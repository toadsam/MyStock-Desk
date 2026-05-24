import type { PricePoint } from '../../types/stock'

export function MiniCandleChart({ data }: { data: PricePoint[] }) {
  const points = data.slice(-48)
  const prices = points.map((item) => item.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = Math.max(max - min, 1)

  return (
    <div className="flex h-64 items-end gap-1 border-b border-slate-700/50 px-1 pb-2">
      {points.map((item, index) => {
        const previous = points[index - 1]?.price ?? item.price
        const up = item.price >= previous
        const height = 20 + ((item.price - min) / range) * 170
        return (
          <div key={`${item.label}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span
              className={up ? 'bg-emerald-500' : 'bg-red-500'}
              style={{
                width: '70%',
                height,
                minHeight: 8,
                boxShadow: `0 0 12px ${up ? 'rgba(34,197,94,.24)' : 'rgba(239,68,68,.24)'}`,
              }}
            />
            <span className="h-8 w-full rounded-sm bg-blue-500/15" style={{ opacity: 0.25 + (index % 7) / 14 }} />
          </div>
        )
      })}
    </div>
  )
}
