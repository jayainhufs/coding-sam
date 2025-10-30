// /components/UserRadar.tsx
'use client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import { aggregateProfile, LABEL, StepKey } from '@/utils/analysis'
import { getAllProgress } from '@/utils/progress'

export default function UserRadar() {
  const raw = getAllProgress()
  const list = Object.entries(raw).map(([id, p]: any) => ({
    id,
    scores: p?.scores ?? {},
    attempts: p?.attempts ?? 0,
  }))
  const summary = aggregateProfile(list)

  // 0~100 범위로 보정
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n ?? 0)))
  const data = (['understand','decompose','pattern','abstract','pseudocode'] as StepKey[])
    .map((k) => ({ step: LABEL[k], value: clamp(summary.avg[k]) }))

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis dataKey="step" tick={{ fill: '#334155', fontSize: 12 }} />
          {/* ★ 반경을 0~100으로 고정(눈금/축선은 숨김) */}
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} strokeOpacity={0} />
          <Radar name="평균" dataKey="value" stroke="#0f172a" fill="#0f172a" fillOpacity={0.5} dot={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
