import { cn } from '../../utils/cn'
import { formatPercent } from '../../utils/format'

interface BarItem {
  label: string
  value: number
}

export function BarChartList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const up = item.value >= 0
        return (
          <div key={item.label} className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-3 text-sm">
            <span className="truncate text-slate-300">{item.label}</span>
            <div className="h-3 rounded-full bg-slate-800">
              <div
                className={cn('h-full rounded-full', up ? 'bg-emerald-500' : 'bg-red-500')}
                style={{ width: `${Math.max(7, (Math.abs(item.value) / max) * 100)}%` }}
              />
            </div>
            <span className={cn('text-right font-semibold', up ? 'text-emerald-400' : 'text-red-400')}>
              {formatPercent(item.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
