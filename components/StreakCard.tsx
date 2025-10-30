// /components/StreakCard.tsx
'use client'

export default function StreakCard({ streakDays }: { streakDays: number }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      <h3 className="font-semibold">연속 학습</h3>
      <div className="mt-2 text-2xl font-extrabold">{streakDays}일</div>
      <p className="mt-1 text-xs text-gray-600">내일도 이어가면 보너스 XP!</p>
    </div>
  )
}
