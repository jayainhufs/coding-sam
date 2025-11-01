// components/learn/EditorRunPanel.tsx
'use client'

import CodeEditor, { LanguageKey } from '@/components/CodeEditor'
import { useRunner } from '@/hooks/useRunner'

export default function EditorRunPanel({
  language, setLanguage,
  codeByLang, setCodeByLang,
  samples,
}: {
  language: LanguageKey
  setLanguage: (l: LanguageKey) => void
  codeByLang: Record<LanguageKey, string>
  setCodeByLang: (next: Record<LanguageKey, string>) => void
  samples?: { input: string; output: string }[]
}) {
  const { stdin, setStdin, stdout, run } = useRunner(language)

  function updateCode(next: string) {
    setCodeByLang({ ...codeByLang, [language]: next })
    const key = `code:${language}`
    localStorage.setItem(key, next)
  }

  const runSample = (i: number) => {
    const s = samples?.[i]
    if (!s) return
    run(codeByLang[language] ?? '', s.input)
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        {(['python', 'c', 'java'] as LanguageKey[]).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              l === language ? 'bg-[#296B75] text-white border-[#296B75]' : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto text-xs md:text-sm text-slate-500">VSCode 스타일 하이라이트</div>
      </div>

      <CodeEditor language={language} code={codeByLang[language] ?? ''} onChange={updateCode} />

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <textarea
          className="w-full h-32 rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
          placeholder={`표준입력 예\n필요 시 "실행" 전에 붙여넣기`}
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
        />
        <pre className="w-full h-32 rounded-xl border border-slate-200 p-3 bg-slate-50 overflow-auto whitespace-pre-wrap break-words">
{stdout || '실행 결과가 여기에 표시됩니다.'}
        </pre>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => run(codeByLang[language] ?? '')}
          className="px-4 py-2 rounded-xl bg-[#002D56] text-white hover:bg-[#002D56]/90 disabled:opacity-50"
          disabled={(codeByLang[language] ?? '').trim().length === 0}
          title="Ctrl/⌘ + Enter"
        >
          실행
        </button>

        {(samples ?? []).map((_, i) => (
          <button
            key={i}
            onClick={() => runSample(i)}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-gray-50"
          >
            샘플 {i + 1} 실행
          </button>
        ))}

        <span className="text-xs text-slate-500 ml-1">
          단축키: <kbd className="px-1 py-0.5 border rounded">Ctrl/⌘</kbd> + <kbd className="px-1 py-0.5 border rounded">Enter</kbd>
        </span>
      </div>
    </>
  )
}
