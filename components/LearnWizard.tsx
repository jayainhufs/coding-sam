// components/LearnWizard.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProblemHeader from './learn/ProblemHeader'
import StepTabs from './learn/StepTabs'
import ProgressBar from './learn/ProgressBar'
import EditorRunPanel from './learn/EditorRunPanel'
import AiTutorPanel from './learn/AiTutorPanel'
import { useTemplates } from '@/hooks/useTemplates'
import { AiMode, StepKey } from '@/hooks/useAiTutor'
import {
  addXP, getProgress as getProgressRec, setProgress, markSolved,
  type StepScores, type ProblemProgress,
} from '@/utils/progress'
import { LanguageKey } from './CodeEditor'
import { USER_KEY, PREF_KEY } from '@/lib/AuthContext'

type Problem = {
  id: string
  title: string
  description?: string
  difficulty?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

const STEP_ORDER: StepKey[] = [
  'understand',
  'decompose',
  'pattern',
  'abstract',
  'pseudocode',
]
const STEP_LABEL: Record<StepKey, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드 → 코드/실행',
}

const PASS_LINE = 50

export default function LearnWizard({ problem }: { problem: Problem }) {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]
  const T = useTemplates(problem.id)

  // ... (입력 상태: understand, decompose, etc.) ...
  const [understand, setUnderstand] = useState('')
  const [decompose, setDecompose] = useState('')
  const [pattern, setPattern] = useState('')
  const [abstractIn, setAbstractIn] = useState('')
  const [abstractOut, setAbstractOut] = useState('')
  const [pseudocode, setPseudocode] = useState('')

  // 코드/언어
  const [language, setLanguage] = useState<LanguageKey>('python')
  const [codeByLang, setCodeByLang] = useState<Record<LanguageKey, string>>({
    python: '',
    c: '',
    java: '',
  })

  // ... (제출/점수: scores, avgScore, isCodeVerified) ...
  const [scores, setScores] = useState<StepScores>({})
  const [avgScore, setAvgScore] = useState<number>(0)
  const [isCodeVerified, setIsCodeVerified] = useState(false)
  // 통과한 테스트 케이스 개수 state
  const [passCount, setPassCount] = useState(0)
  // 학생 프로필(스타일)을 저장할 state
  const [studentProfile, setStudentProfile] = useState<any>(null)

  // 초기 진행 불러오기
  useEffect(() => {
    const prev = getProgressRec(problem.id) as ProblemProgress | undefined
    if (!prev) return
    setScores(prev.scores)
    const vals = Object.values(prev.scores || {})
    const prevAvg = vals.length
      ? Math.round(vals.reduce((a, b) => a + (b ?? 0), 0) / vals.length)
      : 0
    setAvgScore(prevAvg)
  }, [problem.id])

  // 마운트 시 학생 프로필(스타일) 로드
  useEffect(() => {
    try {
      const userName = localStorage.getItem(USER_KEY)
      if (userName) {
        const prefKey = PREF_KEY(userName)
        const prefData = localStorage.getItem(prefKey)
        if (prefData) {
          setStudentProfile(JSON.parse(prefData))
        }
      }
    } catch (e) {
      console.error('Failed to load student profile', e)
    }
  }, []) // 마운트 시 1회 실행

  // ... (getCurrentText, useEffect - AI 채점, canNext, scoreOf, goToQuiz, handleSubmit) ...
  // (LearnWizard.tsx의 기존 함수들)
  const getCurrentText = (): string => {
    if (step === 'understand') return understand
    if (step === 'decompose') return decompose
    if (step === 'pattern') return pattern
    if (step === 'abstract') return `입력:\n${abstractIn}\n\n출력:\n${abstractOut}`
    return pseudocode
  }
  const [aiScore, setAiScore] = useState<number>(0)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [scoring, setScoring] = useState(false)
  const debounceId = useRef<number | null>(null)
  useEffect(() => {
    const text = (getCurrentText() || '').trim()
    if (debounceId.current) window.clearTimeout(debounceId.current)
    debounceId.current = window.setTimeout(
      async () => {
        if (!text) {
          setAiScore(0)
          setAiTips([])
          return
        }
        setScoring(true)
        try {
          const r = await fetch('/api/ai/feedback/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step, text }),
          })
          const j = await r.json()
          if (!r.ok || !j?.ok) throw new Error(j?.error || 'score api error')
          const score = typeof j.score === 'number' ? j.score : 0
          setAiScore(score)
          setAiTips(Array.isArray(j.tips) ? j.tips : [])
        } catch {
          const crude = text.length > 120 ? 62 : text.length > 60 ? 58 : 40
          setAiScore(crude)
          setAiTips(
            crude >= PASS_LINE ? [] : ['예시·수치·경계 케이스를 2개 이상 추가'],
          )
        } finally {
          setScoring(false)
        }
      },
      400,
    )
    return () => {
      if (debounceId.current) window.clearTimeout(debounceId.current)
    }
  }, [step, understand, decompose, pattern, abstractIn, abstractOut, pseudocode])
  const canNext =
    step === 'pseudocode' || step === 'pattern' ? true : aiScore >= PASS_LINE
  const scoreOf = (text: string, keywords: string[]) => {
    if (!text.trim()) return 0
    let s = 40
    const t = text.toLowerCase()
    for (const k of keywords) if (t.includes(k)) s += 12
    return Math.min(100, s)
  }
  function goToQuiz(
    problemId: string,
    latestStep: StepKey,
    latestText: string,
  ) {
    const qs = new URLSearchParams({
      step: latestStep,
      text: latestText,
      problem: problem.description || problem.title || '',
    }).toString()
    window.location.href = `/quiz/${problemId}?${qs}`
  }
  async function handleSubmit() {
    // (수정) 전체 샘플 미통과 시 사용자 확인 (강제 통과 가능)
    let forcedVerified = isCodeVerified
  
    if (!isCodeVerified) {
      // alert 대신 confirm을 사용하여 선택권 부여
      const proceed = window.confirm(
        '모든 샘플을 통과하지 못했습니다. 그래도 제출하시겠습니까?',
      )
      if (!proceed) {
        return // 취소 시 중단
      }
      // 확인 시 강제로 통과 상태로 설정
      forcedVerified = true
      setIsCodeVerified(true) // UI 반영
    }
    const s: StepScores = {
      understand: scoreOf(understand, [
        '입력',
        '출력',
        '제약',
        'edge',
        '엣지',
        '반례',
        'o(n)',
      ]),
      decompose: scoreOf(decompose, [
        '입력 파싱',
        '핵심',
        '출력',
        '상태',
        '전이',
        '예외',
      ]),
      pattern: scoreOf(pattern, [
        '후보',
        '시간',
        '공간',
        '반례',
        '불변식',
        'kadane',
        'hash',
      ]),
      abstract: scoreOf(`${abstractIn}\n${abstractOut}`, [
        '입력',
        '출력',
        '흐름',
        '정의',
        '전이',
        '경계'
      ]),
      pseudocode: (() => {
        let baseScore = scoreOf(pseudocode, [
          'for',
          'while',
          'if',
          '불변식',
          '복잡도',
          '테스트',
        ])
        // 테스트 케이스 가산점 (최대 3개 * 12점 = 36점)
        const testBonus = passCount * 12
        return Math.min(100, baseScore + testBonus)
      })(),
    }
    const vals = Object.values(s)
    const avg = vals.length
      ? Math.round(vals.reduce((a, b) => a + (b ?? 0), 0) / vals.length)
      : 0
    const prev = getProgressRec(problem.id) as ProblemProgress | undefined
    const attemptsPrev = prev?.attempts ?? 0
    try {
      const res = await fetch('/api/ai/feedback/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: {
            avg: s,
            attempts: attemptsPrev,
            solvedCount: 0,
            weakest: [],
            strength: [],
          },
          aiRequestCount: 0,
          hintCount: 0,
          solvedThreshold: 20,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '서버 평가 실패')
      const attemptsNext =
        typeof data.attempts === 'number' ? data.attempts : attemptsPrev + 1
      const finalAvg = typeof data.finalAvg === 'number' ? data.finalAvg : avg
      const solvedNow = Boolean(data.solvedNow) || forcedVerified
      setProgress(problem.id, { scores: s, attempts: attemptsNext })
      if (solvedNow) {
        markSolved(problem.id)
      }
      const bonus = Math.round((finalAvg / 100) * 20)
      addXP(30 + bonus)
      setScores(s)
      setAvgScore(finalAvg)
      goToQuiz(problem.id, 'pseudocode', pseudocode || '')
    } catch {
      const attempts = attemptsPrev + 1
      setProgress(problem.id, { scores: s, attempts })
      // (수정) 에러 시에도 강제 통과 상태라면 해결 처리
      if (forcedVerified) {
        markSolved(problem.id)
      }
      const bonus = Math.round((avg / 100) * 20)
      addXP(30 + bonus)
      setScores(s)
      setAvgScore(avg)
      goToQuiz(problem.id, 'pseudocode', pseudocode || '')
    }
  }  
  const hasInputForStep = (st: StepKey) => {
    if (st === 'understand') return !!understand.trim()
    if (st === 'decompose') return !!decompose.trim()
    if (st === 'pattern') return !!pattern.trim()
    if (st === 'abstract') return !!(abstractIn.trim() || abstractOut.trim())
    if (st === 'pseudocode') return !!pseudocode.trim()
    return false
  }

  // (삭제) 30초 힌트 제안 useEffect (요청에 따라 삭제)

  // (수정) AI 프롬프트 빌더
  const buildPrompt = useMemo(() => {
    // 7a. (수정) 'code-suggest'를 위한 새 LLM 프롬프트 템플릿
    const codeSuggestMimicPrompt = `### 역할(Role)
당신은 학생의 고유한 코딩 스타일과 논리 패턴을 '모방(mimicking)'하여 힌트를 주는 AI 프로그래밍 조교입니다. 이때, 제안하는 내용은 학습자에게 친화적인(learner-friendly) 톤을 유지해야 합니다 [1].

### 핵심 임무(Core Task)
학생이 자신의 논리 흐름을 유지하며 막힌 부분을 해결하도록 돕는 것입니다.

### 엄격한 제약사항(Strict Constraints)
1.  **절대(NEVER)** 당신의 '더 나은', '최적의', '효율적인' 코드를 먼저 제안하지 마십시오.
2.  오직 학생의 고유한 스타일을 반영한 코드를 생성해야 합니다.
3.  주석 설명을 제한하고, 학생이 현재 작성 중인 코드의 맥락에 바로 이어지는 '다음 단계'의 코드 스니펫(snippet)만 제공하십시오(1~2줄).
4.  제시된 '스타일 프로필'을 반드시 준수해야 합니다.

### 입력 1: 학생 스타일 프로필 (JSON)
${JSON.stringify(studentProfile ?? { styleSummary: '기본 스타일 사용' }, null, 2)}

### 입력 2: 학생이 현재 작성 중인 코드 (Incomplete Code)
{current_incomplete_code}

### 출력 (Your Response)
[학생의 스타일을 모방하여, 입력 2의 코드를 논리적으로 이어받는 다음 단계의 코드 스니펫]
`.trim()

    // 7b. (기존) 'hint', 'request' 모드용 프롬프트
    const goal = `당신은 학습자를 5단계로 코칭하는 한국어 코딩 튜터입니다.
① 이해: 요구/입·출력/제약/엣지를 1문단으로 요약(제약→복잡도 연결, 반례 1줄)
② 분해: 3~7 하위 단계(입력→핵심→출력), 각 단계의 상태/전이/예외를 1줄씩
③ 패턴: 후보 ≥2 비교, 반례로 배제, 최종 선택의 불변식 1줄
④ 추상화: I/O 표 + 상태 전이 + 경계/엣지 분기
⑤ 의사코드: 10~20줄 절차 + 불변식/종료조건/복잡도 + 단위테스트
현재 선택된 단계의 기준만 적용하고, 다른 단계로 넘기지 마세요.`
    const base = `${goal}
- 출력 형식(요청/코드제안): ▷잘한점(0~3) ▷보완점(0~3) ▷다음에 생각할 점(1~2).
- 너무 긴 설명 금지. 구체적이고 짧게.`
    const guide: Record<StepKey, string> = {
      understand:
        '이해 단계: 요구·입출력·제약·엣지를 1문단으로. 제약→복잡도 연결, 반례 1줄.',
      decompose:
        '분해 단계: 3~7 하위 단계(입력→핵심→출력), 각 단계의 상태/전이/예외.',
      pattern: '패턴 단계: 후보 ≥2 비교, 반례로 배제, 최종 불변식 1줄.',
      abstract: '추상화 단계: I/O 표 + 상태 전이 + 경계/엣지 분기.',
      pseudocode:
        '의사코드 단계: 10~20줄 + 불변식/종료조건/복잡도 + 단위테스트.',
    }

    return (st: StepKey, mode: AiMode) => {
      // 7c. (수정) 'code-suggest' 모드 분기
      if (mode === 'code-suggest') {
        // 'code-suggest'는 5단계(pseudocode)의 "실제 코드 에디터" 기준
        const currentCode = codeByLang[language] ?? ''
        return codeSuggestMimicPrompt.replace(
          '{current_incomplete_code}',
          currentCode,
        )
      }

      // 7d. (기존) 'hint', 'request' 로직
      // "요청" 또는 "힌트"는 5단계의 '의사코드' textarea를 사용
      const userText =
        st === 'understand'
          ? understand
          : st === 'decompose'
          ? decompose
          : st === 'pattern'
          ? pattern
          : st === 'abstract'
          ? `입력:\n${abstractIn}\n\n출력:\n${abstractOut}`
          : pseudocode // 5단계일 경우 '의사코드' textarea
      const hasInput = Boolean(userText.trim())
      if (mode === 'hint') {
        const head = hasInput
          ? '아래 학습자 입력을 참고해 '
          : '학습자 입력이 비어있습니다. 입력이 없어도 '
        return `${base}
${guide[st]}
${head}현재 단계에서 채워야 할 구체 항목을 질문/체크리스트 형태의 "힌트만" 2~3개 제시하세요.
학습자 입력:
${userText || '(없음)'}`
      }

      // (기존 'code-suggest' 로직 삭제됨)

      if (!hasInput)
        return `${base}
${guide[st]}
현재 입력이 비어있습니다. 이 단계에서 무엇을 쓰면 좋은지 3줄 이내 가이드만 제시하세요.`
      return `${base}
${guide[st]}
학습자 입력:
${userText}`
    }
  }, [
    understand,
    decompose,
    pattern,
    abstractIn,
    abstractOut,
    pseudocode,
    studentProfile, // (추가) 의존성
    codeByLang, // (추가) 의존성
    language, // (추가) 의존성
  ])

  const progress = ((stepIdx + 1) / STEP_ORDER.length) * 100

  // "실제 코드"가 있는지 확인하는 변수
  const codeInEditor = codeByLang[language]?.trim() ?? ''
  const hasCodeInEditor = codeInEditor.length > 1 // 1글자 이상일 때

  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      <ProblemHeader
        title={problem.title}
        description={problem.description}
        stepText={`${stepIdx + 1} / ${STEP_ORDER.length} 단계`}
      />

      <ProgressBar value={progress} />

      {/* 탭: 표시만, 클릭 비활성화 */}
      <StepTabs
        order={STEP_ORDER}
        label={STEP_LABEL}
        current={step}
        clickable={false}
      />

      {/* 게이트 표시줄 — 패턴/의사코드는 숨김 */}
      {step !== 'pseudocode' && step !== 'pattern' && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {scoring ? (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              채점 중…
            </span>
          ) : aiScore >= PASS_LINE ? (
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
              통과 가능
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
              작성 더 필요
            </span>
          )}
          {!scoring && aiScore < PASS_LINE && aiTips?.length > 0 && (
            <span className="text-slate-600">힌트: {aiTips[0]}</span>
          )}
        </div>
      )}

      {/* 본문 */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
        {step === 'understand' && (
          <>
            <h2 className="text-lg md:text-xl font-bold mb-1">
              1) 문제 이해하기
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              요구/입출력/제약/엣지케이스 1문단(제약→복잡도, 반례 1줄)
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
            <h2 className="text-lg md:text-xl font-bold mb-1">
              2) 문제 분해하기
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              3~7단계, 각 단계에 상태/전이/예외
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
            <h2 className="text-lg md:text-xl font-bold mb-1">
              3) 패턴 인식하기
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              후보 ≥2 비교 → 반례로 제거, 최종 불변식
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
            <h2 className="text-lg md:text-xl font-bold mb-1">
              4) 추상화하기
            </h2>
            <p className="text-xs text-slate-600 mb-3">I/O 표식 + 상태 전이 + 경계</p>
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
            <h2 className="text-lg md:text-xl font-bold mb-1">
              5) 의사코드 → 코드/실행
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              10~20줄 + 불변식/종료조건/복잡도 + 단위테스트
            </p>
            <textarea
              rows={8}
              className="w-full h-[200px] rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56] mb-4"
              placeholder={T.pseudocode}
              value={pseudocode}
              onChange={(e) => setPseudocode(e.target.value)}
            />

            <EditorRunPanel
              language={language}
              setLanguage={setLanguage}
              codeByLang={codeByLang}
              setCodeByLang={setCodeByLang}
              samples={problem.samples}
              onValidationChange={setIsCodeVerified}
              onPassCountChange={setPassCount} // (추가) 통과 개수 전달
            />
          </>
        )}
      </section>

      <AiTutorPanel
        step={step}
        stepLabel={STEP_LABEL[step]}
        problem={problem}
        buildPrompt={buildPrompt}
        hasInputForStep={hasInputForStep} // "의사코드" 입력 여부
        hasCode={hasCodeInEditor} // "실제 코드" 입력 여부
      />

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
          // "제출" 버튼
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90 disabled:opacity-50"
          >
            제출
          </button>
        ) : (
          <button
            onClick={() =>
              setStepIdx((i) => Math.min(STEP_ORDER.length - 1, i + 1))
            }
            className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90 disabled:opacity-50"
            disabled={step !== 'pattern' && (!canNext || scoring)}
            title={
              step === 'pattern'
                ? '다음 단계로 이동'
                : !canNext && !scoring
                ? aiTips?.[0] ?? '조금만 더 보완해 주세요'
                : '다음 단계로 이동'
            }
          >
            {scoring && step !== 'pattern' ? '채점 중…' : '다음'}
          </button>
        )}
      </div>
    </main>
  )
}
