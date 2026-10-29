import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useLiveliness } from './liveliness'
import { lookAt } from './gaze'

/**
 * 풀어둔 벨루가와 화면 사이의 약속.
 *
 * 화면은 "와서 봐 줘" 하고 부르기만 한다 (callBeluga). 어디로 어떻게 헤엄쳐 올지는 벨루가가 정한다.
 * element 는 벨루가가 찾아갈 자리다. 잔, 목표 히어로, 투자 히어로처럼 방금 무슨 일이 생긴 곳.
 */
export type BelugaCall = {
  kind: 'splash' | 'cheer' | 'hop'
  element: HTMLElement | null
  /** 도착해서 하는 말. 금액은 넣지 않는다. */
  line?: string
}

const listeners = new Set<(call: BelugaCall) => void>()

export function callBeluga(call: BelugaCall) {
  // 부르면 화면의 모든 벨루가가 먼저 그쪽을 본다. 풀어둔 벨루가가 없는 단계에서도 시선은 간다.
  const rect = call.element?.getBoundingClientRect()
  if (rect) lookAt({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, 3200)
  listeners.forEach((listener) => listener(call))
}

export function onBelugaCall(listener: (call: BelugaCall) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * 벨루가를 풀어두는 조건. 신나게 단계, 데스크톱 폭, 동작 줄이기 꺼짐.
 * 모바일은 카드 사이에 틈이 없어 글을 가리므로 풀지 않는다.
 */
export function useRoamingEnabled() {
  const { lively } = useLiveliness()
  const reduce = useReducedMotion()
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const onChange = (event: MediaQueryListEvent) => setDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return lively && desktop && !reduce
}
