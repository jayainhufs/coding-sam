// /app/api/quiz/generate/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'
import problems from '@/data/problems.json' assert { type: 'json' }

// ──────────────────────────────────────────────────────────────
// Input schema
// ──────────────────────────────────────────────────────────────
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

const BodySchema = z.object({
  problemId: z.string(),
  // 사용자가 방금 푼 단계(참고용). 생성 시 단계는 강제하지 않음.
  step: StepEnum.optional(),
  userText: z.string().min(1),
  originalProblem: z.string().min(1),
  scoreResult: z
    .object({
      score: z.number().optional(),
      missing: z.array(z.string()).optional(),
    })
    .optional(),
  // (선택) 우리가 가진 '정답 가이드'를 단계별로 넘길 수 있게 훅 추가
  goldAnswers: z.record(StepEnum, z.string()).optional(), // ← partial() 금지, optional만
})

type Body = z.infer<typeof BodySchema>

type ProblemMeta = {
  id: string
  title?: string
  description?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

// ──────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────
function isBannedVariableNameQuestion(q: string) {
  const s = (q || '').toLowerCase()
  // 변수/variable/identifier + what/which/무엇/이름 류의 조합 금지
  return /(변수|variable|identifier)/.test(s) && /(무엇|어느|이름|what|which)/.test(s)
}

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[`"'’“”‘]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:;,.!?()-]+|[\s:;,.!?()-]+$/g, '')
    .trim()
}

function optionsSig(opts?: string[]) {
  if (!Array.isArray(opts) || opts.length !== 4) return ''
  return [...opts].map(norm).sort().join(' | ')
}

// ──────────────────────────────────────────────────────────────
function buildPrompt(input: Body, meta: ProblemMeta | null) {
  const missingPart =
    input.scoreResult?.missing && input.scoreResult.missing.length > 0
      ? `학습자가 놓친 항목:
${input.scoreResult.missing.map(s => `- ${s}`).join('\n')}
→ 해당 약점을 보완하는 문항을 2개 이상 포함하라.`
      : '학습자가 놓친 항목 정보는 없음. 핵심 개념을 고르게 묻는다.'

  const gold =
    input.goldAnswers && Object.keys(input.goldAnswers).length
      ? `\n[우리가 보유한 단계별 정답 가이드(참고용)]
${Object.entries(input.goldAnswers)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}`
      : ''

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

[학습자가 방금 작성한 답안(참고)]
"""${input.userText}"""${gold}

[생성 규칙]
1) 총 **6문항**, 전부 객관식(MCQ).
2) **난이도 분포: medium 2문항, hard 2문항, applied 2문항** (※ easy는 금지).
3) 특정 '사고 단계(understand/decompose/...)'는 강제하지 않는다. 다만 I/O·제약·전략비교·절차/의사코드 등
   다양한 각도에서 골고루 묻게 하라(중복·유사 회피).
4) 보기(options)는 4개. 정답(answer)은 반드시 options 중 하나와 **문자 그대로 완전 일치**.
5) 한국어로 간결하게. 동일/유사 문항·동일 보기 세트 금지.
6) **금지 유형**: “어떤 변수가 ○○을 담당하나요?”, “변수 이름은 무엇인가요?” 등
   변수명/식별자 이름 맞히기는 절대 금지.
7) ${missingPart}

[출력 스키마(JSON 배열)]
[
  {
    "id": "q1",
    "problemId": "${input.problemId}",
    "originalProblem": ${JSON.stringify(input.originalProblem)},
    "type": "mcq",
    "difficulty": "medium" | "hard" | "applied",
    "question": "질문 내용",
    "options": ["보기1","보기2","보기3","보기4"],
    "answer": "정답(위 options 중 하나와 동일)",
    "explanation": "왜 정답인지 1~2줄"
  }
]

주의: 오직 위 JSON 배열만 출력하라. 코드블록/설명문 금지.
`.trim()
}

// ──────────────────────────────────────────────────────────────
function looseParseArray(raw: string): any[] {
  try {
    const m = raw.match(/\[[\s\S]*\]/)
    return m ? JSON.parse(m[0]) : JSON.parse(raw)
  } catch {
    return []
  }
}

// ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json())

    const meta: ProblemMeta | null =
      Array.isArray(problems)
        ? (problems as ProblemMeta[]).find(
            p => (p.id ?? '').toLowerCase() === body.problemId.toLowerCase()
          ) ?? null
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
    const quizzes = looseParseArray(raw)

    // 중복 방지
    const seenQ = new Set<string>()
    const seenOpts = new Set<string>()

    // 난이도 타깃: medium 2, hard 2, applied 2 (easy 금지)
    const targetCounts: Record<'medium'|'hard'|'applied', number> = {
      medium: 2, hard: 2, applied: 2,
    }
    const gotCounts: Record<'medium'|'hard'|'applied', number> = {
      medium: 0, hard: 0, applied: 0,
    }

    const normalized: any[] = []

    const tryPush = (q: any) => {
      // 기본 검증
      const questionText = (q?.question ?? '').trim()
      if (!questionText) return false
      if (isBannedVariableNameQuestion(questionText)) return false

      const qKey = norm(questionText)
      const optsOK = Array.isArray(q?.options) && q.options.length === 4
      const sig = optionsSig(q?.options)
      if (seenQ.has(qKey)) return false
      if (sig && seenOpts.has(sig)) return false

      let diff = (q?.difficulty ?? 'medium').toLowerCase()
      if (diff === 'easy') diff = 'medium'
      if (!['medium','hard','applied'].includes(diff)) diff = 'medium'

      // 난이도 분포 맞추기
      if (gotCounts[diff as 'medium'|'hard'|'applied'] >= targetCounts[diff as 'medium'|'hard'|'applied']) {
        return false
      }

      const ansOK = optsOK && q.options.includes(q?.answer)
      normalized.push({
        id: q?.id ?? `q${normalized.length + 1}`,
        problemId: body.problemId,
        originalProblem: body.originalProblem,
        type: 'mcq',
        difficulty: diff,
        question: questionText,
        options: optsOK ? q.options : ['A','B','C','D'],
        answer: ansOK ? q.answer : (optsOK ? q.options[0] : 'A'),
        explanation: q?.explanation ?? '핵심 근거에 따른 정답입니다.',
      })

      seenQ.add(qKey)
      if (sig) seenOpts.add(sig)
      gotCounts[diff as 'medium'|'hard'|'applied']++
      return true
    }

    // 1) 모델 산출물에서 먼저 선별
    if (Array.isArray(quizzes)) {
      for (const q of quizzes) {
        if (normalized.length >= 6) break
        tryPush(q)
      }
    }

    // 2) 부족하면 난이도별 더미 생성
    const title = meta?.title ?? '주어진 문제'
    const fallbackBank: Record<'medium'|'hard'|'applied', Array<{q:string; opts:string[]; ans:string; exp:string}>> = {
      medium: [
        {
          q: `${title}의 출력 정의로 가장 올바른 것은?`,
          opts: ['문제가 요구한 최종 결과', '입력 길이', '중간 계산값', '디버그 문자열'],
          ans: '문제가 요구한 최종 결과',
          exp: '출력은 요구 조건을 만족하는 최종 결과다.'
        },
        {
          q: `${title} 처리 흐름으로 타당한 것은?`,
          opts: ['입력파싱→핵심로직→출력', '핵심로직→출력→입력파싱', '출력→입력파싱→핵심로직', '입력파싱→출력→핵심로직'],
          ans: '입력파싱→핵심로직→출력',
          exp: '전형적 파이프라인.'
        },
      ],
      hard: [
        {
          q: `${title}에서 시간 복잡도를 낮추기 위한 합리적 전략은?`,
          opts: ['입력 구조 활용한 선형/선형로그 전략', '임의 난수 추가', '모든 경우의 수 완전탐색', '출력만 먼저 확정'],
          ans: '입력 구조 활용한 선형/선형로그 전략',
          exp: '데이터 특성을 활용한 전략이 보편적으로 효율적이다.'
        },
        {
          q: `${title} 엣지케이스를 가장 잘 포착한 설명은?`,
          opts: ['빈/단일 입력, 전부 음수/양수 등 경계 고려', '난수를 섞어 평균화', '출력을 고정 후 입력을 맞춤', 'I/O 정의 생략'],
          ans: '빈/단일 입력, 전부 음수/양수 등 경계 고려',
          exp: '경계 조건을 명시해야 안전하다.'
        },
      ],
      applied: [
        {
          q: `${title} 의사코드에서 먼저 확립해야 할 요소는?`,
          opts: ['절차·제어구조와 종료조건', '변수 이름', '난수 발생', '입력 무시'],
          ans: '절차·제어구조와 종료조건',
          exp: '의사코드는 흐름·제어·종료 조건이 핵심이다.'
        },
        {
          q: `${title} 테스트 설계로 적절한 것은?`,
          opts: ['정상케이스+경계케이스 각 1개 이상', '정상케이스만 1개', '무작위 1개', '출력만 대충 비교'],
          ans: '정상케이스+경계케이스 각 1개 이상',
          exp: '대표·경계 입력으로 최소 검증이 필요하다.'
        },
      ],
    }

    const order: Array<'medium'|'hard'|'applied'> = ['medium','hard','applied']
    for (const diff of order) {
      while (gotCounts[diff] < targetCounts[diff]) {
        const bank = fallbackBank[diff]
        const pick = bank[gotCounts[diff] % bank.length]
        const sig = optionsSig(pick.opts)
        let qtext = pick.q
        // 혹시라도 중복되면 번호를 덧붙여 강제 유니크
        let suffix = 1
        while (seenQ.has(norm(qtext)) || (sig && seenOpts.has(sig))) {
          suffix++
          qtext = `${pick.q} (${suffix})`
        }
        normalized.push({
          id: `fallback-${diff}-${gotCounts[diff] + 1}`,
          problemId: body.problemId,
          originalProblem: body.originalProblem,
          type: 'mcq',
          difficulty: diff,
          question: qtext,
          options: pick.opts,
          answer: pick.ans,
          explanation: pick.exp,
        })
        seenQ.add(norm(qtext))
        if (sig) seenOpts.add(sig)
        gotCounts[diff]++
      }
    }

    // 최종 6개만
    return NextResponse.json({ ok: true, items: normalized.slice(0, 6) })
  } catch (err) {
    console.error('[quiz/generate error]', err)
    // 폴백: medium 2 / hard 2 / applied 2
    const diffs: Array<'medium'|'hard'|'applied'> = ['medium','medium','hard','hard','applied','applied']
    const title = '알고리즘 문제'
    const items = diffs.map((d, i) => ({
      id: `fallback-${d}-${i+1}`,
      problemId: 'unknown',
      originalProblem: title,
      type: 'mcq',
      difficulty: d,
      question:
        d === 'medium' ? `${title}의 출력 정의로 가장 적절한 것은? (${i+1})`
        : d === 'hard' ? `${title}의 경계 케이스로 알맞은 것은? (${i+1})`
        : `${title} 의사코드에서 우선 확정해야 할 요소는? (${i+1})`,
      options:
        d === 'medium'
          ? ['문제가 요구한 최종 결과', '입력 길이', '중간 계산값', '디버그 문자열']
          : d === 'hard'
          ? ['빈/단일 입력, 전부 음수/양수', '난수만 추가', '출력만 먼저 고정', 'I/O 생략']
          : ['절차·제어구조와 종료조건', '변수 이름', '난수 발생', '입력 무시'],
      answer:
        d === 'medium'
          ? '문제가 요구한 최종 결과'
          : d === 'hard'
          ? '빈/단일 입력, 전부 음수/양수'
          : '절차·제어구조와 종료조건',
      explanation:
        d === 'medium'
          ? '출력은 요구 조건을 만족하는 최종 결과다.'
          : d === 'hard'
          ? '경계 입력을 고려해야 안전하다.'
          : '의사코드는 흐름·제어·종료 조건이 핵심이다.',
    }))
    return NextResponse.json({ ok: true, items })
  }
}
