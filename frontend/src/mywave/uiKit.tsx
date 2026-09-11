import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * MyWave 화면들이 공유하는 조각들.
 *
 * MyWaveApp 안에 있던 것을 옮겼다. 소비 입력 화면이 별도 파일로 나가면서
 * 두 파일이 같은 Card/Field 를 써야 하는데, 서로를 import 하면 순환이 된다.
 * 금액 표기(won)는 컴포넌트가 아니므로 format.ts 에 따로 둔다.
 */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

/**
 * 카드.
 *
 * 테두리도 그림자도 없다. 회색 배경 위의 흰 면이라는 사실만으로 경계는 보이고,
 * 테두리를 더하면 카드마다 윤곽선이 하나씩 늘어 화면이 금세 시끄러워진다.
 */
export function Card({ children, title, action, actionTo, className }: { children: ReactNode; title?: ReactNode; action?: ReactNode; actionTo?: string; className?: string }) {
  const navigate = useNavigate()

  return (
    <section className={`rounded-[20px] bg-white p-5 lg:p-6 ${className ?? ''}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">{title}</h2>}
          {typeof action === 'string'
            ? (
                <button onClick={() => actionTo && navigate(actionTo)} className="pressable shrink-0 text-[13px] font-semibold text-slate-400">
                  {action} <ChevronRight className="inline h-4 w-4" />
                </button>
              )
            : action}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * 값에 쓰는 색.
 *
 * gain/loss 는 국내 시세 관행을 따른다. 오르면 빨강, 내리면 파랑이다.
 * up/down 은 "모은 돈"처럼 시세가 아닌 값에 쓴다.
 */
type Tone = 'default' | 'up' | 'down' | 'gain' | 'loss' | 'muted'

const TONE: Record<Tone, string> = {
  default: 'text-slate-900',
  up: 'text-emerald-600',
  down: 'text-slate-400',
  gain: 'text-red-500',
  loss: 'text-blue-700',
  muted: 'text-slate-400',
}

/**
 * 목록의 한 줄. 구분선을 긋지 않고 세로 여백으로만 나눈다.
 * 줄마다 선이 있으면 스무 줄짜리 목록이 스무 개의 상자로 읽힌다.
 */
export function ListRow({
  leading,
  title,
  detail,
  value,
  valueDetail,
  valueTone = 'default',
  valueDetailTone = 'muted',
  onClick,
}: {
  leading?: ReactNode
  title: ReactNode
  detail?: ReactNode
  value?: ReactNode
  valueDetail?: ReactNode
  valueTone?: Tone
  /** 수익·손실처럼 색 자체가 뜻을 가지는 보조값에 쓴다. */
  valueDetailTone?: Tone
  onClick?: () => void
}) {
  const toneClass = TONE[valueTone]
  const detailToneClass = TONE[valueDetailTone]

  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[15px] font-semibold text-slate-900">{title}</div>
        {detail && <div className="mt-0.5 truncate text-[13px] font-medium text-slate-400">{detail}</div>}
      </div>
      {(value || valueDetail) && (
        <div className="shrink-0 text-right">
          {value && <div className={`tnum text-[15px] font-bold ${toneClass}`}>{value}</div>}
          {valueDetail && <div className={`tnum mt-0.5 text-[12px] font-semibold ${detailToneClass}`}>{valueDetail}</div>}
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="pressable -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-3 hover:bg-slate-50">
        {body}
      </button>
    )
  }
  return <div className="flex items-center gap-3 py-3">{body}</div>
}

/** 화면의 주 액션. 한 화면에 하나만 둔다. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="pressable h-14 w-full rounded-[14px] bg-blue-700 text-[16px] font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
    >
      {children}
    </button>
  )
}

/** 주 액션 옆에 서는 보조 버튼. 색을 쓰지 않는다. */
export function SubtleButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pressable h-14 w-full rounded-[14px] bg-slate-100 text-[16px] font-bold text-slate-600 disabled:text-slate-400"
    >
      {children}
    </button>
  )
}
