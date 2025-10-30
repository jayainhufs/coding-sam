// components/SolvedPanel.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { computeLearningRate, getAllProgress, getSolvedList } from '@/utils/progress'

type Item = { id: string; rate: number; attempts: number; solvedAt: string }

export default function SolvedPanel() {
  // ✨ SSR에서는 비어 있게 시작 → CSR에서만 채움
  const [items, setItems] = useState<Item[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const progress = getAllProgress()
    const solved = getSolvedList()

    const list: Item[] = solved
      .map((rawId) => {
        // 따옴표로 감싼 값 정리 (예: "\"max-subarray\"" → "max-subarray")
        const id = rawId.startsWith('"') && rawId.endsWith('"')
          ? rawId.slice(1, -1)
          : rawId

        const p = progress[id]
        const rate = p ? computeLearningRate(p.scores) : 0
        return { id, rate, attempts: p?.attempts ?? 0, solvedAt: p?.solvedAt || '' }
      })
      .sort((a, b) => (b.solvedAt || '').localeCompare(a.solvedAt || ''))

    setItems(list)
  }, [])

  // ✨ 서버와 동일한 초기 HTML을 내기 위해, 마운트 전에는 뼈대 UI(또는 아무 것도)만 노출
  if (!mounted) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold"><span>내가 푼 문제</span></h3>
          <span className="text-xs text-gray-600">0개</span>
        </div>
        <p className="text-sm text-gray-600">로드 중…</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">
          <Link href="/me" className="hover:underline">내가 푼 문제</Link>
        </h3>
        <span className="text-xs text-gray-600">{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-600">아직 푼 문제가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-200/70">
          {items.slice(0, 6).map((it) => (
            <li key={it.id} className="py-2 flex items-center justify-between">
              <Link href={`/learn/${it.id}`} className="text-sm font-medium hover:underline">
                {it.id}
              </Link>
              <div className="text-xs text-gray-600">
                학습률 {it.rate}% · 시도 {it.attempts}회
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 6 && (
        <div className="mt-3 text-right">
          <Link href="/me" className="text-sm text-[#002D56] hover:underline">전체보기</Link>
        </div>
      )}
    </div>
  )
}
