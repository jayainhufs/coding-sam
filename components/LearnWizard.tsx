// components/LearnWizard.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import CodeEditor, { LanguageKey } from './CodeEditor'

type Problem = {
  id: string
  title: string
  description?: string
  difficulty?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

const STEP_ORDER: StepKey[] = ['understand', 'decompose', 'pattern', 'abstract', 'pseudocode']
const STEP_LABEL: Record<StepKey, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드 → 코드/실행',
}

export default function LearnWizard({ problem }: { problem: Problem }) {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]

  // 사용자 입력 상태
  const [understand, setUnderstand] = useState('')
  const [decompose, setDecompose] = useState('')
  const [pattern, setPattern] = useState('')
  const [abstractIn, setAbstractIn] = useState('')
  const [abstractOut, setAbstractOut] = useState('')
  const [pseudocode, setPseudocode] = useState('')

  // 코드/러너 상태
  const [language, setLanguage] = useState<LanguageKey>('python')
  const [codeByLang, setCodeByLang] = useState<Record<LanguageKey, string>>({
    python: '',
    c: '',
    java: '',
  })
  const [stdin, setStdin] = useState('')
  const [stdout, setStdout] = useState('')

  // AI
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [mode, setMode] = useState<'hint' | 'code-suggest' | undefined>(undefined) // ★ 활성 탭 상태

  // LocalStorage
  const codeKey = useMemo(() => `code:${problem.id}:${language}`, [problem.id, language])
  useEffect(() => {
    const saved = localStorage.getItem(codeKey)
    if (saved && !codeByLang[language]) {
      setCodeByLang((p) => ({ ...p, [language]: saved }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeKey])

  function updateCode(next: string) {
    setCodeByLang((prev) => {
      const nx = { ...prev, [language]: next }
      localStorage.setItem(codeKey, next)
      return nx
    })
  }

  // 실행기
  async function run(input?: string) {
    setStdout('실행 중…')
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: codeByLang[language] ?? '',
          stdin: input ?? stdin,
        }),
      })
      const j = await res.json()
      if (!j.ok) {
        setStdout(`실행 오류: ${j.error}`)
      } else {
        const out = j.result?.run?.output ?? j.result?.stdout ?? JSON.stringify(j.result, null, 2)
        setStdout(out)
      }
    } catch (e: any) {
      setStdout(`네트워크 오류: ${e.message ?? e}`)
    }
  }
  function runSample(i: number) {
    const s = problem.samples?.[i]
    if (!s) return
    run(s.input)
  }

  // AI
  async function askAI(mode?: 'hint' | 'code-suggest') {
    setAiLoading(true)
    setAiText('')
    const userInput =
      step === 'understand'
        ? understand
        : step === 'decompose'
        ? decompose
        : step === 'pattern'
        ? pattern
        : step === 'abstract'
        ? `입력:\n${abstractIn}\n\n출력:\n${abstractOut}`
        : pseudocode

    try {
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput,
          problem: { id: problem.id, title: problem.title, description: problem.description },
          mode,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'AI 오류')
      setAiText(j.text as string)
    } catch (e: any) {
      setAiText(`AI 서버 오류: ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // ★ 탭 클릭 시 모드 상태를 바꾸고 요청까지 동시에
  function requestAI(nextMode: 'hint' | 'code-suggest' | undefined) {
    setMode(nextMode)
    askAI(nextMode)
  }

  const progress = ((stepIdx + 1) / STEP_ORDER.length) * 100

  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      {/* 헤더 */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{problem.title}</h1>
          <div className="text-xs md:text-sm text-slate-600">
            {stepIdx + 1} / {STEP_ORDER.length} 단계
          </div>
        </div>
        <p className="text-slate-700 mt-1 text-sm md:text-base">{problem.description}</p>
      </div>

      {/* 진행바 */}
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-[#002D56]" style={{ width: `${progress}%` }} />
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEP_ORDER.map((k, i) => (
          <button
            key={k}
            onClick={() => setStepIdx(i)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              i === stepIdx
                ? 'bg-[#002D56] text-white border-[#002D56]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
            }`}
          >
            {STEP_LABEL[k]}
          </button>
        ))}
      </div>

      {/* 메인 작성 카드 (단일 컬럼) */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        {step === 'understand' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">1) 문제 이해하기</h2>
            <p className="text-sm text-slate-600 mb-3">
              문제가 원하는 것을 한 문장으로 요약해보세요.
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder="예) 입력은 n과 길이 n의 정수배열… 출력은 최대 부분합…"
              value={understand}
              onChange={(e) => setUnderstand(e.target.value)}
            />
          </>
        )}

        {step === 'decompose' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">2) 문제 분해하기</h2>
            <p className="text-sm text-slate-600 mb-3">
              문제를 해결 가능한 작은 하위 단계로 나눠보세요. 질문의 형태라도 괜찮아요.
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder={`예)\n- 입력 파싱\n- 누적합/DP 점화 정리\n- 반복하면서 최댓값 갱신`}
              value={decompose}
              onChange={(e) => setDecompose(e.target.value)}
            />
          </>
        )}

        {step === 'pattern' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">3) 패턴 인식하기</h2>
            <p className="text-sm text-slate-600 mb-3">
              기억나는 유사 문제/자료구조/알고리즘들을 연결해서 어떻게 해결할지 적어봅시다.
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder="예) 부분합 최대 → Kadane 패턴(현재 연속합 음수면 리셋, 전역 최댓값 갱신)…"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </>
        )}

        {step === 'abstract' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">4) 추상화하기</h2>
            <p className="text-sm text-slate-600 mb-3">불필요한 정보 대신 입력/출력 흐름을 정리하세요.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">입력</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder="예) 입력: 정수 배열 nums"
                  value={abstractIn}
                  onChange={(e) => setAbstractIn(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">출력 </label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder="예) 최대 연속 합 (현재까지의 합을 누적해 최대값 갱신)"
                  value={abstractOut}
                  onChange={(e) => setAbstractOut(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 'pseudocode' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">5) 의사코드 → 코드/실행</h2>
            <p className="text-sm text-slate-600 mb-3">
              먼저 의사코드를 정리한 뒤, 아래 코드 에디터에서 구현/실행해보세요.
            </p>

            <textarea
              rows={8}
              className="w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56] mb-4"
              placeholder={`예)\n- cur=0, best=-INF\n- 각 원소 x에 대해: cur = max(x, cur+x); best = max(best, cur)\n- best 출력`}
              value={pseudocode}
              onChange={(e) => setPseudocode(e.target.value)}
            />

            {/* 언어 탭 */}
            <div className="flex items-center gap-2 mb-2">
              {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    l === language
                      ? 'bg-[#296B75] text-white border-[#296B75]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
              <div className="ml-auto text-xs md:text-sm text-slate-500">
                VSCode 스타일 하이라이트
              </div>
            </div>

            <CodeEditor
              language={language}
              code={codeByLang[language] ?? ''}
              onChange={updateCode}
            />

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <textarea
                className="w-full h-32 rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                placeholder={`표준입력 (예: \n9\n-2 1 -3 4 -1 2 1 -5 4\n)`}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
              />
              <pre className="w-full h-32 rounded-xl border border-slate-200 p-3 bg-slate-50 overflow-auto whitespace-pre-wrap break-words">
{stdout || '실행 결과가 여기에 표시됩니다.'}
              </pre>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={() => run()}
                className="px-4 py-2 rounded-xl bg-[#002D56] text-white hover:bg-[#002D56]/90"
              >
                내 입력 실행
              </button>
              {problem.samples?.map((_, i) => (
                <button
                  key={i}
                  onClick={() => runSample(i)}
                  className="px-4 py-2 rounded-xl bg-white text-[#002D56] ring-2 ring-[#002D56] hover:bg-[#002D56]/5"
                >
                  예시 실행 {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* AI 튜터 카드 — 항상 아래로 배치 */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base md:text-lg font-extrabold">
            AI 튜터 — {STEP_LABEL[step]}
          </h3>

          {/* 세그먼트 버튼 (활성 상태에 따라 색 변경) */}
          <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-300" role="tablist" aria-label="AI 요청 모드">
            <button
              role="tab"
              aria-selected={mode === undefined}
              onClick={() => requestAI(undefined)} // ★
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition
                ${mode === undefined ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'}`}
            >
              요청
            </button>
            <button
              role="tab"
              aria-selected={mode === 'hint'}
              onClick={() => requestAI('hint')} // ★
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition
                ${mode === 'hint' ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'}`}
              title="힌트만"
            >
              힌트
            </button>
            <button
              role="tab"
              aria-selected={mode === 'code-suggest'}
              onClick={() => requestAI('code-suggest')} // ★
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition
                ${mode === 'code-suggest' ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'}`}
              title="짧은 코드/의사코드 제안"
            >
              코드 제안
            </button>
          </div>
        </div>

        {/* ★ 구분선 */}
        <div className="border-b border-slate-200 my-3" />

        <div className="text-sm text-slate-600 mb-3">
          {step === 'understand' && '핵심 요구/제약/엣지케이스를 중심으로 피드백합니다.'}
          {step === 'decompose' && '체크리스트 단위 분해가 잘 되었는지 피드백합니다.'}
          {step === 'pattern' && '유사 문제/알고리즘 패턴 연결을 돕습니다.'}
          {step === 'abstract' && '입·출력/흐름 정의의 모호함을 짚어줍니다.'}
          {step === 'pseudocode' && '의사코드를 점검하거나 간단 스니펫을 제안합니다.'}
        </div>

        <div className="min-h-[160px] whitespace-pre-wrap leading-7 break-words">
          {aiLoading ? '생성 중…' : aiText || '오른쪽 상단 버튼으로 피드백을 요청해보세요.'}
        </div>
      </section>

      {/* 하단 내비 */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 disabled:opacity-50 hover:bg-gray-50"
          disabled={stepIdx === 0}
        >
          이전
        </button>
        <button
          onClick={() => setStepIdx((i) => Math.min(STEP_ORDER.length - 1, i + 1))}
          className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90 disabled:opacity-50"
          disabled={stepIdx === STEP_ORDER.length - 1}
        >
          다음
        </button>
      </div>
    </main>
  )
}
