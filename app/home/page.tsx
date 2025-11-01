'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import LevelCardClassic from '@/components/LevelCardClassic'
import StreakCardClassic from '@/components/StreakCardClassic'
import RecommendedToday from '@/components/RecommendedToday'
import SolvedPanel from '@/components/SolvedPanel'
import { getAllProgress, getSolvedList, computeLearningRate, getXP } from '@/utils/progress'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
}

/* 로컬 타임존 YYYY-MM-DD */
const ymdLocal = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function HomeDashboard() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [xp, setXp] = useState<number>(0)         // XP: 단일 소스 구독
  const [streak, setStreak] = useState<number>(0) // 연속 학습일

  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set())

  /* XP 최초 로드 + 이벤트 구독 */
  useEffect(() => {
    const read = () => setXp(getXP())
    const onStorage = (e: StorageEvent) => { if (e.key === 'coding-sam:xp') read() }

    read()
    window.addEventListener('xp-updated', read as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('xp-updated', read as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  /* 스트릭(포커스/가시성 변화에도 갱신) */
  useEffect(() => {
    const KEY_STREAK = 'coding-sam:streak'
    const KEY_LAST   = 'coding-sam:lastActiveLocal'

    const update = () => {
      const today = ymdLocal()
      const legacy = localStorage.getItem('coding-sam:lastActive') // 호환
      const last = localStorage.getItem(KEY_LAST) || legacy || ''
      let cur = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10) || 0

      if (!last) {
        localStorage.setItem(KEY_LAST, today)
        cur = Math.max(1, cur || 1)
        localStorage.setItem(KEY_STREAK, String(cur))
        setStreak(cur)
        return
      }
      if (last === today) { setStreak(cur || 1); return }

      const diffDays = Math.round(
        (+new Date(`${today}T00:00:00`) - +new Date(`${last}T00:00:00`)) / 86400000
      )
      const next = diffDays === 1 ? (cur || 0) + 1 : 1
      localStorage.setItem(KEY_LAST, today)
      localStorage.setItem(KEY_STREAK, String(next))
      setStreak(next)
    }

    update()
    const onFocus = () => update()
    const onVis = () => { if (document.visibilityState === 'visible') update() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  /* 문제 로드 */
  useEffect(() => {
    fetch('/api/problems')
      .then((r) => r.json())
      .then((arr: Problem[]) => setProblems(arr))
      .catch(() => {})
  }, [])

  /* 진행도/푼 문제 배지 */
  useEffect(() => {
    const all = getAllProgress()
    const solved = new Set(getSolvedList())
    const map: Record<string, number> = {}
    Object.entries(all).forEach(([pid, rec]) => { map[pid] = computeLearningRate(rec.scores) })
    setSolvedSet(solved)
    setProgressMap(map)
  }, [])

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* 헤더 */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span>환영합니다</span><span>👋</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">오늘도 한 문제로 실력 +1</p>
        </header>

        {/* 좌: 추천 / 우: 레벨+스트릭+풀이 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="md:col-span-2">
            <RecommendedToday problem={problems[0]} xp={xp} streak={streak} />
          </div>

          {/* 오른쪽 칼럼 고정 */}
          <div className="grid grid-cols-1 gap-4 md:sticky md:top-20 self-start h-fit">
            <LevelCardClassic />
            <StreakCardClassic streakDays={streak} />
            <SolvedPanel />
          </div>
        </section>

        {/* 추천 문제 그리드 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">추천 문제 모음</h2>
            <Link href="/problems" className="text-sm text-[#002D56] hover:underline">전체보기</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {problems.map((p) => (
              <ProblemCard key={p.id} p={p} progress={progressMap[p.id]} solved={solvedSet.has(p.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* —— 보조 카드 —— */
function ProblemCard({ p, progress, solved }: { p: Problem; progress?: number; solved?: boolean }) {
  const pill =
    p.difficulty === 'Easy'   ? 'bg-green-100 text-green-700'
  : p.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700'
  : p.difficulty === 'Hard'   ? 'bg-red-100 text-red-700'
  : 'bg-gray-100 text-gray-600'

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold leading-tight">{p.title}</h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pill}`}>{p.difficulty}</span>
      </div>

      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{p.description}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {typeof progress === 'number' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#146E7A] text-white">학습률 {progress}%</span>
        )}
        {solved && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#002D56] text-white">풀었음</span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/learn/${p.id}`} className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/90">
          {solved ? '다시 풀기' : '풀기'}
        </Link>
        <Link href={`/problems#${p.id}`} className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5">
          자세히
        </Link>
      </div>
    </div>
  )
}
