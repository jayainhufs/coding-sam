// hooks/useAiTutor.ts
'use client'

import { useState, useCallback } from 'react'

export type AiMode = 'hint' | 'code-suggest' | undefined
export type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

export function useAiTutor() {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText]       = useState('')
  const [mode, setMode]           = useState<AiMode>(undefined)
  const [aiRequestCount, setCnt]  = useState(0)
  const [hintCount, setHintCnt]   = useState(0)

  const ask = useCallback(async (payload: {
    step: StepKey,
    problem: { id: string; title: string; description?: string },
    prompt: string,
    nextMode?: AiMode
  }) => {
    const { step, problem, prompt, nextMode } = payload
    setMode(nextMode)
    setAiLoading(true)
    setAiText('')
    try {
      setCnt((c) => c + 1)
      if (nextMode === 'hint') setHintCnt((c) => c + 1)

      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput: 'placeholder',
          problem,
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
  }, [])

  return { aiLoading, aiText, mode, setMode, ask, aiRequestCount, hintCount }
}
