// /app/api/quiz/generate/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

// ✅ 문제 DB에서 메타데이터 로드 (하드코딩 제거)
import problems from '@/data/problems.json' assert { type: 'json' }

const BodySchema = z.object({
  problemId: z.string(),
  step: z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode']),
  userText: z.string().min(1),
  originalProblem: z.string().min(1), // 유지(없으면 fallback용)
  scoreResult: z
    .object({
      score: z.number().optional(),
      missing: z.array(z.string()).optional(),
    })
    .optional(),
})

type ProblemMeta = {
  id: string
  title?: string
  description?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

// ─────────────────────────────
// 프롬프트(문제 일반화)
// ─────────────────────────────
function buildPrompt(input: z.infer<typeof BodySchema>, meta: ProblemMeta | null) {
  const missingPart =
    input.scoreResult?.missing && input.scoreResult.missing.length > 0
      ? `학습자가 놓친 항목:
${input.scoreResult.missing.map(s => `- ${s}`).join('\n')}
이(가) 보완되도록, 현재 단계(${input.step}) 파트의 2문항 이상에 반영하라.`
      : '학습자가 놓친 항목 정보는 없음. 각 단계 핵심을 고르게 묻는다.'

  // 문제 메타: 하드코딩 없이 그대로 전달
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

[원문 문제 설명(클래스/페이지에 노출된 짧은 설명)]
${input.originalProblem}

[학습자가 방금 작성한 단계와 답안]
- 단계: ${input.step}
- 답안:
"""${input.userText}"""

[생성 규칙]
1) 총 10문항, 전부 객관식(MCQ).
2) 5가지 사고 단계별로 2문항씩 배분:
   - understand(이해) 2
   - decompose(분해) 2
   - pattern(패턴) 2
   - abstract(추상화) 2
   - pseudocode(의사코드) 2
3) 난이도 분포: 쉬움 4, 보통 4, 응용 2.
4) 보기(options)는 4개. 정답(answer)은 반드시 options 중 하나와 **문자 그대로 완전 일치**.
5) 한국어로 간결하게, 중복/유사 문항 금지.
6) 단계별 가이드(문제 일반화):
   - understand: 입력/출력 정의, 제약(범위·복잡도 목표), 대표 엣지케이스
   - decompose: "입력 파싱 → 핵심 로직 → 출력" 파이프라인, 각 단계의 상태/전이/예외
   - pattern: 풀이 전략 후보 비교(예: 브루트포스 vs 자료구조/알고리즘), 시간·공간 복잡도, 불변식 또는 핵심 아이디어
   - abstract: I/O 표 개념(이름/타입/범위/예시), 상태 전이, 경계 분기
   - pseudocode: 핵심 변수와 제어구조 기반의 절차, 종료조건/테스트
7) ${missingPart}

[출력 스키마(JSON 배열)]
[
  {
    "id": "q1",
    "problemId": "${input.problemId}",
    "originalProblem": ${JSON.stringify(input.originalProblem)},
    "step": "understand" | "decompose" | "pattern" | "abstract" | "pseudocode",
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

// JSON 배열 파서(느슨)
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

    // 문제 메타 가져오기 (하드코딩 X)
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

    // 스키마 보정 + 10문항 강제 + 단계 균등(2문항씩)
    const steps = ['understand','decompose','pattern','abstract','pseudocode'] as const
    const byStepCount: Record<string, number> = { understand:0, decompose:0, pattern:0, abstract:0, pseudocode:0 }

    const normalized: any[] = []
    for (const q of Array.isArray(quizzes) ? quizzes : []) {
      if (normalized.length >= 10) break
      const step = steps.includes(q?.step) ? q.step : steps[Math.floor(normalized.length/2)]
      if (byStepCount[step] >= 2) continue // 단계별 2문항 제한
      const optsOK = Array.isArray(q?.options) && q.options.length === 4
      const ansOK = optsOK && q.options.includes(q?.answer)

      normalized.push({
        id: q?.id ?? `q${normalized.length + 1}`,
        problemId: body.problemId,
        originalProblem: body.originalProblem,
        step,
        type: 'mcq',
        difficulty: ['easy','medium','applied'].includes(q?.difficulty) ? q.difficulty
                    : (normalized.length < 4 ? 'easy' : normalized.length < 8 ? 'medium' : 'applied'),
        question: q?.question ?? '다음 중 설명에 가장 알맞은 것을 고르세요.',
        options: optsOK ? q.options : ['A','B','C','D'],
        answer: ansOK ? q.answer : (optsOK ? q.options[0] : 'A'),
        explanation: q?.explanation ?? '핵심 개념/흐름/복잡도 근거에 따른 정답입니다.',
      })
      byStepCount[step]++
    }

    // 부족하면 중립 더미로 채우기(문제 제목/설명 사용, 주제 불문)
    for (let i = normalized.length; i < 10; i++) {
      const step = steps[Math.floor(i/2)]
      const diff = i < 4 ? 'easy' : i < 8 ? 'medium' : 'applied'
      const title = meta?.title ?? '주어진 문제'
      const generic = (() => {
        switch (step) {
          case 'understand':
            return {
              q: `${title}의 '출력'을 가장 정확히 서술한 것은?`,
              opts: ['문제가 요구한 결과값', '입력의 길이', '중간 계산값', '정렬된 배열'],
              ans: '문제가 요구한 결과값',
              exp: '출력은 요구 조건을 만족하는 최종 결과.'
            }
          case 'decompose':
            return {
              q: `${title}의 일반적인 처리 흐름으로 가장 타당한 것은?`,
              opts: ['입력파싱→핵심로직→출력', '핵심로직→출력→입력파싱', '출력→입력파싱→핵심로직', '입력파싱→출력→핵심로직'],
              ans: '입력파싱→핵심로직→출력',
              exp: '전형적 파이프라인.'
            }
          case 'pattern':
            return {
              q: `다음 중 ${title}를 푸는 전략 비교로 가장 타당한 설명은?`,
              opts: ['브루트포스는 느리고 최적 기법은 입력 구조를 활용한다', '모든 전략은 동일한 복잡도', '공간만 늘리면 항상 O(1)', '정렬만 하면 항상 해결'],
              ans: '브루트포스는 느리고 최적 기법은 입력 구조를 활용한다',
              exp: '전략 비교의 핵심은 복잡도/구조 활용.'
            }
          case 'abstract':
            return {
              q: `${title}에서 적절한 I/O 매핑 설명은?`,
              opts: ['입력: 문제에서 지정한 자료형들 / 출력: 요구 결과', '입력: 임의 문자열 / 출력: 임의 정수', '입력: 없음 / 출력: 디버그 로그', '입력: 결과 / 출력: 입력'],
              ans: '입력: 문제에서 지정한 자료형들 / 출력: 요구 결과',
              exp: 'I/O는 문제 정의와 일치해야 함.'
            }
          default: // pseudocode
            return {
              q: `${title} 의사코드 작성 시 우선 고려할 요소는?`,
              opts: ['핵심 변수와 제어구조를 명확히 적는다', '주석 없이 한 줄로 쓴다', '난수 생성만 추가한다', '입력을 무시한다'],
              ans: '핵심 변수와 제어구조를 명확히 적는다',
              exp: '의사코드는 흐름과 구조가 핵심.'
            }
        }
      })()

      normalized.push({
        id: `fallback-${i+1}`,
        problemId: body.problemId,
        originalProblem: body.originalProblem,
        step,
        type: 'mcq',
        difficulty: diff,
        question: generic.q,
        options: generic.opts,
        answer: generic.ans,
        explanation: generic.exp,
      })
    }

    return NextResponse.json({ ok: true, items: normalized })
  } catch (err) {
    console.error('[quiz/generate error]', err)
    // 실패 시에도 10문항 보장(완전 중립 더미)
    const steps = ['understand','decompose','pattern','abstract','pseudocode'] as const
    const fallback: any[] = []
    for (let i = 0; i < 10; i++) {
      const step = steps[Math.floor(i/2)]
      fallback.push({
        id: `fallback-${i+1}`,
        problemId: 'unknown',
        originalProblem: '알고리즘 문제',
        step,
        type: 'mcq',
        difficulty: i < 4 ? 'easy' : i < 8 ? 'medium' : 'applied',
        question:
          step === 'understand' ? '문제의 출력 정의로 가장 적절한 것은?'
          : step === 'decompose' ? '일반적인 처리 흐름으로 맞는 것은?'
          : step === 'pattern' ? '전략 비교 설명으로 타당한 것은?'
          : step === 'abstract' ? 'I/O 매핑 설명으로 맞는 것은?'
          : '의사코드 작성 시 우선 고려할 요소는?',
        options:
          step === 'decompose'
            ? ['입력파싱→핵심로직→출력', '핵심로직→출력→입력파싱', '출력→입력파싱→핵심로직', '입력파싱→출력→핵심로직']
            : ['정답 후보1','정답 후보2','정답 후보3','정답 후보4'],
        answer: step === 'decompose' ? '입력파싱→핵심로직→출력' : '정답 후보1',
        explanation: '일반적 원칙에 기반한 정답입니다.',
      })
    }
    return NextResponse.json({ ok: true, items: fallback })
  }
}
