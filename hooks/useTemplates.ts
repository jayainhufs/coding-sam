// hooks/useTemplates.ts
'use client'

import { useMemo } from 'react'

type Templates = {
  understand: string; decompose: string; pattern: string;
  abstractInPh: string; abstractOutPh: string; pseudocode: string
}

export function useTemplates(problemId: string) {
  return useMemo<Templates>(() => {
    if (problemId === 'max-subarray') {
      return {
        understand:
`[요약 1문단]
- 입력: n(정수), nums(길이 n 정수배열)
- 출력: 최대 "연속" 부분배열의 합(정수)
- 제약: 1 ≤ n ≤ 1e5, |nums[i]| ≤ 1e4 → O(n) 필요
- 엣지: 전부 음수 / 전부 양수 / n=1 / 큰 n
- 반례(1줄): [-1,-2]의 정답은 -1 (0 아님)`,
        decompose:
`[3~7단계, 각 단계에 상태 전이 주석]
1) 입력 파싱 → nums 준비
2) 핵심 로직(Kadane 후보)
   - 상태: cur, best
   - 전이: cur = max(x, cur + x); best = max(best, cur)
3) 결과 출력 → best`,
        pattern:
`[후보 2개 + 채택근거]
- Kadane O(n)/O(1) ✅
- 모든 구간 탐색 O(n^2) ❌ (시간 초과)
- 불변식: best는 i까지의 최대합, cur는 i에서 끝나는 최대합`,
        abstractInPh: `I/O(입력)
- nums: int[]  (예: [-2,1,-3,4,-1,2,1,-5,4])
- n:    int     (예: 9)`,
        abstractOutPh: `O(출력)
- answer: int (최대 연속 부분합)
- 상태 전이: cur=max(x,cur+x); best=max(best,cur)`,
        pseudocode:
`best=-INF; cur=0
for x in nums:
  cur=max(x,cur+x)
  best=max(best,cur)
print(best)`,
      }
    }

    if (problemId === 'two-sum') {
      return {
        understand:
`[요약 1문단]
- 입력: nums(정수배열), target(정수)
- 출력: i<j 두 인덱스`,
        decompose:
`1) 입력 파싱
2) 해시맵 1-pass (need=target-x)
3) 결과 출력`,
        pattern:
`- HashMap O(n)/O(n) ✅
- 정렬+투포인터(인덱스 유지 비용) △`,
        abstractInPh: `nums: int[], target: int`,
        abstractOutPh: `indices: (i,j) with i<j`,
        pseudocode:
`seen={}
for i,x in enumerate(nums):
  need=target-x
  if need in seen: return [seen[need],i]
  seen[x]=i
return []`,
      }
    }

    return {
      understand: `[요약 1문단] …`,
      decompose:  `1) 입력 2) 핵심 3) 출력`,
      pattern:    `후보 비교/반례/불변식`,
      abstractInPh: `입력 표`,
      abstractOutPh:`출력+전이 표`,
      pseudocode:  `의사코드 10~20줄`,
    }
  }, [problemId])
}
