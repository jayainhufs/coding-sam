// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { hufsFont } from './fonts'
import NavBar from '@/components/NavBar'          // 경로 별칭으로 통일
import { AuthProvider } from '@/lib/AuthContext'  // 경로 별칭으로 통일

export const metadata: Metadata = {
  title: 'coding-sam',
  description: 'AI 코딩 튜터가 탑재된 코딩 학습',
  icons: {
    icon: '/Homepage_icon.jpg', // public에 파일 존재 필요
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* <head>는 metadata 기반으로 자동 생성 */}
      <body className={`${hufsFont.variable} antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
