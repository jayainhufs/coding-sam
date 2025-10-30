'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext' // 1. useAuth 임포트

const navItems = [
  { href: '/home', label: '대시보드' },
  { href: '/problems', label: '문제' },
  { href: '/home#tutor', label: 'AI 튜터' },
]

// 2. /signup 페이지도 링크 숨김 경로에 추가
const HIDE_LINKS_PATHS = new Set<string>(['/', '/home', '/problems', '/login', '/signup'])

export default function NavBar() {
  const pathname = usePathname()
  const { user, logout } = useAuth() // 3. user와 logout 상태 가져오기

  // 4. /login 또는 /signup 페이지에서는 링크 숨김
  const showLinks = !HIDE_LINKS_PATHS.has(pathname) && !!user

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* === 브랜드 (좌측) === */}
        <Link
          href={user ? "/home" : "/"}
          className="flex items-center gap-2 sm:gap-2.5 font-extrabold text-[#002D56]"
          aria-label="Coding-Sam 홈으로"
          title="Coding-Sam"
        >
          <span className="relative h-9 w-9 sm:h-10 sm:w-10 squircle overflow-hidden avatar-sticker avatar-bg duoish-hover">
            <Image
              src="/Homepage_icon.jpg"
              alt="Mascot"
              fill
              className="object-cover cute-filter"
              style={{ objectPosition: '60% 35%' }}
              priority
            />
          </span>
          <span>Coding-Sam</span>
        </Link>

        {/* === 우측 영역 === */}
        <div className="flex items-center gap-6">
          {/* 다른 페이지에서만 우측 링크 노출 */}
          {showLinks && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => {
                const base = 'hover:opacity-80 transition-colors'
                const active =
                  item.href === '/home'
                    ? pathname === '/home'
                    : pathname.startsWith(item.href.replace(/#.*$/, ''))
                const cls = active ? `text-[#002D56] font-semibold ${base}` : `text-gray-600 ${base}`
                return (
                  <Link key={item.href} href={item.href} className={cls}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* 5. 로그인/로그아웃/회원가입 상태 표시 */}
          <div className="text-sm">
            {user ? (
              // 5a. 로그인 상태
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700 hidden sm:inline">{user}님</span>
                <button
                  onClick={logout}
                  className="font-semibold text-[#002D56] hover:opacity-80"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              // 5b. 로그아웃 상태
              // 로그인/회원가입 페이지에서는 버튼 숨김
              (pathname !== '/login' && pathname !== '/signup') && (
                <div className="flex items-center gap-4">
                  {/* 회원가입 (왼쪽) */}
                  <Link
                    href="/signup"
                    className="font-semibold text-gray-700 hover:text-[#002D56]"
                  >
                    회원가입
                  </Link>
                  {/* 로그인 (오른쪽) */}
                  <Link
                    href="/login"
                    className="font-semibold text-[#002D56] hover:opacity-80"
                  >
                    로그인
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </nav>
  )
}

