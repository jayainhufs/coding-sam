// utils/progress.ts (사용자별 로컬스토리지 네임스페이스 버전)
import { USER_KEY, normalizeUser } from '@/lib/AuthContext'

type StepKey =
  | 'understand'
  | 'decompose'
  | 'pattern'
  | 'abstract'
  | 'pseudocode'

export type StepScores = Partial<Record<StepKey, number>> // 0~100
export type ProblemProgress = {
  scores: StepScores // 최종 점수
  attempts: number // 제출 횟수
  solvedAt?: string // ISO date
  status?: 'solved' | 'in-progress' // ✅ 2. (추가) 상태 타입
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
  // ✅ 2. (수정) AuthContext의 normalizeUser 사용
  const who = u ? normalizeUser(u) : 'anon'
  return `coding-sam:${suffix}:${who}`
}

// 기존 전역 키와 호환을 위해 상수 대신 함수 사용
const K = {
  XP: () => userKey('xp'),
  PROGRESS: () => userKey('progress'),
  SOLVED: () => userKey('solved'), // (레거시/호환용)
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
    try {
      window.dispatchEvent(new Event('xp-updated'))
    } catch {}
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
  all[problemId] = {
    ...cur,
    ...patch,
    scores: { ...cur.scores, ...(patch.scores ?? {}) },
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(K.PROGRESS(), JSON.stringify(all))
    // ✅ 3. (추가) "푼 문제 0개" 버그 수정:
    //    진행도가 변경될 때 'storage' 이벤트를 수동으로 발생시켜
    //    app/home/page.tsx가 즉시 리-렌더링되도록 함
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: K.PROGRESS(), // app/home/page.tsx가 리스닝할 키
        newValue: JSON.stringify(all),
      }),
    )
  }
}
export function markSolved(problemId: string) {
  // (레거시) K.SOLVED() 키에도 저장
  const solved = new Set(readJSON<string[]>(K.SOLVED(), []))
  solved.add(problemId)
  if (typeof window !== 'undefined') {
    localStorage.setItem(K.SOLVED(), JSON.stringify([...solved]))
  }
  // ✅ 4. (핵심 버그 수정) K.PROGRESS() 키에도 'status: "solved"'를 저장
  setProgress(problemId, {
    solvedAt: new Date().toISOString(),
    status: 'solved', // 👈 이 부분이 버그의 원인이었습니다.
  })
}
export function getSolvedList(): string[] {
  // ✅ 5. (수정) K.PROGRESS()를 기준으로 "solved" 목록을 가져오도록 변경
  // (K.SOLVED() 키는 레거시/중복이므로 PROGRESS를 신뢰)
  const all = getAllProgress()
  return Object.entries(all)
    .filter(([_, data]) => data.status === 'solved')
    .map(([problemId, _]) => problemId)
}

// === 학습률(평균 점수) 계산 ===
export function computeLearningRate(scores: StepScores | undefined): number {
  if (!scores) return 0
  const vals = Object.values(scores).filter(
    (v): v is number => typeof v === 'number',
  )
  if (vals.length === 0) return 0
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  return Math.max(0, Math.min(100, avg))
}

// ✅ 6. (추가) 점수를 등급으로 변환하는 함수
export function scoreToGrade(score: number): string {
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  return 'C'
}