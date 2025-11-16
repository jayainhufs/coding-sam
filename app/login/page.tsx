'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

export default function LoginPage() {
  // 2. router 대신 login 함수를 가져옵니다.
  // const router = useRouter()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    // 3. (중요) AuthContext의 login 함수를 호출하도록 변경합니다.
    //    (DB가 없으므로 비밀번호는 여전히 검사하지 않습니다.)
    const trimmedName = name.trim()
    if (trimmedName) {
      // localStorage.setItem('coding-sam:user', name.trim()) // <- 삭제
      // router.push('/home') // <- 삭제
      login(trimmedName) // ✅ AuthContext의 login 함수 호출
    } else {
      alert('이름을 입력해주세요.')
    }
  }

  return (
    <main className="min-h-[80svh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-[#002D56]">로그인</h1>
          <p className="text-gray-600 mt-2">다시 오신 것을 환영합니다!</p>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="grid gap-4"
          >
            {/* 이름 입력 필드 */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-700">이름</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="사용자 이름"
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#002D56]"
                required
              />
            </label>

            {/* 비밀번호 입력 필드 */}
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-700">
                비밀번호
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="아무거나 입력하세요"
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ring-[#002D56]"
                required
              />
            </label>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={!name.trim() || !password.trim()} // 버튼 활성화 조건은 유지
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-5 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition disabled:opacity-50"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}