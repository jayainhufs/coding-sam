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
  progress,          // ⬅ 추가: 학습률 %
  solved,            // ⬅ 추가: 풀었음 배지
  scoreToGrade,
}: {
  problem?: Problem
  xp: number
  streak: number
  progress?: number
  solved?: boolean
  scoreToGrade: (score: number) => string // ✅ 1. (추가) prop 타입 정의
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

  const reasons = [
    `🔥 현재 ${streak}일 연속 학습 중! 문제를 풀어 연속학습을 이어가세요!`,
    `💎 이 문제를 해결하고 ${100 - xp%100}XP를 획득하여 레벨을 올려보세요!`,
    problem.tags?.length
      ? `🧠 당신이 관심 있을 만한 ${problem.tags.slice(0, 3).map((t) => `#${t}`).join(' ')} 유형과 연결됩니다.`
      : undefined,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-6 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold">{problem.title}</div>
          <p className="mt-1 text-gray-600">{problem.description}</p>

          {/* 학습률/풀었음 배지 */}
          <div className="mt-2 flex flex-wrap gap-2">
          {/* ✅ 2. (수정) "학습률" -> "학습 등급" */}
          {typeof progress === 'number' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              학습 등급 {scoreToGrade(progress)}
            </span>
            )}
            {solved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#002D56] text-white">
                풀었음
              </span>
            )}
          </div>
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
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${problem.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-4 py-2 text-sm font-semibold hover:bg-[#002D56]/90"
        >
          {solved ? '다시 풀기' : '지금 풀기'}
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
