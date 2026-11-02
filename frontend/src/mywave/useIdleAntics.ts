import { useEffect, useRef } from 'react'

/**
 * 벨루가가 혼자 노는 박자.
 *
 * 켜져 있으면 6~11초마다 kinds 중 하나를 골라 perform 을 부른다. 직전과 같은 것은 연달아 고르지 않는다.
 * 탭이 숨어 있을 때는 건너뛴다 (돌아왔을 때 밀린 동작이 한꺼번에 터지면 안 된다).
 * kinds 는 모듈 상수처럼 바뀌지 않는 배열이어야 한다. 렌더마다 새 배열을 주면 박자가 매번 리셋된다.
 */
export function useIdleAntics<Kind extends string>(
  enabled: boolean,
  kinds: ReadonlyArray<Kind>,
  perform: (kind: Kind) => void,
  { min = 6000, max = 11000 }: { min?: number; max?: number } = {},
) {
  const latest = useRef(perform)
  useEffect(() => {
    latest.current = perform
  }, [perform])

  useEffect(() => {
    if (!enabled || kinds.length === 0) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    let last: Kind | null = null
    const schedule = () => {
      timer = window.setTimeout(() => {
        const pool = kinds.length > 1 ? kinds.filter((kind) => kind !== last) : kinds
        const kind = pool[Math.floor(Math.random() * pool.length)]
        last = kind
        if (document.visibilityState === 'visible') latest.current(kind)
        schedule()
      }, min + Math.random() * (max - min))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [enabled, kinds, min, max])
}
