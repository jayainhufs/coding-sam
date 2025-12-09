// hooks/useTemplates.ts
'use client'

import { useMemo } from 'react'

type Templates = {
  understand: string; decompose: string; pattern: string;
  abstract: string; pseudocode: string
}

export function useTemplates(problemId: string) {
  return useMemo<Templates>(() => {
    if (problemId === 'max-subarray') {
      return {
        understand:
`문제를 한 문단으로 요약해보세요:

• 입력: 무엇을 받나요? (예: n(정수), nums(길이 n 정수배열))
• 출력: 무엇을 구하나요? (예: 최대 "연속" 부분배열의 합)
• 제약: 크기나 범위는? → 목표 복잡도는? (예: 1 ≤ n ≤ 1e5, |nums[i]| ≤ 1e4 → O(n) 필요)
• 특별한 경우: 주의해야 할 입력은? (예: 전부 음수, 전부 양수, n=1 등)
• 반례: 실수하기 쉬운 경우는? (예: [-1,-2]의 정답은 -1, 0이 아님)`,
        decompose:
`문제를 4개의 단계로 나눠보세요:

   - 입력: 무엇을 받나요?
   - 상태: 어떤 변수나 값이 필요한가요?
   - 처리: 어떻게 변하나요?
   - 출력: 무엇을 만들어내나요?`,

        pattern:
`문제를 해결할 수 있는 방법을 2개 이상 생각해보고, 장점, 단점, 시간복잡도 등을 자유롭게 비교하고 작성해보세요.`,
        abstract: `문제 해결의 핵심 아이디어를 말로 정리해보세요. 입력과 출력, 그리고 어떻게 처리할지에 대한 핵심 개념을 설명하세요.`,
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
`문제를 한 문단으로 요약해보세요:

• 입력: 무엇을 받나요? (예: nums(정수배열), target(정수))
• 출력: 무엇을 구하나요? (예: i<j 두 인덱스)
• 제약: 크기나 범위는? → 목표 복잡도는?
• 특별한 경우: 주의해야 할 입력은?
• 반례: 실수하기 쉬운 경우는?`,
        decompose:
`문제를 4개의 단계로 나눠보세요:

   - 입력: 무엇을 받나요?
   - 상태: 어떤 변수나 값이 필요한가요?
   - 처리: 어떻게 변하나요?
   - 출력: 무엇을 만들어내나요?`,
        pattern:
`문제를 해결할 수 있는 방법을 2개 이상 생각해보고, 장점, 단점, 시간복잡도 등을 자유롭게 비교하고 작성해보세요.`,
        abstract: `문제 해결의 핵심 아이디어를 말로 정리해보세요. 입력과 출력, 그리고 어떻게 처리할지에 대한 핵심 개념을 설명하세요.`,
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
      understand: `문제를 한 문단으로 요약해보세요:

• 입력: 무엇을 받나요?
• 출력: 무엇을 구하나요?
• 제약: 크기나 범위는? → 목표 복잡도는?
• 특별한 경우: 주의해야 할 입력은?
• 반례: 실수하기 쉬운 경우는?`,
      decompose: `문제를 4개의 단계로 나눠보세요:

   - 입력: 무엇을 받나요?
   - 상태: 어떤 변수나 값이 필요한가요?
   - 처리: 어떻게 변하나요?
   - 출력: 무엇을 만들어내나요?`,
      pattern: `문제를 해결할 수 있는 방법을 2개 이상 생각해보고, 장점, 단점, 시간복잡도 등을 자유롭게 비교하고 작성해보세요.`,
      abstract: `문제 해결의 핵심 아이디어를 말로 정리해보세요. 입력과 출력, 그리고 어떻게 처리할지에 대한 핵심 개념을 설명하세요.`,
      pseudocode:  `의사코드 10~20줄`,
    }
  }, [problemId])
}
