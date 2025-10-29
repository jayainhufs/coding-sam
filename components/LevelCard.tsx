'use client'

import { useEffect, useState } from 'react'

export default function LevelCard({
  totalXp,
  title = '레벨 진행',
}: { totalXp: number; title?: string }) {
  const level = Math.floor(totalXp / 100) + 1
  const cur = totalXp % 100
  const left = 100 - cur
  const pct = Math.min(100, Math.max(0, (cur / 100) * 100))

  const [w, setW] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">{title}</h3>
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#002D56]">
          <path fill="currentColor" d="M13 2L3 14h7l-1 8l12-14h-7l-1-6z" />
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <div className="grid place-items-center rounded-2xl bg-[#0F2F57] text-white w-16 h-16 shadow-md">
          <div className="text-[10px] opacity-80 -mb-1">LV</div>
          <div className="text-2xl font-extrabold leading-none">{level}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-gray-900 font-semibold">
            LV {level} · {cur} / 100 XP
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#002D56] via-[#146E7A] to-[#8D7150] transition-[width] duration-700 ease-out"
              style={{ width: `${w}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">다음 레벨까지 {left} XP</div>
        </div>
      </div>
    </div>
  )
}
