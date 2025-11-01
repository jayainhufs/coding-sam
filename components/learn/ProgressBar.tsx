// components/learn/ProgressBar.tsx
'use client'

export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-5">
      <div className="h-full bg-[#002D56]" style={{ width: `${value}%` }} />
    </div>
  )
}
