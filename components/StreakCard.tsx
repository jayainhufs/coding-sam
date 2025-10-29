'use client'

export default function StreakCard({
  streakDays,
  title = '연속 출석',
  caption = '꾸준함이 실력입니다',
}: { streakDays: number; title?: string; caption?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-gray-800">{title}</h3>
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#E67E22]">
          <path fill="currentColor" d="M13.5 5.5S14 7 12 8.5S8 8 8 8s1 2 0 3s-2 2.5-2 4.5a6 6 0 1 0 12 0c0-3-2-5-4.5-6.5z" />
        </svg>
      </div>

      <div className="flex items-center gap-4">
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white text-[#002D56] ring-1 ring-[#002D56]/20 shadow-sm">
          <div className="text-[11px] text-gray-600 -mb-1">연속</div>
          <div className="text-2xl font-extrabold leading-none">{streakDays}</div>
        </div>

        <div className="flex-1">
          <div className="text-gray-900 font-semibold">{streakDays}일 연속 학습 중</div>
          <div className="text-xs text-gray-500">{caption}</div>
        </div>
      </div>
    </div>
  )
}
