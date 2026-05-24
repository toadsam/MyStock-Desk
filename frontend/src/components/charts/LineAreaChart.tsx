import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PricePoint } from '../../types/stock'
import { formatNumber } from '../../utils/format'

interface LineAreaChartProps {
  data: PricePoint[]
  height?: number
  color?: string
  showVolume?: boolean
  secondaryDataKey?: string
}

export function LineAreaChart({ data, height = 280, color = '#22c55e', showVolume = false }: LineAreaChartProps) {
  if (showVolume) {
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="mainArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(51,65,85,0.4)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis yAxisId="price" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={58} tickFormatter={(value) => formatNumber(value as number)} domain={['dataMin - 100', 'dataMax + 100']} />
            <YAxis yAxisId="volume" orientation="right" hide />
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(71,85,105,.7)', borderRadius: 12, color: '#e2e8f0' }} />
            <Area yAxisId="price" dataKey="price" type="monotone" stroke={color} strokeWidth={2.5} fill="url(#mainArea)" dot={false} />
            <Bar yAxisId="volume" dataKey="volume" fill="rgba(59,130,246,.22)" barSize={4} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.33} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(51,65,85,0.4)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={58} tickFormatter={(value) => formatNumber(value as number)} domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(71,85,105,.7)', borderRadius: 12, color: '#e2e8f0' }} />
          <Area dataKey="price" type="monotone" stroke={color} strokeWidth={2.5} fill="url(#lineArea)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PortfolioLineChart({ data }: { data: { label: string; portfolioValue: number; kospiValue: number }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(51,65,85,0.4)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={70} tickFormatter={(value) => `${Math.round((value as number) / 10000)}만`} />
          <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(71,85,105,.7)', borderRadius: 12, color: '#e2e8f0' }} />
          <Area dataKey="portfolioValue" name="내 포트폴리오" stroke="#22c55e" fill="url(#portfolioFill)" strokeWidth={2.5} dot={false} />
          <Line dataKey="kospiValue" name="KOSPI" stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
