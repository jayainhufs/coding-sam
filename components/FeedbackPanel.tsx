'use client'

import { useState } from 'react'

type Step = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'
type Mode = 'hint' | 'code-suggest' | undefined

const STEP_LABEL: Record<Step, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드',
}

export default function FeedbackPanel({ problem }: { problem: {id: string; title?: string; description?: string} }) {
  const [step, setStep] = useState<Step>('understand')
  const [mode, setMode] = useState<Mode>(undefined)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<string>('')

  const request = async () => {
    setLoading(true)
    setResp('')
    try {
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, userInput: input, problem, mode }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'AI 오류')
      setResp(j.text)
    } catch (e: any) {
      setResp(`AI 서버 오류: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 p-5 md:p-6 bg-white">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-xl font-semibold">AI 튜터 — {STEP_LABEL[step]}</h3>

        <div className="flex gap-2">
          <button
            onClick={() => setMode(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${!mode ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="일반 피드백"
          >
            요청
          </button>
          <button
            onClick={() => setMode('hint')}
            className={`px-3 py-1 rounded-full text-sm ${mode === 'hint' ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="힌트만"
          >
            힌트
          </button>
          <button
            onClick={() => setMode('code-suggest')}
            className={`px-3 py-1 rounded-full text-sm ${mode === 'code-suggest' ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="짧은 코드/의사코드 제안"
          >
            코드 제안
          </button>
        </div>
      </div>

      {/* 단계 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(STEP_LABEL) as Step[]).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-3 py-1 rounded-full border ${step === s ? 'bg-[#002D56] text-white border-[#002D56]' : 'bg-white text-slate-700 border-slate-300'}`}
          >
            {STEP_LABEL[s]}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <textarea
        className="mt-4 w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
        rows={5}
        placeholder="이 단계에서의 생각/요약/체크리스트/의사코드를 적어보세요."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="mt-3 flex gap-3">
        <button
          disabled={loading || !input.trim()}
          onClick={request}
          className="px-4 py-2 rounded-xl bg-[#296B75] text-white font-semibold disabled:opacity-50"
        >
          {loading ? '요청 중…' : 'AI 피드백 받기'}
        </button>
      </div>

      {/* 결과 */}
      {resp && (
        <div className="mt-4 whitespace-pre-wrap text-slate-800 leading-7">
          {resp}
        </div>
      )}
    </div>
  )
}