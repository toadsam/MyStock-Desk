import { BarChart3, BriefcaseBusiness, CalendarDays, ChevronRight, CircleHelp, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from './format'
import { Card } from './uiKit'
import { motion } from 'motion/react'
import { Bubbles, MouthBubbles, Odometer } from './motion'
import { BelugaArt, type BelugaMood } from './BelugaArt'
import { useLiveliness } from './liveliness'
import { useDrowsy } from './useDrowsy'
import { HeroSwimmer } from './HeroSwimmer'
import { useIdleAntics } from './useIdleAntics'
import { useCursorTilt } from './useCursorTilt'
import { useHandoffEntrance } from './handoff'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useMyWaveData } from './runtime'

export type HeroTone = 'blue' | 'mint' | 'violet' | 'navy' | 'cyan'

export function MobileBlueSummary({ title, value, detail, tone = 'blue' }: { title: string; value: string; detail: string; tone?: HeroTone }) {
  return (
    <section className={`motion-card pressable relative overflow-hidden rounded-[24px] p-5 text-white hero-tone-${tone}`}>
      <div className="relative z-10">
        <div className="wave-jua text-[15px] text-white/90">{title} <Info className="inline h-4 w-4" /></div>
        <div className="wave-num mt-4 text-4xl font-bold tracking-[-0.02em]">{value}</div>
        <div className="mt-4 text-sm font-black text-white/85">{detail}</div>
      </div>
      <div className="absolute -bottom-8 -right-8 h-32 w-44 rounded-full bg-white/15 blur-xl" />
      {/* 제목 오른쪽 빈 띠를 벨루가가 오간다. 큰 숫자 줄(아래)은 건드리지 않는다. */}
      <HeroSwimmer className="left-[46%] right-3 top-1 lg:hidden" size={56} />
    </section>
  )
}

/**
 * 파란 히어로 카드.
 *
 * 벨루가(art)는 글 위에 떠 있지 않고 자기 열을 갖는다. 전에는 absolute 로 오른쪽 아래에
 * 붙여 두어서 숫자가 길어지면 벨루가가 "보유 종목 3개"를 가렸다. 열을 따로 주면
 * 숫자가 아무리 길어져도 그림과 만나지 않는다. 좁은 화면에서는 그림을 숨긴다.
 */
export function BlueCard({
  children,
  className,
  art,
  artBump = 0,
  artClassName = 'h-40 w-40',
  handoffId,
  overlay,
  targetId,
  tone = 'blue',
}: {
  children: ReactNode
  className?: string
  art?: BelugaMood
  /** 값이 바뀔 때마다 벨루가가 한 번 뛴다. 거래를 저장한 순간 같은 데 쓴다. */
  artBump?: number
  artClassName?: string
  /** 다른 화면에서 rememberHandoff(id) 로 기억해 둔 카드 자리에서 출발해 이 자리까지 날아온다 (홈의 목표 카드 → 목표 히어로). */
  handoffId?: string
  /** 카드 전체 위에 얹는 연출. 기포 폭발 같은 것. */
  overlay?: ReactNode
  /** 풀어둔 벨루가가 찾아올 때 쓰는 이름 (data-beluga-target). */
  targetId?: string
  /** 화면마다 다른 색. 홈 파랑, 목표 민트, 소비 보라, 투자 남색, 리포트 청록. */
  tone?: HeroTone
}) {
  const { lively } = useLiveliness()
  // 카드 위에서 커서가 움직이면 벨루가가 그쪽으로 조금 몸을 튼다. 신나게 단계에서는 화면 어디서든.
  const section = useRef<HTMLElement>(null)
  const tilt = useCursorTilt(7, 10, lively, section)
  useHandoffEntrance(handoffId, section)
  const antics = useArtAntics(lively && !!art)
  const asleep = useDrowsy()
  return (
    <section
      ref={section}
      data-beluga-target={targetId}
      {...tilt.handlers}
      className={`relative overflow-hidden rounded-[28px] p-7 text-white shadow-blue hero-tone-${tone} ${className ?? ''}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.24),transparent_28%),linear-gradient(90deg,rgba(0,0,0,.10),transparent_55%)]" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />
      <HeroWaves />
      <Bubbles />
      <div aria-hidden="true" className="hero-sheen" />
      {overlay}
      {art
        ? (
            <div className="relative z-10 flex items-end gap-6">
              <div data-handoff-content className="min-w-0 flex-1">{children}</div>
              <motion.div data-handoff-content style={tilt.style} className="hidden shrink-0 md:block">
                <div className="beluga-breathe">
                  <div key={`${artBump}-${antics.token}`} className={`relative ${artBump + antics.token > 0 ? antics.className : ''} ${artClassName}`}>
                    <BelugaArt mood={art} asleep={asleep} className="h-full w-full drop-shadow-[0_14px_20px_rgba(10,40,140,.35)]" />
                    <MouthBubbles token={antics.mouth} className="left-[24%] top-[30%]" />
                  </div>
                </div>
              </motion.div>
            </div>
          )
        : <div data-handoff-content className="relative z-10">{children}</div>}
    </section>
  )
}

/**
 * 히어로의 벨루가가 혼자 노는 것. 신나게 단계에서만.
 * 깡충 뛰거나, 몸을 흔들거나, 입에서 기포를 뱉는다. 흔든 뒤에는 다시 "뛰기"로 돌아와
 * 거래 저장 같은 바깥의 bump 가 늘 깡충으로 보이게 한다.
 */
const ART_ANTICS = ['hop', 'wiggle', 'bubbles'] as const

function useArtAntics(enabled: boolean) {
  const [token, setToken] = useState(0)
  const [kind, setKind] = useState<'hop' | 'wiggle'>('hop')
  const [mouth, setMouth] = useState(0)
  const reset = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(reset.current), [])
  useIdleAntics(enabled, ART_ANTICS, (antic) => {
    if (antic === 'bubbles') {
      setMouth((value) => value + 1)
      return
    }
    setKind(antic)
    setToken((value) => value + 1)
    window.clearTimeout(reset.current)
    if (antic === 'wiggle') reset.current = window.setTimeout(() => setKind('hop'), 900)
  })
  return { token, mouth, className: kind === 'wiggle' ? 'beluga-wiggle' : 'beluga-hop' }
}

/**
 * 히어로 바닥에 아주 느리게 흐르는 물결 두 겹. MyWave 라는 이름값이다.
 * 가만히 있어도 화면이 숨 쉬게 하되, 글을 읽는 데 방해가 되지 않을 만큼만 옅다.
 * 경로는 주기가 800 이고 폭이 1600 이라, 절반만큼 밀면 처음과 이어진다.
 */
function HeroWaves() {
  const path = 'M0 60 C200 20 600 100 800 60 C1000 20 1400 100 1600 60 V120 H0 Z'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden">
      <svg className="hero-wave absolute bottom-0 left-0 h-full w-[200%] opacity-[.14]" viewBox="0 0 1600 120" preserveAspectRatio="none">
        <path d={path} fill="#fff" />
      </svg>
      <svg className="hero-wave-slow absolute -bottom-3 left-0 h-full w-[200%] opacity-[.10]" viewBox="0 0 1600 120" preserveAspectRatio="none">
        <path d={path} fill="#fff" />
      </svg>
    </div>
  )
}

/**
 * 히어로의 큰 숫자. 홈의 "오늘 더 써도 되는 돈"과 같은 글꼴(Fredoka)이고,
 * 값이 바뀌면 자릿수마다 오도미터처럼 굴러서 새 값에 맞춰진다.
 * 통화 기호와 단위는 숫자보다 작게 둔다. 읽어야 할 것은 숫자다.
 */
export function HeroAmount({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const text = decimals > 0
    ? value.toFixed(decimals)
    : new Intl.NumberFormat('ko-KR').format(Math.round(value))
  return (
    <span className="wave-num tnum font-bold">
      {prefix && <span className="mr-0.5 text-[0.6em] font-semibold">{prefix}</span>}
      <Odometer value={text} />
      {suffix && <span className="ml-1 text-[0.55em] font-semibold">{suffix}</span>}
    </span>
  )
}

/**
 * 히어로 안의 작은 숫자. 구분선을 긋지 않고 간격으로만 나눈다.
 * 금액은 줄바꿈이 안 되므로, 칸보다 길어지면 옆 칸을 덮는 대신 말줄임으로 끝낸다.
 * 값이 바뀌면 아래에서 살짝 튀어오른다 (key 가 바뀌어 다시 그려진다).
 */
export function BlueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-bold text-white/80">{label}</div>
      <div key={value} className="tnum tick-pop mt-1.5 truncate text-[22px] font-black" title={value}>{value}</div>
    </div>
  )
}

/**
 * 쏠림 게이지.
 *
 * 전에는 초록·노랑·빨강 신호등이었다. 그런데 이 앱에서 빨강은 수익(국내 시세 관행)이라
 * 같은 화면에서 빨강이 "좋음"과 "위험" 둘 다가 됐다. 그래서 색 하나로만 말한다.
 * 회색에서 주황으로 가는 한 줄이고, 가장 큰 종목의 비중만큼 찬다.
 */
export function RiskGauge({ value, level }: { value: number; level: string }) {
  const radius = 80
  const length = Math.PI * radius
  const ratio = Math.max(0, Math.min(100, value)) / 100
  const color = level === '높음' ? '#f76707' : level === '보통' ? '#f59f00' : '#8b95a1'
  return (
    <div className="mx-auto w-48">
      <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e9ecef" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - ratio)}
          className="gauge-fill"
        />
      </svg>
      <div className="-mt-11 text-center">
        <div className="text-[22px] font-black" style={{ color }}>{level}</div>
        <div className="mt-0.5 text-[12px] font-medium text-slate-400">가장 큰 종목 {Math.round(value)}%</div>
      </div>
    </div>
  )
}

export function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail?: string; tone: 'blue' | 'green' | 'violet' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <Card className="min-h-36">
      <div className="flex h-full items-center gap-6">
        <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${colors[tone]}`}>{icon}</div>
        <div>
          <div className="flex items-center gap-1.5 text-base font-black text-slate-900">{label}<CircleHelp className="h-4 w-4 text-slate-400" /></div>
          <div className="mt-3 text-3xl font-black tracking-[-0.03em]">{value}</div>
          {detail && <div className={`mt-2 text-sm font-bold ${tone === 'blue' ? 'text-blue-700' : 'text-slate-500'}`}>{detail}</div>}
        </div>
      </div>
    </Card>
  )
}

export function InlineAction({ to, label, primary = false }: { to: string; label: string; primary?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={primary ? 'rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white' : 'text-sm font-bold text-slate-500'}
    >
      {label} <ChevronRight className="inline h-4 w-4" />
    </button>
  )
}

export function MobileCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`motion-card rounded-[24px] bg-white p-4 ${className}`}>
      {children}
    </section>
  )
}

export function SegmentedTabs({ items, active }: { items: string[]; active: string }) {
  const [selected, setSelected] = useState(active)

  return (
    <div className="grid grid-cols-3 rounded-[14px] bg-slate-100 p-1">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => setSelected(item)}
          className={`pressable h-10 rounded-[11px] text-[14px] font-bold ${item === selected ? 'bg-white text-slate-900' : 'text-slate-400'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function MobileRing({ value }: { value: number }) {
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" stroke="#e7eefb" strokeWidth="10" fill="none" />
        <circle className="ring-progress" cx="60" cy="60" r="48" stroke="#1568f4" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${value * 3.02} 302`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-black text-blue-700">{value}%</div>
          <div className="text-xs font-bold text-slate-500">달성률</div>
        </div>
      </div>
    </div>
  )
}

export function MobileGoalLine({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  void icon
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="whitespace-nowrap text-[13px] font-medium text-slate-400">{label}</span>
      <span className="tnum text-[15px] font-bold text-slate-900">{value}</span>
    </div>
  )
}

/**
 * 자산 배분 도넛.
 *
 * 전에는 조각 비율이 코드에 박혀 있어서 범례가 "현금 100%" 인데 그림은 다섯 조각으로
 * 갈라져 있었다. 화면이 사실과 다른 말을 하면 안 되므로 실제 배분으로 그린다.
 */
export function MobileCssDonut({ center, label, items }: { center: string; label: string; items?: Array<{ name: string; rate: number; color: string }> }) {
  const slices = items && items.length > 0 ? items : [{ name: '없음', rate: 100, color: '#e9ecef' }]
  const { stops, filled } = slices.reduce<{ stops: string[]; filled: number }>(
    (acc, item) => {
      const end = Math.min(100, acc.filled + item.rate)
      return { stops: [...acc.stops, `${item.color} ${acc.filled}% ${end}%`], filled: end }
    },
    { stops: [], filled: 0 },
  )
  // 합이 100 에 못 미치면 나머지를 회색으로 채워 도넛이 끊겨 보이지 않게 한다.
  const ring = filled < 100 ? [...stops, `#e9ecef ${filled}% 100%`] : stops

  return (
    <div className="relative h-36 w-36">
      <div
        className="donut-animate h-full w-full rounded-full"
        style={{ background: `conic-gradient(${ring.join(', ')})` }}
      />
      <div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-[11px] font-medium text-slate-400">{label}</div>
          <div className="mt-0.5 text-[13px] font-bold leading-tight text-slate-900">{center}</div>
        </div>
      </div>
    </div>
  )
}

export function TargetDot() {
  return <span className="inline-block h-4 w-4 rounded-full border-4 border-blue-700 bg-white" />
}

export function FlagIcon() {
  return <span className="block h-4 w-4 rounded-sm bg-blue-700" />
}

export function Progress({ value, className, barClassName, color }: { value: number; className?: string; barClassName?: string; color?: string }) {
  const bar = barClassName ?? 'bg-blue-700'
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-slate-100 ${className ?? ''}`}>
      <div className={`progress-fill relative h-full overflow-hidden rounded-full ${bar}`} style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}>
        {/* 신나게 단계에서 흐르는 줄무늬. 흰 막대에는 파란 줄. */}
        <span aria-hidden="true" className={`stripes ${bar.includes('bg-white') ? 'stripes-dark' : ''}`} />
      </div>
    </div>
  )
}

export function Donut({ data, center, label = '총 자산' }: { data: Array<{ name: string; rate: number; color: string; amount?: number }>; center: string; label?: string }) {
  return (
    <div className="relative h-40 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="rate" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
            {data.map((item) => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-sm font-bold text-slate-400">{label}</div>
          <div className="mt-1 text-lg font-black">{center}</div>
        </div>
      </div>
    </div>
  )
}

export function Legend({ items }: { items: Array<{ name: string; rate: number; color: string; amount?: number }> }) {
  return (
    <div className="space-y-3 self-center">
      {items.map((item) => (
        <div key={item.name} className="grid grid-cols-[1fr_46px] items-center gap-2 text-[14px] sm:grid-cols-[1fr_auto_58px] sm:gap-4">
          <span className="flex items-center gap-2 font-semibold text-slate-900"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}</span>
          {item.amount !== undefined && <span className="hidden font-medium text-slate-400 sm:block">{won(item.amount)}</span>}
          <span className="tnum text-right font-bold text-slate-900">{item.rate}%</span>
        </div>
      ))}
    </div>
  )
}

export function RingProgress({ value }: { value: number }) {
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" stroke="#e9eef7" strokeWidth="14" fill="none" />
        <circle className="ring-progress" cx="60" cy="60" r="48" stroke="#2563eb" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={`${value * 3.02} 302`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-black text-blue-700">{value}%</div>
          <div className="text-xs font-bold text-slate-400">메인 목표</div>
        </div>
      </div>
    </div>
  )
}

export function MiniStat({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">{value}</div>
      {change && <div className="mt-1 text-sm font-black text-blue-700">{change}</div>}
    </div>
  )
}

export function SummaryLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-bold text-slate-500">{label}</span>
      <span className={`font-black ${muted ? 'text-slate-500' : 'text-blue-700'}`}>{value}</span>
    </div>
  )
}

export function MobileTitle({ title }: { title: string }) {
  return <h1 className="mb-2 text-[28px] font-black leading-tight tracking-[-0.04em] lg:hidden">{title}</h1>
}

/**
 * 지금 보고 있는 달. 예전에는 2024년 달들을 고르는 척하는 버튼이었지만 실제로 데이터를
 * 바꾸지 않았다. 다른 달 보기를 붙이기 전까지는 이번 달을 표시만 한다.
 */
export function MonthPicker() {
  const { financeSummary } = useMyWaveData()
  return (
    <div className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-slate-600 lg:h-12 lg:gap-3 lg:px-5 lg:text-sm">
      <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5" /> {financeSummary.month || '이번 달'}
    </div>
  )
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black text-white">{children}</span>
}

export function BriefcaseIcon() {
  return <BriefcaseBusiness className="h-7 w-7" />
}

export function BarIcon() {
  return <BarChart3 className="h-7 w-7" />
}
