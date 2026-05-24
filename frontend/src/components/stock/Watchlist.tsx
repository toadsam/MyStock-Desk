import { Link } from 'react-router-dom'
import type { WatchlistItem } from '../../types/market'
import { cn } from '../../utils/cn'
import { formatCompactWon, formatNumber, formatPercent, isUp } from '../../utils/format'
import { Sparkline } from '../charts/Sparkline'
import { stockPrices } from '../../data/mockData'

export function Watchlist({ items, compact = false }: { items: WatchlistItem[]; compact?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map(({ stock }) => (
        <Link
          key={stock.symbol}
          to={`/stock/${stock.symbol}`}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-blue-500/30 hover:bg-slate-800/30"
        >
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-100">{stock.name}</div>
            <div className="text-xs text-slate-500">{stock.symbol}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-100">{formatNumber(stock.currentPrice)}</div>
            <div className={cn('text-xs font-semibold', isUp(stock.changeRate) ? 'text-emerald-400' : 'text-red-400')}>
              {formatPercent(stock.changeRate)}
            </div>
          </div>
          {!compact && (
            <div className="hidden w-24 md:block">
              <Sparkline data={stockPrices(stock.symbol).slice(-24)} positive={isUp(stock.changeRate)} />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}

export function MarketMiniList({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="divide-y divide-slate-800/80">
      {items.map(({ stock }) => (
        <div key={stock.symbol} className="grid grid-cols-[1fr_auto] gap-3 py-3">
          <div>
            <div className="font-semibold text-slate-100">{stock.name}</div>
            <div className="text-xs text-slate-500">{stock.symbol} · {formatCompactWon(stock.tradingValue)}</div>
          </div>
          <div className={cn('text-right font-semibold', isUp(stock.changeRate) ? 'text-emerald-400' : 'text-red-400')}>
            {formatPercent(stock.changeRate)}
          </div>
        </div>
      ))}
    </div>
  )
}
