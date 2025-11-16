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

// 사용자에게는 점수 미노출, 내부 판단만
const PASS_LINE = 40

export default function LearnWizard({ problem }: { problem: Problem }) {
  // const router = useRouter() // 3. 프리뷰 오류로 주석 처리
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]
  const T = useTemplates(problem.id)

  // 입력 상태
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

  // 제출/점수(제출용 평균)
  const [scores, setScores] = useState<StepScores>({})
  const [avgScore, setAvgScore] = useState<number>(0)

  // ✅ 1. (추가) 코드 실행이 모든 샘플을 통과했는지 여부를 저장할 state
  const [isCodeVerified, setIsCodeVerified] = useState(false)

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

  // 현재 단계 텍스트
  const getCurrentText = (): string => {
    if (step === 'understand') return understand
    if (step === 'decompose') return decompose
    if (step === 'pattern') return pattern
    if (step === 'abstract') return `입력:\n${abstractIn}\n\n출력:\n${abstractOut}`
    return pseudocode
  }

  // AI 채점 (0.4초 디바운스)
  const [aiScore, setAiScore] = useState<number>(0) // 내부 판단용
  const [aiTips, setAiTips] = useState<string[]>([])
  const [scoring, setScoring] = useState(false)
  const debounceId = useRef<number | null>(null)

  useEffect(() => {
    const text = (getCurrentText() || '').trim()

    if (debounceId.current) window.clearTimeout(debounceId.current)
    debounceId.current = window.setTimeout(async () => {
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
        // 폴백(길이 기반)
        const crude = text.length > 120 ? 62 : text.length > 60 ? 58 : 40
        setAiScore(crude)
        setAiTips(
          crude >= PASS_LINE ? [] : ['예시·수치·경계 케이스를 2개 이상 추가'],
        )
      } finally {
        setScoring(false)
      }
    }, 400)

    return () => {
      if (debounceId.current) window.clearTimeout(debounceId.current)
    }
  }, [step, understand, decompose, pattern, abstractIn, abstractOut, pseudocode])

  // ▶ 패턴/의사코드는 항상 이동 가능
  const canNext =
    step === 'pseudocode' || step === 'pattern' ? true : aiScore >= PASS_LINE

  // 제출용 임시 점수(기존 로직 유지)
  const scoreOf = (text: string, keywords: string[]) => {
    if (!text.trim()) return 0
    let s = 40
    const t = text.toLowerCase()
    for (const k of keywords) if (t.includes(k)) s += 12
    return Math.min(100, s)
  }

  // 퀴즈 이동
  function goToQuiz(problemId: string, latestStep: StepKey, latestText: string) {
    const qs = new URLSearchParams({
      step: latestStep,
      text: latestText,
      problem: problem.description || problem.title || '',
    }).toString()
    // router.push(`/quiz/${problemId}?${qs}`) // 4. 프리뷰 오류로 window.location.href 사용
    window.location.href = `/quiz/${problemId}?${qs}`
  }

  // 제출
  async function handleSubmit() {
    // ✅ 2. (추가) 제출 버튼이 눌렸을 때, 통과 여부를 다시 한번 확인
    if (!isCodeVerified) {
      // (참고) confirm/alert는 프리뷰에서 안 보일 수 있음
      alert(
        '"전체 샘플 실행"을 눌러 모든 샘플(✅)을 통과했는지 다시 확인해주세요.',
      )
      return
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
        '경계',
      ]),
      pseudocode: scoreOf(pseudocode, [
        'for',
        'while',
        'if',
        '불변식',
        '복잡도',
        '테스트',
      ]),
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
          solvedThreshold: 80,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '서버 평가 실패')

      const attemptsNext =
        typeof data.attempts === 'number' ? data.attempts : attemptsPrev + 1
      const finalAvg = typeof data.finalAvg === 'number' ? data.finalAvg : avg
      const solvedNow = Boolean(data.solvedNow)

      setProgress(problem.id, { scores: s, attempts: attemptsNext })
      if (solvedNow) {
        markSolved(problem.id) // ✅ 'utils/progress'의 수정된 함수 호출
      }

      const bonus = Math.round((finalAvg / 100) * 20)
      addXP(30 + bonus)
      setScores(s)
      setAvgScore(finalAvg)

      goToQuiz(problem.id, 'pseudocode', pseudocode || '')
    } catch {
      const attempts = attemptsPrev + 1
      setProgress(problem.id, { scores: s, attempts })
      markSolved(problem.id) // ✅ 'utils/progress'의 수정된 함수 호출
      const bonus = Math.round((avg / 100) * 20)
      addXP(30 + bonus)
      setScores(s)
      setAvgScore(avg)

      goToQuiz(problem.id, 'pseudocode', pseudocode || '')
    }
  }

  // 현재 단계 입력 유무 체크
  const hasInputForStep = (st: StepKey) => {
    if (st === 'understand') return !!understand.trim()
    if (st === 'decompose') return !!decompose.trim()
    if (st === 'pattern') return !!pattern.trim()
    if (st === 'abstract') return !!(abstractIn.trim() || abstractOut.trim())
    if (st === 'pseudocode') return !!pseudocode.trim()
    return false
  }

  // 30초 무활동 시 힌트 제안
  useEffect(() => {
    const IDLE_MS = 30_000
    const timer = setTimeout(() => {
      const text =
        step === 'understand'
          ? understand
          : step === 'decompose'
          ? decompose
          : step === 'pattern'
          ? pattern
          : step === 'abstract'
          ? `${abstractIn}\n${abstractOut}`
          : pseudocode

      if (!text.trim() || text.trim().length < 10) {
        // (참고) confirm()은 프리뷰 환경에서 보이지 않을 수 있음
        const ok = window.confirm(
          '30초 동안 입력이 없었어요. 이 단계에 맞는 힌트를 받아볼까요?',
        )
        if (ok)
          window.dispatchEvent(
            new CustomEvent('AITUTOR_HINT', { detail: { step } }),
          )
      }
    }, IDLE_MS)
    return () => clearTimeout(timer)
  }, [step, understand, decompose, pattern, abstractIn, abstractOut, pseudocode])

  // AI 프롬프트 빌더
  const buildPrompt = useMemo(() => {
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
      const userText =
        st === 'understand'
          ? understand
          : st === 'decompose'
          ? decompose
          : st === 'pattern'
          ? pattern
          : st === 'abstract'
          ? `입력:\n${abstractIn}\n\n출력:\n${abstractOut}`
          : pseudocode
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
      if (mode === 'code-suggest') {
        if (!hasInput)
          return `${base}
${guide[st]}
현재 입력이 비어있습니다. 2~3개 질문으로 요구사항을 확인한 뒤, 짧은 의사코드/스니펫(10~20줄)을 제시하세요.`
        return `${base}
${guide[st]}
학습자 입력을 반영해 짧은 의사코드 또는 10~20줄 스니펫을 제시하세요.
학습자 입력:
${userText}`
      }
      if (!hasInput)
        return `${base}
${guide[st]}
현재 입력이 비어있습니다. 이 단계에서 무엇을 쓰면 좋은지 3줄 이내 가이드만 제시하세요.`
      return `${base}
${guide[st]}
학습자 입력:
${userText}`
    }
  }, [understand, decompose, pattern, abstractIn, abstractOut, pseudocode])

  const progress = ((stepIdx + 1) / STEP_ORDER.length) * 100

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

            {/* ✅ 3. (수정) EditorRunPanel에 onValidationChange prop 전달 */}
            <EditorRunPanel
              language={language}
              setLanguage={setLanguage}
              codeByLang={codeByLang}
              setCodeByLang={setCodeByLang}
              samples={problem.samples}
              onValidationChange={setIsCodeVerified}
            />
          </>
        )}
      </section>

      <AiTutorPanel
        step={step}
        stepLabel={STEP_LABEL[step]}
        problem={{
          id: problem.id,
          title: problem.title,
          description: problem.description,
        }}
        buildPrompt={buildPrompt}
        hasInputForStep={hasInputForStep}
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
          // ✅ 4. (수정) "제출" 버튼
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90 disabled:opacity-50"
            // ✅ (수정) isCodeVerified state로 비활성화
            disabled={!isCodeVerified}
            title={
              !isCodeVerified
                ? '"전체 샘플 실행"을 눌러 모든 샘플(✅)을 통과해야 제출할 수 있습니다.'
                : '제출'
            }
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