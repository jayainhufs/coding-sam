'use client'
import { useEffect, useState } from 'react'

type ProblemSummary = { id: string; title: string; difficulty: 'Easy'|'Medium'|'Hard' }

export default function HomePage() {
  const [rec, setRec] = useState<ProblemSummary | null>(null)

  useEffect(() => {
    fetch('/api/problems?recommended=1').then(r=>r.json()).then(setRec)
  }, [])

  return (
    <div className="grid gap-6">
      <h1 className="h1">환영합니다 👋 오늘의 추천</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <a className="card hover:shadow-md" href={rec ? `/learn/${rec.id}` : '/problems'}>
          <div className="text-sm text-gray-500 mb-1">오늘의 추천 문제</div>
          <div className="font-semibold">{rec ? rec.title : '불러오는 중…'}</div>
          <div className="text-xs mt-1">난이도: {rec?.difficulty ?? '-'}</div>
        </a>
        <a className="card hover:shadow-md" href="/problems">
          <div className="text-sm text-gray-500 mb-1">지금 풀기</div>
          <div className="font-semibold">문제 선택창으로 이동</div>
        </a>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">내 진행 상황</div>
        <p className="text-sm text-gray-600">예: 문제 3개 완료, 알고리즘적 사고 보완 필요 (샘플)</p>
      </div>
    </div>
  )
}