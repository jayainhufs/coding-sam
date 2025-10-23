'use client'
import { useRouter } from 'next/navigation'

const langs = ['Python', 'Java', 'C', 'C++', 'JavaScript']

export default function LanguagePicker() {
  const r = useRouter()
  function choose(l: string) {
    localStorage.setItem('coding-sam:lang', l)
    r.push('/onboarding')
  }
  return (
    <div className="flex flex-wrap gap-2">
      {langs.map(l => (
        <button key={l} className="btn-ghost" onClick={() => choose(l)}>{l}</button>
      ))}
    </div>
  )
}