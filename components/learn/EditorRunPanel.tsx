// components/learn/EditorRunPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import CodeEditor, { LanguageKey } from '@/components/CodeEditor'
import { useRunner } from '@/hooks/useRunner'
import { getSubmittedCodes, isRefactorEnabled, getSubmittedCodeCount } from '@/utils/codeStorage'

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
  const [refactoring, setRefactoring] = useState(false)
  const [refactorEnabled, setRefactorEnabled] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(0)

  useEffect(() => {
    const updateRefactorStatus = () => {
      const enabled = isRefactorEnabled()
      const count = getSubmittedCodeCount()
      setRefactorEnabled(enabled)
      setSubmittedCount(count)
    }
    
    updateRefactorStatus()
    
    // storage 이벤트 리스너 추가 (코드 저장 시 업데이트)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('submitted-codes')) {
        updateRefactorStatus()
      }
    }
    
    // 커스텀 이벤트도 리스닝 (같은 탭에서 코드 저장 시)
    const handleCustomStorage = () => {
      updateRefactorStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('code-submitted', handleCustomStorage)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('code-submitted', handleCustomStorage)
    }
  }, [])

  useEffect(() => {
    let passCount = 0
    if (stdout.includes('): 통과')) {
      const matches = stdout.match(/\): 통과/g)
      passCount = matches ? matches.length : 0
    }
    
    if (stdout.startsWith('모든 샘플 통과!')) {
      onValidationChange(true)
    } else {
      onValidationChange(false)
    }

    if (onPassCountChange) {
      onPassCountChange(passCount)
    }
  }, [stdout, onValidationChange, onPassCountChange])

  const handleRefactor = async () => {
    const currentCode = codeByLang[language] ?? ''
    if (!currentCode.trim()) {
      alert('리팩토링할 코드를 입력해주세요.')
      return
    }

    const submittedCodes = getSubmittedCodes()
    if (submittedCodes.length < 3) {
      alert('최소 3개의 코드를 제출해야 리팩토링 기능을 사용할 수 있습니다.')
      return
    }

    setRefactoring(true)
    try {
      const res = await fetch('/api/ai/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCode,
          language,
          submittedCodes,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || '리팩토링에 실패했습니다.')
      }

      // 리팩토링된 코드로 업데이트
      setCodeByLang({ ...codeByLang, [language]: data.refactoredCode })
      setStdout('코드가 나만의 스타일로 리팩토링되었습니다! ✨')
    } catch (e: any) {
      console.error('리팩토링 오류:', e)
      alert(`리팩토링 실패: ${e.message}`)
    } finally {
      setRefactoring(false)
    }
  }

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

  // 1. 첫 번째 샘플 가져오기
  const firstSample = samples && samples.length > 0 ? samples[0] : null

  return (
    <>
      {/* (추가) 에디터 상단에 첫 번째 샘플 데이터 표시 */}
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
      </div>

      <CodeEditor
        language={language}
        code={codeByLang[language] ?? ''}
        onChange={updateCode}
      />

      {/* ... (이하 실행 결과창 및 버튼들은 기존 코드와 동일) ... */}
      <pre
        className={`w-full h-auto max-h-48 overflow-auto rounded-xl border p-3 mt-4 text-sm whitespace-pre-wrap break-words ${
          stdout.startsWith('모든 샘플 통과!')
            ? 'border-green-300 bg-green-50 text-green-800'
            : stdout.includes('오답') || stdout.includes('실행 오류') || stdout.includes('런타임 에러') || stdout.includes('시간 초과') || stdout.includes('메모리 초과') || (stdout.includes('샘플 통과') && !stdout.startsWith('모든 샘플 통과!'))
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

        {/* 코드 리팩토링 버튼 */}
        <div className="relative ml-auto group">
          <button
            onClick={handleRefactor}
            disabled={!refactorEnabled || refactoring || (codeByLang[language] ?? '').trim().length === 0}
            className={`px-4 py-2 rounded-xl border text-sm transition-all ${
              refactorEnabled
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
            }`}
          >
            {refactoring ? '리팩토링 중...' : '✨ 코드 리팩토링'}
          </button>
          {!refactorEnabled && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
              {3 - submittedCount}개만 더 제출하면 나만의 코드 스타일로 코드 리팩토링할 수 있어요!
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}