'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth, USER_KEY, PREF_KEY } from '@/lib/AuthContext'

const levels = [
  {
    id: 'beginner',
    title: '입문 (Beginner)',
    desc: '문법 기초부터 시작해요. 코드가 낯설어요.',
  },
  {
    id: 'intermediate',
    title: '중급 (Intermediate)',
    desc: '기본기는 있지만, 문제 해결 전략이 부족해요.',
  },
  {
    id: 'advanced',
    title: '고급 (Advanced)',
    desc: '다양한 문제를 풀었고, 코딩 스타일/최적화에 관심이 많아요',
  },
]

const goals = [
  {
    id: 'algorithm',
    title: '논리력 및 문제 해결',
    desc: '복잡한 문제를 체계적으로 분석하고 해결하는 논리 흐름을 키우고 싶어요.',
  },
  {
    id: 'style',
    title: '가독성 및 코드 구조화',
    desc: '클린 코드 원칙을 적용하고, 함수/변수 구조를 명확하게 만들고 싶어요.',
  },
  {
    id: 'system',
    title: '시스템 효율 및 최적화',
    desc: '시간/공간 복잡도를 이해하고, 코드를 빠르고 효율적으로 만들고 싶어요.',
  },
]

export default function Onboarding() {
  const r = useRouter()
  const { user } = useAuth()
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('algorithm')

  // 미로그인 접근 가드(문자열 사용자 기준)
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(USER_KEY)
      if (!stored) r.replace('/login')
    }
  }, [user, r])

  function next() {
    const pref = { level, goal }
    try {
      const u = user ?? localStorage.getItem(USER_KEY) // 타이밍 대비
      if (u) {
        localStorage.setItem(PREF_KEY(u), JSON.stringify(pref)) // ✅ 사용자별 저장
        localStorage.removeItem('coding-sam:pref') // (선택) 레거시 정리
      }
    } catch (e) {
      console.error('localStorage error', e)
    }
    // r.push('/home') // 1. 기존 /home 경로
    r.push('/onboarding/style') // 2. ✅ 새로운 스타일 분석 페이지로 이동
  }

  const getButtonClass = (isActive: boolean) =>
    isActive
      ? 'pressable w-full text-left rounded-2xl border-2 border-[#002D56] bg-[#002D56]/5 p-4 ring-2 ring-[#002D56]/50 transition-all'
      : 'pressable w-full text-left rounded-2xl border border-gray-300/70 bg-white p-4 hover:bg-gray-50 transition-all'

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white py-12 px-4">
      <main className="mx-auto max-w-xl">
        {/* 헤더 */}
        <div className="flex flex-col items-center text-center mb-8">
          <span className="relative h-16 w-16 sm:h-20 sm:w-20 squircle overflow-hidden avatar-sticker avatar-bg duoish-hover mb-4">
            <Image
              src="/Homepage_icon.jpg"
              alt="Mascot"
              fill
              className="object-cover cute-filter"
              style={{ objectPosition: '60% 35%' }}
              priority
            />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002D56]">
            {user ? `${user}님, 환영합니다!` : '환영합니다!'}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            AI 조교가 당신에게 딱 맞는 학습 경로를 찾아 드려요.
          </p>
        </div>

        {/* 설문 카드 */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-6 md:p-8 shadow-md ring-1 ring-black/5">
          <div className="grid gap-8">
            {/* 1. 실력 수준 */}
            <fieldset className="grid gap-3">
              <legend className="text-lg font-semibold text-gray-900 mb-2">
                1. 당신의 코딩 경험 단계는?
              </legend>
              <div className="grid gap-3">
                {levels.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLevel(item.id)}
                    className={getButtonClass(level === item.id)}
                  >
                    <span className="font-semibold text-gray-800">
                      {item.title}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 2. 학습 목표 */}
            <fieldset className="grid gap-3">
              <legend className="text-lg font-semibold text-gray-900 mb-2">
                2. 주된 학습 목표는 무엇인가요?
              </legend>
              <div className="grid gap-3">
                {goals.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id)}
                    className={getButtonClass(goal === item.id)}
                  >
                    <span className="font-semibold text-gray-800">
                      {item.title}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 3. 시작하기 버튼 */}
            <button
              className="pressable w-full inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3.5 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition mt-4"
              onClick={next}
            >
              다음
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}