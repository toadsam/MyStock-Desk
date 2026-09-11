import type { ReactNode } from 'react'
import belugaCalm from '../assets/mywave/beluga-calm.png'
import belugaCheer from '../assets/mywave/beluga-cheer.png'
import belugaHello from '../assets/mywave/beluga-hello.png'

/**
 * 벨루가 — MyWave 의 마스코트이자 코치의 얼굴.
 *
 * 지켜야 할 규칙이 셋 있다. 이 파일 밖에서도 같다.
 *
 * 1. 숫자에는 벨루가 말투를 섞지 않는다. 벨루가는 안내만 하고 금액은 화면이 보여준다.
 *    "61,000원이나 썼어요!" 가 아니라, 벨루가가 "이번 달 소비를 정리해봤어요" 라고
 *    말한 뒤 숫자는 숫자대로 크게 찍는다.
 * 2. 나쁜 소식에는 귀엽지 않다. 예산 초과나 손실 앞에서 신난 마스코트는 조롱처럼 읽힌다.
 *    concern 무드는 벨루가를 작게 물리고 문장이 무게를 지게 한다.
 * 3. 투자 판단은 하지 않는다. "사세요" 가 아니라 "확인해볼 점을 모아봤어요" 다.
 */

export type BelugaMood = 'hello' | 'calm' | 'cheer' | 'concern'

const FACE: Record<BelugaMood, string> = {
  hello: belugaHello,
  calm: belugaCalm,
  cheer: belugaCheer,
  // 걱정할 때 다른 얼굴을 쓰지 않는다. 차분한 얼굴로 물러서고 문장이 말하게 둔다.
  concern: belugaCalm,
}

/**
 * calm/cheer 원화는 흰 정사각형 위에 그려진 원형이라 모서리를 잘라내야 한다.
 * hello 는 배경이 비어 있으므로 자르면 몸이 잘린다.
 */
const CIRCULAR: Record<BelugaMood, boolean> = {
  hello: false,
  calm: true,
  cheer: true,
  concern: true,
}

const SIZE = {
  xs: 'h-9 w-9',
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
  xl: 'h-44 w-44',
} as const

export function Beluga({
  mood = 'hello',
  size = 'md',
  float = true,
  className = '',
}: {
  mood?: BelugaMood
  size?: keyof typeof SIZE
  float?: boolean
  className?: string
}) {
  return (
    <img
      src={FACE[mood]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`${SIZE[size]} shrink-0 select-none object-contain ${CIRCULAR[mood] ? 'rounded-full' : ''} ${float ? 'beluga-float' : ''} ${mood === 'concern' ? 'opacity-90 saturate-[.85]' : ''} ${className}`}
    />
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
