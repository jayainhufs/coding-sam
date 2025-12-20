'use client'

import { useState } from 'react'
import {
  runPerformanceEvaluation,
  printPerformanceReport,
  saveReportAsJSON,
  type PerformanceReport,
} from '@/utils/performance-evaluation'

export default function PerformanceEvaluationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [iterations, setIterations] = useState(3)
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([
    '/api/problems',
    '/api/run',
    '/api/ai/analyze-style',
    '/api/ai/feedback',
  ])

  const availableEndpoints = [
    { value: '/api/problems', label: '문제 목록 (GET)' },
    { value: '/api/run', label: '코드 실행' },
    { value: '/api/ai/analyze-style', label: '스타일 분석' },
    { value: '/api/ai/evaluate-style', label: '스타일 평가' },
    { value: '/api/ai/refactor', label: '코드 리팩토링' },
    { value: '/api/ai/feedback', label: 'AI 피드백' },
    { value: '/api/quiz/generate', label: '퀴즈 생성' },
  ]

  const handleRunEvaluation = async () => {
    setIsRunning(true)
    setReport(null)

    try {
      const result = await runPerformanceEvaluation(
        iterations,
        selectedEndpoints as any
      )
      setReport(result)
      printPerformanceReport(result)
    } catch (error: any) {
      console.error('평가 실행 오류:', error)
      alert(`평가 실행 실패: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleToggleEndpoint = (endpoint: string) => {
    setSelectedEndpoints((prev) =>
      prev.includes(endpoint)
        ? prev.filter((e) => e !== endpoint)
        : [...prev, endpoint]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-hufs-gray/30 to-white py-12 px-4">
      <main className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002D56]">
            성능 평가 도구
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Coding-Sam의 API 응답 시간, 페이지 로드 시간, LocalStorage 성능을 측정합니다.
          </p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-black/5">
          {/* 설정 */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4">평가 설정</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API 호출 횟수 (각 엔드포인트당)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002D56] focus:border-transparent"
                disabled={isRunning}
              />
              <p className="mt-1 text-xs text-gray-500">
                각 엔드포인트를 몇 번 호출할지 설정합니다. (1-10)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                측정할 API 엔드포인트
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableEndpoints.map((endpoint) => (
                  <label
                    key={endpoint.value}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEndpoints.includes(endpoint.value)}
                      onChange={() => handleToggleEndpoint(endpoint.value)}
                      disabled={isRunning}
                      className="rounded border-gray-300 text-[#002D56] focus:ring-[#002D56]"
                    />
                    <span className="text-sm">{endpoint.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 실행 버튼 */}
          <button
            onClick={handleRunEvaluation}
            disabled={isRunning || selectedEndpoints.length === 0}
            className="w-full px-6 py-3 bg-[#002D56] text-white font-semibold rounded-xl hover:bg-[#002D56]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '평가 실행 중...' : '성능 평가 실행'}
          </button>

          {/* 결과 */}
          {report && (
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">평가 결과</h2>
                <button
                  onClick={() => saveReportAsJSON(report)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  JSON 다운로드
                </button>
              </div>

              {/* 요약 */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">📈 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">총 API 호출</div>
                    <div className="font-semibold text-lg">
                      {report.summary.totalApiCalls}회
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">성공률</div>
                    <div className="font-semibold text-lg text-green-600">
                      {report.summary.overallApiSuccessRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">평균 응답 시간</div>
                    <div className="font-semibold text-lg">
                      {report.summary.avgApiResponseTime}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">가장 느린 엔드포인트</div>
                    <div className="font-semibold text-sm text-red-600 break-all">
                      {report.summary.slowestEndpoint}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">가장 빠른 엔드포인트</div>
                    <div className="font-semibold text-sm text-green-600 break-all">
                      {report.summary.fastestEndpoint}
                    </div>
                  </div>
                </div>
              </div>

              {/* API 상세 메트릭 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">🔌 API 엔드포인트별 상세</h3>
                <div className="space-y-4">
                  {report.apiMetrics.map((metric) => (
                    <div
                      key={metric.endpoint}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                            {metric.method}
                          </span>
                          <span className="ml-2 font-semibold">{metric.endpoint}</span>
                        </div>
                        <div className="text-sm">
                          성공률:{' '}
                          <span
                            className={`font-semibold ${
                              metric.successRate >= 90
                                ? 'text-green-600'
                                : metric.successRate >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {metric.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3">
                        <div>
                          <div className="text-gray-600">평균</div>
                          <div className="font-semibold">{metric.avgResponseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">최소</div>
                          <div className="font-semibold text-green-600">
                            {metric.minResponseTime}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">최대</div>
                          <div className="font-semibold text-red-600">
                            {metric.maxResponseTime}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">중앙값</div>
                          <div className="font-semibold">{metric.medianResponseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">P95</div>
                          <div className="font-semibold">{metric.p95ResponseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">P99</div>
                          <div className="font-semibold">{metric.p99ResponseTime}ms</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 페이지 로드 메트릭 */}
              {report.pageLoadMetrics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">📄 페이지 로드 시간</h3>
                  {report.pageLoadMetrics.map((metric) => (
                    <div
                      key={metric.page}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="font-semibold mb-2">{metric.page}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-gray-600">전체 로드</div>
                          <div className="font-semibold">{metric.loadTime}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">DOMContentLoaded</div>
                          <div className="font-semibold">
                            {metric.domContentLoaded}ms
                          </div>
                        </div>
                        {metric.firstPaint && (
                          <div>
                            <div className="text-gray-600">First Paint</div>
                            <div className="font-semibold">{metric.firstPaint}ms</div>
                          </div>
                        )}
                        {metric.firstContentfulPaint && (
                          <div>
                            <div className="text-gray-600">FCP</div>
                            <div className="font-semibold">
                              {metric.firstContentfulPaint}ms
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LocalStorage 메트릭 */}
              <div>
                <h3 className="text-sm font-semibold mb-3">💾 LocalStorage 성능</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">읽기 평균</div>
                      <div className="font-semibold">
                        {report.localStorageMetrics.readTime}μs
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">쓰기 평균</div>
                      <div className="font-semibold">
                        {report.localStorageMetrics.writeTime}μs
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">읽기 작업</div>
                      <div className="font-semibold">
                        {report.localStorageMetrics.readOperations}회
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">쓰기 작업</div>
                      <div className="font-semibold">
                        {report.localStorageMetrics.writeOperations}회
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>
            💡 <strong>팁:</strong> 브라우저 개발자 도구(F12)의 콘솔에서도 상세한 리포트를
            확인할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  )
}

