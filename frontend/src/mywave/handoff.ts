import { useLayoutEffect, type RefObject } from 'react'

/**
 * 화면 사이의 건네주기.
 *
 * 홈의 목표 카드를 누르면 그 카드가 있던 자리를 기억해 두고, 목표 화면의 히어로가
 * 그 자리에서 출발해 제자리까지 날아가며 커진다. 라우터가 화면을 통째로 갈아 끼우므로
 * 두 요소는 동시에 있지 않다. 그래서 자리(사각형)만 건네고, 받는 쪽이 FLIP 으로 되감는다.
 *
 * 내용(글, 벨루가)은 상자가 거의 도착한 뒤에 나타난다. 날아가는 동안 글이 늘어나 보이면 안 된다.
 */
const handoffs = new Map<string, { rect: DOMRect; at: number }>()
const TTL = 1500

export function rememberHandoff(id: string, element: HTMLElement | null) {
  if (!element) return
  handoffs.set(id, { rect: element.getBoundingClientRect(), at: performance.now() })
}

function takeHandoff(id: string) {
  const entry = handoffs.get(id)
  if (!entry) return null
  // 개발 모드는 layout effect 를 두 번 돌린다. 바로 지우면 두 번째에 못 받으므로 끝날 때 지운다.
  if (performance.now() - entry.at > TTL) {
    handoffs.delete(id)
    return null
  }
  return entry.rect
}

export function useHandoffEntrance(id: string | undefined, ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!id) return
    const element = ref.current
    if (!element) return
    const from = takeHandoff(id)
    if (!from) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      handoffs.delete(id)
      return
    }
    const to = element.getBoundingClientRect()
    if (to.width === 0 || to.height === 0) return

    const dx = from.left - to.left
    const dy = from.top - to.top
    const sx = from.width / to.width
    const sy = from.height / to.height
    const previousOrigin = element.style.transformOrigin
    element.style.transformOrigin = '0 0'

    const box = element.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, boxShadow: '0 0 0 rgba(46,111,242,0)' },
        { transform: 'none', boxShadow: '0 6px 16px rgba(46,111,242,0.22)' },
      ],
      { duration: 620, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' },
    )
    const parts = [...element.querySelectorAll<HTMLElement>('[data-handoff-content]')]
    const fades = parts.map((part) => part.animate(
      [{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }],
      { duration: 620, easing: 'ease-out' },
    ))
    box.onfinish = () => {
      element.style.transformOrigin = previousOrigin
      handoffs.delete(id)
    }
    return () => {
      box.cancel()
      fades.forEach((fade) => fade.cancel())
      element.style.transformOrigin = previousOrigin
    }
  }, [id, ref])
}
