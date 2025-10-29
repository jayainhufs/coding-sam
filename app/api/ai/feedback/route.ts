import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

// 우리 플로우의 5단계 (문서 기준): 이해, 분해, 패턴, 추상화, 의사코드
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

const BodySchema = z.object({
  step: StepEnum,
  userInput: z.string().min(1, '입력을 작성해 주세요.'),
  problem: z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  // UI에서 힌트/코드제안을 누르면 mode 로 전달 (optional)
  mode: z.enum(['hint', 'code-suggest']).optional(),
})

const STEP_TITLES: Record<z.infer<typeof StepEnum>, string> = {
  understand: '문제 이해하기',
  decompose: '문제 분해하기',
  pattern: '패턴 인식하기',
  abstract: '추상화하기(입/출력/처리 흐름)',
  pseudocode: '의사코드 설계',
}

// 각 단계별로 프롬프트를 분리 (PDF 플로우 반영)
function buildPrompt(step: z.infer<typeof StepEnum>, mode: 'hint' | 'code-suggest' | undefined, userInput: string, problem: {title?: string; description?: string}) {
  const base = `
당신은 코딩 학습용 AI 튜터입니다. 우리는 코딩 방식을 총 4가지로 나눌거에요. 문제 이해, 문제 분해, 문제 패턴 인식, 문제 추상화하기입니다.
학생이 ${STEP_TITLES[step]} 단계에서 작성한 내용을 보고, ${step} 단계에만 집중해서 한국어로 간결하고 구체적인 피드백을 주세요.
- 장점 0~3개, 보완점 0~3개로 나눠 bullet로
- 현재 피드백을 바탕으로 다음 단계로 넘어갈 때 생각해봐야 할 점 1~2개
문제 정보:
${problem.title ?? ''}

${problem.description ?? ''}

학생 입력:
${userInput}
`.trim()

  if (mode === 'hint') {
    return base + `

[추가 요구] 지금 단계에 맞는 "힌트만" 제시하세요. 정답이나 완전한 코드가 아닌, 현 단계에서 사고를 확장시키는 질문/힌트 3개 내로.`
  }
  if (mode === 'code-suggest') {
    return base + `

[추가 요구] 지금까지의 피드백과 학생의 내용을을 바탕으로 "짧은 스니펫" 또는 "의사코드"를 10~20줄 내로 제안하세요.`
  }
  return base
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { step, userInput, problem, mode } = BodySchema.parse(json)

    const prompt = buildPrompt(step, mode, userInput, problem)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 코딩 학습을 단계적으로 코칭하는 한국어 튜터입니다. ' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const text = completion.choices[0]?.message?.content ?? '응답이 비어있습니다.'
    return NextResponse.json({ ok: true, step, mode, text })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'server error' }, { status: 400 })
  }
}