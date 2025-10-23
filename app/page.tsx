import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-[100svh] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-6">
        <div className="text-3xl font-black tracking-tight">coding-sam</div>
      </div>

      {/* 이미지 살짝 더 작게 */}
      <Image
        src="/Homepage_icon.jpg"
        alt="코딩샘 메인 일러스트"
        width={320}
        height={320}
        priority
        className="mb-8 w-[220px] sm:w-[260px] md:w-[320px] h-auto"
      />

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-6">
        재미있고 효과적인 무료 코딩 공부!
      </h1>

      <div className="w-full max-w-[420px] grid gap-3">
        {/* 메인 버튼: 네이비 배경 + 흰 글자 + 동일한 네이비 테두리 */}
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-4 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition"
        >
          시작하기
        </Link>

        {/* 보조 버튼: 흰 배경 + 네이비 테두리/텍스트 (색 통일) */}
        <button
          type="button"
          aria-disabled
          title="로그인 기능은 곧 제공됩니다"
          className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-4 px-6 font-semibold shadow-sm hover:bg-[#002D56]/5 cursor-not-allowed"
        >
          계정이 이미 있습니다
        </button>
      </div>
    </main>
  )
}