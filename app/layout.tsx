import './globals.css'
import type { Metadata } from 'next'
import { hufsFont } from './fonts'   // ← 추가

export const metadata: Metadata = {
  title: 'coding-sam',
  description: 'AI 코딩 튜터가 탑재된 코딩 학습',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${hufsFont.variable} antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  )
}