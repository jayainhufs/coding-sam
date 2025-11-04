// utils/progress.ts (사용자별 로컬스토리지 네임스페이스 버전)
import { USER_KEY, normalizeUser } from '@/lib/AuthContext'

type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

export type StepScores = Partial<Record<StepKey, number>> // 0~100
export type ProblemProgress = {
  scores: StepScores       // 최종 점수
  attempts: number         // 제출 횟수
  solvedAt?: string        // ISO date
}
export type ProgressRecord = ProblemProgress

// ----- 사용자별 키 생성 -----
function currentUserName(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const u = localStorage.getItem(USER_KEY)
    return u ? u : null
  } catch {
    return null
  }
}
function userKey(suffix: string): string {
  const u = currentUserName()
  const who = u ? normalizeUser(u) : 'anon'
  return `coding-sam:${suffix}:${who}`
}

// 기존 전역 키와 호환을 위해 상수 대신 함수 사용
const K = {
  XP: () => userKey('xp'),
  PROGRESS: () => userKey('progress'),
  SOLVED: () => userKey('solved'),
}

// 같은 탭에서도 즉시 반영되도록 커스텀 이벤트
const XP_EVENT = 'coding-sam:xp:changed'

// 공통 JSON 읽기
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// ── XP ───────────────────────────────────────────────────────────
export function getXP(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(K.XP()) || '0', 10) || 0
}
export function setXP(xp: number) {
  if (typeof window === 'undefined') return
  const next = Math.max(0, Math.floor(xp))
  localStorage.setItem(K.XP(), String(next))
  // 즉시 갱신 이벤트 발행
  window.dispatchEvent(new CustomEvent<number>(XP_EVENT, { detail: next }))
}
export function addXP(delta: number) {
  const next = getXP() + Math.max(0, Math.floor(delta))
  setXP(next)
  if (typeof window !== 'undefined') {
    try { window.dispatchEvent(new Event('xp-updated')) } catch {}
  }
}
export function onXPChanged(handler: (xp: number) => void) {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => {
    const xp = (e as CustomEvent<number>).detail
    handler(typeof xp === 'number' ? xp : getXP())
  }
  window.addEventListener(XP_EVENT, listener as EventListener)
  return () => window.removeEventListener(XP_EVENT, listener as EventListener)
}

// ── 진행도 ────────────────────────────────────────────────────────
export function getAllProgress(): Record<string, ProblemProgress> {
  return readJSON<Record<string, ProblemProgress>>(K.PROGRESS(), {})
}
export function getProgress(problemId: string): ProblemProgress | undefined {
  return getAllProgress()[problemId]
}
export function setProgress(problemId: string, patch: Partial<ProblemProgress>) {
  const all = getAllProgress()
  const cur = all[problemId] ?? { scores: {}, attempts: 0 }
  all[problemId] = { ...cur, ...patch, scores: { ...cur.scores, ...(patch.scores ?? {}) } }
  if (typeof window !== 'undefined') {
    localStorage.setItem(K.PROGRESS(), JSON.stringify(all))
  }
}
export function markSolved(problemId: string) {
  const solved = new Set(readJSON<string[]>(K.SOLVED(), []))
  solved.add(problemId)
  if (typeof window !== 'undefined') {
    localStorage.setItem(K.SOLVED(), JSON.stringify([...solved]))
  }
  setProgress(problemId, { solvedAt: new Date().toISOString() })
}
export function getSolvedList(): string[] {
  return readJSON<string[]>(K.SOLVED(), [])
}

// === 학습률(평균 점수) 계산 ===
export function computeLearningRate(scores: StepScores | undefined): number {
  if (!scores) return 0
  const vals = Object.values(scores).filter((v): v is number => typeof v === 'number')
  if (vals.length === 0) return 0
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  return Math.max(0, Math.min(100, avg))
}
