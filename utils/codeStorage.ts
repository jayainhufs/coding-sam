// utils/codeStorage.ts
import { USER_KEY, normalizeUser } from '@/lib/AuthContext'

// 사용자별 제출한 코드 저장 키
function getUserCodeKey(): string {
  try {
    if (typeof window === 'undefined') return ''
    const u = localStorage.getItem(USER_KEY)
    const who = u ? normalizeUser(u) : 'anon'
    return `coding-sam:submitted-codes:${who}`
  } catch {
    return ''
  }
}

export type SubmittedCode = {
  problemId: string
  language: string
  code: string
  submittedAt: string // ISO date
}

/**
 * 제출한 코드 목록 가져오기
 */
export function getSubmittedCodes(): SubmittedCode[] {
  const key = getUserCodeKey()
  if (!key) return []
  
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * 코드 제출 저장
 */
export function saveSubmittedCode(problemId: string, language: string, code: string) {
  const key = getUserCodeKey()
  if (!key) return
  
  try {
    const existing = getSubmittedCodes()
    // 중복 제거: 같은 문제의 같은 언어 코드는 최신 것으로 교체
    const filtered = existing.filter(
      (c) => !(c.problemId === problemId && c.language === language)
    )
    
    const newCode: SubmittedCode = {
      problemId,
      language,
      code,
      submittedAt: new Date().toISOString(),
    }
    
    const updated = [...filtered, newCode]
    localStorage.setItem(key, JSON.stringify(updated))
    
    // 커스텀 이벤트 발생 (같은 탭에서 즉시 반영)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('code-submitted'))
    }
  } catch (e) {
    console.error('코드 저장 실패:', e)
  }
}

/**
 * 제출한 코드 개수 가져오기
 */
export function getSubmittedCodeCount(): number {
  return getSubmittedCodes().length
}

/**
 * 리팩토링 기능 활성화 여부 확인 (3개 이상)
 */
export function isRefactorEnabled(): boolean {
  return getSubmittedCodeCount() >= 3
}

