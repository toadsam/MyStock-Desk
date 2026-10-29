import { useEffect, useRef, useState } from 'react'
import { BelugaArt, type BelugaMood } from './BelugaArt'
import { useLiveliness } from './liveliness'

/**
 * 히어로 카드 안을 헤엄치는 벨루가 — 좁은 화면용.
 *
 * 넓은 화면에서는 벨루가가 카드 뒤 바다를 돌아다니지만(RoamingBeluga), 좁은 화면은 카드가
 * 화면을 꽉 채워 뒤로 지나가면 보이지 않는다. 대신 파란 히어로 카드가 곧 물이다.
 * 홈에서는 하루 예산 잔 속을, 다른 화면에서는 요약 카드의 제목 오른쪽 띠를 오간다.
 *
 * 띠(lane)의 양 끝 사이를 밀고 미끄러지며 왕복하고, 물결 타듯 오르내리며, 끝에서 몸이 납작해지며 돌아선다.
 * rise 만큼 위로 잠수했다 떠오르기를 가로 왕복과 다른 박자로 되풀이해 길이 매번 다르다. 누르면 뛰고 한마디 한다.
 * depth(물 깊이)를 주면 물 밖으로는 안 나간다. 몸이 다 안 잠길 만큼 얕으면 헤엄을 멈추고 바닥에 엎드린다.
 * 조용히 단계에서는 안 보인다. 동작 줄이기를 켠 사람에게는 제자리에 떠 있다.
 */
const LINES = ['물이 참 좋네요.', '여기가 제 수영장이에요.', '간식 사기 전에 잔 한번 보기!', '천천히, 꾸준히.', '저 여기 있어요~']
// 가끔 멈춰 서서 보여주는 포즈. 헤엄 그림 말고 다른 얼굴도 보여야 살아 있어 보인다.
const REST_POSES: BelugaMood[] = ['hello', 'think', 'point', 'cheer']
// 물이 얕아 바닥에 엎드렸을 때 하는 말.
const SHALLOW_LINES = ['물이 얕아요…', '여기선 헤엄을 못 쳐요.', '내일이면 다시 차요!']

export function HeroSwimmer({
  size = 60,
  className = '',
  lines = LINES,
  bump = 0,
  bumpLine,
  speed = 42,
  rise = 0,
  depth,
  shallowLines = SHALLOW_LINES,
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
  /** 띠 바닥에서 위로 오르내릴 수 있는 높이(px). 0 이면 가로로만 오간다. */
  rise?: number
  /**
   * 띠 바닥 위 물 깊이(px). 주면 벨루가는 물 밖으로 나가지 않는다.
   * 오르내림을 물 높이 안으로 줄이고, 몸이 다 안 잠길 만큼 얕으면 헤엄을 멈추고 바닥에 엎드린다.
   */
  depth?: number
  /** 엎드려 있을 때 누르면 하는 말. */
  shallowLines?: string[]
}) {
  const { quiet } = useLiveliness()
  const lane = useRef<HTMLDivElement>(null)
  const [span, setSpan] = useState(0)
  const [hop, setHop] = useState(0)
  const [line, setLine] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lastBump = useRef(bump)
  // 몸(size)이 다 안 잠기면 헤엄치지 않는다. 물이 있으면 그 안에서만 오르내린다(수면 아래 10px 여유).
  const stranded = depth !== undefined && depth < size + 4
  const room = depth === undefined ? rise : Math.max(0, Math.min(rise, depth - size - 10))
  // 14~26초마다 2.8초 동안 멈춰 다른 포즈를 보여준다.
  const [pose, setPose] = useState<BelugaMood | null>(null)
  useEffect(() => {
    if (stranded) return
    let show = 0
    let hide = 0
    const schedule = () => {
      show = window.setTimeout(() => {
        if (document.visibilityState === 'visible') setPose(REST_POSES[Math.floor(Math.random() * REST_POSES.length)])
        hide = window.setTimeout(() => {
          setPose(null)
          schedule()
        }, 2800)
      }, 14000 + Math.random() * 12000)
    }
    schedule()
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
      setPose(null)
    }
  }, [stranded])

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
  // 오르내림은 가로 왕복과 박자가 어긋나야 같은 길을 되풀이하지 않는다. 가로의 0.37배.
  const dive = Math.max(4.5, duration * 0.37)
  const bubble = line && (
    <div role="status" className="hero-swim-line bubble-pop absolute bottom-full left-1/2 mb-1 w-max max-w-[200px] rounded-[14px] bg-white px-3 py-2 text-[12px] font-bold leading-4 text-slate-900 shadow-[0_8px_24px_rgba(25,31,40,.18)]">
      {line}
    </div>
  )

  // 물이 얕다: 왼쪽 바닥에 엎드려 걱정스러운 얼굴로 숨만 쉰다. 누르면 왜 안 헤엄치는지 말한다.
  if (stranded) {
    return (
      <div ref={lane} className={`hero-swimmer pointer-events-none absolute ${className}`} style={{ height: size }}>
        <div className="absolute bottom-0 left-[12%]" style={{ width: size, height: size }}>
          <button
            type="button"
            onClick={() => say(shallowLines[hop % shallowLines.length])}
            aria-label="벨루가에게 말 걸기"
            className="pointer-events-auto block h-full w-full cursor-pointer select-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span key={hop} className={`block h-full w-full ${hop > 0 ? 'beluga-hop' : ''}`}>
              <span className="hero-stranded block h-full w-full">
                <BelugaArt mood="concern" className="h-full w-full drop-shadow-[0_6px_10px_rgba(10,40,140,.28)]" />
              </span>
            </span>
          </button>
          {bubble}
        </div>
      </div>
    )
  }

  return (
    <div ref={lane} className={`hero-swimmer pointer-events-none absolute ${className}`} style={{ height: size + room }}>
      <div
        className={`hero-swim-path absolute bottom-0 left-0 ${pose ? 'hero-swim-paused' : ''}`}
        style={{ width: size, height: size, ['--swim-span' as string]: `${span}px`, ['--swim-duration' as string]: `${duration}s`, ['--swim-rise' as string]: `${room}px`, ['--dive-duration' as string]: `${dive}s` }}
      >
       {/* 잠수했다 떠오르기. 말풍선도 같이 오르내린다. */}
       <div className={`relative h-full w-full ${room > 0 ? 'hero-swim-dive' : ''}`}>
        <button
          type="button"
          onClick={() => say(lines[hop % lines.length])}
          aria-label="벨루가에게 말 걸기"
          className="pointer-events-auto block h-full w-full cursor-pointer select-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {/* 뒤집기(hero-swim-face)는 그림에만 건다. 말풍선까지 뒤집히면 글이 거울로 보인다. */}
          <span className="hero-swim-face block h-full w-full">
            <span key={`${hop}-${pose ?? ''}`} className={`block h-full w-full ${hop > 0 ? 'beluga-hop' : pose ? 'wave-pop' : ''}`}>
              <span className={`block h-full w-full ${pose ? 'beluga-breathe' : 'hero-swim-wave'}`}>
                <BelugaArt mood={pose ?? 'swim'} swimming={!pose} className="h-full w-full drop-shadow-[0_6px_10px_rgba(10,40,140,.28)]" />
              </span>
            </span>
          </span>
        </button>
        {bubble}
       </div>
      </div>
    </div>
  )
}
