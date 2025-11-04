// lib/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export const USER_KEY = 'coding-sam:user'

// ✅ 사용자명 표준화: 앞뒤 공백 제거 + 소문자 + URI 인코딩으로 숨은 문자/공백 차단
export const normalizeUser = (u: string) => encodeURIComponent(u.trim().toLowerCase())

export const PREF_KEY = (u: string) => `coding-sam:pref:${normalizeUser(u)}`

interface AuthContextType {
  user: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const router = useRouter()

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
      // ✅ 사용자별 pref만 확인 (표준화된 키 사용)
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
