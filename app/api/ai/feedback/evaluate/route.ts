// /app/api/ai/evaluate/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'
import { LABEL, type ProfileSummary, type StepKey } from '@/utils/analysis'

// 단계 라벨 고정
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

const ScoresSchema = z.object({
  understand: z.number().optional(),
  decompose: z.number().optional(),
  pattern: z.number().optional(),
  abstract: z.number().optional(),
  pseudocode: z.number().optional(),
})

const SummarySchema = z.object({
  avg: ScoresSchema,
  attempts: z.number().int().nonnegative(),
  solvedCount: z.number().int().nonnegative(),
  weakest: z.array(StepEnum),
  strength: z.array(StepEnum),
})

const RecentItemSchema = z.object({
  id: z.string(),
  scores: ScoresSchema.optional().default({}),
  attempts: z.number().int().nonnegative(),
})

const BodySchema = z.object({
  summary: SummarySchema,
  recent: z.array(RecentItemSchema).optional(),

  // ✅ 추가: 패널티 계산을 위한 카운터(이번 제출 시점 누적)
  aiRequestCount: z.number().int().nonnegative().default(0), // AI 요청 총합(이번 포함)
  hintCount: z.number().int().nonnegative().default(0),      // 힌트 사용 총합(요청에 포함이면 0으로)
  solvedThreshold: z.number().min(1).max(100).default(80),   // (참고용) 정답 처리 기준
})

// ── 채점 기준 & 점수 향상 가이드 (모델 컨텍스트로만 활용; 출력엔 노출 X) ─────────
const RUBRIC = `
[채점 기준(요약) & 점수 향상 가이드]

① 이해
- 기준: 요구/입력/출력/제약/엣지케이스를 모호함 없이 1문단으로 요약
- 점수 올리는 방법:
  • 40→60: 입력형/출력형을 구체적 타입/범위로 표기, 최소 2개의 엣지케이스 추가
  • 60→80: "제약→알고리즘 후보" 연결(예: n≤1e5 → O(n) 필요)
  • 80→95: 반례 한 줄 설명, 성공/실패 조건을 테스트 문장으로 요약

② 분해
- 기준: 3~7개의 실행 가능한 하위 단계(관찰 가능한 행동/산출물)
- 점수 올리는 방법:
  • 40→60: "입력 파싱→핵심 로직→출력" 3블록으로 최소 분해
  • 60→80: 각 단계에 입·출력 상태/전이(무엇이 생기고 사라지는지) 명시
  • 80→95: 단계 간 의존성과 실패지점(예외 처리)을 주석으로 표시

③ 패턴 인식
- 기준: 제약과 데이터 특성에 맞게 전형 패턴을 근거로 선택
- 점수 올리는 방법:
  • 40→60: 후보 2개 제시 + 각 후보의 시간/공간 근거 1줄
  • 60→80: 반례를 통해 부적합 후보 1개 제거(왜 안 되는지)
  • 80→95: 최종 패턴의 핵심 불변식·상태 정의 1~2줄

④ 추상화
- 기준: 불필요한 세부 제거, 입력→처리→출력 흐름과 상태/전이 명확화
- 점수 올리는 방법:
  • 40→60: I/O를 표 형태로 정리(이름/타입/범위/예시 1개)
  • 60→80: 상태 차트(전이: 언제 값이 갱신되는가) 텍스트 다이어그램
  • 80→95: 경계/빈배열/음수/중복 등 케이스별 처리 분기 명시

⑤ 의사코드(알고리즘적 사고)
- 기준: 순서·분기·반복으로 구현 가능한 절차, 복잡도·불변식 점검
- 점수 올리는 방법:
  • 40→60: 10~20줄 의사코드(입력/출력/변수 선언 + 루프/조건)
  • 60→80: 루프 불변식 1개와 종료 조건을 주석으로 기술
  • 80→95: 시간/공간 복잡도 근거 1줄 + 단위 테스트 2줄(입력/기대값)
`.trim()

// ── 유틸 ──────────────────────────────────────────────────────────────────
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
function average(nums: number[]) {
  const arr = nums.filter((v) => typeof v === 'number')
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// 패널티 규칙: 첫 AI 요청은 무료, 이후 요청 1회당 -1, 힌트 1회당 -1
const PENALTY_PER_REQUEST = 1
const PENALTY_PER_HINT = 1
function computePenaltyUnits(requestCount: number, hintCount: number) {
  const requestPenalty = Math.max(0, requestCount - 1) * PENALTY_PER_REQUEST
  const hintPenalty = Math.max(0, hintCount) * PENALTY_PER_HINT
  return requestPenalty + hintPenalty
}

// ── 로컬 폴백(모델 실패 시) ────────────────────────────────────────────────
function localFallback(summary: ProfileSummary) {
  const brief =
    (Object.entries(summary.avg) as [StepKey, number][])
      .map(([k, v]) => `${LABEL[k]} ${Math.round(v || 0)}점`)
      .join(', ')
  return [
    `요약: ${brief}. 시도 ${summary.attempts}회 / 푼 문제 ${summary.solvedCount}개.`,
    '',
    '공통 실수 Top 3',
    '1) 요구/제약/엣지케이스가 표로 정리되지 않음 → 엣지 2개를 먼저 고정',
    '2) 분해 단계가 산출물 없이 서술됨 → 각 단계에 “입력→출력” 한 단어로 표기',
    '3) 패턴 선택 근거 부재 → 후보 2개 + 탈락 사유/선택 근거 1줄씩',
    '',
    '이번 주 과제(약점 보강)',
    '- 월: 약점1을 쉬운 문제 2개로 재훈련(체크리스트 템플릿 사용)',
    '- 수: 약점2를 중간 난이도 1개 + 의사코드 15줄 + 불변식 1개',
    '- 금: 강점 단계로 변형 문제 1개 풀고 반례 메모',
    '',
    '연습 드릴 5개',
    '- 주어진 문제를 1문단으로 요약(입력/출력/제약/엣지)',
    '- 요구를 3~7단계로 분해하고 각 단계의 입력/출력을 1줄로 표기',
    '- 패턴 후보 2개를 쓰고 탈락 사유 1개/선택 근거 1개 적기',
    '- 상태 전이를 텍스트 다이어그램으로 작성',
    '- 10~20줄 의사코드 + 테스트 2케이스(입력/기대값)',
  ].join('\n')
}

// ── 프롬프트 생성 (플레이북 섹션 제거 & 번호 재정렬) ─────────────────────────
function buildPrompt(summary: ProfileSummary) {
  const avgLine = (Object.entries(summary.avg) as [StepKey, number][])
    .map(([k, v]) => `${LABEL[k]} ${Math.round(v || 0)}점`)
    .join(', ')
  const weak = summary.weakest.map(k => LABEL[k]).join(', ') || '없음'
  const strong = summary.strength.map(k => LABEL[k]).join(', ') || '없음'

  return `
너는 학습자의 약점을 빠르게 개선시키는 한국어 코딩 튜터다. 과장 없이, 실행가능한 지시로 답하라.

[현재 지표]
- 평균 점수: ${avgLine}
- 약점: ${weak}
- 강점: ${strong}
- 시도: ${summary.attempts}회, 푼 문제: ${summary.solvedCount}개

(참고용 가이드 — 출력에 직접 쓰지 말 것)
${RUBRIC}

[요청 출력 형식 — 반드시 이 순서/제목 사용]
1) 한 줄 진단
2) 공통 실수 Top 3 (각 1줄)
3) 이번 주 과제(약점 2개 기반): 월·수·금 3줄
4) 연습 드릴 5개 (각 1줄, 바로 실행 가능한 형태)
`.trim()
}

// ── 핸들러 ───────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const parsed = BodySchema.parse(await req.json())
    const { summary, aiRequestCount, hintCount, solvedThreshold } = parsed

    // ✅ 패널티 전 평균(avgRaw) 계산
    const avgRaw = Math.round(
      average(Object.values(summary.avg).map((v) => (typeof v === 'number' ? v : 0)))
    )

    // ✅ 패널티 계산 및 적용 평균(finalAvg)
    const penaltyUnits = computePenaltyUnits(aiRequestCount, hintCount)
    const finalAvg = clamp(avgRaw - penaltyUnits)

    // (참고) 정답 처리 기준 충족 여부(대시보드 로직에서 쓸 수 있도록 동봉)
    const solvedNow = finalAvg >= solvedThreshold

    const prompt = buildPrompt(summary)

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              '너는 학습자의 수준에 맞춰 난도를 자동 조절하는 한국어 코딩 코치다. 과도한 이론 대신 즉시 적용 가능한 지시를 간결하게 쓴다.',
          },
          { role: 'user', content: prompt },
        ],
      })
      const text = completion.choices[0]?.message?.content?.trim() || '분석 결과를 생성하지 못했습니다.'
      return NextResponse.json({
        ok: true,
        text,
        // ✅ 점수 메타(프런트에서 표시/집계에 사용)
        avgRaw,
        finalAvg,
        penalty: {
          rule: 'first AI request free; then -1 per request and -1 per hint',
          aiRequestCount,
          hintCount,
          units: penaltyUnits,
        },
        solvedThreshold,
        solvedNow,
      })
    } catch {
      // 모델 실패 시에도 UX 끊기지 않게 폴백 리포트 + 점수 메타 반환
      const text = localFallback(summary)
      return NextResponse.json({
        ok: true,
        text,
        fallback: true,
        avgRaw,
        finalAvg,
        penalty: {
          rule: 'first AI request free; then -1 per request and -1 per hint',
          aiRequestCount,
          hintCount,
          units: penaltyUnits,
        },
        solvedThreshold,
        solvedNow,
      })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'invalid request' }, { status: 400 })
  }
}
