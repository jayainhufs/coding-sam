// components/learn/AiTutorPanel.tsx
'use client'

import { useState } from 'react'
import type { StepKey, AiMode } from '@/hooks/useAiTutor'

type Props = {
  step: StepKey
  stepLabel: string
  problem: { id: string; title: string; description?: string }
  buildPrompt: (st: StepKey, mode: AiMode) => string
  hasInputForStep: (st: StepKey) => boolean
}

export default function AiTutorPanel({
  step,
  stepLabel,
  problem,
  buildPrompt,
  hasInputForStep,
}: Props) {
  const [mode, setMode] = useState<AiMode | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')

  const canRunRequest = hasInputForStep(step) // 요청/코드제안 전용
  const canRunHint = true                      // 힌트는 항상 OK

  async function run(nextMode: AiMode | undefined) {
    // 입력 제한: 힌트는 제외, 나머지는 입력 필요
    if (nextMode !== 'hint' && !canRunRequest) {
      setMode(nextMode)
      setText('현재 단계 입력이 비어 있어요. 간단히 메모를 적은 뒤 다시 시도해 주세요.')
      return
    }

    setMode(nextMode)
    setLoading(true)
    setText('')

    try {
      const prompt = buildPrompt(step, nextMode as AiMode)
      const res = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          mode: nextMode,                 // 'hint' | 'code-suggest' | undefined
          problem,                        // { id, title, description }
          promptOverride: prompt,         // 서버는 이 프롬프트를 그대로 사용
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'AI 서버 오류')
      setText(j.text || '(임시 응답)\n' + prompt)
    } catch (e: any) {
      setText(`AI 서버 오류: ${e.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base md:text-lg font-extrabold">AI 튜터 — {stepLabel}</h3>

        <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-300" role="tablist">
          <button
            role="tab"
            aria-selected={mode === undefined}
            onClick={() => run(undefined)}           // 요청
            disabled={!canRunRequest}
            className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
              mode === undefined ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'
            } ${!canRunRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canRunRequest ? '현재 단계 입력이 필요합니다' : '요청'}
          >
            요청
          </button>

          <button
            role="tab"
            aria-selected={mode === 'hint'}
            onClick={() => run('hint')}              // 힌트 (항상 가능)
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
            onClick={() => run('code-suggest')}     // 코드 제안
            disabled={!canRunRequest}
            className={`px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
              mode === 'code-suggest' ? 'bg-[#0f2a4a] text-white' : 'bg-white hover:bg-gray-50 text-slate-700'
            } ${!canRunRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canRunRequest ? '현재 단계 입력이 필요합니다' : '짧은 코드/의사코드 제안'}
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
        {loading ? '생성 중…' : text || '오른쪽 상단 버튼으로 피드백을 요청해보세요.'}
      </div>
    </section>
  )
}
