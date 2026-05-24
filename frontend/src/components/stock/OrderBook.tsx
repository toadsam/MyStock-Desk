import type { OrderBook as OrderBookType } from '../../types/stock'
import { cn } from '../../utils/cn'
import { formatNumber, formatPercent } from '../../utils/format'

export function OrderBook({ orderBook }: { orderBook: OrderBookType }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-3 px-2 text-xs text-slate-500">
        <span>매도잔량</span>
        <span className="text-center">호가</span>
        <span className="text-right">매수잔량</span>
      </div>
      {orderBook.asks.map((level) => (
        <div key={`ask-${level.price}`} className="grid grid-cols-3 items-center rounded-lg bg-red-500/8 px-2 py-1.5 text-sm">
          <span className="text-slate-400">{formatNumber(level.quantity)}</span>
          <span className="text-center font-semibold text-red-400">{formatNumber(level.price)}</span>
          <span className="text-right text-red-300">{formatPercent(level.changeRate)}</span>
        </div>
      ))}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-lg font-bold text-emerald-400">
        {formatNumber(orderBook.currentPrice)}
      </div>
      {orderBook.bids.map((level) => (
        <div key={`bid-${level.price}`} className="grid grid-cols-3 items-center rounded-lg bg-blue-500/8 px-2 py-1.5 text-sm">
          <span className="text-slate-400">{formatNumber(level.quantity)}</span>
          <span className="text-center font-semibold text-sky-400">{formatNumber(level.price)}</span>
          <span className="text-right text-sky-300">{formatPercent(level.changeRate, false)}</span>
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 text-sm">
        <span className="text-slate-400">체결강도</span>
        <span className="font-semibold text-emerald-400">{orderBook.executionStrength.toFixed(2)}%</span>
      </div>
    </div>
  )
}
