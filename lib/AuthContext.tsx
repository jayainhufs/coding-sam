'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation' // usePathname은 여기서 더 이상 필요 없습니다.

const USER_KEY = 'coding-sam:user'

interface AuthContextType {
  user: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const router = useRouter()

  // 앱 로드 시 localStorage에서 사용자 정보 읽어오기
  // 초기 state는 null이고, effect가 실행된 후에 state가 업데이트됩니다.
  // 이는 서버 렌더링(user=null)과 클라이언트 첫 렌더링(user=null)을 일치시켜
  // Hydration 오류를 방지하는 올바른 방법입니다.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        setUser(storedUser)
      }
    } catch (e) {
      console.error('Failed to read auth from localStorage', e)
    }
  }, [])

  const login = (username: string) => {
    const cleanUser = username.trim()
    if (cleanUser) {
      setUser(cleanUser)
      localStorage.setItem(USER_KEY, cleanUser)
      // 온보딩을 했다면 /home, 안했다면 /onboarding
      const pref = localStorage.getItem('coding-sam:pref')
      router.push(pref ? '/home' : '/onboarding')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
    // 로그아웃 시 랜딩 페이지로 이동
    router.push('/')
  }
  
  // ❗️ 문제를 일으켰던 'if (loading || pathname === '/login')' 블록을
  // ❗️ 완전히 제거했습니다.

  // ✅ 항상 Provider를 반환합니다.
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Custom Hook 생성 (오류가 발생했던 곳)
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // 이제 Provider가 항상 존재하므로 이 오류는 발생하지 않아야 합니다.
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}