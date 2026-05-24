import { Bell, Share2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Stock } from '../../types/stock'
import { cn } from '../../utils/cn'
import { formatCompactWon, formatNumber, formatPercent, isUp } from '../../utils/format'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function StockHeader({ stock }: { stock: Stock }) {
  const up = isUp(stock.changeRate)
  return (
    <div className="glass-card rounded-2xl p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Star className="h-5 w-5 text-yellow-300" />
            <h1 className="text-2xl font-bold text-slate-50 md:text-3xl">{stock.name}</h1>
            <span className="text-slate-400">{stock.symbol}</span>
            <Badge tone="slate">{stock.market}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className={cn('text-4xl font-black md:text-5xl', up ? 'text-emerald-400' : 'text-red-400')}>
              {formatNumber(stock.currentPrice)}
            </span>
            <span className={cn('mb-1 text-lg font-bold', up ? 'text-emerald-400' : 'text-red-400')}>
              {up ? '▲' : '▼'} {formatNumber(Math.abs(stock.changePrice))} ({formatPercent(stock.changeRate)})
            </span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] lg:min-w-[34rem]">
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
            <span>고가 <b className="ml-2 text-red-400">{formatNumber(stock.highPrice)}</b></span>
            <span>저가 <b className="ml-2 text-sky-400">{formatNumber(stock.lowPrice)}</b></span>
            <span>거래량 <b className="ml-2 text-slate-200">{formatNumber(stock.volume)}</b></span>
            <span>거래대금 <b className="ml-2 text-slate-200">{formatCompactWon(stock.tradingValue)}</b></span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="min-h-10 flex-1 px-3"><Bell className="h-4 w-4" /> 알림</Button>
            <Button variant="outline" className="min-h-10 flex-1 px-3"><Share2 className="h-4 w-4" /> 공유</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/trade?symbol=${stock.symbol}&type=BUY`}><Button variant="buy" className="w-full">매수</Button></Link>
            <Link to={`/trade?symbol=${stock.symbol}&type=SELL`}><Button variant="sell" className="w-full">매도</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
