import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { PricePoint } from '../../types/stock'

interface SparklineProps {
  data: PricePoint[]
  positive?: boolean
}

export function Sparkline({ data, positive = true }: SparklineProps) {
  const color = positive ? '#22c55e' : '#ef4444'
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey="price" type="monotone" stroke={color} strokeWidth={2} fill={`url(#spark-${positive ? 'up' : 'down'})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
