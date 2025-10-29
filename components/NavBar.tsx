'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', label: '대시보드' },
  { href: '/problems', label: '문제' },
  { href: '/home#tutor', label: 'AI 튜터' },
]

// 링크를 숨길 경로들 (랜딩/홈/문제)
const HIDE_LINKS_PATHS = new Set<string>(['/', '/home', '/problems'])

export default function NavBar() {
  const pathname = usePathname()
  const showLinks = !HIDE_LINKS_PATHS.has(pathname)

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* === 브랜드: 스퀴클 아바타 + 텍스트 === */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 font-extrabold text-[#002D56]"
          aria-label="Coding-Sam 홈으로"
          title="Coding-Sam"
        >
          {/* 스퀴클 스티커 아바타 (얼굴만 보이도록 오브젝트 포지션) */}
          <span className="relative h-9 w-9 sm:h-10 sm:w-10 squircle overflow-hidden avatar-sticker avatar-bg duoish-hover">
            <Image
              src="/Homepage_icon.jpg"   // 전용 얼굴 이미지를 쓰고 싶으면 /mascot-face.png 로 교체
              alt="Mascot"
              fill
              className="object-cover cute-filter"
              style={{ objectPosition: '60% 35%' }} /* 얼굴 위치 조정 */
              priority
            />
          </span>
          <span>Coding-Sam</span>
        </Link>

        {/* 다른 페이지에서만 우측 링크 노출 */}
        {showLinks && (
          <div className="flex items-center gap-6 text-sm">
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
      </div>
    </nav>
  )
}
