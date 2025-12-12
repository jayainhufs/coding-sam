// app/api/ai/refactor/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

const BodySchema = z.object({
  currentCode: z.string().min(1, '코드가 필요합니다.'),
  language: z.enum(['python', 'c', 'java']),
  submittedCodes: z.array(z.object({
    problemId: z.string(),
    language: z.string(),
    code: z.string(),
    submittedAt: z.string(),
  })).min(3, '최소 3개의 제출 코드가 필요합니다.'),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { currentCode, language, submittedCodes } = BodySchema.parse(json)

    // 사용자의 코드 스타일 분석
    const styleAnalysisPrompt = `
당신은 사용자의 코딩 스타일을 분석하는 전문가입니다.

다음은 사용자가 이전에 작성한 ${submittedCodes.length}개의 코드입니다:

${submittedCodes.map((c, i) => `
[코드 ${i + 1} - 문제: ${c.problemId}]
언어: ${c.language}
코드:
\`\`\`${c.language}
${c.code}
\`\`\`
`).join('\n')}

위 코드들을 분석하여 사용자의 코딩 스타일을 파악하세요. 다음 요소들을 중점적으로 분석하세요:
- 변수/함수 명명 규칙 (snake_case, camelCase, PascalCase 등)
- 코드 구조 및 포맷팅 스타일
- 제어 흐름 선호도 (반복문 vs 재귀 등)
- 주석 스타일
- 에러 처리 방식
- 일반적인 코딩 패턴과 습관

사용자의 코딩 스타일을 JSON 형식으로 요약해주세요:
{
  "namingConvention": "변수/함수 명명 규칙",
  "codeStructure": "코드 구조 및 포맷팅 스타일",
  "controlFlow": "제어 흐름 선호도",
  "commentStyle": "주석 스타일",
  "errorHandling": "에러 처리 방식",
  "commonPatterns": ["자주 사용하는 패턴 1", "자주 사용하는 패턴 2", ...]
}
`

    // 1단계: 사용자 스타일 분석
    const styleCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 코딩 스타일 분석 전문가입니다. JSON 형식으로만 응답하세요.' },
        { role: 'user', content: styleAnalysisPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const styleText = styleCompletion.choices[0]?.message?.content
    if (!styleText) {
      throw new Error('스타일 분석에 실패했습니다.')
    }

    const userStyle = JSON.parse(styleText)

    // 2단계: 현재 코드를 사용자 스타일로 리팩토링
    const refactorPrompt = `
당신은 코드 리팩토링 전문가입니다.

다음은 사용자의 코딩 스타일입니다:
${JSON.stringify(userStyle, null, 2)}

다음 코드를 사용자의 코딩 스타일에 맞게 리팩토링해주세요. 
코드의 로직은 변경하지 말고, 스타일만 사용자의 기존 스타일에 맞춰주세요.

[리팩토링할 코드]
언어: ${language}
코드:
\`\`\`${language}
${currentCode}
\`\`\`

리팩토링된 코드만 반환해주세요. 설명이나 주석 없이 코드만 반환하세요.
`

    const refactorCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 코드 리팩토링 전문가입니다. 코드만 반환하세요.' },
        { role: 'user', content: refactorPrompt },
      ],
      temperature: 0.3,
    })

    const refactoredCode = refactorCompletion.choices[0]?.message?.content?.trim() ?? ''
    
    // 코드 블록 제거 (```python ... ``` 형식에서 코드만 추출)
    const cleanedCode = refactoredCode
      .replace(/^```[\w]*\n?/gm, '')
      .replace(/```$/gm, '')
      .trim()

    return NextResponse.json({ 
      ok: true, 
      refactoredCode: cleanedCode,
      style: userStyle,
    })
  } catch (err: any) {
    console.error('[API /refactor] Error:', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? '리팩토링에 실패했습니다.' },
      { status: 400 },
    )
  }
}

