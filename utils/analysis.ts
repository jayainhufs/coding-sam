// /utils/analysis.ts

// 단계 키(프로젝트 공통)
export type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

export type StepScores = Partial<Record<StepKey, number>>

// 마이페이지 집계 시 한 문제의 요약 형태
export type ProblemProgress = {
  id: string
  scores: StepScores
  attempts: number
  solvedAt?: string
}

// 마이페이지 상단 요약에 쓰는 구조
export type ProfileSummary = {
  avg: Record<StepKey, number>   // 단계별 평균 0~100
  attempts: number               // 총 시도 수 합
  solvedCount: number            // 푼 문제 수
  weakest: StepKey[]             // 하위 2개 단계
  strength: StepKey[]            // 상위 2개 단계
}

// 한글 라벨(전역 통일)
export const LABEL: Record<StepKey, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드',
}

const ORDER: StepKey[] = ['understand', 'decompose', 'pattern', 'abstract', 'pseudocode']

/**
 * 문제별 진행 리스트를 받아 마이페이지용 요약을 만든다.
 */
export function aggregateProfile(all: ProblemProgress[]): ProfileSummary {
  const sum: Record<StepKey, number> = { understand: 0, decompose: 0, pattern: 0, abstract: 0, pseudocode: 0 }
  const cnt: Record<StepKey, number> = { understand: 0, decompose: 0, pattern: 0, abstract: 0, pseudocode: 0 }
  let attempts = 0

  for (const p of all) {
    attempts += p.attempts ?? 0
    for (const k of ORDER) {
      const v = p.scores?.[k]
      if (typeof v === 'number' && !Number.isNaN(v)) {
        const clamped = Math.max(0, Math.min(100, Math.round(v)))
        sum[k] += clamped
        cnt[k]++
      }
    }
  }

  const avg = {} as Record<StepKey, number>
  ORDER.forEach((k) => (avg[k] = cnt[k] ? Math.round(sum[k] / cnt[k]) : 0))

  const sorted = [...ORDER].sort((a, b) => avg[a] - avg[b])
  const weakest = sorted.slice(0, 2)
  const strength = sorted.slice(-2).reverse()

  return { avg, attempts, solvedCount: all.length, weakest, strength }
}
