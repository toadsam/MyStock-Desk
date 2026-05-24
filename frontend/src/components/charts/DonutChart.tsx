import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Allocation } from '../../types/portfolio'
import { formatWon } from '../../utils/format'

const COLORS = ['#2f80ff', '#6d5dfc', '#e7d84c', '#22c55e', '#8ddc91']

export function DonutChart({ data, centerLabel }: { data: Allocation[]; centerLabel: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="rate" nameKey="name" innerRadius="56%" outerRadius="82%" paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(71,85,105,.7)', borderRadius: 12, color: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xs text-slate-400">총 자산</div>
            <div className="text-sm font-bold text-slate-100">{centerLabel}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 self-center">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-3 w-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
              {item.name}
            </span>
            <span className="text-slate-400">{item.rate.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
