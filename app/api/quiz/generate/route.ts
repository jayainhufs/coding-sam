// /app/api/quiz/generate/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'
import problems from '@/data/problems.json' assert { type: 'json' }

const BodySchema = z.object({
  problemId: z.string(),
  step: z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode']),
  userText: z.string().min(1),
  originalProblem: z.string().min(1),
  scoreResult: z.object({
    score: z.number().optional(),
    missing: z.array(z.string()).optional(),
  }).optional(),
})

type ProblemMeta = {
  id: string
  title?: string
  description?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

/** 이번 퀴즈에서 사용할 3단계(2/2/2). 필요 시 여기만 수정 */
const TARGET_STEPS = ['understand','decompose','pseudocode'] as const
type TargetStep = typeof TARGET_STEPS[number]

/** 변수명 맞히기류 금지 필터 */
function isBannedVariableNameQuestion(q: string) {
  const s = (q || '').toLowerCase()
  // 한/영 모두 금지: "변수", "variable", "identifier", "...은 무엇인가요/무엇인가"
  return /(변수|variable|identifier)/.test(s) && /(무엇|어느|이름|what|which)/.test(s)
}

/** 프롬프트 */
function buildPrompt(input: z.infer<typeof BodySchema>, meta: ProblemMeta | null) {
  const missingPart =
    input.scoreResult?.missing && input.scoreResult.missing.length > 0
      ? `학습자가 놓친 항목:
${input.scoreResult.missing.map(s => `- ${s}`).join('\n')}
이(가) 보완되도록, 해당 항목을 현재 단계(${input.step}) 연계 문항에 반영하라.`
      : '학습자가 놓친 항목 정보는 없음. 핵심 개념을 고르게 묻는다.'

  const metaBlock = meta
    ? `{
  "id": "${meta.id}",
  "title": ${JSON.stringify(meta.title ?? '')},
  "description": ${JSON.stringify(meta.description ?? '')},
  "tags": ${JSON.stringify(meta.tags ?? [])},
  "samples": ${JSON.stringify(meta.samples ?? [])}
}`
    : 'null'

  return `
너는 코딩 튜터용 퀴즈 생성기다. 출력은 **반드시 JSON 배열 하나**만.

[문제 메타데이터(JSON)]
${metaBlock}

[원문 문제 설명]
${input.originalProblem}

[학습자가 방금 작성한 단계와 답안]
- 단계: ${input.step}
- 답안:
"""${input.userText}"""

[생성 규칙]
1) 총 6문항, 전부 객관식(MCQ).
2) 단계 배분은 아래 3단계에 각 2문항씩 (순서는 임의):
   - understand(이해) 2
   - decompose(분해) 2
   - pseudocode(의사코드) 2
3) 난이도 분포는 자유롭게 섞되, 너무 쉬움에 치우치지 말 것.
4) 보기(options)는 4개. 정답(answer)은 반드시 options 중 하나와 **문자 그대로 완전 일치**.
5) 한국어로 간결하게, 중복/유사 문항 금지.
6) **금지 유형**: “어떤 변수가 ○○을 담당하나요?”, “변수 이름은 무엇인가요?” 등
   변수명/식별자 이름을 맞히게 하는 문제는 **절대 만들지 말 것**.
7) 단계별 가이드(일반화):
   - understand: 입력/출력 정의, 제약(범위·복잡도 목표), 대표 엣지케이스
   - decompose: "입력 파싱 → 핵심 로직 → 출력" 파이프라인, 각 단계의 상태/전이/예외
   - pseudocode: 핵심 변수의 역할 설명이 아니라, 절차·제어구조·종료조건·테스트 같은 행위/흐름을 묻는다.
8) ${missingPart}

[출력 스키마(JSON 배열)]
[
  {
    "id": "q1",
    "problemId": "${input.problemId}",
    "originalProblem": ${JSON.stringify(input.originalProblem)},
    "step": "understand" | "decompose" | "pseudocode",
    "type": "mcq",
    "difficulty": "easy" | "medium" | "applied",
    "question": "질문 내용",
    "options": ["보기가능1","보기가능2","보기가능3","보기가능4"],
    "answer": "정답(위 options 중 하나와 동일)",
    "explanation": "왜 정답인지 1~2줄"
  },
  ...
]

주의: 오직 위 JSON 배열만 출력하라. 코드블록/설명문 금지.
`.trim()
}

/** JSON 배열 파서(느슨) */
function looseParseArray(raw: string): any[] {
  try {
    const m = raw.match(/\[[\s\S]*\]/)
    return m ? JSON.parse(m[0]) : JSON.parse(raw)
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json())

    const meta: ProblemMeta | null =
      Array.isArray(problems)
        ? (problems as ProblemMeta[]).find(p => (p.id ?? '').toLowerCase() === body.problemId.toLowerCase()) ?? null
        : null

    const prompt = buildPrompt(body, meta)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: '너는 코딩 학습용 퀴즈를 JSON으로만 생성하는 도구다.' },
        { role: 'user', content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'
    let quizzes = looseParseArray(raw)

    // 스키마 보정 + 6문항 강제 + 단계 균등(2/2/2) + 금지문항 필터
    const steps = TARGET_STEPS
    const byStepCount: Record<TargetStep, number> = {
      understand: 0, decompose: 0, pseudocode: 0,
    }

    const normalized: any[] = []
    for (const q of Array.isArray(quizzes) ? quizzes : []) {
      if (normalized.length >= 6) break
      const step: TargetStep = steps.includes(q?.step) ? q.step : steps[Math.floor(normalized.length/2)] as TargetStep
      if (byStepCount[step] >= 2) continue
      const optsOK = Array.isArray(q?.options) && q.options.length === 4
      const ansOK = optsOK && q.options.includes(q?.answer)
      const questionText = q?.question ?? ''

      // 변수명 맞히기류 금지
      if (isBannedVariableNameQuestion(questionText)) continue

      normalized.push({
        id: q?.id ?? `q${normalized.length + 1}`,
        problemId: body.problemId,
        originalProblem: body.originalProblem,
        step,
        type: 'mcq',
        difficulty: ['easy','medium','applied'].includes(q?.difficulty) ? q.difficulty : 'medium',
        question: questionText || '설명에 가장 알맞은 것을 고르세요.',
        options: optsOK ? q.options : ['A','B','C','D'],
        answer: ansOK ? q.answer : (optsOK ? q.options[0] : 'A'),
        explanation: q?.explanation ?? '핵심 개념/흐름 근거에 따른 정답입니다.',
      })
      byStepCount[step]++
    }

    // 부족 시 더미 생성(금지 유형 없이)
    const title = meta?.title ?? '주어진 문제'
    const fallbackFor = (step: TargetStep) => {
      if (step === 'understand') {
        return {
          q: `${title}의 '출력'을 가장 정확히 서술한 것은?`,
          opts: ['요구 조건을 만족하는 최종 결과', '입력 길이', '중간 계산값', '임의 디버그 문자열'],
          ans: '요구 조건을 만족하는 최종 결과',
          exp: '출력은 요구 조건을 만족하는 최종 결과다.',
        }
      }
      if (step === 'decompose') {
        return {
          q: `${title} 처리 흐름으로 가장 타당한 것은?`,
          opts: ['입력파싱→핵심로직→출력', '핵심로직→출력→입력파싱', '출력→입력파싱→핵심로직', '입력파싱→출력→핵심로직'],
          ans: '입력파싱→핵심로직→출력',
          exp: '전형적 파이프라인.',
        }
      }
      // pseudocode
      return {
        q: `${title} 의사코드 작성에서 먼저 고려할 항목은?`,
        opts: ['절차/제어구조와 종료조건을 명확히 한다', '변수 이름을 미리 정한다', '난수를 추가한다', '입력을 무시한다'],
        ans: '절차/제어구조와 종료조건을 명확히 한다',
        exp: '의사코드는 흐름·제어·종료 조건이 핵심이다.',
      }
    }

    // 단계별 2문항 충족되도록 채우기
    for (const st of steps) {
      while (byStepCount[st] < 2) {
        const g = fallbackFor(st)
        normalized.push({
          id: `fallback-${st}-${byStepCount[st]+1}`,
          problemId: body.problemId,
          originalProblem: body.originalProblem,
          step: st,
          type: 'mcq',
          difficulty: 'medium',
          question: g.q,
          options: g.opts,
          answer: g.ans,
          explanation: g.exp,
        })
        byStepCount[st]++
      }
    }

    // 최종 6개만 보장
    return NextResponse.json({ ok: true, items: normalized.slice(0, 6) })
  } catch (err) {
    console.error('[quiz/generate error]', err)
    // 실패 시에도 6문항 보장
    const steps = TARGET_STEPS
    const fallback: any[] = []
    const title = '알고리즘 문제'
    const mk = (st: TargetStep, i: number) => {
      if (st === 'understand') {
        return {
          id: `fallback-${st}-${i}`,
          step: st,
          question: `${title}의 출력 정의로 가장 적절한 것은?`,
          options: ['요구 조건을 만족하는 최종 결과', '입력 길이', '중간 계산값', '임의 디버그 문자열'],
          answer: '요구 조건을 만족하는 최종 결과',
          explanation: '출력은 요구 조건을 만족하는 최종 결과.',
        }
      }
      if (st === 'decompose') {
        return {
          id: `fallback-${st}-${i}`,
          step: st,
          question: `${title} 처리 흐름으로 올바른 것은?`,
          options: ['입력파싱→핵심로직→출력', '핵심로직→출력→입력파싱', '출력→입력파싱→핵심로직', '입력파싱→출력→핵심로직'],
          answer: '입력파싱→핵심로직→출력',
          explanation: '전형적 파이프라인.',
        }
      }
      return {
        id: `fallback-${st}-${i}`,
        step: st,
        question: `${title} 의사코드에서 우선 고려할 요소는?`,
        options: ['절차/제어구조와 종료조건', '변수 이름', '난수 추가', '입력 무시'],
        answer: '절차/제어구조와 종료조건',
        explanation: '의사코드는 흐름·제어·종료 조건이 핵심.',
      }
    }
    for (const st of steps) {
      for (let i = 1; i <= 2; i++) {
        const g = mk(st, i)
        fallback.push({
          id: g.id,
          problemId: 'unknown',
          originalProblem: title,
          step: st,
          type: 'mcq',
          difficulty: 'medium',
          question: g.question,
          options: g.options,
          answer: g.answer,
          explanation: g.explanation,
        })
      }
    }
    return NextResponse.json({ ok: true, items: fallback })
  }
}
