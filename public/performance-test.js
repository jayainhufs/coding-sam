/**
 * Coding-Sam 성능 평가 스크립트
 * 
 * 사용법:
 * 1. 브라우저 개발자 도구(F12) 열기
 * 2. Console 탭으로 이동
 * 3. 이 스크립트를 복사하여 붙여넣고 실행
 * 
 * 또는:
 * - http://localhost:3000/performance 페이지에서 GUI로 실행
 */

// 스크립트를 동적으로 로드
(async function() {
  console.log('🚀 성능 평가 스크립트 로딩 중...')
  
  // 성능 평가 유틸리티 함수들을 동적으로 import
  const { 
    runPerformanceEvaluation, 
    printPerformanceReport,
    saveReportAsJSON 
  } = await import('/utils/performance-evaluation.ts')
  
  // 전역 함수로 등록
  window.runPerformanceTest = async function(iterations = 3) {
    console.log(`\n📊 성능 평가 시작 (각 API ${iterations}회 호출)...\n`)
    
    const report = await runPerformanceEvaluation(iterations)
    printPerformanceReport(report)
    
    // 전역 변수로 저장 (나중에 참조 가능)
    window.lastPerformanceReport = report
    
    console.log('\n💾 리포트를 JSON으로 저장하려면: savePerformanceReport() 실행')
    
    return report
  }
  
  window.savePerformanceReport = function() {
    if (!window.lastPerformanceReport) {
      console.error('❌ 먼저 runPerformanceTest()를 실행해주세요.')
      return
    }
    saveReportAsJSON(window.lastPerformanceReport)
  }
  
  window.quickPerformanceTest = async function() {
    return await window.runPerformanceTest(2)
  }
  
  window.fullPerformanceTest = async function() {
    return await window.runPerformanceTest(5)
  }
  
  console.log('✅ 성능 평가 스크립트 로드 완료!')
  console.log('\n사용 가능한 함수:')
  console.log('  - runPerformanceTest(iterations) : 성능 평가 실행 (기본 3회)')
  console.log('  - quickPerformanceTest() : 빠른 평가 (2회)')
  console.log('  - fullPerformanceTest() : 전체 평가 (5회)')
  console.log('  - savePerformanceReport() : 마지막 리포트를 JSON으로 저장')
  console.log('\n예시: runPerformanceTest(3)')
})()

