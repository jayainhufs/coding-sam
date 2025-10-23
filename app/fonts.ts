import localFont from 'next/font/local'

export const hufsFont = localFont({
  src: [
    // 가벼운 본문용 (Light)
    { path: './fonts/HUFS-L.ttf', weight: '300', style: 'normal' },
    // 기본 본문 (Medium)
    { path: './fonts/HUFS-M.ttf', weight: '500', style: 'normal' },
    // 제목/강조 (Bold)
    { path: './fonts/HUFS-B.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-hufs',
  display: 'swap',
})