// /components/SolvedPanel.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { computeLearningRate, getAllProgress, getSolvedList } from '@/utils/progress'

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
    </svg>
  )
}

type Item = { id: string; rate: number; attempts: number; solvedAt: string }

export default function SolvedPanel() {
  const [items, setItems] = useState<Item[] | null>(null)

  const load = () => {
    const all = getAllProgress()
    const solved = getSolvedList()
    const list: Item[] = solved
      .map((id) => {
        const p = all[id]
        const rate = p ? computeLearningRate(p.scores) : 0
        return { id, rate, attempts: p?.attempts ?? 0, solvedAt: p?.solvedAt || '' }
      })
      .sort((a, b) => b.solvedAt.localeCompare(a.solvedAt))
    setItems(list)
  }

  useEffect(() => {
    load()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'coding-sam:progress' || e.key === 'coding-sam:solved') load()
    }
    const onProgressUpdated = () => load()
    window.addEventListener('storage', onStorage)
    window.addEventListener('progress-updated', onProgressUpdated as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('progress-updated', onProgressUpdated as EventListener)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      {/* 헤더: 항상 보이는 ‘전체보기’ 버튼 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">내가 푼 문제</h3>
          <span className="text-xs text-gray-600">{items?.length ?? 0}개</span>
        </div>
        <Link
          href="/me"
          className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-300 text-[#002D56] hover:bg-[#002D56]/5 focus:outline-none focus:ring-2 focus:ring-[#002D56]"
        >
          전체보기
        </Link>
      </div>

      {/* 리스트(내부 스크롤) - 스켈레톤 포함 */}
      <ul role="list" className="divide-y divide-gray-200/70 max-h-48 overflow-y-auto pr-1">
        {items === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="py-2 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3 w-full">
                <div className="h-4 w-4 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="mt-2 h-1.5 w-full bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-4 bg-gray-200 rounded" />
              </div>
            </li>
          ))
        ) : items.length === 0 ? (
          <li className="py-2"><EmptyState /></li>
        ) : (
          items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/learn/${it.id}`}
                className="group flex items-center gap-3 py-2 outline-none"
                aria-label={`${it.id}로 이동`}
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600/90 group-hover:text-emerald-700" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900 group-hover:underline">{it.id}</span>
                    <span className="rounded-full bg-[#002D56]/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      학습률 {it.rate}%
                    </span>
                    {it.attempts > 1 && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                        시도 {it.attempts}회
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#146E7A] transition-[width] duration-300" style={{ width: `${it.rate}%` }} aria-hidden />
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:text-[#002D56] transition-colors" aria-hidden />
              </Link>
            </li>
          ))
        )}
      </ul>

      {/* (선택) 아래 전체보기는 제거해도 됨. 헤더 버튼이 항상 있으니 UX 명확 */}
      {/* <div className="mt-3 text-right">
        <Link href="/me" className="text-sm text-[#002D56] hover:underline">전체보기</Link>
      </div> */}

      <div className="mt-3 text-[11px] text-slate-500">
        항목 전체가 클릭됩니다. Enter 또는 Space로도 이동할 수 있어요.
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center">
      <div className="text-sm font-medium text-slate-700">아직 푼 문제가 없습니다.</div>
      <div className="mt-1 text-xs text-slate-500">첫 문제를 풀면 이곳에 표시돼요.</div>
      <div className="mt-3">
        <Link
          href="/problems"
          className="inline-flex items-center rounded-lg bg-[#002D56] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002D56]/90 focus:outline-none focus:ring-2 focus:ring-[#002D56]"
        >
          문제 보러가기
        </Link>
      </div>
    </div>
  )
}
