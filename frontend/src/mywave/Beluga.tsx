import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BelugaArt, type BelugaMood } from './BelugaArt'
import { MouthBubbles } from './motion'
import { useLiveliness } from './liveliness'
import { useIdleAntics } from './useIdleAntics'
import { useDrowsy, useWakeToken } from './useDrowsy'

export type { BelugaMood } from './BelugaArt'

/**
 * 벨루가 — MyWave 의 마스코트이자 코치의 얼굴.
 *
 * 그림은 BelugaArt(원화 + 눈 깜빡임)가 그린다. 여기서는 벨루가가 화면에서 어떻게 행동하는지를 정한다.
 * 지켜야 할 규칙이 셋 있다. 이 파일 밖에서도 같다.
 *
 * 1. 숫자에는 벨루가 말투를 섞지 않는다. 벨루가는 안내만 하고 금액은 화면이 보여준다.
 *    "61,000원이나 썼어요!" 가 아니라, 벨루가가 "이번 달 소비를 정리해봤어요" 라고
 *    말한 뒤 숫자는 숫자대로 크게 찍는다.
 * 2. 나쁜 소식에는 귀엽지 않다. 예산 초과나 손실 앞에서 신난 마스코트는 조롱처럼 읽힌다.
 *    concern 무드는 벨루가를 작게 물리고 문장이 무게를 지게 한다.
 * 3. 투자 판단은 하지 않는다. "사세요" 가 아니라 "확인해볼 점을 모아봤어요" 다.
 */

/** 혼자 놀 때 하는 말. 금액은 없다 (규칙 1). */
const IDLE_LINES = [
  '오늘 기록 잊지 않았죠?',
  '물이 참 좋네요.',
  '간식 사기 전에 잔 한번 보기!',
  '저 여기 있어요~',
  '잔이 차면 저도 기뻐요.',
  '천천히, 꾸준히.',
]

// 혼자 노는 동작. 나쁜 소식(concern) 앞에서는 기포만 뱉는다. 신난 몸짓은 조롱처럼 읽힌다.
const IDLE_ANTICS = ['hop', 'say', 'bubbles', 'pose'] as const
/** 깨어날 때 하는 말. */
const WAKE_LINES = ['으앗! 안 잤어요.', '…네? 저 깨 있었어요.', '하암. 다시 왔군요!']
const CALM_ANTICS = ['bubbles'] as const
const STILL_ANTICS = ['hop', 'wiggle', 'bubbles'] as const

const SIZE = {
  xs: 'h-9 w-9',
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
  xl: 'h-44 w-44',
} as const

/**
 * 가만히 있는 벨루가. 말풍선 옆, 빈 화면, 안내 카드에 선다.
 * 신나게 단계에서는 혼자서 가끔 뛰거나 몸을 흔들거나 기포를 뱉는다.
 * framed 는 동그란 프로필 자리다. 얼굴만 크게 보인다.
 */
export function Beluga({
  mood = 'hello',
  size = 'md',
  float = true,
  framed = false,
  className = '',
}: {
  mood?: BelugaMood
  size?: keyof typeof SIZE
  float?: boolean
  framed?: boolean
  className?: string
}) {
  const { lively } = useLiveliness()
  const [antic, setAntic] = useState<{ kind: 'hop' | 'wiggle'; token: number }>({ kind: 'hop', token: 0 })
  const [mouth, setMouth] = useState(0)
  useIdleAntics(lively && mood !== 'concern', STILL_ANTICS, (kind) => {
    if (kind === 'bubbles') setMouth((value) => value + 1)
    else setAntic((value) => ({ kind, token: value.token + 1 }))
  }, { min: 9000, max: 16000 })
  const play = antic.token > 0 ? (antic.kind === 'wiggle' ? 'beluga-wiggle' : 'beluga-hop') : ''

  if (framed) {
    return (
      <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ring-[3px] ring-[#eef4ff] ${SIZE[size]} ${className}`}>
        <BelugaArt mood="calm" className="h-full w-full" />
      </span>
    )
  }

  return (
    <span key={antic.token} className={`relative inline-block shrink-0 select-none ${SIZE[size]} ${play} ${mood === 'concern' ? 'opacity-90 saturate-[.85]' : ''} ${className}`}>
      <span className={`block h-full w-full ${float && mood !== 'concern' ? 'beluga-float' : ''}`}>
        <BelugaArt mood={mood} blink={size !== 'xs'} className={`h-full w-full ${mood === 'calm' ? 'rounded-full' : 'drop-shadow-[0_8px_12px_rgba(10,40,140,.18)]'}`} />
      </span>
      <MouthBubbles token={mouth} className="left-[24%] top-[40%]" />
    </span>
  )
}

/**
 * 누를 수 있는 벨루가. 누르면 깡충 뛰고 짧은 말을 한다.
 *
 * 말은 lines 에서 차례대로 고른다. 금액은 넣지 않는다 (규칙 1).
 * 화면을 쓰는 데 꼭 필요한 기능은 아니다. 앱이 살아 있다는 느낌을 주는 자리다.
 * 신나게 단계에서는 혼자서도 뛰고, 혼잣말하고, 기포를 뱉고, 표정을 바꾼다.
 */
export function BelugaTap({
  mood = 'hello',
  lines,
  imgClassName = 'h-24 w-24',
  bubbleSide = 'left',
  bump = 0,
  bumpLine,
  alt = '벨루가',
  wrapArt,
}: {
  mood?: BelugaMood
  lines: string[]
  imgClassName?: string
  bubbleSide?: 'left' | 'right' | 'top'
  /** 값이 바뀔 때마다 밖에서 깡충 뛰게 한다. 기록이 저장된 순간, 화면이 바뀐 순간처럼. */
  bump?: number | string
  bumpLine?: string
  alt?: string
  /**
   * 그림에만 걸 움직임(숨쉬기, 기울기)을 여기서 감싼다.
   * 바깥에서 통째로 감싸면 말풍선까지 같이 흔들려서 카드 가장자리에서 잘린다.
   */
  wrapArt?: (art: ReactNode) => ReactNode
}) {
  const [hop, setHop] = useState(0)
  const [line, setLine] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const lastBump = useRef(bump)
  // 혼자 놀기: 잠깐 바꾼 표정, 입에서 나온 기포
  const { lively } = useLiveliness()
  const [pose, setPose] = useState<BelugaMood | null>(null)
  const [mouth, setMouth] = useState(0)
  const poseTimer = useRef<number | undefined>(undefined)
  // 1분 동안 아무 일도 없으면 존다. 깨어나면 움찔하고 한마디.
  const asleep = useDrowsy()
  const wake = useWakeToken(asleep)

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    window.clearTimeout(poseTimer.current)
  }, [])

  function say(text: string | null) {
    setHop((value) => value + 1)
    setLine(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLine(null), 2600)
  }

  useEffect(() => {
    if (bump === lastBump.current) return
    lastBump.current = bump
    const id = window.setTimeout(() => say(bumpLine ?? null), 0)
    return () => window.clearTimeout(id)
  }, [bump, bumpLine])

  useEffect(() => {
    if (wake === 0) return
    const id = window.setTimeout(() => {
      // 깨면 눈이 동그래진 얼굴로 움찔하고, 한마디 하고, 원래 얼굴로 돌아온다.
      setPose('surprise')
      window.clearTimeout(poseTimer.current)
      poseTimer.current = window.setTimeout(() => setPose(null), 1400)
      setLine(WAKE_LINES[wake % WAKE_LINES.length])
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setLine(null), 2600)
    }, 0)
    return () => window.clearTimeout(id)
  }, [wake])

  useIdleAntics(lively && !asleep, mood === 'concern' ? CALM_ANTICS : IDLE_ANTICS, (antic) => {
    if (antic === 'hop') say(null)
    else if (antic === 'say') say(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)])
    else if (antic === 'bubbles') setMouth((value) => value + 1)
    else {
      setPose(mood === 'hello' ? 'cheer' : 'hello')
      window.clearTimeout(poseTimer.current)
      poseTimer.current = window.setTimeout(() => setPose(null), 2600)
    }
  })

  function poke() {
    say(lines[hop % lines.length])
  }

  const bubblePlace = bubbleSide === 'left' ? 'right-full top-1 mr-2' : bubbleSide === 'right' ? 'left-full top-1 ml-2' : 'bottom-full right-0 mb-1'

  const art = (
    <button type="button" onClick={poke} aria-label={alt === '벨루가' ? '벨루가에게 말 걸기' : `${alt}에게 말 걸기`} className="relative block cursor-pointer select-none">
      <span key={`${hop}-${pose ?? ''}`} className={`block ${imgClassName} ${pose === 'surprise' ? 'beluga-startle' : pose ? 'wave-pop' : hop > 0 ? 'beluga-hop' : ''}`}>
        <BelugaArt mood={pose ?? mood} asleep={asleep} className="h-full w-full drop-shadow-[0_10px_14px_rgba(10,40,140,.3)]" />
      </span>
      <MouthBubbles token={mouth} className="left-[22%] top-[38%]" />
    </button>
  )

  return (
    <div className="relative">
      {wrapArt ? wrapArt(art) : art}
      {line && (
        // 말풍선은 그림의 움직임 밖에 있다. 좁은 화면에서는 폭을 줄여 카드 왼쪽으로 넘치지 않게 한다.
        <div
          role="status"
          className={`bubble-pop absolute z-20 w-max max-w-[min(220px,calc(100vw-11rem))] rounded-[16px] bg-white px-3.5 py-2.5 text-[13px] font-bold leading-5 text-slate-900 shadow-[0_8px_24px_rgba(25,31,40,.18)] ${bubblePlace}`}
        >
          {line}
        </div>
      )}
    </div>
  )
}

/**
 * 벨루가가 말하는 자리.
 *
 * 말풍선 꼬리를 삼각형이 아니라 물결로 둔 것이 이 앱의 서명이다.
 * 벨루가는 물 위에서 말을 걸고, 말풍선은 그 물결에서 이어진다.
 */
export function BelugaSays({
  children,
  mood = 'hello',
  size = 'md',
  action,
  tone = 'default',
}: {
  children: ReactNode
  mood?: BelugaMood
  size?: keyof typeof SIZE
  action?: ReactNode
  tone?: 'default' | 'quiet'
}) {
  return (
    <div className="flex items-start gap-3">
      <Beluga mood={mood} size={size} float={mood !== 'concern'} />
      <div className="min-w-0 flex-1">
        <div className={`bubble-pop relative rounded-[20px] px-5 py-4 text-[15px] font-bold leading-7 ${
          tone === 'quiet'
            ? 'bg-slate-50 text-slate-700'
            : mood === 'concern'
              ? 'bg-white text-slate-900 ring-1 ring-slate-200'
              : 'bg-wave-foam text-blue-950'
        }`}>
          <WaveTail concern={mood === 'concern'} quiet={tone === 'quiet'} />
          {children}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

/** 말풍선 꼬리. 삼각형 대신 물결 한 자락. */
function WaveTail({ concern, quiet }: { concern?: boolean; quiet?: boolean }) {
  const fill = concern ? '#ffffff' : quiet ? '#f8fafc' : 'var(--wave-foam)'
  return (
    <svg
      viewBox="0 0 22 20"
      aria-hidden="true"
      className="absolute -left-[13px] top-5 h-5 w-[22px]"
    >
      <path
        d="M22 2C14 2 12 8 6 11c-3 1.5-5 2-6 2.6C3 15 6 16.5 9 18c5 2.4 10 .6 13 0Z"
        fill={fill}
      />
      {concern && (
        <path
          d="M22 2C14 2 12 8 6 11c-3 1.5-5 2-6 2.6C3 15 6 16.5 9 18"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      )}
    </svg>
  )
}

/**
 * 아직 아무것도 없는 화면. 비어 있음을 알리는 자리가 아니라 다음 행동을 권하는 자리다.
 */
export function BelugaEmpty({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Beluga mood="calm" size="lg" />
      <p className="text-base font-black text-slate-900">{title}</p>
      {hint && <p className="max-w-[28ch] text-sm font-bold leading-6 text-slate-500">{hint}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
