// /app/quiz/[problemId]/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'

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

export default function QuizPage() {
  const params = useParams<{ problemId: string }>()
  const search = useSearchParams()
  const router = useRouter()

  // 쿼리에서 넘어온 최근 단계/텍스트/문제요약
  const step = (search.get('step') as StepKey) ?? 'abstract'
  const userText = search.get('text') ?? ''
  const originalProblem =
    search.get('problem') ??
    '정수 배열이 주어졌을 때 연속 부분 배열 중 가장 큰 합을 구하라.'

  // 상태
  const [items, setItems] = useState<QuizItem[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [freeAnswer, setFreeAnswer] = useState('') // 서술형 대비
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 진행률
  const progress = useMemo(() => {
    if (!items.length) return 0
    return Math.round(((idx) / items.length) * 100)
  }, [idx, items.length])

  // 단계 라벨/색상
  const STEP_LABEL: Record<StepKey, string> = {
    understand: '이해',
    decompose: '분해',
    pattern: '패턴',
    abstract: '추상화',
    pseudocode: '의사코드',
  }
  const DIFF_STYLE: Record<Difficulty, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    applied: 'bg-indigo-100 text-indigo-700',
  }

  // 퀴즈 불러오기
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
            // 라우트가 userText/originalProblem을 기대 — 그대로 보냄
            userText,
            originalProblem,
          }),
        })
        const data = await res.json()
        if (!alive) return
        if (!res.ok || !data?.items) throw new Error('퀴즈 생성 실패')
        setItems(data.items as QuizItem[])
        setIdx(0)
        setSelected(null)
        setFreeAnswer('')
        setFeedback(null)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? '퀴즈를 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [params.problemId, step, userText, originalProblem])

  // 키보드 단축키: 1~4 선택, Enter 제출/다음
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!items.length) return
      const cur = items[idx]
      if (!cur) return
      if (cur.type === 'mcq' && cur.options?.length === 4) {
        if (e.key >= '1' && e.key <= '4') {
          setSelected(Number(e.key) - 1)
        }
      }
      if (e.key === 'Enter') {
        if (feedback) {
          handleNext()
        } else {
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, idx, feedback])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-2 bg-gray-200 rounded mb-6 overflow-hidden">
          <div className="h-full w-1/3 animate-pulse bg-gray-300" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          퀴즈를 생성하는 중입니다…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6">
          {error} <button className="underline ml-2" onClick={() => router.refresh()}>다시 시도</button>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          생성된 문항이 없습니다. <button className="underline" onClick={() => router.push('/home')}>홈으로</button>
        </div>
      </div>
    )
  }

  const current = items[idx]
  const isMCQ = current.type === 'mcq' && Array.isArray(current.options) && current.options.length === 4

  const handleSubmit = () => {
    if (!current) return
    let userAns = ''
    if (isMCQ) {
      if (selected == null) return // 선택 안 했으면 제출 X
      userAns = current.options![selected]
    } else {
      if (!freeAnswer.trim()) return
      userAns = freeAnswer.trim()
    }
    const correct =
      current.answer.trim().toLowerCase() === userAns.trim().toLowerCase()
    setFeedback(
      correct ? '정답입니다. 잘했어요! 🎉' : `오답입니다. 정답: ${current.answer}`
    )
  }

  const handleNext = () => {
    setFeedback(null)
    setSelected(null)
    setFreeAnswer('')
    if (idx + 1 >= items.length) {
      router.push('/home')
      return
    }
    setIdx((i) => i + 1)
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* 진행바 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>문제 {idx + 1} / {items.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-[#002D56] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 카드 */}
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-6 ring-1 ring-black/5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
              {STEP_LABEL[current.step]}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DIFF_STYLE[current.difficulty]}`}>
              {current.difficulty === 'easy' ? '쉬움'
                : current.difficulty === 'medium' ? '보통'
                : '응용'}
            </span>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="text-xs text-gray-500 hover:underline"
            title="나중에 다시 풀기"
          >
            나가기
          </button>
        </div>

        <h1 className="text-lg font-semibold leading-snug mb-3 whitespace-pre-wrap">
          {current.question}
        </h1>

        {/* 보기 (라디오 카드) / 서술형 */}
        {isMCQ ? (
          <div className="grid gap-2 mt-4">
            {current.options!.map((opt, i) => {
              const active = selected === i
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition
                    ${active ? 'border-[#002D56] bg-[#002D56]/5' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => setSelected(i)}
                >
                  <input
                    type="radio"
                    className="accent-[#002D56]"
                    name="opt"
                    value={opt}
                    checked={active}
                    onChange={() => setSelected(i)}
                  />
                  <span className="text-sm">{opt}</span>
                  <span className="ml-auto text-xs text-gray-400">({i + 1})</span>
                </label>
              )
            })}
            <p className="text-xs text-gray-500 mt-1">숫자키 1–4로 선택, Enter로 제출/다음</p>
          </div>
        ) : (
          <div className="mt-3">
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
              placeholder="정답을 입력하세요"
              value={freeAnswer}
              onChange={(e) => setFreeAnswer(e.target.value)}
            />
          </div>
        )}

        {/* 피드백/버튼 */}
        <div className="mt-5 flex items-start justify-between gap-3">
          {feedback ? (
            <div className="flex-1">
              <div className="text-sm mb-1">{feedback}</div>
              {current.explanation ? (
                <div className="text-xs text-gray-600">{current.explanation}</div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-gray-500">모든 문항은 한 번에 한 문제씩 채점됩니다.</div>
          )}

          {feedback ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#296B75] text-white hover:bg-[#296B75]/90"
            >
              {idx + 1 >= items.length ? '완료' : '다음'}
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

      {/* 하단 보조 링크 */}
      <div className="mt-4 text-right">
        <button
          onClick={() => router.push('/home')}
          className="text-sm text-gray-500 underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    </main>
  )
}
