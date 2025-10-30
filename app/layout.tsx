import './globals.css'
import type { Metadata } from 'next'
import { hufsFont } from './fonts'
import NavBar from '../components/NavBar'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata: Metadata = {
  title: 'coding-sam',
  description: 'AI 코딩 튜터가 탑재된 코딩 학습',
  
  // ⬇️ 파비콘 설정을 여기에 추가합니다.
  icons: {
    // 일반 브라우저 탭에 표시될 아이콘 (public/logo.svg 사용)
    icon: '/Homepage_icon.jpg'
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* <head> 태그는 Next.js가 이 metadata를 기반으로 자동 생성합니다. */}
      <body className={`${hufsFont.variable} antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
