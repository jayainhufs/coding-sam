// app/api/ai/evaluate-style/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

const BodySchema = z.object({
  codeStyle: z.object({
    styleSummary: z.string().optional(),
    patterns: z.any().optional(),
  }),
  submittedCodes: z.array(z.object({
    problemId: z.string(),
    language: z.string(),
    code: z.string(),
  })).min(1),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { codeStyle, submittedCodes } = BodySchema.parse(json)

    const codesText = submittedCodes.map((c, i) => 
      `[코드 ${i + 1}]\n언어: ${c.language}\n${c.code}`
    ).join('\n\n')

    const prompt = `
당신은 코드 스타일 평가 전문가입니다.

사용자의 코드 스타일 정보:
${JSON.stringify(codeStyle, null, 2)}

사용자가 작성한 코드들:
${codesText}

위 정보를 바탕으로 사용자의 코드 스타일을 간략하게 평가해주세요.

**출력 형식 (반드시 이 형식을 따라주세요):**
- 강점: [1줄로 간단히]
- 개선점: [1줄로 간단히]
- 종합: [1줄로 간단히]

각 항목은 2-3줄로 구성되며, 총 3줄 이내로 작성해주세요.
`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: '당신은 코드 스타일 평가 전문가입니다. 요청된 형식에 정확히 맞춰 2-3줄로 간략하게 평가해주세요.' 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const evaluation = completion.choices[0]?.message?.content?.trim() ?? ''
    
    // 형식 검증 및 정규화
    const normalizedEvaluation = normalizeEvaluation(evaluation)

    return NextResponse.json({ 
      ok: true, 
      evaluation: normalizedEvaluation,
    })
  } catch (err: any) {
    console.error('[API /evaluate-style] Error:', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? '평가에 실패했습니다.' },
      { status: 400 },
    )
  }
}

function normalizeEvaluation(text: string): string {
  // 기본 형식 확인
  const hasFormat = /강점|개선점|종합/.test(text)
  
  if (!hasFormat) {
    // 형식이 없으면 기본 템플릿 반환
    return `- 강점: 코드 작성 패턴이 일관적입니다.\n- 개선점: 더 나은 코드 구조화를 고려해보세요.\n- 종합: 꾸준한 개선이 필요합니다.`
  }
  
  // 줄바꿈 정리 및 최대 3줄로 제한
  const lines = text.split('\n').filter(line => line.trim())
  const formatted = lines.slice(0, 3).join('\n')
  
  return formatted
}

