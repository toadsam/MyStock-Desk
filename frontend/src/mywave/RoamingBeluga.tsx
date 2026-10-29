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
 *  1. 집(사이드바 아래)에서 떠다니며 쉰다. 화면이 바뀌면 그 화면 한마디를 한다.
 *  2. 5~11초 뒤 카드 뒤로 들어가 틈을 골라 서너 번 헤엄치고, 틈마다 잠시 떠다닌다.
 *  3. 집으로 돌아와 한마디 하고 다시 쉰다.
 *
 * 움직임은 전부 매 프레임 직접 그린다(requestAnimationFrame). 가는 길은 직선이 아니라 S 자로 휘고,
 * 그 길 위를 꼬리질 박자에 맞춰 밀고(빠르게) 미끄러지며(느리게) 끊김 없이 나아간다.
 * 쉴 때도 가만있지 않고 자리 둘레를 천천히 떠다니며 두리번거리고, 포즈를 바꾸고, 가끔 한 바퀴 돈다.
 *
 * 화면이 부르면(callBeluga) 하던 일을 멈추고 카드 앞으로 나와 그 자리로 헤엄쳐 가 뛰고 돌아온다.
 * 누르면 말을 걸고, 잡아서 던지면 미끄러졌다가 다시 헤엄친다.
 * 집은 Companion 이 비워 둔 자리([data-beluga-home])다. 벨루가는 한 마리뿐이다.
 */
const SIZE = 112
const SPEED = 120 // px/s 평균. 밀 때는 이보다 빠르고 미끄러질 때는 느리다.
const STROKE_HZ = 1.15 // 보통 속도일 때 초당 꼬리질 횟수
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
  // 공중제비. 쉴 때 가끔, 신날 때 헤엄치다가 한 바퀴.
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
  // 지금 보고 있는(또는 돌아서는 중인) 방향. facing 애니메이션을 겹쳐 걸지 않기 위한 거울.
  const facingWant = useRef<1 | -1>(1)
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
    if (facingWant.current === want) return
    facingWant.current = want
    await animate(facing, want, { duration: 0.35, ease: 'easeInOut' })
  }, [facing])

  /** 기포 하나를 꼬리 쪽(가는 방향의 반대)에 남긴다. */
  const dropBubble = useCallback(() => {
    const id = ++trailId.current
    setTrail((items) => [...items.slice(-10), { id, x: x.get() + (facingWant.current < 0 ? SIZE * 0.75 : SIZE * 0.2), y: y.get() + SIZE * 0.55 }])
    window.setTimeout(() => setTrail((items) => items.filter((item) => item.id !== id)), 1500)
  }, [x, y])

  /** 한 바퀴 공중제비. 끝나면 각도를 0 으로 되돌려 다음에 또 돌 수 있게 한다. */
  const somersault = useCallback(async () => {
    roll.set(0)
    await animate(roll, 360, { duration: 1.0, ease: [0.4, 0, 0.2, 1] })
    roll.set(0)
  }, [roll])

  /**
   * 지금 자리에서 target 까지 헤엄친다.
   * 직선이 아니라 S 자로 휜 길을 따라, 꼬리질 박자에 맞춰 밀고 미끄러지기를 되풀이하며 끊김 없이 나아간다.
   * 몸은 길이 향하는 쪽으로 기울고, 꼬리질마다 길 위아래로 살짝 들썩이며, 밀 때 기포를 남긴다.
   * 방향이 바뀌면 가는 중에 돌아선다. playful 이면 가끔 가다가 한 바퀴 돈다.
   */
  const swimTo = useCallback((target: Point, speed = SPEED, alive: () => boolean = () => true, playful = false) => new Promise<void>((resolve) => {
    const from = { x: x.get(), y: y.get() }
    const distance = Math.hypot(target.x - from.x, target.y - from.y)
    if (distance < 6) {
      resolve()
      return
    }
    const path = bendPath(from, target, Math.min(140, distance * 0.28))
    setSwimming(true)
    let travelled = 0
    let phase = rand(0, Math.PI * 2)
    let last = performance.now()
    let lastBubble = 0
    // 신날 때 셋 중 하나는 가다가 한 바퀴 돈다. 짧은 길에서는 안 돈다.
    let rolled = !playful || distance < 260 || Math.random() > 0.35
    const rollAt = rand(0.3, 0.65) * path.length
    const step = (now: number) => {
      if (!alive()) {
        resolve()
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // 꼬리질 박자. 빠르게 갈 때는 박자도 조금 빠르다.
      phase += dt * Math.PI * 2 * STROKE_HZ * Math.sqrt(speed / SPEED)
      const push = Math.pow(0.5 + 0.5 * Math.sin(phase), 2) // 0~1, 평균 3/8
      // 밀 때 1.75배, 미끄러질 때 0.55배. 평균이 speed 가 된다. 목적지 앞에서는 미끄러지듯 느려진다.
      const brake = Math.min(1, 0.3 + (path.length - travelled) / 150)
      travelled += speed * (0.55 + push * 1.2) * brake * dt
      const s = Math.min(path.length, travelled)
      const here = path.at(s)
      const ahead = path.at(Math.min(path.length, s + 10))
      const vx = ahead.x - here.x
      const vy = ahead.y - here.y
      const len = Math.hypot(vx, vy) || 1
      // 꼬리질에 맞춰 몸이 길 위아래로 살짝 들썩인다.
      const bob = Math.sin(phase - 0.8) * 5
      x.set(here.x + (-vy / len) * bob)
      y.set(here.y + (vx / len) * bob)
      // 가는 쪽을 본다. 길이 휘어 방향이 바뀌면 가는 중에 돌아선다.
      if (Math.abs(vx) > len * 0.3) void turnToward(vx < 0 ? -100 : 100)
      // 오르내림만큼 기울인다. 홱 꺾지 않고 조금씩 따라간다.
      const want = clamp(((Math.atan2(vy, Math.max(len * 0.6, Math.abs(vx))) * 180) / Math.PI) * 0.7, -18, 18)
      pitch.set(pitch.get() + (want - pitch.get()) * Math.min(1, dt * 6))
      if (push > 0.8 && now - lastBubble > 420) {
        lastBubble = now
        dropBubble()
      }
      if (!rolled && s >= rollAt) {
        rolled = true
        void somersault()
      }
      if (s >= path.length) {
        setSwimming(false)
        animate(pitch, 0, { duration: 0.6 })
        resolve()
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }), [dropBubble, pitch, somersault, turnToward, x, y])

  /**
   * ms 만큼 쉰다. 쉬는 동안도 가만있지 않는다.
   * 자리 둘레를 천천히 떠다니며(가로세로 박자가 달라 같은 길을 두 번 그리지 않는다) 떠가는 쪽으로 살짝 기울고,
   * 2~3초마다 주사위를 굴려 포즈를 바꾸거나, 반대쪽을 두리번거리거나, 한 바퀴 돈다. 졸 때는 아주 조금만 흔들린다.
   */
  const linger = useCallback((ms: number, alive: () => boolean) => new Promise<void>((resolve) => {
    const anchor = { x: x.get(), y: y.get() }
    const start = performance.now()
    const phaseX = rand(0, Math.PI * 2)
    const phaseY = rand(0, Math.PI * 2)
    const hzX = rand(0.1, 0.17)
    const hzY = rand(0.16, 0.26)
    let nextDice = start + rand(1800, 3200)
    const step = (now: number) => {
      if (!alive()) {
        resolve()
        return
      }
      const t = (now - start) / 1000
      // 처음 1초는 서서히 커져 도착하자마자 튀지 않는다. 졸면 0.35배.
      const amp = Math.min(1, t / 1.2) * (asleepRef.current ? 0.35 : 1)
      const ax = Math.PI * 2 * hzX
      const ay = Math.PI * 2 * hzY
      x.set(anchor.x + Math.sin(t * ax + phaseX) * 16 * amp)
      y.set(anchor.y + Math.sin(t * ay + phaseY) * 16 * amp)
      const wantPitch = Math.cos(t * ay + phaseY) * 6 * amp
      pitch.set(pitch.get() + (wantPitch - pitch.get()) * 0.06)
      if (now - start >= ms) {
        resolve()
        return
      }
      if (now >= nextDice) {
        nextDice = now + rand(1800, 3200)
        const dice = Math.random()
        if (asleepRef.current) {
          // 자는 동안은 포즈도 재주도 없다.
        } else if (dice < 0.1) {
          void somersault()
        } else if (dice < 0.42) {
          setMood(pick(REST_POSES))
        } else if (dice < 0.6) {
          void turnToward(facingWant.current > 0 ? -100 : 100)
        }
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }), [pitch, somersault, turnToward, x, y])

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
          await linger(rand(5000, 11000), alive)
          if (!alive()) return
          if (document.visibilityState !== 'visible' || asleepRef.current) continue
          setMood('hello')
          setFront(false)
          await sleep(200)
        }
        const trips = randInt(3, 5)
        for (let index = 0; index < trips && alive(); index += 1) {
          const target = pickGap({ x: x.get(), y: y.get() })
          if (!target) break
          await swimTo(target, SPEED, alive, true)
          if (!alive()) return
          setMood(pick(REST_POSES))
          await linger(rand(2000, 5000), alive)
        }
        if (!alive()) return
        const back = homePoint()
        if (!back) return
        setMood('hello')
        await swimTo(back, SPEED * 1.3, alive)
        if (!alive()) return
        await turnToward(100)
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

type Path = { length: number; at: (s: number) => Point }

/**
 * from 에서 to 로 가는 휜 길. 양 끝 1/3 지점의 조종점을 길의 수직 방향으로 제각각 밀어 S 자나 C 자가 된다.
 * 길이 따라 고른 속도로 걸을 수 있게 쉰 토막으로 잘라 누적 길이표를 만든다. at(s) 는 출발점에서 s px 간 자리.
 */
function bendPath(from: Point, to: Point, bend: number): Path {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy) || 1
  const nx = -dy / d
  const ny = dx / d
  const k1 = bend * rand(-1, 1)
  const k2 = bend * rand(-1, 1)
  const c1 = { x: from.x + dx / 3 + nx * k1, y: from.y + dy / 3 + ny * k1 }
  const c2 = { x: to.x - dx / 3 + nx * k2, y: to.y - dy / 3 + ny * k2 }
  const curve = (t: number): Point => {
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const e = t * t * t
    return { x: a * from.x + b * c1.x + c * c2.x + e * to.x, y: a * from.y + b * c1.y + c * c2.y + e * to.y }
  }
  const segments = 50
  const points: Point[] = []
  const lengths: number[] = [0]
  for (let index = 0; index <= segments; index += 1) {
    const point = curve(index / segments)
    if (index > 0) lengths.push(lengths[index - 1] + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y))
    points.push(point)
  }
  const length = lengths[segments]
  return {
    length,
    at(s: number) {
      const target = clamp(s, 0, length)
      let index = 1
      while (index < segments && lengths[index] < target) index += 1
      const span = lengths[index] - lengths[index - 1] || 1
      const t = (target - lengths[index - 1]) / span
      const p = points[index - 1]
      const q = points[index]
      return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }
    },
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
