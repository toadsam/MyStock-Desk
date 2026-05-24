import type { HeatmapSector } from '../../types/market'
import { cn } from '../../utils/cn'
import { formatPercent } from '../../utils/format'

export function Heatmap({ sectors }: { sectors: HeatmapSector[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {sectors.map((sector) => {
        const up = sector.changeRate >= 0
        return (
          <div
            key={sector.sectorName}
            className={cn('rounded-xl border p-2', up ? 'border-emerald-500/25 bg-emerald-500/12' : 'border-red-500/25 bg-red-500/12')}
          >
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-100">{sector.sectorName}</span>
              <span className={up ? 'text-emerald-400' : 'text-red-400'}>{formatPercent(sector.changeRate)}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {sector.stocks.map((stock) => {
                const stockUp = stock.changeRate >= 0
                return (
                  <div
                    key={stock.symbol}
                    className={cn(
                      'min-h-20 rounded-lg border p-2 text-center',
                      stockUp ? 'border-emerald-400/25 bg-emerald-500/15' : 'border-red-400/25 bg-red-500/15',
                    )}
                  >
                    <div className="truncate text-sm font-semibold text-slate-100">{stock.name}</div>
                    <div className={cn('mt-2 text-sm font-bold', stockUp ? 'text-emerald-300' : 'text-red-300')}>
                      {formatPercent(stock.changeRate)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
