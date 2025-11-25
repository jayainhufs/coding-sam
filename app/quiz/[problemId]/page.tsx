'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
// 1. (수정) useRouter 제거
import { useSearchParams, useParams /*, useRouter*/ } from 'next/navigation'
// 2. (수정) '@/' -> '../' 상대 경로로 수정
import { addXP , getProgress as getProgressRec, type StepScores} from 'utils/progress'

type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'
type Difficulty = 'easy' | 'medium' | 'applied'

type QuizItem = {
  id: string
  problemId?: string
  originalProblem?: string
  step: StepKey
  type: 'mcq' | 'short' | 'fill'
  difficulty: Difficulty
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

type QuizResultLog = {
  questionId: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation?: string
}

const XP_PER_CORRECT = 15

export default function QuizPage() {
  const params = useParams<{ problemId: string }>()
  const search = useSearchParams()
  // const router = useRouter() // 3. (수정) 프리뷰 오류로 window.location.href 사용

  // 쿼리 파라미터
  const step = (search.get('step') as StepKey) ?? 'abstract'
  const userText = search.get('text') ?? ''
  const originalProblem = search.get('problem') ?? '정수 배열이 주어졌을 때...'

  // 상태
  const [items, setItems] = useState<QuizItem[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [freeAnswer, setFreeAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 결과 관리 상태
  const [results, setResults] = useState<QuizResultLog[]>([])
  const [showResult, setShowResult] = useState(false)

  // ✅ 5. (추가) 단계별 점수 상태
  const [stepScores, setStepScores] = useState<StepScores | null>(null)

  const xpSavedRef = useRef(false)

  // 진행률
  const progress = useMemo(() => {
    if (!items.length) return 0
    if (showResult) return 100
    return Math.round((idx / items.length) * 100)
  }, [idx, items.length, showResult])

  const STEP_LABEL: Record<StepKey, string> = {
    understand: '이해',
    decompose: '분해',
    pattern: '패턴',
    abstract: '추상화',
    pseudocode: '의사코드',
  }

  // ✅ 4. (복원) 누락되었던 DIFF_STYLE 상수
  const DIFF_STYLE: Record<Difficulty, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    applied: 'bg-indigo-100 text-indigo-700',
  }

  // 퀴즈 로드
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: params.problemId,
            step,
            userText,
            originalProblem,
          }),
        })
        const data = await res.json()
        if (!alive) return
        if (!res.ok || !data?.items) throw new Error('퀴즈 생성 실패')
        setItems(data.items as QuizItem[])
        setIdx(0)
        setResults([])
        setShowResult(false)
        xpSavedRef.current = false // 초기화
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? '오류 발생')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [params.problemId, step, userText, originalProblem])

  // 결과 화면 진입 시 XP 지급
  useEffect(() => {
    if (showResult && !xpSavedRef.current) {
      const correctCount = results.filter((r) => r.isCorrect).length
      const totalXp = correctCount * XP_PER_CORRECT

      if (totalXp > 0) {
        addXP(totalXp)
      }
      // ✅ 6. (추가) localStorage에서 단계별 점수 로드
      const p = getProgressRec(params.problemId)
      if (p?.scores) {
        setStepScores(p.scores)
      }
      xpSavedRef.current = true
    }
  }, [showResult, results])

  // 키보드 이벤트
  useEffect(() => {
    if (showResult) return
    const onKey = (e: KeyboardEvent) => {
      if (!items.length) return
      const cur = items[idx]
      if (!cur) return
      if (cur.type === 'mcq' && cur.options?.length === 4) {
        if (e.key >= '1' && e.key <= '4') setSelected(Number(e.key) - 1)
      }
      if (e.key === 'Enter') {
        if (feedback) handleNext()
        else handleSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, idx, feedback, showResult])

  // 핸들러
  const current = items[idx]
  const isMCQ =
    current?.type === 'mcq' &&
    Array.isArray(current.options) &&
    current.options.length === 4

  const handleSubmit = () => {
    if (!current) return
    let userAns = ''
    if (isMCQ) {
      if (selected == null) return
      userAns = current.options![selected]
    } else {
      if (!freeAnswer.trim()) return
      userAns = freeAnswer.trim()
    }

    const correct =
      current.answer.trim().toLowerCase() === userAns.trim().toLowerCase()

    setFeedback(
      correct ? '정답입니다. 잘했어요! 🎉' : `오답입니다. 정답: ${current.answer}`,
    )

    setResults((prev) => [
      ...prev,
      {
        questionId: current.id,
        question: current.question,
        userAnswer: userAns,
        correctAnswer: current.answer,
        isCorrect: correct,
        explanation: current.explanation,
      },
    ])
  }

  const handleNext = () => {
    setFeedback(null)
    setSelected(null)
    setFreeAnswer('')

    if (idx + 1 >= items.length) {
      setShowResult(true)
      return
    }
    setIdx((i) => i + 1)
  }

  // 렌더링
  if (loading) return <div className="p-10 text-center">로딩 중...</div>
  if (error) return <div className="p-10 text-red-600">{error}</div>

  // 결과 화면
  if (showResult) {
    const correctCount = results.filter((r) => r.isCorrect).length
    const score = Math.round((correctCount / results.length) * 100)
    const gainedXp = correctCount * XP_PER_CORRECT // 화면 표시용 XP

    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">퀴즈 완료! 🎉</h2>
          <p className="text-gray-600 mb-6">수고하셨습니다. 결과를 확인해보세요.</p>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl min-w-[100px]">
              <div className="text-sm text-gray-500">정답 수</div>
              <div className="text-2xl font-bold text-[#002D56]">
                {correctCount} / {results.length}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl min-w-[100px]">
              <div className="text-sm text-gray-500">점수</div>
              <div
                className={`text-2xl font-bold ${
                  score >= 80
                    ? 'text-green-600'
                    : score >= 50
                    ? 'text-yellow-600'
                    : 'text-red-500'
                }`}
              >
                {score}점
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl min-w-[100px] border border-yellow-100">
              <div className="text-sm text-yellow-700 font-medium">획득 XP</div>
              <div className="text-2xl font-bold text-yellow-600">
                +{gainedXp} XP
              </div>
            </div>
          </div>

          {/* ✅ 7. (추가) 단계별 성취도 (점수) 표시 */}
          {stepScores && (
            <div className="mb-8 text-left bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3">단계별 성취도</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {(Object.keys(STEP_LABEL) as StepKey[]).map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{STEP_LABEL[key]}</span>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#146E7A]" 
                        style={{ width: `${stepScores[key] || 0}%` }} 
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {stepScores[key] || 0}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            // 5. ✅ (수정) router.push -> window.location.href
            onClick={() => (window.location.href = '/home')}
            className="px-6 py-3 bg-[#002D56] text-white rounded-xl font-medium hover:bg-[#002D56]/90 transition"
          >
            학습 종료하고 홈으로
          </button>
        </div>

        {/* 상세 리뷰 리스트 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold px-1">상세 리뷰</h3>
          {results.map((res, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border ${
                res.isCorrect
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-red-200 bg-red-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    res.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {res.isCorrect ? 'O' : 'X'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 mb-2">
                    Q{i + 1}. {res.question}
                  </p>
                  <div className="text-sm space-y-1">
                    <p
                      className={
                        res.isCorrect ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      <span className="font-semibold">나의 답:</span>{' '}
                      {res.userAnswer}
                    </p>
                    {!res.isCorrect && (
                      <p className="text-gray-600">
                        <span className="font-semibold">정답:</span>{' '}
                        {res.correctAnswer}
                      </p>
                    )}
                    {res.explanation && (
                      <div className="mt-2 pt-2 border-t border-gray-200/50 text-gray-600 text-xs leading-relaxed">
                        💡 {res.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 퀴즈 진행 UI
  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* 진행바 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>{STEP_LABEL[step] ?? '퀴즈'} 단계 점검</span>
          <div className="flex gap-3">
            <span>
              문제 {idx + 1} / {items.length}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
        <div className="h-2 rounded bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-[#002D56] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 퀴즈 카드 */}
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-6 ring-1 ring-black/5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          {/* ✅ 6. (수정) DIFF_STYLE 변수 사용 */}
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
              DIFF_STYLE[current.difficulty]
            }`}
          >
            {current.difficulty}
          </span>
          <span className="text-xs text-gray-400">
            {current.type === 'mcq' ? '객관식' : '단답형'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          {/* 문제 본문 */}
        </div>

        <h1 className="text-lg font-semibold leading-snug mb-3 whitespace-pre-wrap">
          {current.question}
        </h1>

        {/* 보기/입력 UI */}
        {isMCQ ? (
          <div className="grid gap-2 mt-4">
            {current.options!.map((opt, i) => {
              const active = selected === i
              return (
                <label
                  key={opt}
                  onClick={() => setSelected(i)}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    active
                      ? 'border-[#002D56] bg-[#002D56]/5'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    className="accent-[#002D56]"
                    checked={active}
                    onChange={() => setSelected(i)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              )
            })}
          </div>
        ) : (
          <div className="mt-3">
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              value={freeAnswer}
              onChange={(e) => setFreeAnswer(e.target.value)}
              placeholder="정답을 입력하세요"
            />
          </div>
        )}

        {/* 피드백 및 버튼 */}
        <div className="mt-5 flex items-start justify-between gap-3">
          {feedback ? (
            <div className="flex-1">
              <div
                className={`text-sm mb-1 font-bold ${
                  feedback.startsWith('정답')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {feedback}
              </div>
              {current.explanation && (
                <div className="text-xs text-gray-600">
                  {current.explanation}
                </div>
              )}
            </div>
          ) : (
            <div></div>
          )}

          {feedback ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90"
            >
              {idx + 1 >= items.length ? '결과 보기' : '다음'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isMCQ ? selected == null : !freeAnswer.trim()}
              className="px-4 py-2 rounded-xl bg-[#002D56] text-white disabled:opacity-50 hover:bg-[#002D56]/90"
            >
              제출
            </button>
          )}
        </div>
      </div>
    </main>
  )
}