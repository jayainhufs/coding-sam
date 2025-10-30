// components/LearnWizard.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CodeEditor, { LanguageKey } from './CodeEditor'
import {
  addXP,
  getProgress as getProgressRec,
  setProgress,
  markSolved,
  type StepScores,
  type ProblemProgress,
} from '@/utils/progress'

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
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]

  // 사용자 입력
  const [understand, setUnderstand] = useState('')
  const [decompose, setDecompose] = useState('')
  const [pattern, setPattern] = useState('')
  const [abstractIn, setAbstractIn] = useState('')
  const [abstractOut, setAbstractOut] = useState('')
  const [pseudocode, setPseudocode] = useState('')

  // 코드/러너
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
  const [mode, setMode] = useState<'hint' | 'code-suggest' | undefined>(undefined)

  // 제출/학습 결과(페이지 내 표시용)
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<StepScores>({})
  const [avgScore, setAvgScore] = useState<number>(0)
  const [awardedXP, setAwardedXP] = useState<number>(0)

  // ✅ AI 요청/힌트 카운터(패널티용)
  const [aiRequestCount, setAiRequestCount] = useState(0)
  const [hintCount, setHintCount] = useState(0)

  // 문제 바뀌면 카운터/표시 초기화
  useEffect(() => {
    setAiRequestCount(0)
    setHintCount(0)
    setSubmitted(false)
    setScores({})
    setAvgScore(0)
    setAwardedXP(0)
  }, [problem.id])

  // 기존 진행 불러오기(있으면 반영)
  useEffect(() => {
    const prev = getProgressRec(problem.id) as ProblemProgress | undefined
    if (!prev) return
    setSubmitted(true)
    setScores(prev.scores)
    const vals = Object.values(prev.scores || {})
    const prevAvg = vals.length ? Math.round(vals.reduce((a, b) => a + (b ?? 0), 0) / vals.length) : 0
    setAvgScore(prevAvg)
  }, [problem.id])

  // 코드 저장 키
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

  // 프롬프트 빌더(힌트/요청/코드제안)
  function buildPrompt(step: StepKey, mode: 'hint' | 'code-suggest' | undefined) {
    const goal = `당신은 코딩을 4단계(문제분해, 패턴 인식, 추상화, 알고리즘적 사고)로 코칭하는 한국어 튜터입니다. 학습자의 사고를 확장시키는 것이 목표입니다.`
    const base = `
${goal}
- 현재 단계에만 집중해서 피드백.
- 형식: ▷잘한점(0~3) ▷보완점(0~3) ▷다음에 생각할 점(1~2).
- 너무 긴 설명 금지. 구체적이고 짧게.`.trim()

    const stepGuide: Record<StepKey, string> = {
      understand: '문제 요구/입출력/제약/엣지케이스를 정확히 요약하도록 코칭하세요.',
      decompose: '큰 문제를 실행 가능한 하위 단계로 나누는 체크리스트로 코칭하세요.',
      pattern: '유사 문제/자료구조/알고리즘 패턴을 연결하도록 코칭하세요.',
      abstract: '입력/출력/핵심 처리 흐름의 본질만 남기도록 코칭하세요.',
      pseudocode: '짧은 의사코드 점검. 필요 시 간단 스니펫(10~20줄) 제안.',
    }

    const userText =
      step === 'understand' ? understand :
      step === 'decompose' ? decompose :
      step === 'pattern' ? pattern :
      step === 'abstract' ? `입력:\n${abstractIn}\n\n출력:\n${abstractOut}` :
      pseudocode

    const hasInput = Boolean(userText.trim())

    if (mode === 'hint') {
      const head = hasInput ? '아래 학습자 입력을 참고해 ' : '학습자 입력이 비어있습니다. 입력이 없어도 '
      return `${base}
${stepGuide[step]}
${head}해당 단계에 맞는 "힌트만" 2~3개 제시하세요.
학습자 입력:
${userText || '(없음)'}`
    }

    if (mode === 'code-suggest') {
      if (!hasInput) {
        return `${base}
${stepGuide[step]}
현재 단계의 학습자 입력이 비어있습니다. 먼저 2~3개의 질문으로 생각을 자극한 뒤,
예시 의사코드(또는 10~20줄 스니펫)를 매우 짧게 제시하세요.`
      }
      return `${base}
${stepGuide[step]}
학습자 입력을 반영해, 짧은 의사코드 또는 10~20줄 스니펫을 제시하세요.
학습자 입력:
${userText}`
    }

    if (!hasInput) {
      return `${base}
${stepGuide[step]}
현재 입력이 비어있습니다. 이 단계에서 무엇을 쓰면 좋은지 가이드를 3줄 이내로 알려주세요.`
    }
    return `${base}
${stepGuide[step]}
학습자 입력:
${userText}`
  }

  async function askAI(nextMode?: 'hint' | 'code-suggest') {
    setMode(nextMode)
    setAiLoading(true)
    setAiText('')
    try {
      // ✅ 페널티 카운터 증가
      setAiRequestCount((c) => c + 1)
      if (nextMode === 'hint') setHintCount((c) => c + 1)

      const prompt = buildPrompt(step, nextMode)
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput: 'placeholder', // 서버 유효성 회피용
          problem: { id: problem.id, title: problem.title, description: problem.description },
          mode: nextMode,
          promptOverride: prompt, // 서버가 지원하면 사용, 아니면 무시됨
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'AI 오류')
      setAiText(j.text || '(임시 응답)\n' + prompt)
    } catch (e: any) {
      setAiText(`AI 서버 오류: ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // 점수 산정(간단 휴리스틱)
  function scoreOf(text: string, keywords: string[]) {
    if (!text.trim()) return 0
    let s = 40
    const t = text.toLowerCase()
    for (const k of keywords) if (t.includes(k)) s += 12
    return Math.min(100, s)
  }

  // 단계별 점수 → 약점/강점(Top2)
  function rankSteps(s: StepScores, topN = 2): { weakest: StepKey[]; strength: StepKey[] } {
    const entries = (Object.entries(s) as Array<[StepKey, number]>).filter(([, v]) => typeof v === 'number')
    entries.sort((a, b) => a[1] - b[1])
    const weakest = entries.slice(0, topN).map(([k]) => k)
    const strength = entries.slice(-topN).reverse().map(([k]) => k)
    return { weakest, strength }
  }

  // ✅ 제출 → 서버 평가(/api/ai/evaluate) → 진행 저장/XP/이동
  async function handleSubmit() {
    // 1) 로컬 휴리스틱 점수 (서버에는 summary 형태로 전달)
    const s: StepScores = {
      understand: scoreOf(understand, ['입력', '출력', '제약', 'edge', '엣지']),
      decompose: scoreOf(decompose, ['입력', '파싱', '반복', '점화', '갱신']),
      pattern: scoreOf(pattern, ['kadane', 'dp', '누적', 'greedy', 'hash']),
      abstract: scoreOf(`${abstractIn}\n${abstractOut}`, ['입력', '출력', '흐름', '정의']),
      pseudocode: scoreOf(pseudocode, ['for', 'while', 'max', 'cur', 'best']),
    }
    const vals = Object.values(s)
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + (b ?? 0), 0) / vals.length) : 0
    const prev = getProgressRec(problem.id) as ProblemProgress | undefined
    const attemptsPrev = prev?.attempts ?? 0
    const solvedPrev = 0 // 로컬 저장에 solvedCount 없으므로 0
    const { weakest, strength } = rankSteps(s)

    // 2) 서버 평가 호출
    let data: any
    try {
      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: {
            avg: s,
            attempts: attemptsPrev,
            solvedCount: solvedPrev,
            weakest,
            strength,
          },
          aiRequestCount,            // 패널티: 첫 1회 무료, 이후 -1
          hintCount,
          solvedThreshold: 80,
        }),
      })
      data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '서버 평가 실패')
    } catch (e: any) {
      // 서버 실패 시: 기존 로직으로만 저장/XP/이동
      const attempts = attemptsPrev + 1
      const rec: ProblemProgress = { scores: s, attempts }
      setProgress(problem.id, rec)
      markSolved(problem.id)
      const bonus = Math.round((avg / 100) * 20)
      const xp = 30 + bonus
      addXP(xp)
      setScores(s)
      setAvgScore(avg)
      setAwardedXP(xp)
      setSubmitted(true)
      router.push('/home')
      return
    }

    // 3) 서버 응답 반영
    const attemptsNext = (typeof data.attempts === 'number') ? data.attempts : attemptsPrev + 1
    const finalAvg = (typeof data.finalAvg === 'number') ? data.finalAvg : avg
    const solvedNow = Boolean(data.solvedNow)

    // 4) 진행 저장/XP/마킹
    const baseProgress: ProblemProgress = { scores: s, attempts: attemptsNext }
    setProgress(problem.id, baseProgress)
    if (solvedNow) {
      markSolved(problem.id)
    }

    const bonus = Math.round((finalAvg / 100) * 20) // 0~20
    const xp = 30 + bonus                           // 30~50
    addXP(xp)

    // 5) 로컬 UI 표시
    setScores(s)
    setAvgScore(finalAvg)
    setAwardedXP(xp)
    setSubmitted(true)

    // 6) 홈으로 이동
    router.push('/home')
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

      {/* 단계 탭 */}
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

      {/* 메인 카드 */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        {step === 'understand' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">1) 문제 이해하기</h2>
            <p className="text-sm text-slate-600 mb-3">문제가 원하는 것을 한 문장으로 요약해보세요.</p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder="예) 입력은 n과 배열 nums, 출력은 최대 부분합…"
              value={understand}
              onChange={(e) => setUnderstand(e.target.value)}
            />
          </>
        )}

        {step === 'decompose' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">2) 문제 분해하기</h2>
            <p className="text-sm text-slate-600 mb-3">작은 하위 단계 체크리스트로 쪼개보세요.</p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder={`예)\n- 입력 파싱\n- 누적합/DP 점화 정리\n- 반복하며 최댓값 갱신`}
              value={decompose}
              onChange={(e) => setDecompose(e.target.value)}
            />
          </>
        )}

        {step === 'pattern' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">3) 패턴 인식하기</h2>
            <p className="text-sm text-slate-600 mb-3">유사 문제/자료구조/알고리즘을 연결해보세요.</p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder="예) Kadane 패턴: cur = max(x, cur+x); best = max(best, cur)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </>
        )}

        {step === 'abstract' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-2">4) 추상화하기</h2>
            <p className="text-sm text-slate-600 mb-3">입력/출력/핵심 흐름을 명확히.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">입력</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder="예) n: 정수, nums: 길이 n의 정수 배열"
                  value={abstractIn}
                  onChange={(e) => setAbstractIn(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">출력</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder="예) 최대 연속 부분합 값"
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
            <p className="text-sm text-slate-600 mb-3">의사코드를 정리하고 아래에서 실행.</p>
            <textarea
              rows={8}
              className="w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56] mb-4"
              placeholder={`예)\n- cur=0, best=-INF\n- 각 x에 대해 cur=max(x,cur+x); best=max(best,cur)\n- best 출력`}
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
                    l === language ? 'bg-[#296B75] text-white border-[#296B75]' : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
              <div className="ml-auto text-xs md:text-sm text-slate-500">VSCode 스타일 하이라이트</div>
            </div>

            <CodeEditor language={language} code={codeByLang[language] ?? ''} onChange={updateCode} />

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
          </>
        )}
      </section>

      {/* AI 튜터 카드 — 아래 고정 */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base md:text-lg font-extrabold">AI 튜터 — {STEP_LABEL[step]}</h3>
          <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-300" role="tablist">
            <button
              role="tab"
              aria-selected={mode === undefined}
              onClick={() => askAI(undefined)}
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
                mode === undefined ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'
              }`}
            >
              요청
            </button>
            <button
              role="tab"
              aria-selected={mode === 'hint'}
              onClick={() => askAI('hint')}
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
                mode === 'hint' ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'
              }`}
              title="힌트만"
            >
              힌트
            </button>
            <button
              role="tab"
              aria-selected={mode === 'code-suggest'}
              onClick={() => askAI('code-suggest')}
              className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
                mode === 'code-suggest' ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'
              }`}
              title="짧은 코드/의사코드 제안"
            >
              코드 제안
            </button>
          </div>
        </div>

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

        {step === 'pseudocode' ? (
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90"
          >
            제출
          </button>
        ) : (
          <button
            onClick={() => setStepIdx((i) => Math.min(STEP_ORDER.length - 1, i + 1))}
            className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90 disabled:opacity-50"
          >
            다음
          </button>
        )}
      </div>
    </main>
  )
}
