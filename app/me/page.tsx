// /app/me/page.tsx
'use client'

import UserRadar from '@/components/UserRadar'
import EvaluationPanel from '@/components/EvaluationPanel'
import { getAllProgress, computeLearningRate } from '@/utils/progress'

export default function MyPage() {
  const progress = getAllProgress() as Record<string, any>

  const solvedCount = Object.keys(progress).length
  const avgLearningRate = (() => {
    const rates = Object.values(progress).map((p: any) => computeLearningRate(p?.scores ?? {}))
    if (!rates.length) return 0
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  })()

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">내 학습 리포트</h1>
        <p className="text-sm text-slate-600 mt-1">내가 푼 문제를 바탕으로 단계별 레이더와 맞춤형 평가를 제공합니다.</p>
      </header>

      {/* 상단: 레이더 + 요약 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h2 className="text-lg font-bold mb-3">단계별 평균 점수</h2>
          <UserRadar />
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-3">요약</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">푼 문제</dt>
              <dd className="font-semibold">{solvedCount}개</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">평균 학습률</dt>
              <dd className="font-semibold">{avgLearningRate}%</dd>
            </div>
          </dl>
        </aside>
      </section>

      {/* 하단: AI 학습 평가 */}
      <EvaluationPanel />
    </main>
  )
}
