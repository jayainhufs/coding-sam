'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import UserRadar from '@/components/UserRadar'
import EvaluationPanel from '@/components/EvaluationPanel'
import { getAllProgress, computeLearningRate, scoreToGrade } from '@/utils/progress'
import { useAuth, USER_KEY, PREF_KEY } from '@/lib/AuthContext'
import { getSubmittedCodes, type SubmittedCode } from '@/utils/codeStorage'
import { getProblemById } from '@/lib/problemsRepo'
import CodeViewer from '@/components/CodeViewer'
import { LanguageKey } from '@/components/CodeEditor'

// --- 표시용 텍스트 매핑 (기존 유지) ---
const LEVEL_MAP: Record<string, string> = {
  beginner: '입문 (Beginner)',
  intermediate: '중급 (Intermediate)',
  advanced: '고급 (Advanced)',
}

const GOAL_MAP: Record<string, string> = {
  algorithm: '논리력 및 문제 해결',
  style: '가독성 및 코드 구조화',
  system: '시스템 효율 및 최적화',
}
// --- 끝 ---

export default function MyPage() {
  // --- 사용자 정보 State (styleSummary를 위해 수정) ---
  const [username, setUsername] = useState('사용자')
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('algorithm')
  // 'codeStyle' state를 객체로 받도록 수정 (기존 '미설정' -> null)
  const [codeStyle, setCodeStyle] = useState<any>(null) // 초기값 'null'
  const [recentCodes, setRecentCodes] = useState<Array<SubmittedCode & { problemTitle?: string }>>([])
  const [styleEvaluation, setStyleEvaluation] = useState<string | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  // --- 끝 ---

  // --- AuthContext에서 사용자 정보 가져오기 ---
  const { user: authUser } = useAuth()

  // --- localStorage에서 정보 로드 (기존 유지) ---
  useEffect(() => {
    const currentUserName = authUser || localStorage.getItem(USER_KEY)

    if (currentUserName) {
      setUsername(currentUserName)

      const prefKey = PREF_KEY(currentUserName)
      const savedPref = localStorage.getItem(prefKey)

      if (savedPref) {
        try {
          const pref = JSON.parse(savedPref)
          if (pref.level) setLevel(pref.level)
          if (pref.goal) setGoal(pref.goal)
          // 'codeStyle' 객체를 state에 설정 (기존 로직)
          if (pref.codeStyle) setCodeStyle(pref.codeStyle)
          // 코드 스타일 평가 로드 (이미 평가된 경우)
          if (pref.codeStyleEvaluation) {
            setStyleEvaluation(pref.codeStyleEvaluation)
          }
        } catch (e) {
          console.error('설정 로드 실패:', e)
        }
      }
      
      // 최근 제출 코드 로드
      const loadRecentCodes = async () => {
        try {
          const codes = getSubmittedCodes()
          // 최신순으로 정렬하고 최근 3개만 가져오기
          const sorted = codes.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          ).slice(0, 3)
          
          // 문제 정보 가져오기
          const codesWithProblems = await Promise.all(
            sorted.map(async (code) => {
              try {
                const problem = await getProblemById(code.problemId)
                return {
                  ...code,
                  problemTitle: problem?.title || code.problemId,
                }
              } catch {
                return {
                  ...code,
                  problemTitle: code.problemId,
                }
              }
            })
          )
          
          setRecentCodes(codesWithProblems)
        } catch (e) {
          console.error('최근 코드 로드 실패:', e)
        }
      }
      
      loadRecentCodes()
    }
  }, [authUser])
  
  // 코드 스타일 평가 함수
  const handleEvaluateStyle = async () => {
    if (!codeStyle || recentCodes.length === 0) return
    
    setEvaluating(true)
    try {
      const res = await fetch('/api/ai/evaluate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeStyle,
          submittedCodes: recentCodes,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '평가에 실패했습니다.')
      }
      
      const evaluation = data.evaluation
      setStyleEvaluation(evaluation)
      
      // LocalStorage에 평가 결과 저장
      const currentUserName = authUser || localStorage.getItem(USER_KEY)
      if (currentUserName) {
        const prefKey = PREF_KEY(currentUserName)
        const savedPref = localStorage.getItem(prefKey)
        if (savedPref) {
          try {
            const pref = JSON.parse(savedPref)
            pref.codeStyleEvaluation = evaluation
            localStorage.setItem(prefKey, JSON.stringify(pref))
          } catch (e) {
            console.error('평가 저장 실패:', e)
          }
        }
      }
    } catch (e: any) {
      console.error('스타일 평가 오류:', e)
      alert(`평가 실패: ${e.message}`)
    } finally {
      setEvaluating(false)
    }
  }
  // --- 끝 ---

  // getAllProgress, computeLearningRate 호출 복원
  const progress = getAllProgress() as Record<string, any>

  const solvedCount = Object.keys(progress).length
  const avgLearningRate = (() => {
    const rates = Object.values(progress).map((p: any) =>
      computeLearningRate(p?.scores ?? {}),
    )
    if (!rates.length) return 0
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  })()

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">내 학습 리포트</h1>
        <p className="text-sm text-slate-600 mt-1">
          내가 푼 문제를 바탕으로 단계별 레이더와 맞춤형 평가를 제공합니다.
        </p>
      </header>

      {/* --- 프로필 섹션 (수정) --- */}
      <section className="rounded-2xl border border-hufs-gray bg-white p-5 md:p-6 ring-1 ring-black/5 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          <div className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-hufs-gray/50 shadow-sm">
            <Image
              src="/Homepage_icon.jpg"
              alt="프로필 이미지"
              fill
              style={{ objectFit: 'cover' }}
              className="z-0"
            />
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-hufs-navy">
              {username}
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <InfoItem
                label="실력 수준"
                value={LEVEL_MAP[level] ?? '미설정'}
              />
              <InfoItem
                label="학습 목표"
                value={GOAL_MAP[goal] ?? '미설정'}
              />
              {/* 10. 코드 스타일 정보 (styleSummary 표시 로직) */}
              <InfoItem
                label="코드 스타일"
                value={
                  typeof codeStyle === 'object' &&
                  codeStyle !== null &&
                  codeStyle.styleSummary
                    ? codeStyle.styleSummary
                    : '미설정'
                }
              />
            </div>
          </div>
        </div>
      </section>
      {/* --- 끝 --- */}

      {/* --- 상단: 레이더 + 요약 (기존 유지) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h2 className="text-lg font-bold mb-3">단계별 평균 점수</h2>
          {/* 11. <UserRadar /> 컴포넌트 */}
          <UserRadar />
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-3">요약</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">푼 문제</dt>
              <dd className="font-semibold">{solvedCount}개</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">평균 학습 등급</dt>
              {/* "%" -> "등급" */}
              <dd className="font-semibold">
                {scoreToGrade(avgLearningRate)} 등급
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      {/* --- 코드 스타일 섹션 --- */}
      {codeStyle && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 ring-1 ring-black/5 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold">나의 코드 스타일</h2>
            {!styleEvaluation && (
              <button
                onClick={handleEvaluateStyle}
                disabled={evaluating || recentCodes.length === 0}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {evaluating ? '평가 중...' : '스타일 평가 받기'}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* 코드 스타일 평가 */}
            {styleEvaluation && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-700 mb-2">코드 스타일 평가</h3>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {styleEvaluation}
                </div>
              </div>
            )}
            
            {codeStyle.styleSummary && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">스타일 요약</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{codeStyle.styleSummary}</p>
              </div>
            )}
            
            {codeStyle.patterns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codeStyle.patterns.naming_conventions && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-xs font-semibold text-blue-700 mb-2">명명 규칙</h3>
                    <div className="text-sm text-blue-600 space-y-1">
                      {codeStyle.patterns.naming_conventions.variables && (
                        <div>변수: {codeStyle.patterns.naming_conventions.variables}</div>
                      )}
                      {codeStyle.patterns.naming_conventions.functions && (
                        <div>함수: {codeStyle.patterns.naming_conventions.functions}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {codeStyle.patterns.control_flow && codeStyle.patterns.control_flow.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h3 className="text-xs font-semibold text-green-700 mb-2">제어 흐름</h3>
                    <div className="text-sm text-green-600 space-y-1">
                      {codeStyle.patterns.control_flow.map((cf: any, i: number) => (
                        <div key={i}>
                          {cf.name === 'iterative_loops' && `반복문: ${cf.preference}`}
                          {cf.name === 'recursion' && `재귀: ${cf.preference}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- 최근 제출 코드 섹션 --- */}
      {recentCodes.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 ring-1 ring-black/5 shadow-sm mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-4">최근 제출한 코드</h2>
          <div className="space-y-4">
            {recentCodes.map((code, index) => (
              <div
                key={`${code.problemId}-${code.language}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {code.problemTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="px-2 py-1 bg-slate-200 rounded-full">
                        {code.language.toUpperCase()}
                      </span>
                      <span>
                        {new Date(code.submittedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <CodeViewer
                    language={code.language as LanguageKey}
                    code={code.code}
                    defaultExpanded={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- 하단: AI 학습 평가 (기존 유지) --- */}
      {/* 12. <EvaluationPanel /> 컴포넌트*/}
      <EvaluationPanel />
    </main>
  )
}

// --- 8. 프로필 정보 표시용 내부 컴포넌트 (기존 유지) ---
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  )
}