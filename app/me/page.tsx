'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import UserRadar from '@/components/UserRadar'
import EvaluationPanel from '@/components/EvaluationPanel'
import { getAllProgress, computeLearningRate } from '@/utils/progress'
import { useAuth, USER_KEY, PREF_KEY } from '@/lib/AuthContext'

// --- 표시용 텍스트 매핑 (기존 유지) ---
const LEVEL_MAP: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
}

const GOAL_MAP: Record<string, string> = {
  algorithm: '알고리즘 사고',
  style: '코드 스타일/리팩토링',
  system: '시스템/CS 개념',
}
// --- 끝 ---

export default function MyPage() {
  // --- 사용자 정보 State (styleSummary를 위해 수정) ---
  const [username, setUsername] = useState('사용자')
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('algorithm')
  // ✅ 6. 'codeStyle' state를 객체로 받도록 수정 (기존 '미설정' -> null)
  const [codeStyle, setCodeStyle] = useState<any>(null) // 초기값 'null'
  // --- 끝 ---

  // --- AuthContext에서 사용자 정보 가져오기 ---
  const { user: authUser } = useAuth()

  // --- localStorage에서 정보 로드 (기존 유지) ---
  useEffect(() => {
    const currentUserName = authUser || localStorage.getItem(USER_KEY)

    if (currentUserName) {
      setUsername(currentUserName)

      const prefKey = PREF_KEY(currentUserName)
      const savedPref = localStorage.getItem(prefKey)

      if (savedPref) {
        try {
          const pref = JSON.parse(savedPref)
          if (pref.level) setLevel(pref.level)
          if (pref.goal) setGoal(pref.goal)
          // ✅ 7. 'codeStyle' 객체를 state에 설정 (기존 로직)
          if (pref.codeStyle) setCodeStyle(pref.codeStyle)
        } catch (e) {
          console.error('설정 로드 실패:', e)
        }
      }
    }
  }, [authUser])
  // --- 끝 ---

  // ✅ 8. getAllProgress, computeLearningRate 호출 복원
  const progress = getAllProgress() as Record<string, any>

  const solvedCount = Object.keys(progress).length
  const avgLearningRate = (() => {
    const rates = Object.values(progress).map((p: any) =>
      computeLearningRate(p?.scores ?? {}),
    )
    if (!rates.length) return 0
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  })()

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">내 학습 리포트</h1>
        <p className="text-sm text-slate-600 mt-1">
          내가 푼 문제를 바탕으로 단계별 레이더와 맞춤형 평가를 제공합니다.
        </p>
      </header>

      {/* --- 프로필 섹션 (수정) --- */}
      <section className="rounded-2xl border border-hufs-gray bg-white p-5 md:p-6 ring-1 ring-black/5 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          <div className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-hufs-gray/50 shadow-sm">
            <Image
              src="/Homepage_icon.jpg"
              alt="프로필 이미지"
              fill
              style={{ objectFit: 'cover' }}
              className="z-0"
            />
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-hufs-navy">
              {username}
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <InfoItem
                label="실력 수준"
                value={LEVEL_MAP[level] ?? '미설정'}
              />
              <InfoItem
                label="학습 목표"
                value={GOAL_MAP[goal] ?? '미설정'}
              />
              {/* 10. 코드 스타일 정보 (styleSummary 표시 로직) */}
              <InfoItem
                label="코드 스타일"
                value={
                  typeof codeStyle === 'object' &&
                  codeStyle !== null &&
                  codeStyle.styleSummary
                    ? codeStyle.styleSummary
                    : '미설정'
                }
              />
            </div>
          </div>
        </div>
      </section>
      {/* --- 끝 --- */}

      {/* --- 상단: 레이더 + 요약 (기존 유지) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h2 className="text-lg font-bold mb-3">단계별 평균 점수</h2>
          {/* 11. <UserRadar /> 컴포넌트 */}
          <UserRadar />
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-3">요약</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">푼 문제</dt>
              <dd className="font-semibold">{solvedCount}개</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">평균 학습률</dt>
              <dd className="font-semibold">{avgLearningRate}%</dd>
            </div>
          </dl>
        </aside>
      </section>

      {/* --- 하단: AI 학습 평가 (기존 유지) --- */}
      {/* 12. <EvaluationPanel /> 컴포넌트*/}
      <EvaluationPanel />
    </main>
  )
}

// --- 8. 프로필 정보 표시용 내부 컴포넌트 (기존 유지) ---
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  )
}