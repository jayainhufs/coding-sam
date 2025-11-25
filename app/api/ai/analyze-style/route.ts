import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai, MODEL } from '@/lib/openai'

// 2. Zod 스키마 (기존과 동일)
const BodySchema = z.object({
  code: z.string().min(10, '분석을 위해 최소 10자 이상의 코드가 필요합니다.'),
})

// 3. OpenAI에게 보낼 시스템 프롬프트 (AI의 역할 정의)
const systemPrompt = `
당신은 학생의 코딩 스타일과 논리 패턴을 정량적으로 분석하는 AI 코드 분석가입니다.
제공된 코드 스니펫을 분석하여, 학생이 자주 사용하는 제어 흐름, 자료 구조, 습관 등을 파악하세요.
응답은 반드시 아래에 지정된 JSON 스키마를 따라야 합니다.

[분석 목표]
1. 언어 감지: 사용자가 작성한 코드를 기반으로 언어(Python, Java, C 등)를 명확히 식별
2. 스타일 요약: 학생의 전반적인 코딩 습관을 1~2문장으로 한국어 요약
3. 상세 패턴: 자료 구조 사용 선호도(high/medium/low), 제어 흐름 선호도(strong/avoided)를 파악

[출력 스키마]
{
  "language": "python" | "java" | "c" | "unknown",
  "styleSummary": "학생의 전반적인 코딩 습관에 대한 1~2줄 요약 (한국어)",
  "patterns": {
    "data_structures": [
      { "name": "dictionary | hashmap | array | list", "frequency": "high | medium | low", "context": "사용 맥락 (예: element_counting)" }
    ],
    "control_flow": [
      { "name": "iterative_loops (반복문)", "preference": "strong | medium | weak" },
      { "name": "recursion (재귀)", "preference": "strong | medium | avoided" }
    ],
    "common_idioms": [
      "자주 사용하는 Python/Java/C 숙어 1~3개 (예: list_comprehension)"
    ],
    "naming_conventions": {
      "variables": "snake_case | camelCase | PascalCase",
      "functions": "snake_case | camelCase | PascalCase"
    }
  }
}
`

// 4. API 라우트 핸들러
export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { code } = BodySchema.parse(json)

    // 5. OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: MODEL, // lib/openai.ts에서 정의된 모델 사용
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze the following code:\n\n${code}` }, // 사용자 코드
      ],
      temperature: 0.2, // 스타일 분석은 일관성이 중요하므로 낮은 값 설정
      response_format: { type: 'json_object' }, // (필수) JSON 형식 응답 강제
    })

    // 6. 응답 추출
    const jsonText = completion.choices[0]?.message?.content
    if (!jsonText) {
      throw new Error('OpenAI로부터 유효한 응답을 받지 못했습니다.')
    }

    // 7. 응답 파싱
    const analysisSummary = JSON.parse(jsonText) // AI가 반환한 JSON 요약 객체

    // 8. 클라이언트(app/onboarding/style/page.tsx)로 반환
    // 클라이언트는 'data.style' 키를 기대하고 있습니다. [cite: app/onboarding/style/page.tsx]
    // 여기에 분석 요약 객체(analysisSummary)를 통째로 전달합니다.
    return NextResponse.json({ ok: true, style: analysisSummary })
  } catch (err: any) {
    console.error('[API /analyze-style] Error:', err)
    // Zod 오류 또는 OpenAI 오류
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'server error' },
      { status: 400 },
    )
  }
}