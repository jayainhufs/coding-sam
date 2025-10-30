'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

const navItems = [
  { href: '/home', label: '대시보드' },
  { href: '/problems', label: '문제' },
] // ✅ 'AI 튜터' 제거

const HIDE_LINKS_PATHS = new Set<string>(['/', '/home', '/problems', '/login', '/signup'])

export default function NavBar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const showLinks = !HIDE_LINKS_PATHS.has(pathname) && !!user

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* 좌측 로고 */}
        <Link
          href={user ? '/home' : '/'}
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

        {/* 우측 영역 */}
        <div className="flex items-center gap-6">
          {/* 네비 링크 (로그인 상태 + 특정 경로 제외) */}
          {showLinks && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => {
                const base = 'hover:opacity-80 transition-colors'
                const active =
                  item.href === '/home' ? pathname === '/home' : pathname.startsWith(item.href)
                const cls = active ? `text-[#002D56] font-semibold ${base}` : `text-gray-600 ${base}`
                return (
                  <Link key={item.href} href={item.href} className={cls}>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}

          {/* 로그인/로그아웃/회원가입 */}
          <div className="text-sm">
            {user ? (
              <div className="flex items-center gap-3">
                {/* ✅ 사용자 이름을 배지(pill)로 명확히 구분 */}
                <span className="hidden sm:inline px-3 py-1 rounded-full bg-[#002D56] text-white font-semibold">
                  {user}님
                </span>
                <button
                  onClick={logout}
                  className="font-semibold text-[#002D56] hover:opacity-80"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              pathname !== '/login' &&
              pathname !== '/signup' && (
                <div className="flex items-center gap-4">
                  <Link href="/signup" className="font-semibold text-gray-700 hover:text-[#002D56]">
                    회원가입
                  </Link>
                  <Link href="/login" className="font-semibold text-[#002D56] hover:opacity-80">
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
