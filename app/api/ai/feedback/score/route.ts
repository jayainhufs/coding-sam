// /app/api/ai/feedback/score/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])
const BodySchema = z.object({
  step: StepEnum,
  text: z.string().min(1, 'text is required'),
})

// 기본 통과선 완화 (환경변수 없으면 40)
const PASS_LINE = Number(process.env.AI_PASS_LINE ?? '40')

// ───────────── Quick-Fail Guard (완화판) ─────────────
function quickFail(step: z.infer<typeof StepEnum>, raw: string) {
  const text = (raw || '').trim()
  const lc = text.toLowerCase()
  const len = text.length
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean).length

  // 공통: 사실상 빈 값
  if (len < 8 || lines < 1) {
    return {
      fail: true,
      score: 10,
      tips: ['한 줄이라도 예시/수치/키워드 넣어서 써주세요.'],
      missing: ['분량이 거의 없음'],
    }
  }

  // ───── understand: 기존 기준 유지 ─────
  if (step === 'understand') {
    const hasIn  = /(입력|input)/.test(lc)
    const hasOut = /(출력|output)/.test(lc)
    const hasCon = /(제약|constraint|n\s*[<=>]|o\([^)]+\))/.test(lc)
    const hasEd  = /(엣지|edge|경계)/.test(lc)
    const okCount = [hasIn, hasOut, hasCon, hasEd].filter(Boolean).length
    if (okCount < 2) {
      return {
        fail: true,
        score: 30,
        tips: ['입력/출력 중 하나 + 제약 또는 엣지 중 하나만이라도 적기', 'n≤… 같은 수치 한 번만 박기'],
        missing: ['입/출력/제약/엣지 중 2개 미만'],
      }
    }
  }

  // ───── decompose: 완화 ─────
  if (step === 'decompose') {
    const keyCount = ['입력', '핵심', '로직', '출력', '상태', '전이']
      .reduce((c, k) => c + (lc.includes(k) ? 1 : 0), 0)
    const hasBlocks = /(→|->|①|②|③|단계|step)/i.test(lc)
    const minimalStructure = keyCount >= 2 || hasBlocks || lines >= 3
    if (!minimalStructure) {
      return {
        fail: true,
        score: 30,
        tips: ['입력→핵심→출력 3블록으로만이라도 적기', '상태/전이 한 줄씩 추가'],
        missing: ['3블록 분해 또는 상태/전이 힌트 부재'],
      }
    }
  }

  // ───── pattern: 완화 ─────
  if (step === 'pattern') {
    const candCnt = (lc.match(/kadane|dp|dynamic|greedy|heap|two[-\s]?pointer|hash|정렬|분할정복|후보|candidate/g) || []).length
    const hasCx = /(o\([^)]+\)|시간|공간|complexity)/.test(lc)
    // 패턴명 ≥1 또는 복잡도 언급이 하나라도 있으면 통과
    if (candCnt < 1 && !hasCx) {
      return {
        fail: true,
        score: 30,
        tips: ['패턴명 1개(Kadane/DP/그리디 등) 또는 O(n) 같은 복잡도 1회 언급'],
        missing: ['패턴명/복잡도 모두 없음'],
      }
    }
  }

  // ───── abstract: 프리패스 (여기서는 컷 안 함) ─────
  if (step === 'abstract') {
    return { fail: false }
  }

  // ───── pseudocode: 완화(3줄 + 제어구조) ─────
  if (step === 'pseudocode') {
    const hasCtrl = /\b(for|while|if|else|switch)\b/.test(lc)
    if (lines < 3 || !hasCtrl) {
      return {
        fail: true,
        score: 35,
        tips: ['for/if 하나만이라도 넣어서 3줄 이상 작성', '입력→루프→리턴 구조만 적기'],
        missing: ['분량 부족 또는 제어구조 부재'],
      }
    }
  }

  return { fail: false }
}

// ───────────── 채점 루브릭/핸들러 이하 동일 ─────────────
const RUBRIC: Record<z.infer<typeof StepEnum>, { criterion: string; lifts: string[] }> = {
  understand: {
    criterion:
`- 요구/입·출력/제약/엣지케이스를 모호함 없이 1문단 요약
- 제약→복잡도 연결(예: n≤1e5 → O(n))
- 반례 1줄 + 성공/실패 조건 요약`,
    lifts: [
      '40→60: 입력/출력을 구체 타입/범위로, 엣지케이스 ≥2',
      '60→80: 제약 수치화 + 목표 복잡도 연결',
      '80→95: 반례 1줄 + 성공/실패 테스트 문장',
    ],
  },
  decompose: {
    criterion:
`- 3~7개의 실행 가능한 하위 단계(입력 파싱→핵심→출력)
- 각 단계의 상태/전이 1줄
- 실패지점/예외 흐름`,
    lifts: [
      '40→60: 입력 파싱→핵심→출력 3블록',
      '60→80: 각 단계에 상태/전이 명시',
      '80→95: 예외/실패지점 표시',
    ],
  },
  pattern: {
    criterion:
`- 제약/데이터 특성에 맞는 전형 패턴 후보 ≥2 비교
- 시간/공간 근거 1줄씩
- 반례로 부적합 후보 제거
- 최종 패턴의 불변식/상태 1~2줄`,
    lifts: [
      '40→60: 후보 2개 + 시간/공간 근거',
      '60→80: 반례로 후보 1개 배제',
      '80→95: 최종 불변식/상태 정의',
    ],
  },
  abstract: {
    criterion:
`- I/O 표(이름/타입/범위/예시)
- 상태 전이 텍스트 다이어그램
- 경계/엣지 분기(빈배열/음수/중복/정렬 등)`,
    lifts: [
      '40→60: I/O 표 작성',
      '60→80: 상태 전이 정리',
      '80→95: 경계 케이스 분기',
    ],
  },
  pseudocode: {
    criterion:
`- 10~20줄 의사코드(입력/출력/변수 + 제어구조)
- 루프 불변식 1개와 종료조건
- 시간/공간 복잡도 근거
- 단위 테스트 1~2개`,
    lifts: [
      '40→60: 10~20줄 절차/제어구조',
      '60→80: 불변식 + 종료조건',
      '80→95: 복잡도 + 단위 테스트',
    ],
  },
}

const BASELINE: Record<z.infer<typeof StepEnum>, string> = {
  understand:
`기본 요건(=50점):
- 입력/출력을 "이름·타입·범위(숫자 단위 포함)"로 1회 이상 명시
- 제약을 수치로 1개 이상 명시(n, 값 범위 등)하고 목표 복잡도와 최소 1줄로 연결
- 엣지케이스 ≥2를 문장으로 열거`,
  decompose:
`기본 요건(=50점):
- "입력 파싱 → 핵심 로직 → 출력"의 3블록 이상으로 단계화
- 각 블록마다 수행 내용이 관찰 가능한 동사로 1줄 이상 기술`,
  pattern:
`기본 요건(=50점):
- 후보 패턴 ≥2 제시(예: DP/그리디/투포인터/해시 등)
- 각 후보에 대한 시간 또는 공간 근거를 1줄 이상 명시`,
  abstract:
`기본 요건(=50점):
- I/O 표 형태로 이름/타입/범위/간단 예시를 최소 1행 이상 제시
- 상태 전이를 텍스트(언제 무엇이 갱신되는지)로 1줄 이상 설명`,
  pseudocode:
`기본 요건(=50점):
- 10줄 이상 의사코드(입력/출력/변수 선언 + 제어구조 포함)
- 종료 조건 또는 루프 불변식 중 최소 1개를 주석으로 1줄 이상`,
}

const SYS = `너는 코딩 학습 루브릭 채점기다. 반드시 JSON만 출력하라.
형식:
{
  "score": 0-100 정수,
  "band": "LT40"|"40-59"|"60-79"|"80-95"|"96-100",
  "missing": [부족 항목 짧은 한국어 문자열...],
  "tips": [다음 점수대로 가려면 무엇을 추가? 1~3개]
}
설명문, 코드블록, 기타 텍스트 금지. JSON만.`

function userPrompt(step: z.infer<typeof StepEnum>, text: string) {
  const r = RUBRIC[step]
  return [
    `현재 단계: ${step}`,
    `채점 기준:\n${r.criterion}`,
    `기본 요건(=50점) 정의:\n${BASELINE[step]}`,
    `점수 올리는 방법:\n- ${r.lifts.join('\n- ')}`,
    `학습자 제출:\n${text}`,
    `지침:
- 위 기준으로 0~100점 채점하라.
- 50점은 "기본 요건 충족". BASELINE을 만족하지 않으면 50점 미만을 부여.
- 근거 불충분·모호하면 보수적 감점.
- 출력은 JSON만.`,
  ].join('\n\n')
}

function safeParse(s: string) {
  try { const m = s.match(/\{[\s\S]*\}$/); return m ? JSON.parse(m[0]) : null }
  catch { return null }
}

export async function POST(req: Request) {
  try {
    const { step, text } = BodySchema.parse(await req.json())

    // 1) 하드 가드(완화판)
    const q = quickFail(step, text)
    if (q.fail) {
      return NextResponse.json({
        ok: true,
        score: q.score,
        pass: false,
        band: 'LT40',
        missing: q.missing,
        tips: q.tips,
        passLine: PASS_LINE,
      })
    }

    // 2) GPT 채점
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: userPrompt(step, text) },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed = safeParse(raw)
    if (!parsed || typeof parsed.score !== 'number') {
      return NextResponse.json({
        ok: true,
        score: 45,
        pass: 45 >= PASS_LINE,
        band: '40-59',
        missing: ['형식 오류'],
        tips: ['BASELINE 항목을 충족하도록 보완'],
        passLine: PASS_LINE,
      })
    }

    const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
    const pass = score >= PASS_LINE
    const band = parsed.band ?? (score < 40 ? 'LT40' : score < 60 ? '40-59' : score < 80 ? '60-79' : score <= 95 ? '80-95' : '96-100')
    const missing = Array.isArray(parsed.missing) ? parsed.missing.slice(0, 6) : []
    const tips = Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : []

    return NextResponse.json({ ok: true, score, pass, band, missing, tips, passLine: PASS_LINE })
  } catch (err: any) {
    console.error('[score route error]', err)
    let text = ''
    try { const b = await req.json(); text = typeof (b as any)?.text === 'string' ? (b as any).text : '' } catch {}
    const crude = text.length > 120 ? 62 : text.length > 60 ? 58 : 40
    const pass = crude >= PASS_LINE
    return NextResponse.json({
      ok: true,
      score: crude,
      pass,
      band: crude < 40 ? 'LT40' : crude < 60 ? '40-59' : crude < 80 ? '60-79' : '80-95',
      missing: ['채점기 오류(폴백 채점)'],
      tips: pass ? [] : ['예시·수치·경계 케이스를 2개 이상 추가'],
      passLine: PASS_LINE,
    })
  }
}
