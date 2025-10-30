// /components/XPBadge.tsx
'use client'

import { useEffect, useState } from 'react'
import { getXP, onXPChanged } from '@/utils/progress'

export default function XPBadge() {
  const [xp, setXp] = useState(0)

  useEffect(() => {
    setXp(getXP())
    const off = onXPChanged(setXp)
    return off
  }, [])

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-sm">
      <strong className="font-semibold">{xp}</strong> XP
    </span>
  )
}
