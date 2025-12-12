// components/CodeViewer.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { LanguageKey } from './CodeEditor'

// SSR에서 monaco가 안 돌아가므로 동적 import
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const langMap: Record<LanguageKey, string> = {
  python: 'python',
  c: 'c',
  java: 'java',
}

export default function CodeViewer({
  language,
  code,
}: {
  language: LanguageKey
  code: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 코드 줄 수 계산
  const lineCount = code.split('\n').length

  if (!isExpanded) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            코드 {lineCount}줄
          </span>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-[#002D56] hover:text-[#002D56]/80 px-4 py-2 rounded-lg border border-slate-300 hover:bg-white transition-colors font-medium"
          >
            코드 보기 ▼
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <Monaco
        height="400px"
        language={langMap[language]}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
        }}
      />
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {lineCount}줄
        </span>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-slate-300 hover:text-white px-3 py-1 rounded hover:bg-slate-700 transition-colors"
        >
          코드 숨기기 ▲
        </button>
      </div>
    </div>
  )
}

