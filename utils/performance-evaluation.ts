/**
 * Coding-Sam 성능 평가 도구
 * 
 * 측정 지표:
 * 1. API 응답 시간 (각 엔드포인트별 평균, 최소, 최대, 중앙값)
 * 2. API 성공률
 * 3. 페이지 로드 시간
 * 4. LocalStorage 읽기/쓰기 성능
 * 5. 컴포넌트 렌더링 시간 (선택적)
 */

export type ApiEndpoint = 
  | '/api/ai/feedback'
  | '/api/ai/analyze-style'
  | '/api/ai/evaluate-style'
  | '/api/ai/refactor'
  | '/api/quiz/generate'
  | '/api/run'
  | '/api/problems'

export interface ApiMetrics {
  endpoint: string
  method: 'GET' | 'POST'
  totalRequests: number
  successCount: number
  failureCount: number
  successRate: number
  responseTimes: number[] // ms
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  medianResponseTime: number
  p95ResponseTime: number // 95th percentile
  p99ResponseTime: number // 99th percentile
}

export interface PageLoadMetrics {
  page: string
  loadTime: number // ms
  domContentLoaded: number // ms
  firstPaint?: number // ms
  firstContentfulPaint?: number // ms
}

export interface LocalStorageMetrics {
  readTime: number // ms (평균)
  writeTime: number // ms (평균)
  readOperations: number
  writeOperations: number
}

export interface PerformanceReport {
  timestamp: string
  apiMetrics: ApiMetrics[]
  pageLoadMetrics: PageLoadMetrics[]
  localStorageMetrics: LocalStorageMetrics
  summary: {
    totalApiCalls: number
    totalApiFailures: number
    overallApiSuccessRate: number
    avgApiResponseTime: number
    slowestEndpoint: string
    fastestEndpoint: string
  }
}

/**
 * API 응답 시간 측정
 */
export async function measureApiCall(
  endpoint: ApiEndpoint,
  method: 'GET' | 'POST' = 'POST',
  body?: any,
  headers?: Record<string, string>
): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const startTime = performance.now()
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
    
    if (method === 'POST' && body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(endpoint, options)
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    if (!response.ok) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}`,
      }
    }
    
    // 응답 본문 읽기 (에러 체크를 위해)
    try {
      await response.json()
    } catch {
      // JSON 파싱 실패는 성공으로 간주 (응답은 받았으므로)
    }
    
    return {
      success: true,
      responseTime,
    }
  } catch (error: any) {
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    return {
      success: false,
      responseTime,
      error: error.message || 'Network error',
    }
  }
}

/**
 * 여러 번 API 호출하여 통계 수집
 */
export async function collectApiMetrics(
  endpoint: ApiEndpoint,
  method: 'GET' | 'POST' = 'POST',
  iterations: number = 5,
  body?: any,
  headers?: Record<string, string>
): Promise<ApiMetrics> {
  const responseTimes: number[] = []
  let successCount = 0
  let failureCount = 0
  
  console.log(`[성능 측정] ${endpoint} - ${iterations}회 호출 중...`)
  
  for (let i = 0; i < iterations; i++) {
    const result = await measureApiCall(endpoint, method, body, headers)
    
    responseTimes.push(result.responseTime)
    
    if (result.success) {
      successCount++
    } else {
      failureCount++
      console.warn(`[실패] ${endpoint} (${i + 1}/${iterations}): ${result.error}`)
    }
    
    // API 속도 제한 회피를 위한 짧은 딜레이
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  const sortedTimes = [...responseTimes].sort((a, b) => a - b)
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
  const minResponseTime = Math.min(...responseTimes)
  const maxResponseTime = Math.max(...responseTimes)
  const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
  const p95Index = Math.floor(sortedTimes.length * 0.95)
  const p99Index = Math.floor(sortedTimes.length * 0.99)
  
  return {
    endpoint,
    method,
    totalRequests: iterations,
    successCount,
    failureCount,
    successRate: (successCount / iterations) * 100,
    responseTimes,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    minResponseTime: Math.round(minResponseTime * 100) / 100,
    maxResponseTime: Math.round(maxResponseTime * 100) / 100,
    medianResponseTime: Math.round(medianResponseTime * 100) / 100,
    p95ResponseTime: Math.round(sortedTimes[p95Index] * 100) / 100,
    p99ResponseTime: Math.round(sortedTimes[p99Index] * 100) / 100,
  }
}

/**
 * 페이지 로드 시간 측정
 */
export function measurePageLoad(pageName: string): PageLoadMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      page: pageName,
      loadTime: 0,
      domContentLoaded: 0,
    }
  }
  
  const perf = window.performance
  const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  
  if (!nav) {
    return {
      page: pageName,
      loadTime: 0,
      domContentLoaded: 0,
    }
  }
  
  const loadTime = nav.loadEventEnd - nav.fetchStart
  const domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart
  
  // Paint Timing (선택적, 지원되는 경우)
  const paintEntries = perf.getEntriesByType('paint')
  const firstPaint = paintEntries.find(e => e.name === 'first-paint')
  const firstContentfulPaint = paintEntries.find(e => e.name === 'first-contentful-paint')
  
  return {
    page: pageName,
    loadTime: Math.round(loadTime * 100) / 100,
    domContentLoaded: Math.round(domContentLoaded * 100) / 100,
    firstPaint: firstPaint ? Math.round(firstPaint.startTime * 100) / 100 : undefined,
    firstContentfulPaint: firstContentfulPaint
      ? Math.round(firstContentfulPaint.startTime * 100) / 100
      : undefined,
  }
}

/**
 * LocalStorage 성능 측정
 */
export function measureLocalStoragePerformance(iterations: number = 100): LocalStorageMetrics {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      readTime: 0,
      writeTime: 0,
      readOperations: 0,
      writeOperations: 0,
    }
  }
  
  const testKey = 'coding-sam:perf-test'
  const testData = JSON.stringify({ test: 'data', timestamp: Date.now() })
  
  // 쓰기 성능 측정
  const writeStart = performance.now()
  for (let i = 0; i < iterations; i++) {
    localStorage.setItem(`${testKey}-${i}`, testData)
  }
  const writeEnd = performance.now()
  const writeTime = (writeEnd - writeStart) / iterations
  
  // 읽기 성능 측정
  const readStart = performance.now()
  for (let i = 0; i < iterations; i++) {
    localStorage.getItem(`${testKey}-${i}`)
  }
  const readEnd = performance.now()
  const readTime = (readEnd - readStart) / iterations
  
  // 테스트 데이터 정리
  for (let i = 0; i < iterations; i++) {
    localStorage.removeItem(`${testKey}-${i}`)
  }
  
  return {
    readTime: Math.round(readTime * 1000 * 100) / 100, // μs 단위
    writeTime: Math.round(writeTime * 1000 * 100) / 100, // μs 단위
    readOperations: iterations,
    writeOperations: iterations,
  }
}

/**
 * 전체 성능 평가 실행
 */
export async function runPerformanceEvaluation(
  apiIterations: number = 3,
  testEndpoints: ApiEndpoint[] = [
    '/api/problems',
    '/api/run',
    '/api/ai/analyze-style',
    '/api/ai/feedback',
  ]
): Promise<PerformanceReport> {
  console.log('🚀 성능 평가 시작...')
  const startTime = Date.now()
  
  // API 메트릭 수집
  const apiMetrics: ApiMetrics[] = []
  
  for (const endpoint of testEndpoints) {
    try {
      let body: any = undefined
      
      // 엔드포인트별 테스트 데이터 준비
      if (endpoint === '/api/run') {
        body = {
          language: 'python',
          code: 'print("Hello, World!")',
          stdin: '',
        }
      } else if (endpoint === '/api/ai/analyze-style') {
        body = {
          code: 'def hello():\n    print("Hello")\n    return True',
        }
      } else if (endpoint === '/api/ai/feedback') {
        body = {
          step: 'understand',
          userInput: '이 문제는 배열의 합을 구하는 문제입니다.',
          problem: {
            id: 'test-problem',
            title: '테스트 문제',
            description: '테스트용 문제 설명',
          },
          mode: 'hint',
        }
      } else if (endpoint === '/api/problems') {
        // GET 요청
        const metrics = await collectApiMetrics(endpoint, 'GET', apiIterations)
        apiMetrics.push(metrics)
        continue
      }
      
      const metrics = await collectApiMetrics(
        endpoint,
        'POST',
        apiIterations,
        body
      )
      apiMetrics.push(metrics)
    } catch (error: any) {
      console.error(`[오류] ${endpoint} 측정 실패:`, error)
    }
  }
  
  // 페이지 로드 메트릭 (현재 페이지)
  const pageLoadMetrics: PageLoadMetrics[] = []
  if (typeof window !== 'undefined') {
    const currentPage = window.location.pathname || 'unknown'
    pageLoadMetrics.push(measurePageLoad(currentPage))
  }
  
  // LocalStorage 성능 측정
  const localStorageMetrics = measureLocalStoragePerformance(100)
  
  // 요약 통계 계산
  const totalApiCalls = apiMetrics.reduce((sum, m) => sum + m.totalRequests, 0)
  const totalApiFailures = apiMetrics.reduce((sum, m) => sum + m.failureCount, 0)
  const overallApiSuccessRate =
    totalApiCalls > 0 ? ((totalApiCalls - totalApiFailures) / totalApiCalls) * 100 : 0
  const avgApiResponseTime =
    apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / apiMetrics.length
      : 0
  
  const slowestEndpoint =
    apiMetrics.length > 0
      ? apiMetrics.reduce((max, m) =>
          m.avgResponseTime > max.avgResponseTime ? m : max
        ).endpoint
      : 'N/A'
  
  const fastestEndpoint =
    apiMetrics.length > 0
      ? apiMetrics.reduce((min, m) =>
          m.avgResponseTime < min.avgResponseTime ? m : min
        ).endpoint
      : 'N/A'
  
  const endTime = Date.now()
  const totalEvaluationTime = endTime - startTime
  
  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    apiMetrics,
    pageLoadMetrics,
    localStorageMetrics,
    summary: {
      totalApiCalls,
      totalApiFailures,
      overallApiSuccessRate: Math.round(overallApiSuccessRate * 100) / 100,
      avgApiResponseTime: Math.round(avgApiResponseTime * 100) / 100,
      slowestEndpoint,
      fastestEndpoint,
    },
  }
  
  console.log('✅ 성능 평가 완료!')
  console.log(`총 소요 시간: ${totalEvaluationTime}ms`)
  console.log(`평균 API 응답 시간: ${report.summary.avgApiResponseTime}ms`)
  console.log(`API 성공률: ${report.summary.overallApiSuccessRate}%`)
  
  return report
}

/**
 * 리포트를 콘솔에 출력
 */
export function printPerformanceReport(report: PerformanceReport) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 Coding-Sam 성능 평가 리포트')
  console.log('='.repeat(80))
  console.log(`평가 시각: ${new Date(report.timestamp).toLocaleString('ko-KR')}`)
  console.log('\n')
  
  // 요약
  console.log('📈 요약')
  console.log('-'.repeat(80))
  console.log(`총 API 호출: ${report.summary.totalApiCalls}회`)
  console.log(`실패 횟수: ${report.summary.totalApiFailures}회`)
  console.log(`전체 성공률: ${report.summary.overallApiSuccessRate}%`)
  console.log(`평균 응답 시간: ${report.summary.avgApiResponseTime}ms`)
  console.log(`가장 느린 엔드포인트: ${report.summary.slowestEndpoint}`)
  console.log(`가장 빠른 엔드포인트: ${report.summary.fastestEndpoint}`)
  console.log('\n')
  
  // API 상세 메트릭
  console.log('🔌 API 엔드포인트별 상세 메트릭')
  console.log('-'.repeat(80))
  report.apiMetrics.forEach((metric) => {
    console.log(`\n${metric.method} ${metric.endpoint}`)
    console.log(`  호출 횟수: ${metric.totalRequests}회`)
    console.log(`  성공률: ${metric.successRate.toFixed(2)}%`)
    console.log(`  평균 응답 시간: ${metric.avgResponseTime}ms`)
    console.log(`  최소: ${metric.minResponseTime}ms`)
    console.log(`  최대: ${metric.maxResponseTime}ms`)
    console.log(`  중앙값: ${metric.medianResponseTime}ms`)
    console.log(`  P95: ${metric.p95ResponseTime}ms`)
    console.log(`  P99: ${metric.p99ResponseTime}ms`)
  })
  console.log('\n')
  
  // 페이지 로드 메트릭
  if (report.pageLoadMetrics.length > 0) {
    console.log('📄 페이지 로드 메트릭')
    console.log('-'.repeat(80))
    report.pageLoadMetrics.forEach((metric) => {
      console.log(`\n페이지: ${metric.page}`)
      console.log(`  전체 로드 시간: ${metric.loadTime}ms`)
      console.log(`  DOMContentLoaded: ${metric.domContentLoaded}ms`)
      if (metric.firstPaint) {
        console.log(`  First Paint: ${metric.firstPaint}ms`)
      }
      if (metric.firstContentfulPaint) {
        console.log(`  First Contentful Paint: ${metric.firstContentfulPaint}ms`)
      }
    })
    console.log('\n')
  }
  
  // LocalStorage 메트릭
  console.log('💾 LocalStorage 성능')
  console.log('-'.repeat(80))
  console.log(`읽기 평균 시간: ${report.localStorageMetrics.readTime}μs`)
  console.log(`쓰기 평균 시간: ${report.localStorageMetrics.writeTime}μs`)
  console.log(`읽기 작업: ${report.localStorageMetrics.readOperations}회`)
  console.log(`쓰기 작업: ${report.localStorageMetrics.writeOperations}회`)
  console.log('\n')
  
  console.log('='.repeat(80))
}

/**
 * 리포트를 JSON 파일로 저장 (브라우저 환경)
 */
export function saveReportAsJSON(report: PerformanceReport, filename?: string) {
  if (typeof window === 'undefined') {
    console.warn('브라우저 환경에서만 JSON 저장이 가능합니다.')
    return
  }
  
  const json = JSON.stringify(report, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `performance-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  console.log(`✅ 리포트가 ${a.download}로 저장되었습니다.`)
}

