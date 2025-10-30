// app/page.tsx
// import Image from 'next/image' // 1. 프리뷰 환경 오류로 인해 Image 컴포넌트 대신 <img> 사용
// import Link from 'next/link'   // 2. 프리뷰 환경 오류로 인해 Link 컴포넌트 대신 <a> 사용

const TITLE = 'Coding-Sam'

/** SVG 기반 그라디언트 타이틀 – background-clip:text 버그 회피 */
function GradientTitle({ text }: { text: string }) {
  return (
    <svg
      role="img"
      aria-label={text}
      xmlns="http://www.w3.org/2000/svg"
      className="block w-full max-w-[820px] h-auto"
      viewBox="0 0 1000 170"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6b705c" />
          <stop offset="50%" stopColor="#8D7150" />
          <stop offset="100%" stopColor="#002D56" />
          {/* 부드러운 좌→우 이동 */}
          {/* @ts-ignore React 타입이 animate를 완전하게 커버하지 못하는 경우가 있어 무시합니다. */}
          <animate attributeName="x1" from="0%" to="100%" dur="8s" repeatCount="indefinite" />
          {/* @ts-ignore */}
          <animate attributeName="x2" from="100%" to="200%" dur="8s" repeatCount="indefinite" />
        </linearGradient>
      </defs>

      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        fontWeight="800"
        fontSize="120"
        fill="url(#csGrad)"
        style={{ paintOrder: 'stroke' }}
      >
        {text}
      </text>
    </svg>
  )
}

export default function Page() {
  return (
    <main className="min-h-[100svh] flex flex-col items-center justify-center text-center p-6">
      {/* 브랜드 타이틀(SVG) */}
      <div className="mb-4 sm:mb-6">
        <GradientTitle text={TITLE} />
      </div>

      {/* 메인 일러스트 */}
      {/* 3. <Image>를 <img> 태그로 변경 (priority 속성 제거) */}
      <img
        src="/Homepage_icon.jpg"
        alt="코딩샘 메인 일러스트"
        width={320}
        height={320}
        className="mb-8 w-[220px] sm:w-[260px] md:w-[320px] h-auto"
      />

      {/* 서브 헤드라인 – 기존 CSS 그라디언트 텍스트 사용 */}
      <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-6">
        <span className="gradient-text gradient-anim">재미있고 효과적인</span> 무료 코딩 공부!
      </p>

      {/* CTA */}
      <div className="w-full max-w-[420px] grid gap-3">
        {/* 4. <Link>를 <a> 태그로 변경 */}
        <a
          href="/signup"
          className="pressable inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-4 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition"
        >
          시작하기
        </a>

        {/* 5. <Link>를 <a> 태그로 변경 */}
        <a
          href="/login"
          className="pressable inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-4 px-6 font-semibold shadow-sm hover:bg-[#002D56]/5"
        >
          계정이 이미 있습니다
        </a>
      </div>
    </main>
  )
}

