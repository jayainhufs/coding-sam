'use client'

import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext' // 1. 경로 별칭(@/)을 상대 경로로 수정
// 2. import Link from 'next/link' 제거

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const { login } = useAuth() 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      login(username.trim()) 
    }
  }

  return (
    <main className="min-h-[80svh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-center text-[#002D56] mb-8">
          로그인
        </h1>
        
        <form 
          onSubmit={handleLogin}
          className="w-full bg-white border border-gray-200/80 rounded-2xl p-6 shadow-md ring-1 ring-black/5"
        >
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-gray-700">이름 (또는 닉네임)</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="이름을 입력하세요"
                required
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#002D56]"
              />
              <p className="text-xs text-gray-500 mt-1">
                (이름을 입력해주세요.)
              </p>
            </label>
            
            <button
              type="submit"
              className="pressable w-full inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition disabled:opacity-50"
              disabled={!username.trim()}
            >
              로그인
            </button>
            
            {/* 3. <Link>를 <a> 태그로 변경 */}
            <a 
              href="/signup"
              className="text-center text-sm text-gray-600 hover:text-[#002D56] hover:underline"
            >
              계정이 없으신가요? 회원가입
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}

