import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { LIVELINESS_LEVELS, useLiveliness } from './liveliness'

/**
 * 살아 있는 화면을 만드는 작은 조각들.
 *
 * 세 층으로 나눈다. 층마다 세기가 다르다.
 *  1. 가만히 있어도 숨 쉬는 것 — 기포, 벨루가 숨쉬기, 흐르는 빛. 아주 옅고 느리다.
 *  2. 만지면 반응하는 것 — 커서 쪽으로 몸을 트는 벨루가(useCursorTilt), 굴러가는 숫자. 짧고 탱글하다.
 *  3. 순간의 연출 — 타자 치듯 찍히는 말, 기포 폭발, 그려지는 체크. 드물게, 크게.
 *
 * 동작 줄이기를 켜면 1·2층은 멈추고 3층은 결과만 보여준다.
 */

/* ---------------------------------------------------------------------------
   오도미터 — 자릿수마다 굴러가는 숫자
   ---------------------------------------------------------------------------
   카운트업은 값이 "흘러간다"면 오도미터는 값이 "맞춰진다". 각 자리가 0~9 띠 위에서
   스프링으로 제자리를 찾아가고, 왼쪽 자리일수록 조금 늦게 멈춘다.
   쉼표와 소수점은 움직이지 않는다. 읽어야 할 것은 숫자뿐이다.
   --------------------------------------------------------------------------- */
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function Odometer({ value, className = '' }: { value: string; className?: string }) {
  const reduce = useReducedMotion()
  // 오른쪽부터 센 자리 번호를 key 로 쓴다. 자릿수가 늘어도 같은 자리는 같은 띠를 그대로 돌린다.
  const chars = [...value]
  const items: Array<{ char: string; isDigit: boolean; key: string; place: number }> = []
  for (let index = chars.length - 1, place = 0; index >= 0; index -= 1) {
    const char = chars[index]
    const isDigit = char >= '0' && char <= '9'
    items.unshift({ char, isDigit, key: isDigit ? `d${place}` : `s${place}${char}`, place })
    if (isDigit) place += 1
  }

  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`} role="img" aria-label={value}>
      {items.map((item) => (item.isDigit
        ? <Digit key={item.key} digit={Number(item.char)} place={item.place} reduce={!!reduce} />
        : <span key={item.key} aria-hidden="true">{item.char}</span>))}
    </span>
  )
}

function Digit({ digit, place, reduce }: { digit: number; place: number; reduce: boolean }) {
  return (
    <span aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden align-baseline leading-none">
      {/* 보이지 않는 0 이 폭을 잡는다 (가장 넓은 숫자). 자리가 굴러도 폭이 흔들리지 않는다. 띠는 그 위를 미끄러진다. */}
      <span className="invisible block h-[1em] leading-none">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 block text-center"
        initial={{ y: '0em' }}
        animate={{ y: `${-digit}em` }}
        transition={reduce
          ? { duration: 0 }
          : { type: 'spring', stiffness: 110, damping: 19, mass: 0.9, delay: Math.min(place, 8) * 0.05 }}
      >
        {DIGITS.map((d) => <span key={d} className="block h-[1em] leading-none">{d}</span>)}
      </motion.span>
    </span>
  )
}

/* ---------------------------------------------------------------------------
   기포 — 히어로 안에서 천천히 올라가 사라진다
   ---------------------------------------------------------------------------
   위치와 박자는 고정한다. 렌더마다 바뀌면 화면이 들썩이는 것처럼 보인다.
   --------------------------------------------------------------------------- */
const BUBBLES = [
  { left: 6, size: 7, delay: 0, duration: 7.5 },
  { left: 18, size: 5, delay: 2.4, duration: 6.4 },
  { left: 33, size: 9, delay: 1.1, duration: 8.6 },
  { left: 52, size: 4, delay: 3.6, duration: 5.8 },
  { left: 64, size: 6, delay: 0.7, duration: 7.1 },
  { left: 79, size: 8, delay: 2.9, duration: 8.1 },
  { left: 91, size: 5, delay: 1.8, duration: 6.7 },
]

export function Bubbles({ rise = 320 }: { rise?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ ['--rise' as string]: `${rise}px` }}>
      {BUBBLES.map((bubble, index) => (
        <span
          key={index}
          className="hero-bubble absolute -bottom-3 rounded-full"
          style={{
            left: `${bubble.left}%`,
            width: bubble.size,
            height: bubble.size,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   기포 폭발 — 마일스톤을 넘은 순간
   ---------------------------------------------------------------------------
   꽃가루(Celebration)는 목표 완료 하나에만 쓴다. 중간 마일스톤은 이 정도면 충분하다.
   --------------------------------------------------------------------------- */
const BURST = Array.from({ length: 16 }, (_, index) => ({
  angle: (index / 16) * Math.PI * 2 + (index % 2) * 0.2,
  distance: 90 + (index % 3) * 34,
  size: 6 + (index % 4) * 3,
  delay: (index % 5) * 30,
}))

export function BubbleBurst({ token }: { token: number }) {
  if (token === 0) return null
  return (
    <div key={token} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {BURST.map((piece, index) => (
        <span
          key={index}
          className="burst-bubble absolute left-1/2 top-1/2 rounded-full bg-white"
          style={{
            width: piece.size,
            height: piece.size,
            marginLeft: -piece.size / 2,
            marginTop: -piece.size / 2,
            animationDelay: `${piece.delay}ms`,
            ['--dx' as string]: `${Math.cos(piece.angle) * piece.distance}px`,
            ['--dy' as string]: `${Math.sin(piece.angle) * piece.distance}px`,
          }}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   타자 효과 — 벨루가의 말이 한 글자씩 찍힌다
   ---------------------------------------------------------------------------
   길이에 상관없이 1.4초 안에 끝난다. 말이 길다고 오래 기다리게 하면 안 된다.
   이미 읽은 말(저장된 대화)은 다시 찍지 않는다. 처음 나타나는 말에만 쓴다.
   --------------------------------------------------------------------------- */
export function Typewriter({ text, className = '' }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  // 어떤 문장을 어디까지 찍었는지. 문장이 바뀌면 처음부터 다시 찍는다.
  const [progress, setProgress] = useState({ text, shown: 0 })
  const frame = useRef(0)

  useEffect(() => {
    if (reduce) return
    const total = Math.min(1400, Math.max(400, text.length * 28))
    const start = performance.now()
    const step = (now: number) => {
      const ratio = Math.min(1, (now - start) / total)
      setProgress({ text, shown: Math.round(ratio * text.length) })
      if (ratio < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [text, reduce])

  const shown = reduce ? text.length : progress.text === text ? progress.shown : 0
  const done = shown >= text.length
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      {!done && <span aria-hidden="true" className="typing-caret" />}
    </span>
  )
}

/* ---------------------------------------------------------------------------
   그려지는 체크 — 저장이 끝났다는 신호
   --------------------------------------------------------------------------- */
export function CheckDraw({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * 저장·삭제 결과를 알리는 한 줄. 잘 됐으면 체크가 그려지고, 안 됐으면 붉게 선다.
 * 같은 문장이 다시 와도 key 가 바뀌어 체크가 다시 그려진다.
 */
export function Notice({ text, className = '' }: { text: string; className?: string }) {
  const bad = /실패|못했|못 했|오류|않았/.test(text)
  return (
    <div
      key={text}
      role="status"
      className={`notice-in flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-black ${bad ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'} ${className}`}
    >
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${bad ? 'bg-red-500' : 'bg-blue-700'}`}>
        {bad ? <span className="text-[13px] font-black leading-none">!</span> : <CheckDraw className="h-3.5 w-3.5" />}
      </span>
      {text}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   차트 끝점 — 가장 최근 달은 맥박처럼 뛴다
   ---------------------------------------------------------------------------
   Recharts 의 dot 렌더러. 값이 없는 달(기록 전)은 점을 찍지 않는다.
   --------------------------------------------------------------------------- */
export function LiveDot({ cx, cy, index, points, value, stroke = '#2563eb' }: {
  cx?: number
  cy?: number
  index?: number
  points?: ReadonlyArray<unknown>
  value?: unknown
  stroke?: string
}) {
  if (cx === undefined || cy === undefined || value === null || value === undefined) return <g />
  const last = points !== undefined && index === points.length - 1
  return (
    <g>
      {last && <circle className="live-dot-ring" cx={cx} cy={cy} r={6} fill="none" stroke={stroke} strokeWidth={2} />}
      <circle className={last ? 'live-dot-core' : undefined} cx={cx} cy={cy} r={last ? 5 : 4} fill={stroke} stroke="#fff" strokeWidth={2} />
    </g>
  )
}

/* ---------------------------------------------------------------------------
   바다 — 신나게 단계에서만 보이는 배경
   ---------------------------------------------------------------------------
   크고 흐릿한 파란 덩어리 셋이 아주 천천히 떠다니고, 작은 입자들이 카드 뒤로 올라간다.
   카드는 흰색이고 배경은 회색이라, 이 층은 그 둘 사이에서만 보인다.
   --------------------------------------------------------------------------- */
const BLOBS = [
  { left: '-12%', top: '-14%', size: 680, color: 'rgba(46, 111, 242, 0.17)', duration: 46, dx: 160, dy: 110 },
  { left: '52%', top: '22%', size: 760, color: 'rgba(81, 185, 255, 0.15)', duration: 58, dx: -180, dy: -120 },
  { left: '16%', top: '64%', size: 600, color: 'rgba(79, 207, 176, 0.13)', duration: 52, dx: 140, dy: -160 },
]

const MOTES = Array.from({ length: 16 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  size: 3 + (index % 4) * 2,
  duration: 18 + (index % 5) * 4,
  delay: -((index * 3.1) % 20),
  dx: ((index % 3) - 1) * 48,
}))

export function Ocean({ always = false }: { always?: boolean }) {
  return (
    <div aria-hidden="true" className={`ocean pointer-events-none absolute inset-0 -z-10 overflow-hidden ${always ? 'ocean-always' : ''}`}>
      {BLOBS.map((blob, index) => (
        <span
          key={index}
          className="ocean-blob"
          style={{
            left: blob.left,
            top: blob.top,
            width: blob.size,
            height: blob.size,
            background: `radial-gradient(circle, ${blob.color}, transparent 70%)`,
            ['--dur' as string]: `${blob.duration}s`,
            ['--dx' as string]: `${blob.dx}px`,
            ['--dy' as string]: `${blob.dy}px`,
          }}
        />
      ))}
      {MOTES.map((mote, index) => (
        <span
          key={index}
          className="ocean-mote"
          style={{
            left: `${mote.left}%`,
            width: mote.size,
            height: mote.size,
            animationDuration: `${mote.duration}s`,
            animationDelay: `${mote.delay}s`,
            ['--dx' as string]: `${mote.dx}px`,
          }}
        />
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   입에서 나오는 기포 — 벨루가가 혼자 놀 때
   --------------------------------------------------------------------------- */
export function MouthBubbles({ token, className = '' }: { token: number; className?: string }) {
  if (token === 0) return null
  return (
    <span key={token} aria-hidden="true" className={`pointer-events-none absolute z-20 ${className}`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="mouth-bubble absolute rounded-full border-2 border-white/90 bg-white/40"
          style={{ width: 6 + index * 3, height: 6 + index * 3, left: index * 8 - 8, top: index * -2, animationDelay: `${index * 150}ms` }}
        />
      ))}
    </span>
  )
}

/* ---------------------------------------------------------------------------
   화면 활기 고르기 — 내 정보에 있다
   --------------------------------------------------------------------------- */
export function LivelinessPicker() {
  const { level, setLevel } = useLiveliness()
  const current = LIVELINESS_LEVELS.find((item) => item.level === level) ?? LIVELINESS_LEVELS[1]
  return (
    <div>
      <div className="grid grid-cols-3 rounded-[14px] bg-slate-100 p-1" role="radiogroup" aria-label="화면 활기">
        {LIVELINESS_LEVELS.map((item) => (
          <button
            key={item.level}
            type="button"
            role="radio"
            aria-checked={item.level === level}
            onClick={() => setLevel(item.level)}
            className={`pressable h-11 rounded-[11px] text-[14px] font-bold ${item.level === level ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(25,31,40,.08)]' : 'text-slate-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p key={level} className="notice-in mt-3 text-[13px] font-medium text-slate-500">{current.hint} 동작 줄이기가 켜져 있으면 어느 단계든 멈춰요.</p>
    </div>
  )
}
