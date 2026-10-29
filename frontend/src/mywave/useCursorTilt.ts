import { useEffect, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useLiveliness } from './liveliness'

/**
 * 커서를 따라 몸을 트는 벨루가.
 *
 * 카드 위에서 커서가 움직이면 벨루가가 그쪽으로 아주 조금 기울고 미끄러진다.
 * 스프링이라 커서가 떠나면 천천히 제자리로 돌아온다. 터치 화면, 동작 줄이기, 조용히 단계에서는 아무 일도 없다.
 *
 * global 이면 카드 밖에서도 본다. 화면 어디에 커서가 있든 벨루가(card 가 가리키는 카드)의 중심에서
 * 그쪽으로 몸을 튼다. 신나게 단계에서 쓴다.
 *
 * card 는 호출하는 쪽이 만든 ref 다. handlers 는 카드에, style 은 벨루가를 감싼 motion.div 에 준다.
 */
export function useCursorTilt(maxDegrees = 7, maxShift = 10, global = false, card?: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion()
  const { quiet } = useLiveliness()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 90, damping: 16, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 90, damping: 16, mass: 0.6 })
  const rotate = useTransform(sx, [-1, 1], [-maxDegrees, maxDegrees])
  const translateX = useTransform(sx, [-1, 1], [-maxShift, maxShift])
  const translateY = useTransform(sy, [-1, 1], [-maxShift * 0.6, maxShift * 0.6])
  const off = !!reduce || quiet

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (off || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    x.set(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1))
    y.set(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1))
  }
  const onPointerLeave = () => {
    if (global) return
    x.set(0)
    y.set(0)
  }

  useEffect(() => {
    if (!global || off || !card) return
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const element = card.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      if (rect.width === 0) return
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      x.set(clamp((event.clientX - centerX) / (window.innerWidth / 2)))
      y.set(clamp((event.clientY - centerY) / (window.innerHeight / 2)))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [global, off, card, x, y])

  return { handlers: { onPointerMove, onPointerLeave }, style: { rotate, x: translateX, y: translateY } }
}

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value))
}
