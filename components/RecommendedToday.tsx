// /components/RecommendedToday.tsx
'use client'
import Link from 'next/link'

type Problem = {
  id: string
  title: string
  description?: string
  difficulty?: string
  tags?: string[]
}

export default function RecommendedToday({
  problem,
  xp,
  streak,
}: {
  problem?: Problem
  xp: number
  streak: number
}) {
  if (!problem) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-6 ring-1 ring-black/5 shadow-sm">
        <div className="text-sm text-gray-600">추천할 문제가 없습니다.</div>
      </div>
    )
  }

  const diff =
    problem.difficulty === 'Easy'
      ? 'bg-green-100 text-green-700'
      : problem.difficulty === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : problem.difficulty === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700'

  // 샘플 “추천 이유”
  const reasons = [
    `연속 학습을 시작하기 좋도록 짧은 풀이 동선이에요.`,
    `현재 XP ${xp} / 스트릭 ${streak}일 — 이 문제로 안정적으로 XP를 쌓을 수 있어요.`,
    problem.tags?.length ? `최근 학습한 ${problem.tags.slice(0, 3).map((t) => `#${t}`).join(' ')} 와(과) 연결됩니다.` : undefined,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-6 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold">{problem.title}</div>
          <p className="mt-1 text-gray-600">{problem.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${diff}`}>{problem.difficulty}</span>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span>✨</span>
          <span className="font-semibold">추천 이유</span>
        </div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        {problem.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {problem.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">#{t}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${problem.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-4 py-2 text-sm font-semibold hover:bg-[#002D56]/90"
        >
          지금 풀기
        </Link>
        <Link
          href={`/problems#${problem.id}`}
          className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-4 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
        >
          문제 선택
        </Link>
      </div>
    </div>
  )
}
