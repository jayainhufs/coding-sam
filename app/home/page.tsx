'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import LevelCard from '@/components/LevelCard'
import StreakCard from '@/components/StreakCard'
import RecommendedToday from '@/components/RecommendedToday'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
}

export default function HomeDashboard() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [xp, setXp] = useState<number>(120)       // 예시: 120 → LV2, 20/100
  const [streak, setStreak] = useState<number>(3) // 초기 화면 예시값

  // --- XP 영속화 (임시) ---
  useEffect(() => {
    const saved = localStorage.getItem('coding-sam:xp')
    if (saved) setXp(parseInt(saved, 10))
  }, [])
  useEffect(() => {
    localStorage.setItem('coding-sam:xp', String(xp))
  }, [xp])

  // --- 연속 출석 (하루 1회 갱신) ---
  useEffect(() => {
    const keyStreak = 'coding-sam:streak'
    const keyLast = 'coding-sam:lastActive' // 'YYYY-MM-DD'

    const today = new Date()
    const ymd = today.toISOString().slice(0, 10)

    const last = localStorage.getItem(keyLast)
    const curStreak = parseInt(localStorage.getItem(keyStreak) || '0', 10) || 0

    if (!last) {
      localStorage.setItem(keyLast, ymd)
      localStorage.setItem(keyStreak, '1')
      setStreak(1)
      return
    }
    if (last === ymd) {
      setStreak(curStreak || 1)
      return
    }
    const lastDate = new Date(last + 'T00:00:00')
    const diffDays = Math.round((+today - +lastDate) / (1000 * 60 * 60 * 24))
    const next = diffDays === 1 ? curStreak + 1 : 1
    localStorage.setItem(keyLast, ymd)
    localStorage.setItem(keyStreak, String(next))
    setStreak(next)
  }, [])

  useEffect(() => {
    fetch('/api/problems')
      .then((r) => r.json())
      .then((arr: Problem[]) => setProblems(arr))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* 헤더 */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span>환영합니다</span>
            <span>👋</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">오늘도 한 문제로 실력 +1</p>
        </header>

        {/* 좌: 오늘의 추천 문제(확대 & 추천이유) / 우: 레벨 & 연속출석 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="md:col-span-2">
            <RecommendedToday problem={problems[0]} xp={xp} streak={streak} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <LevelCard totalXp={xp} />
            <StreakCard streakDays={streak} />
          </div>
        </section>

        {/* 추천 문제 그리드 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">추천 문제 모음</h2>
            <Link href="/problems" className="text-sm text-[#002D56] hover:underline">
              전체보기
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {problems.map((p) => (
              <ProblemCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ——— 보조 컴포넌트 (기존 유지) ——— */

function DifficultyPill({ level }: { level?: string }) {
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
        <Link
          href={`/problems#${p.id}`}
          className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
        >
          자세히
        </Link>
      </div>
    </div>
  )
}
