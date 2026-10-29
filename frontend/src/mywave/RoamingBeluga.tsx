import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { BelugaArt, type BelugaMood } from './BelugaArt'
import { BubbleBurst } from './motion'
import { onBelugaCall, type BelugaCall } from './roaming'
import { useDrowsy, useWakeToken } from './useDrowsy'

/**
 * 풀어둔 벨루가 — 카드 뒤 바다를 헤엄친다.
 *
 * 화면 전체가 바다다. 벨루가는 카드들 "뒤"에서 헤엄쳐서, 카드와 카드 사이 틈과 가장자리에서만 보인다.
 * 수족관 유리 뒤로 지나가는 물고기처럼. 글을 가리지 않고 버튼을 막지 않는다.
 *
 * 하루:
 *  1. 집(사이드바 아래)에서 쉰다. 화면이 바뀌면 그 화면 한마디를 한다.
 *  2. 9~18초 뒤 카드 뒤로 들어가 틈을 골라 두세 번 헤엄치고, 틈마다 잠시 머문다.
 *  3. 집으로 돌아와 한마디 하고 다시 쉰다.
 *
 * 화면이 부르면(callBeluga) 하던 일을 멈추고 카드 앞으로 나와 그 자리로 헤엄쳐 가 뛰고 돌아온다.
 * 누르면 말을 걸고, 잡아서 던지면 미끄러졌다가 다시 헤엄친다.
 * 집은 Companion 이 비워 둔 자리([data-beluga-home])다. 벨루가는 한 마리뿐이다.
 */
const SIZE = 112
const SPEED = 110 // px/s. 서두르지 않는다.
const IDLE_LINES = ['물이 참 좋네요.', '저 여기 있어요~', '천천히, 꾸준히.', '오늘 기록 잊지 않았죠?', '간지러워요!', '카드 뒤는 시원해요.']
// 쉴 때 하는 포즈. 틈에서, 집에서 번갈아 보여준다. 나쁜 소식용 concern 은 여기 없다.
const REST_POSES: BelugaMood[] = ['hello', 'think', 'point', 'cheer', 'hello']

type Point = { x: number; y: number }

export function RoamingBeluga({ pageLine }: { pageLine: string }) {
  const location = useLocation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const pitch = useMotionValue(0)
  // 보는 방향. 1 이면 오른쪽, -1 이면 왼쪽. 돌아설 때 0 을 지나며 납작해진다.
  const facing = useMotionValue(1)
  // 공중제비. 쉴 때 가끔 한 바퀴.
  const roll = useMotionValue(0)
  const [front, setFront] = useState(true)
  const [shown, setShown] = useState(false)
  const [swimming, setSwimming] = useState(false)
  const [mood, setMood] = useState<BelugaMood>('hello')
  const [line, setLine] = useState<string | null>(null)
  // 마지막 몸짓. 깡충(hop)인지 잠에서 깬 움찔(startle)인지.
  const [jump, setJump] = useState<{ kind: 'hop' | 'startle'; token: number }>({ kind: 'hop', token: 0 })
  const [burst, setBurst] = useState(0)
  const [trail, setTrail] = useState<Array<{ id: number; x: number; y: number }>>([])
  const generation = useRef(0)
  const lineTimer = useRef<number | undefined>(undefined)
  const trailId = useRef(0)
  // 헤엄치는 동안 기포를 어느 쪽에 남길지 알기 위한 방향 거울 (facing 과 같이 쓴다)
  const flipRef = useRef(false)
  // 1분 동안 아무 일도 없으면 집에서 존다. 자는 동안은 나가지 않고, 깨면 움찔한다.
  const drowsy = useDrowsy()
  const asleepRef = useRef(false)
  useEffect(() => {
    asleepRef.current = drowsy
  }, [drowsy])
  const wake = useWakeToken(drowsy)
  useEffect(() => {
    if (wake === 0) return
    // 깨면 눈이 동그래진 얼굴로 움찔하고 원래 얼굴로 돌아온다.
    const id = window.setTimeout(() => {
      setJump((value) => ({ kind: 'startle', token: value.token + 1 }))
      setMood('surprise')
    }, 0)
    const back = window.setTimeout(() => setMood('hello'), 1500)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(back)
    }
  }, [wake])

  const say = useCallback((text: string | null, mode: 'hop' | 'quiet' = 'hop') => {
    if (mode === 'hop') setJump((value) => ({ kind: 'hop', token: value.token + 1 }))
    setLine(text)
    window.clearTimeout(lineTimer.current)
    if (text) lineTimer.current = window.setTimeout(() => setLine(null), 2800)
  }, [])

  /** 그림은 오른쪽을 본다. 가는 쪽이 왼쪽이면 돌아선다. 몸이 0 을 지나며 납작해졌다 펴지는 0.35초. */
  const turnToward = useCallback(async (dx: number) => {
    if (Math.abs(dx) <= 24) return
    const want = dx < 0 ? -1 : 1
    if (facing.get() === want) return
    flipRef.current = want < 0
    await animate(facing, want, { duration: 0.35, ease: 'easeInOut' })
  }, [facing])

  /**
   * 지금 자리에서 target 까지 헤엄친다.
   * 한 번에 미끄러지듯 가지 않는다. 물고기처럼 꼬리로 한 번 힘차게 밀고(빠르게) 미끄러지기(느려짐)를
   * 거리만큼 되풀이하고, 토막 사이사이 길이 살짝 위아래로 물결친다. 오르내림만큼 몸을 기울인다.
   */
  const swimTo = useCallback(async (target: Point, speed = SPEED, alive: () => boolean = () => true) => {
    const x0 = x.get()
    const y0 = y.get()
    const dx = target.x - x0
    const dy = target.y - y0
    const distance = Math.hypot(dx, dy)
    if (distance < 4) return
    await turnToward(dx)
    if (!alive()) return
    setSwimming(true)
    const angle = (Math.atan2(dy, Math.max(60, Math.abs(dx))) * 180) / Math.PI
    animate(pitch, Math.max(-16, Math.min(16, angle * 0.6)), { duration: 0.5 })
    const bubbles = window.setInterval(() => {
      if (!alive()) return
      const id = ++trailId.current
      // 기포는 꼬리 쪽(가는 방향의 반대)에 남는다.
      setTrail((items) => [...items.slice(-10), { id, x: x.get() + (flipRef.current ? SIZE * 0.75 : SIZE * 0.2), y: y.get() + SIZE * 0.55 }])
      window.setTimeout(() => setTrail((items) => items.filter((item) => item.id !== id)), 1500)
    }, 520)
    try {
      const strokes = Math.max(1, Math.round(distance / 170))
      const wobble = rand(0, Math.PI * 2)
      for (let index = 1; index <= strokes && alive(); index += 1) {
        const t = index / strokes
        const last = index === strokes
        // 가로로 갈수록 물결이 크고, 마지막 토막은 정확히 목적지에 닿는다.
        const sway = last ? 0 : Math.sin(wobble + index * 1.9) * 12 * (Math.abs(dx) / distance)
        const duration = Math.max(0.55, distance / strokes / speed)
        await Promise.all([
          animate(x, x0 + dx * t, { duration, ease: [0.18, 0.72, 0.32, 1] }),
          animate(y, y0 + dy * t + sway, { duration, ease: [0.18, 0.72, 0.32, 1] }),
        ])
      }
    } finally {
      window.clearInterval(bubbles)
    }
    if (!alive()) return
    animate(pitch, 0, { duration: 0.6 })
    setSwimming(false)
  }, [pitch, turnToward, x, y])

  /** 쉬는 동안 가끔 다른 포즈를 보여주고, 드물게 공중제비를 돈다. ms 만큼 머문다. */
  const linger = useCallback(async (ms: number, alive: () => boolean) => {
    const until = performance.now() + ms
    while (alive() && performance.now() < until) {
      await sleep(Math.min(2600, Math.max(200, until - performance.now())))
      if (!alive()) return
      const dice = Math.random()
      if (dice < 0.08) {
        roll.set(0)
        await animate(roll, 360, { duration: 0.9, ease: [0.4, 0, 0.2, 1] })
        roll.set(0)
      } else if (dice < 0.4) {
        setMood(pick(REST_POSES))
      }
    }
  }, [roll])

  /** 집에서 쉬고, 틈을 헤엄치고, 돌아오는 하루. generation 이 바뀌면 조용히 멈춘다. */
  const startDay = useCallback((fromHome: boolean) => {
    const mine = ++generation.current
    const alive = () => generation.current === mine
    const run = async () => {
      const home = homePoint()
      if (!home) return
      if (fromHome) {
        x.set(home.x)
        y.set(home.y)
        setFront(true)
        setShown(true)
        await sleep(700)
        if (!alive()) return
        say(pageLine)
      }
      let atHome = fromHome
      while (alive()) {
        if (atHome) {
          await linger(rand(9000, 18000), alive)
          if (!alive()) return
          if (document.visibilityState !== 'visible' || asleepRef.current) continue
          setMood('hello')
          setFront(false)
          await sleep(200)
        }
        const trips = randInt(2, 4)
        for (let index = 0; index < trips && alive(); index += 1) {
          const target = pickGap({ x: x.get(), y: y.get() })
          if (!target) break
          await swimTo(target, SPEED, alive)
          if (!alive()) return
          setMood(pick(REST_POSES))
          await linger(rand(3000, 7000), alive)
        }
        if (!alive()) return
        const back = homePoint()
        if (!back) return
        setMood('hello')
        await swimTo(back, SPEED * 1.3, alive)
        if (!alive()) return
        await turnToward(1)
        setFront(true)
        atHome = true
        say(pick(IDLE_LINES))
      }
    }
    void run()
  }, [linger, pageLine, say, swimTo, turnToward, x, y])

  // 화면이 바뀌면 집에서 다시 시작한다. 배치가 달라져 틈 자리도 달라지기 때문이다.
  useEffect(() => {
    startDay(true)
    return () => {
      generation.current += 1
    }
  }, [startDay, location.pathname])

  useEffect(() => () => window.clearTimeout(lineTimer.current), [])

  // 화면이 부른다: 앞으로 나와 그 자리로 헤엄쳐 가서 뛴다.
  useEffect(() => onBelugaCall((call: BelugaCall) => {
    const mine = ++generation.current
    const alive = () => generation.current === mine
    const run = async () => {
      const rect = call.element?.getBoundingClientRect()
      const target: Point = rect
        ? { x: clamp(rect.left + rect.width / 2 - SIZE / 2, 8, window.innerWidth - SIZE - 8), y: clamp(rect.top - SIZE * 0.55, 8, window.innerHeight - SIZE - 8) }
        : { x: x.get(), y: y.get() }
      setFront(true)
      setMood(call.kind === 'cheer' ? 'cheer' : 'hello')
      // 먼저 그쪽으로 몸을 돌려 쳐다보고(눈은 gaze 가 따라간다), 한 박자 뒤에 출발한다.
      await turnToward(target.x - x.get())
      await sleep(380)
      if (!alive()) return
      await swimTo(target, SPEED * 2.4, alive)
      if (!alive()) return
      setJump((value) => ({ kind: 'hop', token: value.token + 1 }))
      setBurst((value) => value + 1)
      if (call.line) say(call.line, 'quiet')
      await sleep(2400)
      if (!alive()) return
      setMood('hello')
      setFront(false)
      startDay(false)
    }
    void run()
  }), [say, startDay, swimTo, turnToward, x, y])

  return (
    <div aria-hidden={!shown} className="pointer-events-none fixed inset-0 hidden lg:block" style={{ zIndex: front ? 60 : 0, opacity: shown ? 1 : 0, transition: 'opacity 400ms' }}>
      {trail.map((bubble) => (
        <span key={bubble.id} className="trail-bubble absolute h-2 w-2 rounded-full bg-[#9ecbff]/70" style={{ left: bubble.x, top: bubble.y }} />
      ))}
      <motion.div
        style={{ x, y, width: SIZE, height: SIZE }}
        className="pointer-events-auto absolute left-0 top-0 cursor-grab active:cursor-grabbing"
        drag
        dragMomentum
        dragTransition={{ power: 0.5, timeConstant: 180 }}
        onDragStart={() => {
          generation.current += 1
          setFront(true)
          setSwimming(false)
          say(null, 'quiet')
        }}
        onDragEnd={() => {
          window.setTimeout(() => startDay(false), 900)
        }}
        onTap={() => {
          setFront(true)
          say(pick(IDLE_LINES))
        }}
      >
        <motion.div style={{ scaleX: facing, width: SIZE, height: SIZE }}>
          <motion.div style={{ rotate: pitch, width: SIZE, height: SIZE }}>
           <motion.div style={{ rotate: roll, width: SIZE, height: SIZE }}>
            <div className={`${swimming ? 'swim-bob' : 'beluga-breathe'} h-full w-full`}>
              <span key={jump.token} className={`block h-full w-full ${jump.token === 0 ? '' : jump.kind === 'startle' ? 'beluga-startle' : 'beluga-hop'}`}>
                <BelugaArt mood={swimming ? 'swim' : mood} asleep={drowsy && front && !swimming} swimming={swimming} className="h-full w-full drop-shadow-[0_12px_18px_rgba(10,40,140,.28)]" />
              </span>
            </div>
           </motion.div>
          </motion.div>
        </motion.div>
        <BubbleBurst token={burst} />
        {line && front && (
          <div role="status" className={`bubble-pop absolute bottom-full mb-1 w-max max-w-[220px] rounded-[16px] bg-white px-3.5 py-2.5 text-[13px] font-bold leading-5 text-slate-900 shadow-[0_8px_24px_rgba(25,31,40,.18)] ${x.get() > window.innerWidth / 2 ? 'right-0' : 'left-0'}`}>
            {line}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/** 집: Companion 이 비워 둔 자리. 사이드바가 화면에 붙어 있어 자리는 늘 같다. */
function homePoint(): Point | null {
  const home = document.querySelector<HTMLElement>('[data-beluga-home]')
  if (!home) return null
  const rect = home.getBoundingClientRect()
  if (rect.width === 0) return null
  return { x: rect.left + (rect.width - SIZE) / 2, y: rect.top + (rect.height - SIZE) / 2 }
}

/**
 * 다음에 갈 틈을 고른다.
 * 본문 안에서 점을 마흔 개 뽑아, 카드에 덜 가려지는 자리일수록, 지금 자리에서 멀수록 좋게 친다.
 * 완전히 보이는 자리는 드물다. 반쯤 가려져 빼꼼 보이는 것이 오히려 이 벨루가의 맛이다.
 */
function pickGap(from: Point): Point | null {
  const main = document.querySelector('main')
  if (!main) return null
  const area = main.getBoundingClientRect()
  const left = Math.max(area.left, 0)
  const top = Math.max(area.top, 0)
  const right = Math.min(area.right, window.innerWidth) - SIZE
  const bottom = Math.min(area.bottom, window.innerHeight) - SIZE
  if (right <= left || bottom <= top) return null
  const blockers = [...main.querySelectorAll<HTMLElement>('.card-lift, section.shadow-blue, header, label, [data-beluga-block]')]
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight)

  let best: { point: Point; score: number } | null = null
  for (let index = 0; index < 40; index += 1) {
    const point = { x: rand(left, right), y: rand(top, bottom) }
    const distance = Math.hypot(point.x - from.x, point.y - from.y)
    if (distance < 160) continue
    const visible = visibleFraction(point, blockers)
    const score = visible * 1.2 + Math.min(distance, 600) / 600 * 0.5 + Math.random() * 0.25
    if (!best || score > best.score) best = { point, score }
  }
  return best ? best.point : { x: right, y: bottom }
}

/** 벨루가 상자 위 아홉 점 중 어떤 카드에도 덮이지 않는 점의 비율. */
function visibleFraction(point: Point, blockers: DOMRect[]) {
  let visible = 0
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const px = point.x + (SIZE * (col + 0.5)) / 3
      const py = point.y + (SIZE * (row + 0.5)) / 3
      const covered = blockers.some((rect) => px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom)
      if (!covered) visible += 1
    }
  }
  return visible / 9
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
