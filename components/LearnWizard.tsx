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

/* ------------------ 문제별 예시 템플릿 ------------------ */
type Templates = {
  understand: string
  decompose: string
  pattern: string
  abstractInPh: string
  abstractOutPh: string
  pseudocode: string
}

function templatesFor(problemId: string): Templates {
  if (problemId === 'max-subarray') {
    return {
      understand:
`[요약 1문단]
- 입력: n(정수), nums(길이 n 정수배열)
- 출력: 최대 "연속" 부분배열의 합(정수)
- 제약: 1 ≤ n ≤ 1e5, |nums[i]| ≤ 1e4 → O(n) 필요
- 엣지: 전부 음수 / 전부 양수 / n=1 / 큰 n
- 반례(1줄): [-1,-2]의 정답은 -1 (0 아님)`,
      decompose:
`[3~7단계, 각 단계에 상태 전이 주석]
1) 입력 파싱 → nums 준비
2) 핵심 로직(Kadane 후보)
   - 상태: cur(현재 연속합), best(최대합)
   - 전이: cur = max(x, cur + x); best = max(best, cur)
   - 실패지점: 비어있는 입력 등 예외 처리
3) 결과 출력 → best`,
      pattern:
`[후보 2개 + 채택근거]
- 후보A: Kadane O(n)/O(1) ✅ 제약(n≤1e5)에 부합
- 후보B: Prefix-sum + 모든 구간 탐색 O(n^2) ❌ 시간 초과
- 불변식: best는 i까지의 부분배열 최대합, cur는 i에서 끝나는 최대합`,
      abstractInPh: `I/O(입력)
- 이름: nums  | 타입: int[] | 범위: |nums[i]|≤1e4 | 예: [-2,1,-3,4,-1,2,1,-5,4]
- 이름: n     | 타입: int   | 범위: 1≤n≤1e5     | 예: 9`,
      abstractOutPh: `O(출력)
- 이름: answer | 타입: int | 정의: 최대 연속 부분합
- 상태 전이(텍스트 차트):
  시작: cur=0,best=-∞
  각 x: cur=max(x,cur+x) → best=max(best,cur)
  종료: best 반환
- 경계: n=1, 전부 음수, 매우 큰 n`,
      pseudocode:
`// 10~20줄 + 불변식 + 복잡도 + 단위테스트
best = -INF; cur = 0
for x in nums:
  // 불변식: cur는 "x에서 끝나는" 최대 연속합
  cur = max(x, cur + x)
  best = max(best, cur)
print(best)
// 시간/공간: O(n)/O(1)
// 단위 테스트:
# [−1] -> −1
# [−2,1] -> 1`,
    }
  }

  if (problemId === 'two-sum') {
    return {
      understand:
`[요약 1문단]
- 입력: nums(정수배열), target(정수)
- 출력: i<j인 두 인덱스(또는 없으면 처리 규칙)
- 제약: 2 ≤ n ≤ 1e5, |nums[i]| ≤ 1e9 → O(n) 권장
- 엣지: 같은 값 중복, 해가 여러 개, 해가 없음
- 반례: nums=[3,3], target=6 → (0,1)`,
      decompose:
`[3~7단계, 상태 전이]
1) 입력 파싱 → nums, target
2) 핵심 로직(해시맵 1-pass)
   - 상태: seen(값→인덱스)
   - 전이: x를 보며 target-x가 seen에 있으면 정답
   - 실패지점: 해가 없을 때 반환 정책
3) 결과 출력 → (i,j)`,
      pattern:
`[후보 비교]
- 후보A: HashMap 1-pass O(n)/O(n) ✅
- 후보B: 정렬+투포인터 O(n log n) (인덱스 유지 추가작업) △
- 불변식: seen에는 처리한 원소들의 위치가 정확히 저장`,
      abstractInPh: `I(입력)
- nums: int[] (중복 가능)   예: [2,7,11,15]
- target: int               예: 9`,
      abstractOutPh: `O(출력)
- indices: (i,j) with i<j
- 상태 전이:
  seen={} → x를 보며 need=target-x
  if need in seen → (seen[need], idx)
  else seen[x]=idx`,
      pseudocode:
`// 1-pass HashMap
seen = {}
for i, x in enumerate(nums):
  need = target - x
  if need in seen:
    return [seen[need], i]
  seen[x] = i
return []  // 정책에 따라 예외 처리
// 시간/공간: O(n)/O(n)
// 단위 테스트:
# [2,7,11,15], 9 -> [0,1]
# [3,3], 6 -> [0,1]`,
    }
  }

  // 기본 템플릿
  return {
    understand:
`[요약 1문단]
- 입력: 이름/타입/범위
- 출력: 무엇을, 어떤 형식으로
- 제약: n의 범위 → 시간/공간 복잡도 추정
- 엣지: 빈배열/중복/음수/경계
- 반례(1줄)`,
    decompose:
`[3~7단계, 각 단계는 관찰 가능한 행동/산출물]
1) 입력 파싱
2) 핵심 로직(상태·전이·예외)
3) 결과 출력`,
    pattern:
`[후보 2개 이상 + 근거]
- 후보A: (복잡도/메모리/데이터 특성 적합성)
- 후보B: (왜 부적합인지 반례 1줄)
- 최종 선택의 불변식/상태 정의`,
    abstractInPh: `I(입력) — 이름/타입/범위/예시`,
    abstractOutPh: `O(출력) — 이름/타입/정의 + 상태 전이(텍스트 차트) + 경계`,
    pseudocode:
`// 10~20줄 절차 + 주석
// 불변식/종료조건/복잡도/단위테스트 2줄 포함`,
  }
}

/* ------------------ 컴포넌트 ------------------ */
export default function LearnWizard({ problem }: { problem: Problem }) {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]
  const T = useMemo(() => templatesFor(problem.id), [problem.id])

  // 설명 접기/펼치기
  const [descOpen, setDescOpen] = useState(false)

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

  // 제출/학습 결과
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<StepScores>({})
  const [avgScore, setAvgScore] = useState<number>(0)
  const [awardedXP, setAwardedXP] = useState<number>(0)

  // AI 카운터
  const [aiRequestCount, setAiRequestCount] = useState(0)
  const [hintCount, setHintCount] = useState(0)

  // 문제 바뀌면 초기화
  useEffect(() => {
    setAiRequestCount(0)
    setHintCount(0)
    setSubmitted(false)
    setScores({})
    setAvgScore(0)
    setAwardedXP(0)
  }, [problem.id])

  // 기존 진행 불러오기
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

  // 프롬프트 빌더
  function buildPrompt(step: StepKey, mode: 'hint' | 'code-suggest' | undefined) {
    const goal = `당신은 코딩을 4단계(문제분해, 패턴 인식, 추상화, 알고리즘적 사고)로 코칭하는 한국어 튜터입니다. 학습자의 사고를 확장시키는 것이 목표입니다.`
    const base = `
${goal}
- 현재 단계에만 집중해서 피드백.
- 형식: ▷잘한점(0~3) ▷보완점(0~3) ▷다음에 생각할 점(1~2).
- 너무 긴 설명 금지. 구체적이고 짧게.`.trim()

    const stepGuide: Record<StepKey, string> = {
      understand: '요구/입출력/제약/엣지를 모호함 없이 한 문단으로 요약하도록 코칭. 제약→복잡도 연결까지.',
      decompose: '3~7개의 실행 가능한 하위 단계(입력→핵심→출력). 각 단계의 상태/전이를 한 줄로 명시.',
      pattern: '후보 2개 이상 비교(시간/공간/데이터 특성). 부적합 후보를 반례로 배제. 최종 불변식 1줄.',
      abstract: 'I/O를 표처럼 정리하고, 상태 전이(언제 갱신되는가)와 경계 처리 분기를 텍스트로.',
      pseudocode: '10~20줄 절차 + 불변식/종료조건/복잡도/단위테스트 2줄.',
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
      setAiRequestCount((c) => c + 1)
      if (nextMode === 'hint') setHintCount((c) => c + 1)

      const prompt = buildPrompt(step, nextMode)
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput: 'placeholder',
          problem: { id: problem.id, title: problem.title, description: problem.description },
          mode: nextMode,
          promptOverride: prompt,
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

  function rankSteps(s: StepScores, topN = 2): { weakest: StepKey[]; strength: StepKey[] } {
    const entries = (Object.entries(s) as Array<[StepKey, number]>).filter(([, v]) => typeof v === 'number')
    entries.sort((a, b) => a[1] - b[1])
    const weakest = entries.slice(0, topN).map(([k]) => k)
    const strength = entries.slice(-topN).reverse().map(([k]) => k)
    return { weakest, strength }
  }

  // 제출
  async function handleSubmit() {
    const s: StepScores = {
      understand: scoreOf(understand, ['입력', '출력', '제약', 'edge', '엣지', '반례', 'o(n)']),
      decompose: scoreOf(decompose, ['입력 파싱', '핵심', '출력', '상태', '전이', '예외']),
      pattern: scoreOf(pattern, ['후보', '시간', '공간', '반례', '불변식', 'kadane', 'hash']),
      abstract: scoreOf(`${abstractIn}\n${abstractOut}`, ['입력', '출력', '흐름', '정의', '전이', '경계']),
      pseudocode: scoreOf(pseudocode, ['for', 'while', 'if', '불변식', '복잡도', '테스트']),
    }
    const vals = Object.values(s)
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + (b ?? 0), 0) / vals.length) : 0
    const prev = getProgressRec(problem.id) as ProblemProgress | undefined
    const attemptsPrev = prev?.attempts ?? 0
    const solvedPrev = 0
    const { weakest, strength } = rankSteps(s)

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
          aiRequestCount,
          hintCount,
          solvedThreshold: 80,
        }),
      })
      data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '서버 평가 실패')
    } catch (e: any) {
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

    const attemptsNext = (typeof data.attempts === 'number') ? data.attempts : attemptsPrev + 1
    const finalAvg = (typeof data.finalAvg === 'number') ? data.finalAvg : avg
    const solvedNow = Boolean(data.solvedNow)

    const baseProgress: ProblemProgress = { scores: s, attempts: attemptsNext }
    setProgress(problem.id, baseProgress)
    if (solvedNow) markSolved(problem.id)

    const bonus = Math.round((finalAvg / 100) * 20)
    const xp = 30 + bonus
    addXP(xp)

    setScores(s)
    setAvgScore(finalAvg)
    setAwardedXP(xp)
    setSubmitted(true)
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

        {/* 설명 접기/펼치기 */}
        {problem.description && (
          <div className="mt-1 relative">
            <p
              id="problem-desc"
              className={[
                'text-slate-700 text-sm md:text-base transition-all',
                descOpen ? '' : 'line-clamp-2 pr-16',
              ].join(' ')}
            >
              {problem.description}
            </p>

            {!descOpen && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent md:from-white/90"
                aria-hidden
              />
            )}

            <button
              type="button"
              className="absolute right-0 -bottom-1 text-xs font-semibold text-[#002D56] bg-white/80 px-2 py-0.5 rounded hover:underline"
              aria-controls="problem-desc"
              aria-expanded={descOpen}
              onClick={() => setDescOpen((v) => !v)}
            >
              {descOpen ? '접기' : '자세히'}
            </button>
          </div>
        )}
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
            <h2 className="text-lg md:text-xl font-bold mb-1">1) 문제 이해하기</h2>
            <p className="text-xs text-slate-600 mb-3">
              기준: 요구/입출력/제약/엣지케이스를 모호함 없이 1문단. (제약→복잡도 연결, 반례 1줄)
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder={T.understand}
              value={understand}
              onChange={(e) => setUnderstand(e.target.value)}
            />
          </>
        )}

        {step === 'decompose' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-1">2) 문제 분해하기</h2>
            <p className="text-xs text-slate-600 mb-3">
              기준: 3~7단계, 각 단계에 입력·출력 상태/전이, 의존성/실패지점 주석.
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder={T.decompose}
              value={decompose}
              onChange={(e) => setDecompose(e.target.value)}
            />
          </>
        )}

        {step === 'pattern' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-1">3) 패턴 인식하기</h2>
            <p className="text-xs text-slate-600 mb-3">
              기준: 후보 ≥2, 시간/공간/데이터 특성 비교 → 부적합 후보는 반례로 제거, 최종 불변식 1~2줄.
            </p>
            <textarea
              rows={10}
              className="w-full h-[220px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder={T.pattern}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </>
        )}

        {step === 'abstract' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-1">4) 추상화하기</h2>
            <p className="text-xs text-slate-600 mb-3">
              기준: I/O 표식 + 상태 전이(언제 값이 갱신되는가) + 경계/분기 명시.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">입력</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder={T.abstractInPh}
                  value={abstractIn}
                  onChange={(e) => setAbstractIn(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">출력</label>
                <textarea
                  rows={8}
                  className="mt-1 w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder={T.abstractOutPh}
                  value={abstractOut}
                  onChange={(e) => setAbstractOut(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 'pseudocode' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-1">5) 의사코드 → 코드/실행</h2>
            <p className="text-xs text-slate-600 mb-3">
              기준: 10~20줄 절차 + 불변식/종료조건/복잡도 + 단위 테스트 2줄.
            </p>
            <textarea
              rows={8}
              className="w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56] mb-4"
              placeholder={T.pseudocode}
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
                placeholder={`표준입력 예\n(문제 샘플이 있으면 위 "문제 설명" 참조)\n필요 시 "실행" 전에 붙여넣기`}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
              />
              <pre className="w-full h-32 rounded-xl border border-slate-200 p-3 bg-slate-50 overflow-auto whitespace-pre-wrap break-words">
{stdout || '실행 결과가 여기에 표시됩니다.'}
              </pre>
            </div>

            {/* 실행 버튼들 (추가된 부분) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => run()}
                className="px-4 py-2 rounded-xl bg-[#002D56] text-white hover:bg-[#002D56]/90 disabled:opacity-50"
                disabled={(codeByLang[language] ?? '').trim().length === 0}
                title="Ctrl/⌘ + Enter"
              >
                실행
              </button>

              {(problem.samples ?? []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => runSample(i)}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-gray-50"
                >
                  샘플 {i + 1} 실행
                </button>
              ))}

              <span className="text-xs text-slate-500 ml-1">
                단축키: <kbd className="px-1 py-0.5 border rounded">Ctrl/⌘</kbd> + <kbd className="px-1 py-0.5 border rounded">Enter</kbd>
              </span>
            </div>
          </>
        )}
      </section>

      {/* AI 튜터 카드 */}
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
          {step === 'understand' && '핵심 요구/입·출력/제약/엣지·반례를 기준에 맞춰 점검합니다.'}
          {step === 'decompose' && '단계 수(3~7), 상태·전이·예외 명시 여부를 점검합니다.'}
          {step === 'pattern' && '후보 비교의 근거/반례/불변식 기술 여부를 점검합니다.'}
          {step === 'abstract' && 'I/O 표식·상태 전이·경계 분기 기술 여부를 점검합니다.'}
          {step === 'pseudocode' && '불변식·종료조건·복잡도·단위테스트 포함 여부를 점검합니다.'}
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
