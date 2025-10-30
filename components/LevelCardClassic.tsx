// /components/LevelCardClassic.tsx
'use client'
import { useEffect, useState } from 'react'
import { getXP } from '@/utils/progress'
import { xpToLevel } from '@/utils/level'

export default function LevelCardClassic() {
  const [xp, setXp] = useState(0)

  useEffect(() => {
    const read = () => setXp(getXP())
    read()

    const onXP = () => read()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'coding-sam:xp') read()
    }
    window.addEventListener('xp-updated', onXP)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('xp-updated', onXP)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const { level, cur, need, pct } = xpToLevel(xp)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">내 레벨</span>
        <span className="inline-flex items-center rounded-full bg-[#002D56] px-2.5 py-1 text-xs font-bold text-white">
          LV {level}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-[#002D56]" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xs text-slate-500">다음 레벨까지</span>
          <span className="text-sm font-semibold text-slate-800">
            {cur} / {need} XP
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        총 XP: <span className="font-semibold text-slate-800">{xp}</span>
      </div>
    </div>
  )
}
