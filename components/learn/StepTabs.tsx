// components/learn/StepTabs.tsx
'use client'

export default function StepTabs<T extends string>({
  order, label, current, onChange,
}: {
  order: T[]
  label: Record<T, string>
  current: T
  onChange: (index: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {order.map((k, i) => (
        <button
          key={k}
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            order[i] === current ? 'bg-[#002D56] text-white border-[#002D56]' : 'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
          }`}
        >
          {label[k]}
        </button>
      ))}
    </div>
  )
}
