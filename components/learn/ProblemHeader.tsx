// components/learn/ProblemHeader.tsx
'use client'

import { useState } from 'react'

export default function ProblemHeader({
  title, description, stepText,
}: { title: string; description?: string; stepText: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
        <div className="text-xs md:text-sm text-slate-600">{stepText}</div>
      </div>
      {description && (
        <div className="mt-1 relative">
          <p id="problem-desc" className={['text-slate-700 text-sm md:text-base transition-all', open ? '' : 'line-clamp-2 pr-16'].join(' ')}>
            {description}
          </p>
          {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent md:from-white/90" />}
          <button
            type="button"
            className="absolute right-0 -bottom-1 text-xs font-semibold text-[#002D56] bg-white/80 px-2 py-0.5 rounded hover:underline"
            aria-controls="problem-desc"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '접기' : '자세히'}
          </button>
        </div>
      )}
    </div>
  )
}
