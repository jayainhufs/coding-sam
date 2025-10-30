import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

// App 단계 키(화면 유지): 이해, 분해, 패턴, 추상화, 의사코드
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

/**
 * 요구:
 * - hint 모드는 입력 없어도 OK
 * - 그 외 모드는 최소 1자 이상
 */
const BodySchema = z
  .object({
    step: StepEnum,
    userInput: z.string().default(''),
    problem: z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
    }),
    mode: z.enum(['hint', 'code-suggest']).optional(),
  })
  .superRefine((val, ctx) => {
    const needsInput = !val.mode || val.mode !== 'hint'
    if (needsInput && val.userInput.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userInput'],
        message: '입력을 작성해 주세요.',
      })
    }
  })

// 화면 표기용
const UI_TITLES = {
  understand: '문제 이해하기',
  decompose: '문제 분해하기',
  pattern: '패턴 인식하기',
  abstract: '추상화하기(입/출력/흐름)',
  pseudocode: '의사코드 설계(알고리즘적 사고)',
} as const

// 교육 철학 핵심 4스킬 설명(프롬프트 공통에 삽입)
const PHILOSOPHY = `
우리 튜터의 목표: 어려운 코딩/알고리즘 문제를 4가지 인지 스킬로 나눠 단계 학습하도록 돕는다.
1) 문제 분해: 큰 문제를 작은 하위 과업으로 나누는 사고
2) 패턴 인식: 과거 또는 유사 문제에서 반복되는 구조/알고리즘을 찾는 사고
3) 추상화: 문제/시스템에서 핵심 로직과 불필요한 요소를 구분하는 사고
4) 알고리즘적 사고: 절차적·논리적으로 해결 단계를 설계하고 정확성/복잡도를 고려하는 사고
`.trim()

// 단계별 지시 템플릿
function stageScaffold(step: z.infer<typeof StepEnum>) {
  if (step === 'decompose') {
    return `
[단계 핵심 스킬] 문제 분해
- 큰 요구사항을 3~7개의 실행 가능한 하위 단계(Checklist)로 나누기
- 각 단계는 관찰 가능한 행동/산출물 형태로 서술(예: "입력 파싱", "상태 변수 정의", "반복문으로 최대값 갱신")
[흔한 오류] 단계가 결과/해법을 섞음, 단계 수 과다/과소, 모호한 표현
[평가 기준] 단계의 독립성, 실행 가능성, 불필요한 중복 최소화
`.trim()
  }
  if (step === 'pattern') {
    return `
[단계 핵심 스킬] 패턴 인식
- 자료구조/알고리즘/전형 패턴과 연결(예: 누적합, Kadane, 투 포인터, 해시맵)
- 현재 문제의 제약과 패턴 적합성 검토(시간/공간, 정렬 여부, 음수 포함 등)
[흔한 오류] 임의의 유명 알고리즘을 근거 없이 선택, 제약 미고려
[평가 기준] 선택 근거의 명확성, 반례/엣지 설명
`.trim()
  }
  if (step === 'abstract') {
    return `
[단계 핵심 스킬] 추상화
- 입력/출력 명세를 짧고 모호함 없이 정의
- "상태와 전이" 또는 "입력→처리→출력" 흐름을 텍스트 다이어그램으로 정리
[흔한 오류] 입/출력 단위 불명확, 전처리/후처리 누락, 경계조건 미정의
[평가 기준] 명세의 명료성, 흐름의 누락/중복 없음, 엣지케이스 포함
`.trim()
  }
  if (step === 'pseudocode') {
    return `
[단계 핵심 스킬] 알고리즘적 사고
- 의사코드를 통해 절차를 단계적으로 설계
- 정확성(반례), 복잡도(시간/공간), 변수/불변식 점검
[흔한 오류] 구현 세부로 곧장 점프, 복잡도/불변식 미고려
[평가 기준] 단계 논리의 일관성, 변수/루프 불변식 명시, Big-O 근거
`.trim()
  }
  // understand(사전 정리): 4스킬로 들어가기 전 준비 요약
  return `
[단계 목적] 문제 이해/사전 정리
- 핵심 요구/제약/입출력/엣지케이스를 한 문단으로 요약
- 이후 4가지 스킬 단계에 진입하기 위한 재료를 만든다
[평가 기준] 요약의 정확성, 제약/엣지 누락 여부
`.trim()
}

/** 공통 프롬프트 */
function basePrompt(step: z.infer<typeof StepEnum>, userInput: string, problem: {title?: string; description?: string}) {
  const studentBlock = userInput.trim().length > 0 ? `학생 작성물:\n${userInput}` : `학생 작성물: (없음)`
  return `
${PHILOSOPHY}

[현재 단계] ${UI_TITLES[step]}
${stageScaffold(step)}

문제 정보:
${problem.title ?? ''}
${problem.description ?? ''}

${studentBlock}
`.trim()
}

/** 모드별 프롬프트 생성 */
function buildPrompt(
  step: z.infer<typeof StepEnum>,
  mode: 'hint' | 'code-suggest' | undefined,
  userInput: string,
  problem: { title?: string; description?: string }
) {
  const head = basePrompt(step, userInput, problem)

  if (mode === 'hint') {
    const context = userInput.trim().length > 0
      ? '학생의 현재 작성물을 바탕으로'
      : '학생 입력이 없으므로, 전형적인 오해/엣지/핵심 체크포인트에 근거해'
    return `
${head}

[출력 형식 — 힌트 전용]
- ${context} "${UI_TITLES[step]}" 단계에 딱 맞는 힌트 2~3개
- 각 힌트는 1~2문장, 질문형을 섞어 사고를 확장
- 정답 코드/최종 해법 공개 금지 (스스로 생각을 확장하도록 유도)
`.trim()
  }

  if (mode === 'code-suggest') {
    // 의사코드/짧은 스니펫은 알고리즘적 사고에 맞춰 간결히
    return `
${head}

[출력 형식 — 코드 제안]
- 지금 단계의 맥락을 반영한 "짧은 의사코드 또는 스니펫" (10~20줄)
- 핵심 로직과 흐름이 드러나도록 간결하게
- 가능하면 변수/루프 불변식(또는 핵심 주석) 1~2개 포함
`.trim()
  }

  // 일반 피드백: 스킬 매핑을 강제
  return `
${head}

[출력 형식 — 일반 피드백]
- 장점(0~3개): 현재 단계의 핵심 스킬과 연결해 bullet로
- 보완점(0~3개): 단계 핵심 스킬 관점에서 개선 지점 bullet로
- 다음 단계 생각거리(1~2개): 다음 스킬로 자연스럽게 이어지도록
`.trim()
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { step, userInput, problem, mode } = BodySchema.parse(json)

    const prompt = buildPrompt(step, mode, userInput, problem)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '너는 학습자의 수준에 맞춰 설명 난도를 자동 조절하는 한국어 코딩 튜터다. 초보 입력에는 예시와 쉬운 용어를, 숙련 입력에는 근거/복잡도/반례를 강조한다.' },
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
