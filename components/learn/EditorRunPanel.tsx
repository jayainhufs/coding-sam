// components/learn/EditorRunPanel.tsx
'use client'

import { useEffect } from 'react'
import CodeEditor, { LanguageKey } from '@/components/CodeEditor'
import { useRunner } from '@/hooks/useRunner'

export default function EditorRunPanel({
  language,
  setLanguage,
  codeByLang,
  setCodeByLang,
  samples,
  onValidationChange,
  onPassCountChange, // ✅ 1. (추가) 통과 개수 전달 콜백
}: {
  language: LanguageKey
  setLanguage: (l: LanguageKey) => void
  codeByLang: Record<LanguageKey, string>
  setCodeByLang: (next: Record<LanguageKey, string>) => void
  samples?: { input: string; output: string }[]
  onValidationChange: (isValid: boolean) => void
  onPassCountChange?: (count: number) => void // ✅ 1. (추가) 타입 정의
}) {
  const { stdout, setStdout, run, runAllSamples, running } = useRunner(language)

  useEffect(() => {
    // ✅ 2. (수정) stdout 분석하여 통과 개수 계산
    // stdout 형식: "✅ 모든 샘플 통과! (3/3)" 또는 "❌ 1/3개 샘플 통과"
    let passCount = 0
    if (stdout.includes('✅ 통과')) {
      // "✅ 통과" 문구의 개수를 세거나, 요약 줄을 파싱
      const matches = stdout.match(/✅ 통과/g)
      passCount = matches ? matches.length : 0
    }
    
    // (더 정확한 방법: useRunner가 passCount를 반환하게 하는 것이 좋지만,
    //  여기서는 stdout 파싱으로 간단히 구현)
    
    if (stdout.startsWith('✅ 모든 샘플 통과!')) {
      onValidationChange(true)
    } else {
      onValidationChange(false)
    }

    // ✅ 3. (추가) 부모에게 통과 개수 전달
    if (onPassCountChange) {
      onPassCountChange(passCount)
    }
  }, [stdout, onValidationChange, onPassCountChange])

  function updateCode(next: string) {
    setCodeByLang({ ...codeByLang, [language]: next })
    const key = `code:${language}`
    localStorage.setItem(key, next)
  }

  const runSampleByIndex = (index: number) => {
    const s = samples?.[index]
    if (!s) return
    run(codeByLang[language] ?? '', s.input, s.output)
  }

  return (
    <>
      {/* ... (UI 코드는 기존과 동일) ... */}
      <div className="flex items-center gap-2 mb-2">
        {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLanguage(l)
              setStdout('')
            }}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              l === language
                ? 'bg-[#296B75] text-white border-[#296B75]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto text-xs md:text-sm text-slate-500">
          VSCode 스타일 하이라이트
        </div>
      </div>

      <CodeEditor
        language={language}
        code={codeByLang[language] ?? ''}
        onChange={updateCode}
      />

      <pre
        className={`w-full h-auto max-h-48 overflow-auto rounded-xl border p-3 mt-4 text-sm whitespace-pre-wrap break-words ${
          stdout.startsWith('✅ 모든 샘플 통과!')
            ? 'border-green-300 bg-green-50 text-green-800'
            : stdout.startsWith('✅')
            ? 'border-green-300 bg-green-50 text-green-800'
            : stdout.startsWith('❌')
            ? 'border-red-300 bg-red-50 text-red-800'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        {stdout || '실행 결과가 여기에 표시됩니다.'}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() =>
            runAllSamples(codeByLang[language] ?? '', samples ?? [])
          }
          className="px-4 py-2 rounded-xl bg-[#002D56] text-white hover:bg-[#002D56]/90 disabled:opacity-50"
          disabled={running || (codeByLang[language] ?? '').trim().length === 0}
          title="모든 샘플 케이스를 실행하여 채점합니다 (Ctrl/⌘ + Enter)"
        >
          {running ? '실행 중...' : '전체 샘플 실행'}
        </button>

        {(samples ?? []).map((_, i) => (
          <button
            key={i}
            onClick={() => runSampleByIndex(i)}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-gray-50 disabled:opacity-50"
            disabled={running}
            title={`샘플 ${i + 1}번 케이스만 실행합니다.`}
          >
            샘플 {i + 1} 실행
          </button>
        ))}
      </div>
    </>
  )
}