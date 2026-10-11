import { BarChart3, BriefcaseBusiness, CalendarDays, ChevronRight, CircleHelp, Info } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from './format'
import { Card } from './uiKit'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useMyWaveData } from './runtime'

export function MobileBlueSummary({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className="motion-card pressable relative overflow-hidden rounded-[20px] bg-blue-700 p-5 text-white shadow-blue">
      <div className="relative z-10">
        <div className="text-sm font-black text-white/90">{title} <Info className="inline h-4 w-4" /></div>
        <div className="mt-4 text-4xl font-black tracking-[-0.04em]">{value}</div>
        <div className="mt-4 text-sm font-black text-white/85">{detail}</div>
      </div>
      <div className="absolute -bottom-8 -right-8 h-32 w-44 rounded-full bg-white/15 blur-xl" />
    </section>
  )
}

export function BlueCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#194fe5_0%,#1d67f2_48%,#51b9ff_100%)] p-7 text-white shadow-blue ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.24),transparent_28%),linear-gradient(90deg,rgba(0,0,0,.10),transparent_55%)]" />
      {children}
    </section>
  )
}

export function BlueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-white/20 lg:border-l lg:pl-8 first:lg:border-l-0 first:lg:pl-0">
      <div className="text-sm font-bold text-white/80">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
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
    <section className={`motion-card rounded-[20px] bg-white p-4 ${className}`}>
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
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-slate-100 ${className ?? ''}`}>
      <div className={`progress-fill h-full rounded-full ${barClassName ?? 'bg-blue-700'}`} style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
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
