'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', label: '대시보드' },
  { href: '/problems', label: '문제' },
  { href: '/home#tutor', label: 'AI 튜터' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-[#002D56]">
          coding-sam
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {navItems.map((item) => {
            const active =
              item.href === '/home'
                ? pathname === '/home'
                : pathname.startsWith(item.href.replace(/#.*$/, ''))
            const base =
              'hover:opacity-80 transition-colors'
            const cls = active
              ? `text-[#002D56] font-semibold ${base}`
              : `text-gray-600 ${base}`
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}