'use client'

import { LABEL, StepKey } from '@/utils/analysis'

type Block = {
  title: string
  quickWins: string[]      // 바로 점수 올리는 체크리스트
  routine: string[]        // 루틴(1~5단계)
  proTips?: string[]       // 선택: 고득점 팁
}

const PLAYBOOK: Record<StepKey, Block> = {
  understand: {
    title: '이해(요구/입출력/제약/엣지) 40→80→95 가이드',
    quickWins: [
      '요구사항·입력형·출력형·제약·엣지케이스를 한 문단(5~7문장)으로 요약한다.',
      '입력/출력은 “구체적인 타입·범위·예외”까지 적는다. (예: n ≤ 10^5, 음수 포함)',
      '성공/실패 조건을 “테스트 문장”으로 2개 이상 적는다. (예: “빈 배열이면 0을 반환”)',
    ],
    routine: [
      '문제를 1문단으로 요약 → 핵심 명사/동사를 굵게 표시',
      '입력/출력을 표로 분리: 컬럼(이름/타입/범위/예외)',
      '성공조건 1줄·실패조건 1줄을 “검증문장”으로 적기',
      '엣지 2개를 만들고 예상 결과를 적기',
      '마지막으로 “해결해야 할 핵심” 1줄로 정리',
    ],
    proTips: [
      '요약에서 “해야 할 것 vs 하지 않아도 될 것”을 분리하면 실수가 급감한다.',
    ],
  },

  decompose: {
    title: '분해(체크리스트) 40→80→95 가이드',
    quickWins: [
      '최소 3~7개의 “관찰 가능한 행동”으로 쪼갠다. (예: 입력 파싱, 상태 정의, 반복, 갱신, 출력)',
      '각 단계는 “산출물”이 보이게 쓴다. (예: 누적합 배열 생성, 최대값 갱신 완료)',
      '각 단계의 입력/출력(중간 산출물)을 화살표로 연결한다. (A → B → C)',
    ],
    routine: [
      '문제 요구를 3~5단계로 1차 분해',
      '각 단계에 “입력→출력”을 1줄로 붙인다',
      '중복/누락된 단계가 없는지 점검',
      '위험 단계(실수 잦은 곳)를 ★로 표시',
      '각 단계별 단위 테스트 아이디어 1개씩',
    ],
    proTips: [
      '체크리스트의 각 단계는 “다음 단계의 입력”이 된다 — 연결성이 떨어지면 점수가 깎인다.',
    ],
  },

  pattern: {
    title: '패턴 인식(전형 연결) 40→80→95 가이드',
    quickWins: [
      '후보 패턴 2개를 나열하고, 제약(시간/공간/정렬/음수/중복 등)으로 “부적합”을 먼저 걸러낸다.',
      '선택 패턴 1개에 대해 “핵심 불변식·상태”를 1~2줄로 명시한다.',
      '반례 1개를 구성해 선택의 설득력을 확보한다.',
    ],
    routine: [
      '후보 패턴 2~3개 나열 (예: Kadane / 투포인터 / 누적합 / 해시)',
      '제약표로 적합/부적합을 체크',
      '남은 1개에 대해 불변식·상태 정의',
      '반례 1개 만들어서 통과 확인',
      '복잡도(O-표기)와 메모리 사용 요약',
    ],
    proTips: [
      '“왜 이 패턴이 적합한가”를 2문장으로 말할 수 있으면 80점대가 가능하다.',
    ],
  },

  abstract: {
    title: '추상화(입/출력/흐름) 40→80→95 가이드',
    quickWins: [
      '“입력 → 핵심 처리 → 출력” 3블록 다이어그램을 텍스트로 그린다.',
      '상태 전이(초기화 → 반복/조건 → 종료)를 글머리표로 명확히 한다.',
      '불필요한 세부(포맷팅/입출력 코드)를 과감히 제거한다.',
    ],
    routine: [
      '입력/출력 명세를 한 줄로 단정히 쓴다',
      '초기 상태·변수 정의 → 전이 조건 나열',
      '반복/분기 흐름을 5줄 이내로 요약',
      '엣지 처리 지점을 ●로 표시',
      '마지막에 전체를 1문단으로 재서술',
    ],
    proTips: [
      '추상화 문단을 읽고 바로 의사코드를 쓸 수 있으면 점프가 매끄럽다.',
    ],
  },

  pseudocode: {
    title: '의사코드(알고리즘적 사고) 40→80→95 가이드',
    quickWins: [
      '10~20줄 내로 작성하며, “순서/분기/반복”만으로 흐름이 보이게 한다.',
      '핵심 변수/불변식 1~2개와 종료조건을 주석으로 붙인다.',
      '각 단계 옆에( // O(n) )처럼 대략의 복잡도 표기를 덧붙인다.',
    ],
    routine: [
      '초기화·입력 파싱',
      '반복/조건(핵심 로직) — 불변식 주석',
      '상태 갱신과 전역 최댓값/최솟값 갱신',
      '엣지 처리(비어 있음/경계)',
      '결과 반환과 복잡도 표기',
    ],
    proTips: [
      '“검증 가능한 문장(불변식)”이 1개라도 있으면 채점 기준에서 크게 가산된다.',
    ],
  },
}

export function PersonalPlaybook({
  weakest,
  onChange,
}: {
  weakest: StepKey
  onChange?: (k: StepKey) => void
}) {
  const block = PLAYBOOK[weakest]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 md:p-6 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-extrabold">
          단계별 점수 올리는 플레이북 — <span className="text-[#002D56]">{LABEL[weakest]}</span>
        </h3>

        {/* (원하면) 단계 선택 드롭다운 */}
        {onChange && (
          <select
            className="text-sm border rounded-md px-2 py-1"
            value={weakest}
            onChange={(e) => onChange(e.target.value as StepKey)}
            aria-label="플레이북 단계 선택"
          >
            {(['understand','decompose','pattern','abstract','pseudocode'] as StepKey[]).map(k => (
              <option value={k} key={k}>{LABEL[k]}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-3">
        <div className="font-semibold mb-1">{block.title}</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-3 bg-white/60">
            <div className="text-slate-500 text-sm font-semibold mb-1">Quick Wins</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {block.quickWins.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 bg-white/60">
            <div className="text-slate-500 text-sm font-semibold mb-1">루틴(1→5)</div>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              {block.routine.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>
        </div>

        {block.proTips?.length ? (
          <div className="mt-3 rounded-lg border border-slate-200 p-3 bg-white/60">
            <div className="text-slate-500 text-sm font-semibold mb-1">Pro Tips</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {block.proTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
