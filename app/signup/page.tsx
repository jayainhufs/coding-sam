// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const { login } = useAuth()

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    const name = username.trim()
    if (name) login(name) // login 내부에서 /onboarding 또는 /home으로 분기
  }

  return (
    <main className="min-h-[80svh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-center text-[#002D56] mb-8">회원가입</h1>
        <form onSubmit={handleSignup} className="w-full bg-white border border-gray-200/80 rounded-2xl p-6 shadow-md ring-1 ring-black/5">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-gray-700">사용할 이름 (또는 닉네임)</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="이름을 입력하세요"
                required
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#002D56]"
              />
              <p className="text-xs text-gray-500 mt-1">(간단 구현: 이름만 입력, 비밀번호 없음)</p>
            </label>

            <button
              type="submit"
              className="pressable w-full inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition disabled:opacity-50"
              disabled={!username.trim()}
            >
              회원가입
            </button>

            <a href="/login" className="text-center text-sm text-gray-600 hover:text-[#002D56] hover:underline">
              이미 계정이 있으신가요? 로그인
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
