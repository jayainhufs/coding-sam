// hooks/useRunner.ts
'use client'

import { useState, useCallback } from 'react'
import { LanguageKey } from '@/components/CodeEditor'

export function useRunner(language: LanguageKey) {
  const [stdin, setStdin]   = useState('')
  const [stdout, setStdout] = useState('')

  const run = useCallback(async (code: string, input?: string) => {
    setStdout('실행 중…')
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin: input ?? stdin,
        }),
      })
      const j = await res.json()
      if (!j.ok) setStdout(`실행 오류: ${j.error}`)
      else {
        const out = j.result?.run?.output ?? j.result?.stdout ?? JSON.stringify(j.result, null, 2)
        setStdout(out)
      }
    } catch (e: any) {
      setStdout(`네트워크 오류: ${e.message ?? e}`)
    }
  }, [language, stdin])

  return { stdin, setStdin, stdout, setStdout, run }
}
