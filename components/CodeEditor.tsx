// ~/Desktop/coding-sam/components/CodeEditor.tsx
'use client'

import dynamic from 'next/dynamic'

// SSR에서 monaco가 안 돌아가므로 동적 import
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export type LanguageKey = 'python' | 'c' | 'java'

const langMap: Record<LanguageKey, string> = {
  python: 'python',
  c: 'c',
  java: 'java',
}

export default function CodeEditor({
  language,
  code,
  onChange,
}: {
  language: LanguageKey
  code: string
  onChange: (next: string) => void
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <Monaco
        height="360px"
        language={langMap[language]}
        value={code}
        onChange={(v) => onChange(v ?? '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}