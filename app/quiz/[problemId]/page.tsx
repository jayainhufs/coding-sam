// /app/quiz/[problemId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'

type QuizItem = {
  id: string
  type: 'mcq' | 'short' | 'fill'
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

export default function QuizPage() {
  const params = useParams<{ problemId: string }>()
  const search = useSearchParams()
  const router = useRouter()

  const step = search.get('step') ?? 'abstract'
  const userText = search.get('text') ?? '' // 제출된 원문을 qs로 넘겼다고 가정
  const originalProblem =
    search.get('problem') ?? '정수 배열이 주어졌을 때 연속 부분 배열 중 가장 큰 합을 구하라.'

  const [items, setItems] = useState<QuizItem[]>([])
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuiz = async () => {
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
      setItems(data.items ?? [])
      setIdx(0)
      setAnswer('')
      setFeedback(null)
    }
    fetchQuiz()
  }, [params.problemId, step, userText, originalProblem])

  if (!items || items.length === 0) {
    return <div className="p-6">퀴즈를 생성하는 중입니다…</div>
  }

  const current = items[idx]

  const handleSubmit = () => {
    if (!current) return
    const isCorrect =
      current.answer.trim().toLowerCase() === answer.trim().toLowerCase()
    setFeedback(isCorrect ? '정답입니다.' : `오답입니다. 정답: ${current.answer}`)
  }

  const handleNext = () => {
    setFeedback(null)
    setAnswer('')

    // 마지막 문제였으면 홈으로 이동
    if (idx + 1 >= items.length) {
      router.push('/home')
      return
    }
    setIdx(idx + 1)
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold">
        문제 {idx + 1}/{items.length}
      </h1>

      <p className="whitespace-pre-wrap">{current.question}</p>

      {current.type === 'mcq' && current.options ? (
        <div className="space-y-2">
          {current.options.map((opt) => (
            <label key={opt} className="flex gap-2 items-center">
              <input
                type="radio"
                name="opt"
                value={opt}
                checked={answer === opt}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="정답을 입력하세요"
        />
      )}

      {feedback ? (
        <div className="space-y-2">
          <p>{feedback}</p>
          {current.explanation ? (
            <p className="text-sm text-gray-500">{current.explanation}</p>
          ) : null}
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            다음
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          제출
        </button>
      )}

      {/* 사용자가 중간에 나가고 싶을 때도 홈으로 */}
      <div className="pt-4">
        <button
          onClick={() => router.push('/home')}
          className="text-sm text-gray-500 underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
