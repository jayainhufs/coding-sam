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
  onValidationChange, // ✅ 4. (추가) 부모에게 상태를 전달할 콜백
}: {
  language: LanguageKey
  setLanguage: (l: LanguageKey) => void
  codeByLang: Record<LanguageKey, string>
  setCodeByLang: (next: Record<LanguageKey, string>) => void
  samples?: { input: string; output: string }[]
  onValidationChange: (isValid: boolean) => void // ✅ 4. (추가) 타입
}) {
  // 'runAllSamples' 훅에서 가져오기
  const { stdout, setStdout, run, runAllSamples, running } = useRunner(language)

  // ✅ 5. (추가) stdout(결과창)이 변경될 때마다 부모(LearnWizard)에게 통과 여부 전달
  useEffect(() => {
    if (stdout.startsWith('✅ 모든 샘플 통과!')) {
      onValidationChange(true)
    } else {
      onValidationChange(false)
    }
  }, [stdout, onValidationChange])

  function updateCode(next: string) {
    setCodeByLang({ ...codeByLang, [language]: next })
    const key = `code:${language}`
    localStorage.setItem(key, next)
  }

  // 단일 샘플 실행
  const runSampleByIndex = (index: number) => {
    const s = samples?.[index]
    if (!s) return
    run(codeByLang[language] ?? '', s.input, s.output)
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLanguage(l)
              setStdout('') // 언어 변경 시 결과창 비우기
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

      {/* 결과창(stdout)에 정답/오답/오류에 따른 스타일링 */}
      <pre
        className={`w-full h-auto max-h-48 overflow-auto rounded-xl border p-3 mt-4 text-sm whitespace-pre-wrap break-words ${
          stdout.startsWith('✅ 모든 샘플 통과!')
            ? 'border-green-300 bg-green-50 text-green-800'
            : stdout.startsWith('✅')
            ? 'border-green-300 bg-green-50 text-green-800'
            : stdout.startsWith('❌')
            ? 'border-red-300 bg-red-50 text-red-800'
            : 'border-slate-200 bg-slate-50 text-slate-700' // 기본 또는 '실행 중'
        }`}
      >
        {stdout || '실행 결과가 여기에 표시됩니다.'}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* "전체 샘플 실행" 버튼 */}
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

        {/* "단일 샘플 실행" 버튼들 */}
        {(samples ?? []).map((_, i) => (
          <button
            key={i}
            onClick={() => runSampleByIndex(i)} // 인덱스(0, 1, 2...)
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