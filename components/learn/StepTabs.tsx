// components/learn/StepTabs.tsx
'use client'

export default function StepTabs<T extends string>({
  order,
  label,
  current,
  onChange,
  clickable = true, // ← 추가: 기본은 클릭 가능
}: {
  order: T[]
  label: Record<T, string>
  current: T
  onChange?: (index: number) => void    // ← 클릭 비활성시 없어도 되도록 optional
  clickable?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {order.map((k, i) => {
        const isActive = order[i] === current
        const base =
          'px-3 py-1.5 rounded-full border text-sm select-none transition-colors'
        const activeCls = 'bg-[#002D56] text-white border-[#002D56]'
        const normalCls =
          'bg-white text-slate-700 border-slate-300 hover:bg-gray-50'
        const disableCls = !clickable
          ? 'pointer-events-none cursor-default opacity-95'
          : ''

        return (
          <button
            key={k}
            type="button"
            aria-disabled={!clickable}
            tabIndex={clickable ? 0 : -1}
            onClick={() => {
              if (!clickable || !onChange) return
              onChange(i)
            }}
            className={`${base} ${isActive ? activeCls : normalCls} ${disableCls}`}
          >
            {label[k]}
          </button>
        )
      })}
    </div>
  )
}
