import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'

const Body = z.object({
  step: z.enum(['understand','decompose','pattern','abstract','pseudocode']),
  userInput: z.any(),
  problem: z.object({ id: z.string(), title: z.string(), description: z.string().optional() })
})

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json())
    const client = getOpenAI()

    const messages = [
      {
        role: 'system' as const,
        content: `너는 신뢰할 수 있는 시니어 코딩 튜터다. 학생이 ${body.step} 단계에서 입력한 내용을 칭찬 1줄 + 구체적 보완 2~4개 + 체크리스트 3개 형식으로 간결히 피드백하라. 과장 금지, 정확성 우선.`
      },
      {
        role: 'user' as const,
        content: JSON.stringify({
          step: body.step,
          userInput: body.userInput,
          problem: body.problem,
        })
      }
    ]

    // Responses API (Node SDK)
    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: messages,
    })

    const text = resp.output_text || '피드백 생성 실패'
    return NextResponse.json({ message: text })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ message: '요청 처리 중 오류가 발생했습니다.' }, { status: 400 })
  }
}