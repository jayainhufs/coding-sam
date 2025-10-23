'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | string
  tags: string[]
}

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }
const PAGE_SIZE = 6

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI 상태
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort] = useState<'recommended' | 'difficulty' | 'title'>('recommended')
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    setLoading(true)
    fetch('/api/problems')
      .then((r) => r.json())
      .then((data: Problem[]) => {
        setProblems(data)
        setLoading(false)
      })
      .catch(() => {
        setError('문제 목록을 불러오지 못했어요.')
        setLoading(false)
      })
  }, [])

  // 태그 목록(빈도순)
  const allTags = useMemo(() => {
    const freq = new Map<string, number>()
    problems.forEach((p) => p.tags?.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1)))
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 12)
  }, [problems])

  // 필터링
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return problems
      .filter((p) => (difficulty === 'All' ? true : p.difficulty === difficulty))
      .filter((p) => (activeTags.length ? activeTags.every((t) => p.tags?.includes(t)) : true))
      .filter((p) => {
        if (!q) return true
        const inText =
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        return inText
      })
  }, [problems, difficulty, activeTags, query])

  // 정렬
  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'title') {
      arr.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'difficulty') {
      arr.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99))
    } else {
      // recommended: Medium을 위로, 그다음 Easy/Hard, 그리고 제목순
      arr.sort((a, b) => {
        const score = (x: Problem) =>
          (x.difficulty === 'Medium' ? 0 : x.difficulty === 'Easy' ? 1 : 2)
        const s = score(a) - score(b)
        return s !== 0 ? s : a.title.localeCompare(b.title)
      })
    }
    return arr
  }, [filtered, sort])

  const visibleItems = sorted.slice(0, visible)
  const hasMore = visible < sorted.length

  const resetFilters = () => {
    setQuery('')
    setDifficulty('All')
    setActiveTags([])
    setSort('recommended')
    setVisible(PAGE_SIZE)
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* 헤더 */}
        <header className="mb-6 md:mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">문제 선택</h1>
              <p className="text-sm text-gray-600 mt-1">
                검색/필터로 빠르게 찾아보세요. 총{' '}
                <span className="font-semibold text-[#002D56]">{problems.length}</span>문제
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/home"
                className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
              >
                대시보드
              </Link>
            </div>
          </div>
        </header>

        {/* 컨트롤 바 */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-4 ring-1 ring-black/5 shadow-sm mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* 검색 */}
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setVisible(PAGE_SIZE)
                }}
                placeholder="문제 제목, 설명, 태그 검색…"
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-[#002D56]"
              />
            </div>

            {/* 난이도 */}
            <div className="flex items-center gap-2">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((lvl) => {
                const active = difficulty === lvl
                const base = 'px-3 py-2 rounded-xl text-sm font-medium'
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDifficulty(lvl)
                      setVisible(PAGE_SIZE)
                    }}
                    className={
                      active
                        ? `${base} bg-[#002D56] text-white`
                        : `${base} ring-1 ring-[#002D56] text-[#002D56] hover:bg-[#002D56]/5`
                    }
                  >
                    {lvl}
                  </button>
                )
              })}
            </div>

            {/* 정렬 */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">정렬</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any)
                  setVisible(PAGE_SIZE)
                }}
                className="rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-[#002D56]"
              >
                <option value="recommended">추천순</option>
                <option value="difficulty">난이도순</option>
                <option value="title">제목순</option>
              </select>

              <button
                onClick={resetFilters}
                className="ml-1 inline-flex items-center rounded-xl bg-white text-[#002D56] ring-1 ring-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {allTags.map((t) => {
                const on = activeTags.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setActiveTags((prev) =>
                        on ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                      setVisible(PAGE_SIZE)
                    }}
                    className={
                      on
                        ? 'text-xs px-3 py-1 rounded-full bg-[#146E7A] text-white'
                        : 'text-xs px-3 py-1 rounded-full ring-1 ring-[#146E7A] text-[#146E7A] hover:bg-[#146E7A]/5'
                    }
                  >
                    #{t}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorBox message={error} />
        ) : sorted.length === 0 ? (
          <EmptyBox onReset={resetFilters} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleItems.map((p) => (
                <ProblemCard key={p.id} p={p} />
              ))}
            </div>

            {/* 더 보기 */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ————— 내부 컴포넌트 ————— */

function ProblemCard({ p }: { p: Problem }) {
  const pill =
    p.difficulty === 'Easy'
      ? 'bg-green-100 text-green-700'
      : p.difficulty === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : p.difficulty === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600'

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold leading-tight">{p.title}</h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pill}`}>
          {p.difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{p.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {p.tags?.slice(0, 4).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${p.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/90"
        >
          풀기
        </Link>
        <a
          href={`#${p.id}`}
          className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
        >
          자세히
        </a>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200/70 bg-white/60 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm animate-pulse"
        >
          <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-full bg-gray-200 rounded mb-2" />
          <div className="h-3 w-5/6 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6">
      {message} 새로고침하거나 잠시 후 다시 시도하세요.
    </div>
  )
}

function EmptyBox({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <div className="text-xl font-semibold mb-2">조건에 맞는 문제가 없어요</div>
      <p className="text-sm text-gray-600 mb-4">검색어나 필터를 바꿔보세요.</p>
      <button
        onClick={onReset}
        className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-2 px-4 text-sm font-semibold hover:bg-[#002D56]/5"
      >
        필터 초기화
      </button>
    </div>
  )
}