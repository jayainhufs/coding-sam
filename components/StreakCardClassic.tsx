'use client'

function dots(n: number) {
  return Array.from({ length: 7 }).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        i < Math.min(n, 7) ? 'bg-[#296B75]' : 'bg-slate-200'
      }`}
    />
  ))
}

export default function StreakCardClassic({ streakDays }: { streakDays: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">연속 학습</span>
        <span className="text-sm font-bold text-[#296B75]">{streakDays}일</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">{dots(streakDays % 7 || 7)}</div>
        <span className="text-xs text-slate-500">7일 주기 미니표시</span>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        매일 접속하면 보너스 XP! 끊기면 1일부터 다시 시작돼요.
      </p>
    </div>
  )
}
