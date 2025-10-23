'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
}

export default function HomeDashboard() {
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    fetch('/api/problems')
      .then((r) => r.json())
      .then(setProblems)
      .catch(() => {})
  }, [])

  const primary =
    'inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-5 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition'
  const outline =
    'inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5'

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* 헤더 */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span>환영합니다</span>
            <span>👋</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            오늘도 한 문제로 실력 +1
          </p>
        </header>

        {/* 히어로 카드 + 스탯 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">오늘의 추천 문제</p>
                <h3 className="mt-1 text-lg md:text-xl font-bold">
                  {problems[0]?.title ?? '문제 로딩 중...'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {problems[0]?.description ?? '잠시만요…'}
                </p>
              </div>
              <div className="hidden md:block">
                <DifficultyPill level={problems[0]?.difficulty} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                className={primary}
                href={problems[0] ? `/learn/${problems[0].id}` : '/problems'}
              >
                지금 풀기
              </Link>
              <Link className={outline} href="/problems">
                문제 선택
              </Link>
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">나의 오늘</p>
            <div className="mt-2 flex items-center gap-6">
              <Stat label="연속 학습일" value="3일" />
              <Stat label="획득 XP" value="120" />
            </div>
          </Card>
        </section>

        {/* 추천 문제 그리드 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">🔥 추천 문제 모음</h2>
            <Link
              href="/problems"
              className="text-sm text-[#002D56] hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {problems.map((p) => (
              <ProblemCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* AI 튜터 CTA */}
        <section id="tutor" className="mb-16">
          <Card className="bg-gradient-to-r from-hufs-green/15 to-hufs-gray/20 ring-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">AI 튜터에게 바로 물어보기</h3>
                <p className="text-sm text-gray-600 mt-1">
                  막히는 코드를 붙여넣고 힌트를 받아보세요.
                </p>
              </div>
              <Link href="/problems" className={primary}>
                문제 고르기
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

/* ————— 내부 소형 컴포넌트 ————— */

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

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
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{p.title}</h3>
        <DifficultyPill level={p.difficulty} />
      </div>
      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.tags?.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
          >
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
    </Card>
  )
}