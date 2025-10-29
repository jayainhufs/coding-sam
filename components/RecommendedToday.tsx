// components/RecommendedToday.tsx
'use client'

import Link from 'next/link'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-semibold">
      {children}
    </span>
  )
}

function Diff({ level }: { level?: string }) {
  const color =
    level === 'Easy'
      ? 'bg-green-100 text-green-700'
      : level === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : level === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {level ?? '—'}
    </span>
  )
}

/** 간단한 규칙 기반 "추천 이유" 생성기 (로컬 히스토리/상황 사용) */
function makeReasons(p: Problem, opts: { xp: number; streak: number }) {
  const reasons: string[] = []
  const level = Math.max(1, Math.floor(opts.xp / 100) + 1)
  const xpToNext = 100 - (opts.xp % 100)

  // 1) 연속학습 동기
  if (opts.streak <= 2) {
    reasons.push('연속 학습을 시작하기 좋도록 짧은 풀이 동선이에요.')
  } else {
    reasons.push(`${opts.streak}일 연속 학습 중! 흐름을 잇기 좋은 난이도예요.`)
  }

  // 2) 레벨 업 동기
  if (xpToNext <= 20) {
    reasons.push(`레벨업까지 ${xpToNext} XP – 이 문제로 마무리해보세요.`)
  } else {
    reasons.push(`현재 LV ${level}. 이 문제로 안정적으로 XP를 쌓을 수 있어요.`)
  }

  // 3) 태그 시너지 (최근 태그 이력과 겹치면 추천)
  const recent = (JSON.parse(localStorage.getItem('coding-sam:recent-tags') || '[]') as string[]).slice(0, 6)
  const overlap = p.tags?.filter((t) => recent.includes(t))
  if (overlap?.length) {
    reasons.push(`최근 학습한 ${overlap.map((t) => `#${t}`).join(' ')}와(과) 연계됩니다.`)
  } else if (p.tags?.length) {
    reasons.push(`${p.tags.slice(0, 2).map((t) => `#${t}`).join(' ')} 핵심 개념을 익힐 수 있어요.`)
  }

  return reasons.slice(0, 3)
}

export default function RecommendedToday({
  problem,
  xp,
  streak,
}: {
  problem: Problem | undefined
  xp: number
  streak: number
}) {
  if (!problem) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm min-h-48 md:min-h-56 animate-pulse" />
    )
  }

  const reasons = makeReasons(problem, { xp, streak })

  // 최근 태그 기록 갱신(아주 가볍게)
  try {
    const prev = (JSON.parse(localStorage.getItem('coding-sam:recent-tags') || '[]') as string[])
    const next = Array.from(new Set([...problem.tags, ...prev])).slice(0, 10)
    localStorage.setItem('coding-sam:recent-tags', JSON.stringify(next))
  } catch {}

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm min-h-48 md:min-h-56">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">오늘의 추천 문제</p>
          <div className="mt-1 flex items-center gap-2">
            <h3 className="text-lg md:text-xl font-bold">{problem.title}</h3>
            <Diff level={problem.difficulty} />
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2 md:line-clamp-3">{problem.description}</p>
        </div>
      </div>

      {/* 추천 이유 블록 */}
      <div className="mt-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#002D56]">✨</span>
          <span className="text-sm font-semibold text-gray-800">추천 이유</span>
        </div>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        {/* 태그 요약 */}
        {problem.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {problem.tags.slice(0, 4).map((t) => (
              <Pill key={t}>#{t}</Pill>
            ))}
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${problem.id}`}
          className="inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-5 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition"
        >
          지금 풀기
        </Link>
        <Link
          href="/problems"
          className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5"
        >
          문제 선택
        </Link>
      </div>
    </div>
  )
}
