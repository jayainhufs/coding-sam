'use client'

import { useEffect, useMemo, useState } from 'react'
import { aggregateProfile, LABEL, StepKey } from '@/utils/analysis'
import { getAllProgress, scoreToGrade } from '@/utils/progress'
import { PersonalPlaybook } from '@/components/PersonalPlaybook'

export default function EvaluationPanel() {
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState<string>('')

  const raw = getAllProgress()
  const list = useMemo(() => {
    return Object.entries(raw).map(([id, p]) => ({
      id,
      scores: p.scores as Partial<Record<StepKey, number>>,
      attempts: p.attempts ?? 0,
      solvedAt: p.solvedAt
    }))
  }, [raw])

  const summary = useMemo(() => aggregateProfile(list), [list])

  // 개인화 대상 단계 (기본: 최약점)
  const [target, setTarget] = useState<StepKey>(
    summary.weakest[0] ?? 'understand'
  )
  useEffect(() => {
    // raw/summary가 바뀌면 자동 재선정
    setTarget(summary.weakest[0] ?? 'understand')
  }, [summary.weakest.join(',')])

  async function evaluate() {
    setLoading(true)
    setText('')
    try {
      const res = await fetch('/api/ai/feedback/evaluate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          summary,
          recent: list.sort((a,b)=> (b.solvedAt ?? '').localeCompare(a.solvedAt ?? '')).slice(0,5)
        })
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'AI 오류')
      setText(j.text)
    } catch (e:any) {
      setText(`평가 생성 실패: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 등급에 따른 텍스트 색상 반환 함수
  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-600'
    if (grade === 'B') return 'text-blue-600'
    return 'text-red-500' // C 등급
  }

  return (
    <section className="space-y-4">
      {/* 3) 단계별 점수 올리는 플레이북 — 개인화(한 개만) */}
      <PersonalPlaybook weakest={target} onChange={setTarget} />

      {/* 요약 KPI */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-extrabold">학습 평가</h3>
          <button
            onClick={evaluate}
            className="px-3 py-1.5 rounded-lg bg-[#002D56] text-white hover:bg-[#002D56]/90"
          >
            {loading ? '분석 중…' : '평가 생성'}
          </button>
        </div>

        {/* 점수 -> 등급 표시줄 */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          {(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'] as StepKey[]).map(
            (k) => {
              const score = summary.avg[k]
              const grade = scoreToGrade(score) // 점수를 등급으로 변환
              return (
                <div
                  key={k}
                  className="rounded-lg border border-slate-200 p-2 bg-white/60 text-center"
                >
                  <div className="text-slate-500 text-sm">{LABEL[k]}</div>
                  {/* 등급 표시 */}
                  <div
                    className={`text-2xl font-bold ${getGradeColor(grade)}`}
                  >
                    {grade}
                  </div>
                  {/* 점수 표시 (작게) */}
                  {/* <div className="text-xs text-slate-400">{score}점</div> */}
                </div>
              )
            },
          )}
        </div>

        <div className="mt-2 text-xs text-slate-500">
          시도 {summary.attempts}회 · 푼 문제 {summary.solvedCount}개 · 약점 {summary.weakest.map(k=>LABEL[k]).join(', ')}
        </div>

        <div className="border-b border-slate-200 my-4" />

        {/* 결과 텍스트 */}
        <div className="min-h-[140px] whitespace-pre-wrap leading-7">
          {text || '버튼을 눌러 AI 학습 평가를 받아보세요.'}
        </div>
      </section>
    </section>
  )
}
