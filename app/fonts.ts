import localFont from 'next/font/local'

export const hufsFont = localFont({
  src: [
    { path: './fonts/HUFS-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/HUFS-Bold.woff2',    weight: '700', style: 'normal' },
  ],
  // 파일명이 다르면 path만 바꿔주세요 (예: .ttf/.otf)
  variable: '--font-hufs',
  display: 'swap',
})