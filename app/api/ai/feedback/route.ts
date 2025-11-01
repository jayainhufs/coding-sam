// /app/api/ai/feedback/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

// 5단계
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

const BodySchema = z.object({
  step: StepEnum,
  userInput: z.string().optional(),       // 힌트는 입력 없이도 OK
  promptOverride: z.string().optional(),
  problem: z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  mode: z.enum(['hint', 'code-suggest']).optional(),
}).refine(d => !!(d.userInput?.trim() || d.promptOverride?.trim()), {
  message: 'userInput 또는 promptOverride 중 하나는 필요합니다.',
})

const STEP_TITLES: Record<z.infer<typeof StepEnum>, string> = {
  understand: '문제 이해하기',
  decompose: '문제 분해하기',
  pattern: '패턴 인식하기',
  abstract: '추상화하기(입/출력/처리 흐름)',
  pseudocode: '의사코드 설계',
}

const RUBRIC_HINT = `
- 이해: 요구/입출력/제약/엣지 연결, 제약→복잡도
- 분해: 3~7 단계, 각 단계의 상태·전이·예외
- 패턴: 후보≥2 비교, 반례로 배제, 불변식
- 추상화: I/O 표, 상태 전이, 경계 분기
- 의사코드: 10~20줄, 불변식/종료조건/테스트
`.trim()

// ───────── 간단 갭 분석 ─────────
function analyzeGaps(step: z.infer<typeof StepEnum>, text: string | undefined) {
  const s = (text ?? '').toLowerCase()
  const checks: Record<z.infer<typeof StepEnum>, { name: string; ok: (t: string)=>boolean }[]> = {
    understand: [
      { name: '입력', ok: t => /(입력|input)/.test(t) },
      { name: '출력', ok: t => /(출력|output)/.test(t) },
      { name: '제약→복잡도', ok: t => /(제약|constraint|o\([^)]+\)|n\s*<=)/i.test(t) },
      { name: '엣지(≥2)', ok: t => /(엣지|edge|경계)/.test(t) },
      { name: '반례(1)', ok: t => /(반례|counter)/.test(t) },
    ],
    decompose: [
      { name: '입력 파싱', ok: t => /(입력|파싱|parse)/.test(t) },
      { name: '상태/전이', ok: t => /(상태|전이|state|transition)/.test(t) },
      { name: '출력 단계', ok: t => /(출력|결과)/.test(t) },
      { name: '예외 처리', ok: t => /(예외|error|edge)/.test(t) },
    ],
    pattern: [
      { name: '후보≥2', ok: t => /(후보|kadane|hash|dp|two[-\s]?pointer|heap|greedy)/i.test(t) },
      { name: '반례 배제', ok: t => /(반례|counter)/.test(t) },
      { name: '불변식', ok: t => /(불변식|invariant)/.test(t) },
      { name: '복잡도 근거', ok: t => /(o\([^)]+\)|시간|공간|complexity)/i.test(t) },
    ],
    abstract: [
      { name: '입력 표기', ok: t => /(입력|input)/.test(t) },
      { name: '출력 표기', ok: t => /(출력|output)/.test(t) },
      { name: '상태 전이', ok: t => /(상태|전이|state|transition)/.test(t) },
      { name: '경계/엣지', ok: t => /(경계|엣지|edge)/.test(t) },
    ],
    pseudocode: [
      { name: '제어구조', ok: t => /(for|while|if)/.test(t) },
      { name: '불변식/종료', ok: t => /(불변식|invariant|종료|terminate)/.test(t) },
      { name: '복잡도', ok: t => /(복잡도|o\([^)]+\)|complexity)/i.test(t) },
      { name: '단위 테스트', ok: t => /(테스트|test|예시)/.test(t) },
    ],
  }
  const missing = checks[step].filter(c => !c.ok(s)).map(c => c.name)
  return { missing }
}

// ───────── 힌트 강제 생성(모델이 형식 깨면 사용) ─────────
function buildHintFromMissing(
  step: z.infer<typeof StepEnum>,
  missing: string[],
  problem: { title?: string; description?: string }
) {
  const kw = (problem.title || problem.description || '').split(/[^\w가-힣]+/).filter(Boolean)
  const key = kw.slice(0, 2).join(' ') || '문제'

  const bullets: string[] = []
  if (missing.length === 0) {
    bullets.push(
      `- ${key}의 입력 타입·범위를 수치로 고정해 보세요.`,
      `- ${key}에 대한 엣지케이스 2가지를 한 줄씩 적어 보세요.`,
      `- 제약에서 목표 복잡도(O(…))까지 연결 문장을 1줄로 써 보세요.`
    )
  } else {
    if (missing.some(m => m.includes('입력'))) bullets.push(`- ${key}에서 **입력**의 타입/범위/예시 1개를 명시하세요.`)
    if (missing.some(m => m.includes('출력'))) bullets.push(`- ${key}의 **출력 형식**(이름/타입/예시 1개)을 적어 보세요.`)
    if (missing.some(m => m.includes('제약'))) bullets.push(`- **제약→복잡도**를 연결: n의 범위를 가정하고 목표 복잡도(O(…))를 1줄로 쓰세요.`)
    if (missing.some(m => m.includes('엣지'))) bullets.push(`- **엣지케이스** 2개를 문장으로 적으세요(예: 전부 음수, 빈 배열 등).`)
    if (missing.some(m => m.includes('반례'))) bullets.push(`- **반례** 1줄: 현재 가정이 실패하는 입력을 한 줄로 써 보세요.`)
  }

  const gapLine = missing.length
    ? `부족한 항목: ${missing.join(', ')}`
    : '부족한 항목: (입력이 매우 짧거나 없음 — 기본 체크리스트 중심)'

  return [
    `▷부족한 점 요약: ${gapLine}`,
    '▷문제-맞춤 힌트 2~3개:',
    ...bullets.slice(0, 3),
  ].join('\n')
}

// 모델 출력이 힌트 형식이 아니면 강제로 정규화
function normalizeHintResponse(
  raw: string,
  step: z.infer<typeof StepEnum>,
  missing: string[],
  problem: { title?: string; description?: string }
) {
  const hasHintShape =
    /▷부족한 점 요약/.test(raw) &&
    /▷문제-맞춤 힌트/.test(raw) &&
    !/▷잘한점|▷보완점|▷다음에 생각할 점/.test(raw)

  if (hasHintShape) return raw.trim()
  // 형식이 깨졌거나 평가 형식이 섞였으면 재생성
  return buildHintFromMissing(step, missing, problem)
}

// ───────── 프롬프트 빌더 ─────────
function buildPrompt(
  step: z.infer<typeof StepEnum>,
  mode: 'hint' | 'code-suggest' | undefined,
  userInput: string,
  problem: { title?: string; description?: string }
) {
  const { missing } = analyzeGaps(step, userInput)

  const header = `
현재 단계: ${STEP_TITLES[step]}
문제 제목: ${problem.title ?? ''}
문제 설명: ${problem.description ?? ''}

학생 입력:
${userInput || '(없음)'}
`.trim()

  if (mode === 'hint') {
    const gapLine = missing.length
      ? `부족한 항목: ${missing.join(', ')}`
      : '부족한 항목: (입력이 매우 짧거나 없음 — 기준을 참고해 핵심을 채우도록 유도)'
    return `
너는 코딩을 5단계(이해/분해/패턴/추상화/의사코드)로 코칭하는 한국어 튜터다.
**힌트 모드**: 아래 형식 두 블록만 출력. 정답·완전한 코드 금지. 다른 단계로 이동 지시 금지.

[출력 형식 — 이 두 블록만]
▷부족한 점 요약: 3줄 이내 핵심 (${gapLine})
▷문제-맞춤 힌트 2~3개:
- 질문형/체크리스트형으로, 학생이 현재 단계에서 즉시 채워 넣을 수 있게 지시

${header}

(참고 루브릭)
${RUBRIC_HINT}
`.trim()
  }

  const base = `
너는 코딩을 5단계로 코칭하는 한국어 튜터다. 아래 형식으로 간결하게 답하라.
▷잘한점(0~3)
▷보완점(0~3)
▷다음에 생각할 점(1~2)

${header}
`.trim()

  if (mode === 'code-suggest') {
    return `
${base}

[추가 요구 — 코드 제안]
- 학생 입력을 반영해 "짧은 의사코드/스니펫" 10~20줄 내로 제안.
- 위 형식(잘한점/보완점/다음에 생각할 점)도 함께 작성.
`.trim()
  }

  return `
${base}

[요구 — 일반 평가]
- 위 형식에 맞춰 **간결하고 구체적**으로 작성.
`.trim()
}

function systemFor(mode?: 'hint' | 'code-suggest') {
  const common =
    '너는 학습자를 5단계(이해→분해→패턴→추상화→의사코드)로 코칭하는 한국어 튜터다. 불필요한 장황함을 피한다. '
  if (mode === 'hint') {
    return common + '힌트 모드에서는 "▷부족한 점 요약"과 "▷문제-맞춤 힌트 2–3개"만 출력한다. 정답/완전한 코드는 금지한다.'
  }
  return common + '요청/코드제안에서는 항상 ▷잘한점 ▷보완점 ▷다음에 생각할 점 형식을 유지한다.'
}

// ───────── 핸들러 ─────────
export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { step, userInput, promptOverride, problem, mode } = BodySchema.parse(json)

    const prompt = (promptOverride && promptOverride.trim())
      ? promptOverride
      : buildPrompt(step, mode, (userInput ?? ''), problem)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: mode === 'hint' ? 0.2 : 0.3,
      messages: [
        { role: 'system', content: systemFor(mode) },
        { role: 'user', content: prompt },
      ],
    })

    let text = completion.choices[0]?.message?.content?.trim() ?? '응답이 비어있습니다.'

    // ✅ 힌트 모드: 형식 강제 정규화
    if (mode === 'hint') {
      const { missing } = analyzeGaps(step, userInput)
      text = normalizeHintResponse(text, step, missing, problem)
    }

    return NextResponse.json({ ok: true, step, mode, text })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'server error' }, { status: 400 })
  }
}
