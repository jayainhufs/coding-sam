'use client'
import { useEffect, useState } from 'react'
import { getXP, xpEventName } from '@/utils/progress'
import { getCurrentUserId } from '@/utils/user'

export default function XPIndicator() {
  const [xp, setXp] = useState(0)
  const [uid] = useState(() => getCurrentUserId())

  useEffect(() => {
    setXp(getXP(uid))
    const ev = xpEventName(uid)
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail
      setXp(typeof detail === 'number' ? detail : getXP(uid))
    }
    window.addEventListener(ev, onChange)
    return () => window.removeEventListener(ev, onChange)
  }, [uid])

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
      XP {xp}
    </span>
  )
}
