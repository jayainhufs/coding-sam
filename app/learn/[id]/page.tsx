'use client'
import { useEffect, useState } from 'react'
import Stepper from '@/components/Stepper'
import FeedbackPanel from '@/components/FeedbackPanel'
import QuestionList from '@/components/QuestionList'
import Checklist from '@/components/Checklist'
import ProblemIO from '@/components/ProblemIO'

const steps = [
  { key: 'understand', label: '문제 이해' },
  { key: 'decompose', label: '문제 분해' },
  { key: 'pattern', label: '패턴 인식' },
  { key: 'abstract', label: '추상화' },
  { key: 'pseudocode', label: '의사코드' },
  { key: 'submit', label: '답안 제출' }
]

type Problem = {
  id: string; title: string; description: string; inputFormat?: string; outputFormat?: string
}

export default function LearnPage({ params }: { params: { id: string } }) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [active, setActive] = useState(0)
  const [userInputs, setUserInputs] = useState<Record<string, any>>({
    understand: '',
    decompose: [
      '배열 전체를 순회해야 하나?',
      '현재까지 합이 음수가 되면 초기화해야 하나?',
      '시작 인덱스는 어디서부터?',
      '모두 음수면?'
    ],
    pattern: ["Kadane's Algorithm"],
    abstract: { input: '정수 배열 nums (길이 최대 10^5)', output: '최대 연속 합 (정수)', flow: '누적합과 최대값 갱신' },
    pseudocode: '',
    submit: ''
  })
  const [feedback, setFeedback] = useState<string>('')

  useEffect(() => {
    fetch('/api/problems?id=' + params.id).then(r=>r.json()).then(setProblem)
  }, [params.id])

  const currentKey = steps[active].key

  async function askFeedback() {
    if (!problem) return
    const res = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: currentKey, userInput: userInputs[currentKey], problem })
    })
    const data = await res.json()
    setFeedback(data.message)
  }

  function next() { setActive(p => Math.min(p + 1, steps.length - 1)) }
  function prev() { setActive(p => Math.max(p - 1, 0)) }

  return (
    <div className="grid gap-6">
      <h1 className="h1">{problem?.title ?? '문제 불러오는 중…'}</h1>
      <p className="sub">{problem?.description}</p>

      <Stepper steps={steps} active={active} onChange={setActive} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card grid gap-4">
          {currentKey === 'understand' && (
            <div>
              <div className="font-semibold mb-2">한 문장 요약</div>
              <textarea
                className="w-full border rounded-2xl p-3"
                rows={4}
                value={userInputs.understand}
                onChange={e=>setUserInputs(v=>({ ...v, understand: e.target.value }))}
                placeholder="배열에서 연속된 부분의 최대합을 구하는 문제"
              />
            </div>
          )}

          {currentKey === 'decompose' && (
            <QuestionList value={userInputs.decompose} onChange={v=>setUserInputs(u=>({ ...u, decompose: v }))} />
          )}

          {currentKey === 'pattern' && (
            <Checklist
              options={["Kadane's Algorithm", 'DP with memoization', '완전 탐색']}
              value={userInputs.pattern}
              onChange={v=>setUserInputs(u=>({ ...u, pattern: v }))}
            />
          )}

          {currentKey === 'abstract' && (
            <ProblemIO value={userInputs.abstract} onChange={v=>setUserInputs(u=>({ ...u, abstract: v }))} />
          )}

          {currentKey === 'pseudocode' && (
            <div>
              <div className="font-semibold mb-2">의사코드/풀이 흐름</div>
              <textarea
                className="w-full border rounded-2xl p-3"
                rows={8}
                value={userInputs.pseudocode}
                onChange={e=>setUserInputs(v=>({ ...v, pseudocode: e.target.value }))}
                placeholder={`1) curr에 누적
2) curr = max(a[i], curr + a[i])
3) max_sum 갱신
4) 반환`}
              />
            </div>
          )}

          {currentKey === 'submit' && (
            <div>
              <div className="font-semibold mb-2">최종 답안 제출</div>
              <textarea
                className="w-full border rounded-2xl p-3"
                rows={10}
                value={userInputs.submit}
                onChange={e=>setUserInputs(v=>({ ...v, submit: e.target.value }))}
                placeholder={`최종 풀이 요약 + (선택) 코드 조각`}
              />
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost" onClick={prev}>이전</button>
            <button className="btn-primary" onClick={next}>다음</button>
            <button className="btn-ghost" onClick={askFeedback}>AI 피드백</button>
          </div>
        </div>
        <FeedbackPanel feedback={feedback} />
      </div>
    </div>
  )
}
