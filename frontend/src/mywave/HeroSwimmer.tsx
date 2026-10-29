import { useEffect, useRef, useState } from 'react'
import { BelugaArt } from './BelugaArt'
import { useLiveliness } from './liveliness'

/**
 * 히어로 카드 안을 헤엄치는 벨루가 — 좁은 화면용.
 *
 * 넓은 화면에서는 벨루가가 카드 뒤 바다를 돌아다니지만(RoamingBeluga), 좁은 화면은 카드가
 * 화면을 꽉 채워 뒤로 지나가면 보이지 않는다. 대신 파란 히어로 카드가 곧 물이다.
 * 홈에서는 하루 예산 잔 속을, 다른 화면에서는 요약 카드의 제목 오른쪽 띠를 오간다.
 *
 * 띠(lane)의 양 끝 사이를 천천히 왕복하고, 끝에서 몸이 납작해지며 돌아선다. 누르면 뛰고 한마디 한다.
 * 조용히 단계에서는 안 보인다. 동작 줄이기를 켠 사람에게는 제자리에 떠 있다.
 */
const LINES = ['물이 참 좋네요.', '여기가 제 수영장이에요.', '간식 사기 전에 잔 한번 보기!', '천천히, 꾸준히.', '저 여기 있어요~']

export function HeroSwimmer({
  size = 60,
  className = '',
  lines = LINES,
  bump = 0,
  bumpLine,
  speed = 42,
}: {
  size?: number
  /** 띠의 자리. absolute 로 놓을 left/right/top/bottom 유틸리티를 넘긴다. */
  className?: string
  lines?: string[]
  /** 값이 바뀔 때마다 뛰고 bumpLine 을 말한다. */
  bump?: number | string
  bumpLine?: string
  /** px/s. 서두르지 않는다. */
  speed?: number
}) {
  const { quiet } = useLiveliness()
  const lane = useRef<HTMLDivElement>(null)
  const [span, setSpan] = useState(0)
  const [hop, setHop] = useState(0)
  const [line, setLine] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lastBump = useRef(bump)

  // 띠 너비를 재서 왕복 거리(--swim-span)를 정한다. 카드가 늘거나 줄면 다시 잰다.
  useEffect(() => {
    const element = lane.current
    if (!element) return
    const measure = () => setSpan(Math.max(0, element.clientWidth - size))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [size])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function say(text: string | null) {
    setHop((value) => value + 1)
    setLine(text)
    window.clearTimeout(timer.current)
    if (text) timer.current = window.setTimeout(() => setLine(null), 2600)
  }

  useEffect(() => {
    if (bump === lastBump.current) return
    lastBump.current = bump
    const id = window.setTimeout(() => say(bumpLine ?? null), 0)
    return () => window.clearTimeout(id)
  }, [bump, bumpLine])

  if (quiet) return null
  const duration = Math.max(8, (span * 2) / speed + 2)

  return (
    <div ref={lane} className={`hero-swimmer pointer-events-none absolute ${className}`} style={{ height: size }}>
      <div
        className="hero-swim-path absolute left-0 top-0"
        style={{ width: size, height: size, ['--swim-span' as string]: `${span}px`, ['--swim-duration' as string]: `${duration}s` }}
      >
        <button
          type="button"
          onClick={() => say(lines[hop % lines.length])}
          aria-label="벨루가에게 말 걸기"
          className="pointer-events-auto block h-full w-full cursor-pointer select-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {/* 뒤집기(hero-swim-face)는 그림에만 건다. 말풍선까지 뒤집히면 글이 거울로 보인다. */}
          <span className="hero-swim-face block h-full w-full">
            <span key={hop} className={`block h-full w-full ${hop > 0 ? 'beluga-hop' : ''}`}>
              <span className="swim-bob block h-full w-full">
                <BelugaArt mood="swim" swimming className="h-full w-full drop-shadow-[0_6px_10px_rgba(10,40,140,.28)]" />
              </span>
            </span>
          </span>
        </button>
        {line && (
          <div role="status" className="hero-swim-line bubble-pop absolute bottom-full left-1/2 mb-1 w-max max-w-[200px] rounded-[14px] bg-white px-3 py-2 text-[12px] font-bold leading-4 text-slate-900 shadow-[0_8px_24px_rgba(25,31,40,.18)]">
            {line}
          </div>
        )}
      </div>
    </div>
  )
}
