'use client'

import { useState, useCallback } from 'react'
import { LanguageKey } from '@/components/CodeEditor'

export function useRunner(language: LanguageKey) {
  const [stdout, setStdout] = useState('')
  const [running, setRunning] = useState(false)

  // 2. 단일 케이스 실행 함수 (출력값에 'input' 추가)
  const run = useCallback(
    async (code: string, input?: string, expectedOutput?: string) => {
      setRunning(true)
      setStdout('실행 중…')
      try {
        const res = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            code,
            stdin: input ?? '',
          }),
        })
        const j = await res.json()

        // (추가) 어떤 입력으로 실행했는지 표시
        const inputDisplay = `[입력]:\n${input ?? '(없음)'}\n\n`

        if (!j.ok) {
          setStdout(inputDisplay + `실행 오류:\n${j.error}`)
        } else {
          const actualOutput = (
            j.result?.run?.output ??
            j.result?.stdout ??
            JSON.stringify(j.result, null, 2)
          ).trim()

          if (expectedOutput) {
            const expected = expectedOutput.trim()
            if (actualOutput === expected) {
              setStdout(
                inputDisplay + `정답입니다!\n실행 결과: ${actualOutput}`,
              )
            } else {
              setStdout(
                inputDisplay +
                  `오답입니다.\n실행 결과: ${actualOutput}\n기대값: ${expected}`,
              )
            }
          } else {
            setStdout(inputDisplay + `실행 결과:\n${actualOutput}`)
          }
        }
      } catch (e: any) {
        setStdout(`네트워크 오류: ${e.message ?? e}`)
      } finally {
        setRunning(false)
      }
    },
    [language],
  )

  // 4. "전체 샘플 실행" (출력값에 'input' 추가)
  const runAllSamples = useCallback(
    async (
      code: string,
      samples: { input: string; output: string }[] = [],
    ) => {
      if (samples.length === 0) {
        setStdout('실행할 샘플 케이스가 없습니다.')
        return
      }

      setRunning(true)
      setStdout(`총 ${samples.length}개의 샘플 케이스 실행 중...`)

      let correctCount = 0
      const detailedResults: string[] = []

      try {
        // Promise.all() 대신 for...of 루프 사용 (API 속도 제한 회피)
        for (let i = 0; i < samples.length; i++) {
          const sample = samples[i]
          const expected = sample.output.trim()
          // (추가) 입력값의 첫 줄만 간단히 표시
          const truncatedInput = sample.input.trim().split('\n')[0]

          setStdout(
            `총 ${samples.length}개 중 ${
              i + 1
            }번째 샘플 실행 중...\n\n${detailedResults.join('\n')}`,
          )

          const res = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language,
              code,
              stdin: sample.input,
            }),
          })

          const j = await res.json()

          if (!j.ok) {
            detailedResults.push(
              `케이스 ${i + 1} (입력: ${truncatedInput}): 실행 실패 (${
                j.error ?? 'API 오류'
              })`,
            )
            continue // 다음 샘플로 이동
          }

          const actualOutput = (
            j.result?.run?.output ??
            j.result?.stdout ??
            ''
          ).trim()

          if (actualOutput === expected) {
            correctCount++
            detailedResults.push(
              `케이스 ${i + 1} (입력: ${truncatedInput}): 통과 (결과: ${actualOutput})`,
            )
          } else {
            detailedResults.push(
              `케이스 ${
                i + 1
              } (입력: ${truncatedInput}): 오답 (결과: ${actualOutput}, 기대값: ${expected})`,
            )
          }
        }

        // 최종 결과 요약
        const summary =
          correctCount === samples.length
            ? `모든 샘플 통과! (${correctCount}/${samples.length})`
            : `${correctCount}/${samples.length}개 샘플 통과`

        setStdout(`${summary}\n\n${detailedResults.join('\n')}`)
      } catch (e: any) {
        setStdout(`네트워크 오류: ${e.message ?? e}`)
      } finally {
        setRunning(false)
      }
    },
    [language],
  )

  return { stdout, setStdout, run, runAllSamples, running }
}