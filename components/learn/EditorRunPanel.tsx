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
  onPassCountChange,
}: {
  language: LanguageKey
  setLanguage: (l: LanguageKey) => void
  codeByLang: Record<LanguageKey, string>
  setCodeByLang: (next: Record<LanguageKey, string>) => void
  samples?: { input: string; output: string }[]
  onValidationChange: (isValid: boolean) => void
  onPassCountChange?: (count: number) => void
}) {
  const { stdout, setStdout, run, runAllSamples, running } = useRunner(language)

  useEffect(() => {
    let passCount = 0
    if (stdout.includes('✅ 통과')) {
      const matches = stdout.match(/✅ 통과/g)
      passCount = matches ? matches.length : 0
    }
    
    if (stdout.startsWith('✅ 모든 샘플 통과!')) {
      onValidationChange(true)
    } else {
      onValidationChange(false)
    }

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

  // ✅ 1. 첫 번째 샘플 가져오기
  const firstSample = samples && samples.length > 0 ? samples[0] : null

  return (
    <>
      {/* ✅ 2. (추가) 에디터 상단에 첫 번째 샘플 데이터 표시 */}
      {firstSample && (
        <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-slate-700">👀 입출력 예시 (샘플 1)</span>
            <span className="text-xs text-slate-400">코드를 작성할 때 참고하세요.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 입력 표시 */}
            <div>
              <span className="text-xs text-slate-500 block mb-1 font-semibold">Input</span>
              <pre className="bg-white border border-slate-200 rounded-lg p-3 text-slate-800 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-32 overflow-auto shadow-sm">
                {firstSample.input}
              </pre>
            </div>
            {/* 출력 표시 */}
            <div>
              <span className="text-xs text-slate-500 block mb-1 font-semibold">Output</span>
              <pre className="bg-white border border-slate-200 rounded-lg p-3 text-slate-800 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-32 overflow-auto shadow-sm">
                {firstSample.output}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- 기존 언어 선택 버튼 --- */}
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

      {/* ... (이하 실행 결과창 및 버튼들은 기존 코드와 동일) ... */}
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