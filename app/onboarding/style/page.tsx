'use client'

import { useState } from 'react'
import { useAuth, USER_KEY, PREF_KEY } from '@/lib/AuthContext'
import CodeEditor, { LanguageKey } from '@/components/CodeEditor'

// ✅ 1. 예시 문제 (1-100까지 합)
const sampleProblem = {
  title: '예시 문제: 1부터 100까지의 합',
  description:
    '1부터 100까지 모든 정수의 합을 구하는 코드를 작성하세요.',
  placeholderCode: {
    python: `# 1부터 100까지의 합을 print() 하세요`,
    c: `// 1부터 100까지의 합을 printf() 하세요`,
    java: `// 1부터 100까지의 합을 System.out.print() 하세요`,
  },
  expectedOutput: '5050',
}

export default function StyleOnboardingPage() {
  // const router = useRouter() // 3. 프리뷰 오류로 주석 처리
  const { user } = useAuth()
  const [loading, setLoading] = useState(false) // AI 분석 로딩
  const [tab, setTab] = useState<'sample' | 'paste'>('sample')

  const [language, setLanguage] = useState<LanguageKey>('python')
  const [code, setCode] = useState(sampleProblem.placeholderCode.python)
  const [pastedCode, setPastedCode] = useState('')

  const [runLoading, setRunLoading] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null) // 실행 결과 (STDOUT)

  const isSampleSolved = runResult?.startsWith('✅') ?? false
  const isPastedCodeEmpty = !pastedCode.trim()

  /**
   * (기존 함수) AI에게 스타일 분석을 요청하고 완료되면 /home로 이동
   */
  const analyzeAndFinish = async () => {
    setLoading(true)
    const codeToAnalyze = tab === 'sample' ? code : pastedCode

    if (!codeToAnalyze.trim()) {
      console.error('분석할 코드를 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '분석에 실패했습니다.')

      const currentUserName = user || localStorage.getItem(USER_KEY)
      if (currentUserName) {
        const prefKey = PREF_KEY(currentUserName)
        const existingPrefJSON = localStorage.getItem(prefKey)
        const existingPref = existingPrefJSON
          ? JSON.parse(existingPrefJSON)
          : {}

        const updatedPref = {
          ...existingPref,
          codeStyle: data.style,
        }

        localStorage.setItem(prefKey, JSON.stringify(updatedPref))
      }

      // 4. ✅ router.push -> window.location.href로 변경
      window.location.href = '/home'
    } catch (e: any) {
      console.error('스타일 분석 오류:', e)
      setLoading(false)
    }
  }

  /**
   * (신규) 코드 실행 및 정답 체크 함수
   */
  const handleRunCode = async () => {
    setRunLoading(true)
    setRunResult('실행 중...')

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language,
          code: code,
          stdin: '',
        }),
      })
      const j = await res.json()

      if (!j.ok) {
        setRunResult(`❌ 실행 오류:\n${j.error}`)
      } else {
        const output = (
          j.result?.run?.output ??
          j.result?.stdout ??
          ''
        ).trim()

        if (output === sampleProblem.expectedOutput) {
          setRunResult(`✅ 정답입니다!\n실행 결과: ${output}`)
        } else {
          setRunResult(
            `❌ 오답입니다.\n실행 결과: ${output}`,
          )
        }
      }
    } catch (e: any) {
      setRunResult(`네트워크 오류: ${e.message}`)
    } finally {
      setRunLoading(false)
    }
  }

  /**
   * (기존 함수) 이 단계를 건너뛰고 홈으로 이동
   */
  const skip = () => {
    // 5. ✅ router.push -> window.location.href로 변경
    window.location.href = '/home'
  }

  const baseTab =
    'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors'
  const activeTab = `${baseTab} bg-white border-b-2 border-white`
  const inactiveTab = `${baseTab} bg-transparent text-gray-600 hover:text-gray-900`

  // ✅ 7. (수정) 버튼 비활성화 로직
  const isAnalyzeDisabled =
    loading ||
    runLoading ||
    (tab === 'sample' && !isSampleSolved) ||
    (tab === 'paste' && isPastedCodeEmpty)

  // ✅ 8. (수정) 툴팁 메시지 로직
  const getAnalyzeButtonTitle = () => {
    if (tab === 'sample' && !isSampleSolved) {
      return '"코드 실행 및 정답 확인"을 눌러 정답(✅)을 먼저 받아야 합니다.'
    }
    if (tab === 'paste' && isPastedCodeEmpty) {
      return '분석할 코드를 "내 코드 붙여넣기" 탭에 입력해주세요.'
    }
    return 'AI 스타일 분석하기'
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white py-12 px-4">
      <main className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002D56]">
            코딩 스타일 분석
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

              {/* ✅ (추가) 기대하는 출력값 명시 */}
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <span className="text-xs font-semibold text-slate-600">
                  출력
                </span>
                <pre className="text-sm font-medium text-slate-800 bg-white rounded px-2 py-1 border border-slate-200 font-mono">
                  {sampleProblem.expectedOutput}
                </pre>
              </div>

              {/* 언어 선택 */}
              <div className="flex items-center gap-2">
                {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l)
                      setCode(sampleProblem.placeholderCode[l])
                      setRunResult(null) // 언어 변경 시 결과창 초기화
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

              {/* 코드 실행 버튼 및 결과창 */}
              <button
                onClick={handleRunCode}
                disabled={runLoading || loading}
                type="button"
                className="pressable w-full inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5 transition disabled:opacity-50"
              >
                {runLoading ? '실행 중...' : '코드 실행 및 정답 확인'}
              </button>

              {runResult && (
                <pre
                  className={`w-full h-auto rounded-xl border p-3 text-sm whitespace-pre-wrap ${
                    runResult.startsWith('✅')
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : runResult.startsWith('❌')
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {runResult}
                </pre>
              )}
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
              disabled={isAnalyzeDisabled}
              type="button"
              className="pressable inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition disabled:opacity-50"
              title={getAnalyzeButtonTitle()}
            >
              {loading ? '분석 중...' : '코드 스타일 분석하기'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}