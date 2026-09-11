import { useEffect, useRef, useState } from 'react'

/**
 * 금액이 0에서 실제 값까지 올라간다.
 *
 * 금융 앱에서 이게 먹히는 이유는 화려해서가 아니라, 숫자가 방금 계산되었다는
 * 느낌을 주기 때문이다. 그래서 길면 안 된다. 700ms 안에 끝난다.
 */
export function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(target)
  const previous = useRef(target)
  const frame = useRef(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = previous.current
    previous.current = target

    if (reduceMotion || from === target || !Number.isFinite(target)) {
      setValue(target)
      return
    }

    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      // 빠르게 출발해 부드럽게 멈춘다.
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) {
        frame.current = requestAnimationFrame(step)
      }
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationMs])

  return value
}
