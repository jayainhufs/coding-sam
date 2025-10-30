// utils/user.ts
// 로그인 미구현 환경에서도 유저별 구분을 위해 게스트 ID를 브라우저별로 부여

let cachedId: string | null = null

export function ensureGuestId(): string {
  const k = 'coding-sam:userId'
  try {
    const cur = localStorage.getItem(k)
    if (cur) return cur
    const gid = `anon-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(k, gid)
    return gid
  } catch {
    return 'anon'
  }
}

export function getUserIdFromStorage(): string {
  try {
    return localStorage.getItem('coding-sam:userId') || ensureGuestId()
  } catch {
    return 'anon'
  }
}

export function getCurrentUserId(): string {
  if (cachedId) return cachedId
  try {
    // 선택: AuthProvider에서 window.__CODING_SAM_USER_ID 를 세팅할 수 있음
    // @ts-ignore
    const id = (typeof window !== 'undefined' && window.__CODING_SAM_USER_ID) as string | undefined
    cachedId = id || getUserIdFromStorage()
    return cachedId
  } catch {
    return getUserIdFromStorage()
  }
}

export function setCurrentUserId(id: string | null) {
  cachedId = id ?? null
  try {
    if (id) localStorage.setItem('coding-sam:userId', id)
  } catch {}
}
