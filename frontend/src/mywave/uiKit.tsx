import { ChevronRight, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * MyWave 화면들이 공유하는 조각들.
 *
 * MyWaveApp 안에 있던 것을 옮겼다. 소비 입력 화면이 별도 파일로 나가면서
 * 두 파일이 같은 Card/Field 를 써야 하는데, 서로를 import 하면 순환이 된다.
 * 금액 표기(won)는 컴포넌트가 아니므로 format.ts 에 따로 둔다.
 */

/**
 * 지우기 전에 한 번 더 묻는 버튼. 처음 누르면 "지울까요?"와 지우기·취소가 펼쳐지고, 5초 안에 고르지 않으면 접힌다.
 * 기록 하나가 터치 한 번에 사라지면 안 된다. compact 면 쓰레기통 아이콘, 아니면 글자 버튼이다.
 */
export function ConfirmDeleteButton({
  onConfirm,
  label = '삭제',
  compact = false,
  className = '',
}: {
  onConfirm: () => void | Promise<void>
  label?: string
  compact?: boolean
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 5000)
    return () => window.clearTimeout(timer)
  }, [armed])

  if (armed) {
    return (
      <span role="group" aria-label={`${label} 확인`} className={`inline-flex items-center gap-1 rounded-full bg-red-50 p-1 ${className}`}>
        <span className="pl-2 text-xs font-black text-red-500">지울까요?</span>
        <button type="button" onClick={() => { setArmed(false); void onConfirm() }} className="pressable rounded-full bg-red-500 px-3 py-1.5 text-xs font-black text-white">지우기</button>
        <button type="button" onClick={() => setArmed(false)} className="pressable rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600">취소</button>
      </span>
    )
  }
  if (compact) {
    return (
      <button type="button" onClick={() => setArmed(true)} aria-label={label} className={`pressable grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50 ${className}`}>
        <Trash2 className="h-4 w-4" />
      </button>
    )
  }
  return (
    <button type="button" onClick={() => setArmed(true)} className={`pressable rounded-full bg-white px-3 py-2 text-sm font-black text-red-500 ${className}`}>
      {label}
    </button>
  )
}

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
    <section className={`card-lift rounded-[24px] bg-white p-5 lg:p-6 ${className ?? ''}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="wave-jua text-[19px] text-slate-900">{title}</h2>}
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

/** 칸에 보일 글자. 0 은 빈 칸으로 둔다. 그래야 0 을 지우지 않고 바로 숫자를 칠 수 있다. */
function numberText(value: number) {
  return value === 0 || !Number.isFinite(value) ? '' : String(value)
}

/**
 * 숫자를 적는 칸.
 *
 * 숫자 상태를 `<input type="number" value={0}>` 에 그대로 물리면, 0 이 든 칸에 355 를 쳤을 때 "0355" 로 남는다.
 * React 는 칸의 글자와 상태가 숫자로 같으면(0355 == 355) 글자를 고치지 않기 때문이다.
 * 그래서 칸의 글자는 여기서 따로 들고, 앞자리 0 은 치는 즉시 떼어 낸다. 밖으로는 언제나 숫자만 내보낸다.
 * 밖에서 값이 바뀌면(폼 초기화, 불러오기, 자동완성) 그 숫자를 따라간다.
 */
export function NumberField({
  value,
  onChange,
  className = 'form-input',
  ref,
  ...rest
}: {
  value: number
  onChange: (value: number) => void
  className?: string
  ref?: Ref<HTMLInputElement>
  min?: string
  max?: string
  disabled?: boolean
  'aria-label'?: string
}) {
  const [text, setText] = useState(() => numberText(value))
  // 지금 글자가 같은 숫자를 뜻하면 친 그대로 보여 주고("1.", "0" 같은 치는 중의 글자), 아니면 밖의 숫자를 따른다.
  const shown = Number(text || 0) === value ? text : numberText(value)

  return (
    <input
      {...rest}
      ref={ref}
      type="number"
      placeholder="0"
      value={shown}
      onChange={(event) => {
        // "0355" 는 "355", "00" 은 "0", "-07" 은 "-7". "0.5" 는 그대로 둔다.
        const next = event.target.value.replace(/^(-?)0+(?=\d)/, '$1')
        setText(next)
        const parsed = Number(next)
        onChange(Number.isFinite(parsed) ? parsed : 0)
      }}
      className={className}
    />
  )
}
