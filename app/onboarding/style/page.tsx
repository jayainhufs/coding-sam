'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, USER_KEY, PREF_KEY } from '@/lib/AuthContext'
import CodeEditor, { LanguageKey } from '@/components/CodeEditor'

// 예시 문제 정의
const sampleProblem = {
  title: '예시 문제: 두 수의 합 (Two Sum)',
  description:
    '정수 배열(nums)과 타겟(target)이 주어지면, 합이 타겟이 되는 두 숫자의 인덱스를 찾아 반환하세요. (가장 간단한 방법으로 구현해보세요)',
  placeholderCode: {
    python: `# 여기에 코드를 작성하세요`,
    c: `// 여기에 코드를 작성하세요`,
    java: `// 여기에 코드를 작성하세요`,
  },
}

export default function StyleOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // 1. 탭 상태 ('sample' 또는 'paste')
  const [tab, setTab] = useState<'sample' | 'paste'>('sample')

  // 2. 코드 에디터 상태 (예시 문제용)
  const [language, setLanguage] = useState<LanguageKey>('python')
  // ✅ 수정된 placeholder를 기본값으로 사용
  const [code, setCode] = useState(sampleProblem.placeholderCode.python)

  // 3. 붙여넣기용 텍스트 상태
  const [pastedCode, setPastedCode] = useState('')

  /**
   * AI에게 스타일 분석을 요청하고 완료되면 /home로 이동
   */
  const analyzeAndFinish = async () => {
    setLoading(true)
    const codeToAnalyze = tab === 'sample' ? code : pastedCode

    if (!codeToAnalyze.trim()) {
      // alert()는 프리뷰 환경에서 보이지 않을 수 있습니다.
      console.error('분석할 코드를 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      // 3. (신규) AI 분석 API 호출
      const res = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '분석에 실패했습니다.')

      // 4. 분석 결과(style)를 기존 pref에 덮어쓰기
      const currentUserName = user || localStorage.getItem(USER_KEY)
      if (currentUserName) {
        const prefKey = PREF_KEY(currentUserName)
        const existingPrefJSON = localStorage.getItem(prefKey)
        const existingPref = existingPrefJSON ? JSON.parse(existingPrefJSON) : {}

        const updatedPref = {
          ...existingPref,
          codeStyle: data.style, // 예: "readable"
        }

        localStorage.setItem(prefKey, JSON.stringify(updatedPref))
      }

      // 5. 홈으로 이동
      router.push('/home')
    } catch (e: any) {
      console.error('스타일 분석 오류:', e)
      // alert(`오류: ${e.message}`)
      setLoading(false)
    }
  }

  /**
   * 이 단계를 건너뛰고 홈으로 이동
   */
  const skip = () => {
    router.push('/home')
  }

  const baseTab =
    'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors'
  const activeTab = `${baseTab} bg-white border-b-2 border-white`
  const inactiveTab = `${baseTab} bg-transparent text-gray-600 hover:text-gray-900`

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white py-12 px-4">
      <main className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002D56]">
            코딩 스타일 분석 (3/3)
          </h1>
          <p className="mt-2 text-base text-gray-600">
            AI가 사용자의 코드를 분석하여 맞춤형 피드백에 활용합니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-300/70">
          <button
            onClick={() => setTab('sample')}
            className={tab === 'sample' ? activeTab : inactiveTab}
          >
            1. 예시 문제 풀기
          </button>
          <button
            onClick={() => setTab('paste')}
            className={tab === 'paste' ? activeTab : inactiveTab}
          >
            2. 내 코드 붙여넣기
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="rounded-b-2xl border border-t-0 border-gray-200/70 bg-white p-6 shadow-md ring-1 ring-black/5">
          {tab === 'sample' ? (
            // 1. 예시 문제 풀기
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">{sampleProblem.title}</h3>
              <p className="text-sm text-gray-700">
                {sampleProblem.description}
              </p>

              {/* 언어 선택 */}
              <div className="flex items-center gap-2">
                {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l)
                      // ✅ 수정된 placeholder를 클릭 시 설정
                      setCode(sampleProblem.placeholderCode[l])
                    }}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      l === language
                        ? 'bg-[#296B75] text-white border-[#296B75]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <CodeEditor
                language={language}
                code={code}
                onChange={setCode}
              />
            </div>
          ) : (
            // 2. 내 코드 붙여넣기
            <div className="grid gap-3">
              <h3 className="text-lg font-semibold">기존 코드 붙여넣기</h3>
              <p className="text-sm text-gray-700">
                이전에 작성했던 코드(어떤 언어든, 어떤 문제든)를 붙여넣으세요.
                길수록 분석이 정확해집니다.
              </p>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                rows={15}
                className="w-full rounded-xl border border-gray-300/70 bg-gray-50 p-3 text-sm font-mono outline-none focus:ring-2 ring-[#002D56]"
                placeholder="여기에 코드를 붙여넣으세요..."
              />
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              onClick={skip}
              type="button"
              className="pressable inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5 transition"
            >
              건너뛰기
            </button>
            <button
              onClick={analyzeAndFinish}
              disabled={loading}
              type="button"
              className="pressable inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition disabled:opacity-50"
            >
              {loading ? '분석 중...' : 'AI 분석 및 완료'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}