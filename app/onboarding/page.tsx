'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Onboarding() {
  const r = useRouter()
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('algorithm')

  function next() {
    const pref = { level, goal }
    localStorage.setItem('coding-sam:pref', JSON.stringify(pref))
    r.push('/home')
  }

  return (
    <div className="grid gap-6">
      <h1 className="h1">간단 설문</h1>
      <div className="card grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">실력 수준</span>
          <select className="border rounded-2xl p-2" value={level} onChange={e=>setLevel(e.target.value)}>
            <option value="beginner">입문</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">목표</span>
          <select className="border rounded-2xl p-2" value={goal} onChange={e=>setGoal(e.target.value)}>
            <option value="algorithm">알고리즘 사고</option>
            <option value="style">코드 스타일/리팩토링</option>
            <option value="system">시스템/CS 개념</option>
          </select>
        </label>
        <button className="btn-primary w-fit" onClick={next}>시작하기</button>
      </div>
    </div>
  )
}