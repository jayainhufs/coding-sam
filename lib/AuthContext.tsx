// lib/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export const USER_KEY = 'coding-sam:user'

// 사용자명 표준화: 공백제거 + 소문자 + URI 인코딩
export const normalizeUser = (u: string) => encodeURIComponent(u.trim().toLowerCase())

// 사용자별 온보딩 완료 여부 키
export const PREF_KEY = (u: string) => `coding-sam:pref:${normalizeUser(u)}`

interface AuthContextType {
  user: string | null            // 표시용 이름(문자열)
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const router = useRouter()

  // 초기 동기화 (SSR/Hydration 안정)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) setUser(storedUser)
    } catch (e) {
      console.error('Failed to read auth from localStorage', e)
    }
  }, [])

  const login = (username: string) => {
    const cleanUser = username.trim()
    if (!cleanUser) return
    setUser(cleanUser)
    try {
      localStorage.setItem(USER_KEY, cleanUser)
      // 사용자별 온보딩 여부 확인
      const userPref = localStorage.getItem(PREF_KEY(cleanUser))
      router.push(userPref ? '/home' : '/onboarding')
    } catch (e) {
      console.error('localStorage error', e)
      router.push('/onboarding')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
