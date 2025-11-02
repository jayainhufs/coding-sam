// utils/stepScore.ts
export type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

type ScoreResult = {
  score: number        // 0~100
  tips: string[]       // 다음 점수대로 가려면 무엇을 추가?
  met: string[]        // 충족한 체크 요약
  missing: string[]    // 부족한 항목
  band: 'LT40' | '40-59' | '60-79' | '80-95' | '96-100'
}

// 간단 헬퍼
const has = (s: string, re: RegExp) => re.test(s)
const lines = (s: string) => s.split('\n').map(v => v.trim()).filter(Boolean)

export function scoreStep(step: StepKey, raw: string): ScoreResult {
  const s = (raw || '').trim()
  const lc = s.toLowerCase()

  // 공통: 최소 글자/라인(너무 빈약한 입력 걸러냄)
  const minChars = 50
  const minLines = 2
  if (s.length < minChars || lines(s).length < minLines) {
    return {
      score: 0, band: 'LT40',
      met: [], missing: ['입력 내용이 너무 짧음(최소 분량 미달)'],
      tips: ['예시·제약·엣지케이스 등 최소 3줄 이상 채워주세요.']
    }
  }

  // 단계별 규칙
  let met: string[] = []
  let missing: string[] = []
  let base = 20  // 바닥점 (내용이 있으면)

  if (step === 'understand') {
    // 40→60: 입력/출력을 구체적 타입·범위 + 엣지 2개
    const hasInput = has(lc, /(입력|input)/)
    const hasOutput = has(lc, /(출력|output)/)
    const hasTypes = has(lc, /(int|long|array|list|문자열|배열|정수|범위|<=|≥|>=|≤|\bn\s*[<=>])/)
    const edges = (s.match(/엣지|edge|경계|빈\s*배열|음수|중복|정렬됨|중복 없음/g) || []).length
    const constraints = has(lc, /(제약|constraint|n\s*<=|o\([^)]+\))/)
    const linkToAlgo = has(lc, /(→|->|=>|필요|요구)\s*o\(/i)

    if (hasInput) met.push('입력 요약'); else missing.push('입력 요약')
    if (hasOutput) met.push('출력 요약'); else missing.push('출력 요약')

    // 40점대 요건
    let pts40 = 0
    if (hasTypes) { met.push('구체 타입/범위'); pts40 += 1 } else missing.push('구체 타입/범위')
    if (edges >= 2) { met.push('엣지케이스 ≥2'); pts40 += 1 } else missing.push('엣지케이스 2개')

    // 60점대 요건
    let pts60 = 0
    if (constraints) { met.push('제약 명시'); pts60 += 1 } else missing.push('제약')
    if (linkToAlgo) { met.push('제약→알고리즘 연결'); pts60 += 1 } else missing.push('제약→알고리즘 연결')

    // 80점대 요건
    let pts80 = 0
    const hasCounter = has(lc, /(반례|counter)/)
    const hasTestStmt = has(lc, /(테스트|성공|실패)/)
    if (hasCounter) { met.push('반례 1줄'); pts80 += 1 } else missing.push('반례 1줄')
    if (hasTestStmt) { met.push('성공/실패 테스트 요약'); pts80 += 1 } else missing.push('성공/실패 요약')

    const score = clamp(base + tierScore(pts40, pts60, pts80))
    const band = toBand(score)
    const tips = buildTips(band, {
      '40-59': ['입력/출력을 타입·범위로 구체화', '엣지케이스 2개 추가'],
      '60-79': ['제약을 수치로 쓰고 O( ) 목표 연결'],
      '80-95': ['반례 1줄 + 성공/실패 테스트 문장']
    })
    return { score, band, met, missing: uniq(missing), tips }
  }

  if (step === 'decompose') {
    const stepCount = (s.match(/->|→|단계|step|①|②|③|•/g) || []).length
    const hasIOCore = has(lc, /(입력.*파싱|parse).*핵심|핵심.*출력/)
    const hasStateTrans = has(lc, /(상태|전이|state|transition)/)
    const hasException = has(lc, /(예외|에러|오류|edge)/)

    let pts40 = 0
    if (stepCount >= 3) { met.push('3개 이상 단계'); pts40 += 1 } else missing.push('3개 이상 단계')
    if (hasIOCore) { met.push('입력→핵심→출력 3블록'); pts40 += 1 } else missing.push('입력→핵심→출력')

    let pts60 = 0
    if (hasStateTrans) { met.push('각 단계 상태/전이'); pts60 += 1 } else missing.push('상태/전이')

    let pts80 = 0
    if (hasException) { met.push('예외/실패지점'); pts80 += 1 } else missing.push('예외 처리')

    const score = clamp(base + tierScore(pts40, pts60, pts80))
    const band = toBand(score)
    const tips = buildTips(band, {
      '40-59': ['입력 파싱→핵심 로직→출력으로 최소 분해'],
      '60-79': ['각 단계에 상태/전이를 1줄씩 명시'],
      '80-95': ['실패 지점/예외 흐름 주석 달기']
    })
    return { score, band, met, missing: uniq(missing), tips }
  }

  if (step === 'pattern') {
    const candidates = (s.match(/후보|candidate|dp|greedy|heap|two[-\s]?pointer|hash|정렬|분할정복/gi) || []).length
    const hasComplexity = has(lc, /o\([^)]+\)|시간|공간|complexity/)
    const hasCounter = has(lc, /(반례|counter)/)
    const hasInvariant = has(lc, /(불변식|invariant|상태정의)/)

    let pts40 = 0
    if (candidates >= 2) { met.push('후보 2개'); pts40 += 1 } else missing.push('후보 2개')
    if (hasComplexity) { met.push('각 후보 근거 1줄'); pts40 += 1 } else missing.push('시간/공간 근거')

    let pts60 = 0
    if (hasCounter) { met.push('반례로 탈락 근거'); pts60 += 1 } else missing.push('반례로 탈락')

    let pts80 = 0
    if (hasInvariant) { met.push('최종 패턴 불변식/상태'); pts80 += 1 } else missing.push('불변식/상태 정의')

    const score = clamp(base + tierScore(pts40, pts60, pts80))
    const band = toBand(score)
    const tips = buildTips(band, {
      '40-59': ['후보 2개와 각 시간/공간 근거 1줄'],
      '60-79': ['반례로 부적합 후보 1개 제거'],
      '80-95': ['최종 패턴의 불변식 1~2줄']
    })
    return { score, band, met, missing: uniq(missing), tips }
  }

  if (step === 'abstract') {
    const hasTable = has(lc, /(표|table|입력.*출력|i\/o|io)/)
    const hasTrans = has(lc, /(상태.*전이|state.*transition)/)
    const hasBoundary = has(lc, /(경계|edge|빈\s*배열|음수|중복|정렬)/)

    let pts40 = 0
    if (hasTable) { met.push('I/O 표'); pts40 += 1 } else missing.push('I/O 표')
    if (hasTrans) { met.push('상태 전이'); pts40 += 1 } else missing.push('상태 전이')

    let pts60 = 0
    if (hasTrans) pts60 += 1 // 상태 전이 텍스트 다이어그램으로 간주
    else missing.push('상태 다이어그램')

    let pts80 = 0
    if (hasBoundary) { met.push('경계/분기'); pts80 += 1 } else missing.push('경계/분기')

    const score = clamp(base + tierScore(pts40, pts60, pts80))
    const band = toBand(score)
    const tips = buildTips(band, {
      '40-59': ['I/O를 표 형태(이름/타입/범위/예시)로 정리'],
      '60-79': ['상태 전이 텍스트 다이어그램 추가'],
      '80-95': ['빈배열·음수·중복 등 분기 명시']
    })
    return { score, band, met, missing: uniq(missing), tips }
  }

  // pseudocode
  if (step === 'pseudocode') {
    const lineCnt = lines(s).length
    const hasCtrl = has(lc, /\b(for|while|if|else|switch)\b/)
    const hasInv = has(lc, /(불변식|invariant)/)
    const hasEnd = has(lc, /(종료|terminate|끝|끝조건|base case)/)
    const hasCx = has(lc, /o\([^)]+\)|복잡도|complexity/)
    const hasTest = has(lc, /(테스트|test|입력:|기대값|expected)/)

    let pts40 = 0
    if (lineCnt >= 10 && lineCnt <= 40) { met.push('10~20줄'); pts40 += 1 } else missing.push('10~20줄 의사코드')
    if (hasCtrl) { met.push('제어구조'); pts40 += 1 } else missing.push('제어구조(분기/반복)')

    let pts60 = 0
    if (hasInv) { met.push('루프 불변식'); pts60 += 1 } else missing.push('루프 불변식')
    if (hasEnd) { met.push('종료 조건'); pts60 += 1 } else missing.push('종료 조건')

    let pts80 = 0
    if (hasCx) { met.push('시간/공간 복잡도'); pts80 += 1 } else missing.push('복잡도 근거')
    if (hasTest) { met.push('단위 테스트'); pts80 += 1 } else missing.push('단위 테스트')

    const score = clamp(base + tierScore(pts40, pts60, pts80))
    const band = toBand(score)
    const tips = buildTips(band, {
      '40-59': ['10~20줄 의사코드(입력/출력/변수 + 루프/조건)'],
      '60-79': ['불변식 1개와 종료 조건 주석'],
      '80-95': ['복잡도 1줄 + 테스트 2줄']
    })
    return { score, band, met, missing: uniq(missing), tips }
  }

  return { score: 0, band: 'LT40', met: [], missing: ['알 수 없는 단계'], tips: [] }
}

// 점수 합성: 40점대(0~2) + 60점대(0~2) + 80점대(0~2)를 가중 합
function tierScore(pts40: number, pts60: number, pts80: number) {
  // 바닥 20에서, 각 구간을 40/30/20 가중으로 배분
  const s40 = (pts40 / 2) * 40   // 0~40
  const s60 = (pts60 / 2) * 30   // 0~30
  const s80 = (pts80 / 2) * 20   // 0~20
  return Math.round(s40 + s60 + s80)
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)) }
function toBand(score: number): ScoreResult['band'] {
  if (score < 40) return 'LT40'
  if (score < 60) return '40-59'
  if (score < 80) return '60-79'
  if (score <= 95) return '80-95'
  return '96-100'
}
function uniq<T>(arr: T[]) { return Array.from(new Set(arr)) }
