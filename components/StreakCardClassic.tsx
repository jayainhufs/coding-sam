// /components/StreakCardClassic.tsx
'use client'

import { useEffect, useState } from 'react'

function ymdLocal(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 채워진 칸=불꽃(20px), 빈칸=작은 점. 간격 촘촘(gap-1.5). */
function StreakMini({ n }: { n: number }) {
  const filled = Math.min(n, 7)
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => {
          const on = i < filled
          return (
            <span key={i} className="inline-flex items-center justify-center">
              {on ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  className={
                    'drop-shadow-[0_1px_1px_rgba(0,0,0,.18)] ' +
                    (i === filled - 1 ? 'scale-[1.12]' : '')
                  }
                  aria-hidden
                >
                  <defs>
                    <linearGradient id={`flame-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFC46B" />
                      <stop offset="55%" stopColor="#FF974D" />
                      <stop offset="100%" stopColor="#FF6A3D" />
                    </linearGradient>
                  </defs>
                  {/* 심볼을 살짝 더 통통하게 수정 */}
                  <path
                    d="M12 2c1.9 3.4-.4 5.6-1.9 7.2-1.3 1.4-1.8 2.3-.7 3.9 1.7-1.1 3.5-3.3 3.6-5.6 2.5 2 4.6 4.9 4.6 8.1 0 3.5-2.8 6.4-6.5 6.4s-6.5-2.9-6.5-6.4c0-4 3.1-6.7 5-8 1.1-1 2.1-2.2 2.4-3.6z"
                    fill={`url(#flame-${i})`}
                  />
                  {/* 하이라이트 */}
                  <path
                    d="M12 8.8c.8 2-1.2 4.1-2.7 4.7 1.1-1.8-.1-2.6.8-3.6.6-.7 1.2-1 1.9-1.1z"
                    fill="rgba(255,255,255,.35)"
                  />
                </svg>
              ) : (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function StreakCardClassic({ streakDays }: { streakDays: number }) {
  const [todayDone, setTodayDone] = useState(false)
  useEffect(() => {
    const last =
      localStorage.getItem('coding-sam:lastActiveLocal') ||
      localStorage.getItem('coding-sam:lastActive') ||
      ''
    setTodayDone(last === ymdLocal())
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">연속 학습</span>
        <span className="text-sm font-bold text-[#296B75]">{streakDays}일</span>
      </div>

      {/* 헤더 아이콘 + 메시지 */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 text-white flex items-center justify-center shadow">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 2c1.9 3.4-.4 5.6-1.9 7.2-1.3 1.4-1.8 2.3-.7 3.9 1.7-1.1 3.5-3.3 3.6-5.6 2.5 2 4.6 4.9 4.6 8.1 0 3.5-2.8 6.4-6.5 6.4s-6.5-2.9-6.5-6.4c0-4 3.1-6.7 5-8 1.1-1 2.1-2.2 2.4-3.6z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <div className="text-lg font-extrabold">{streakDays}일</div>
          <div className="text-sm text-gray-600">
            {todayDone ? '오늘의 학습을 달성했어요!' : '오늘도 한 번만 풀면 기록이 이어져요.'}
          </div>
        </div>
      </div>

      {/* 미니 7칸 */}
      <div className="mt-3 flex items-center justify-between">
        <StreakMini n={streakDays % 7 || 7} />
        <span className="text-xs text-slate-500">7일 주기 미니표시</span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        매일 접속하면 보너스 XP! 끊기면 1일부터 다시 시작돼요.
      </p>
    </div>
  )
}
