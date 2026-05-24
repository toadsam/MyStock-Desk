import type { Holding } from '../../types/portfolio'
import { cn } from '../../utils/cn'
import { formatNumber, formatPercent, formatWon, isUp } from '../../utils/format'

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="compact-table text-sm">
          <thead>
            <tr>
              <th>종목명</th>
              <th>보유수량</th>
              <th>평균 매입가</th>
              <th>현재가</th>
              <th>평가금액</th>
              <th>평가손익</th>
              <th>수익률</th>
              <th>비중</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.id}>
                <td>
                  <div className="font-semibold text-slate-100">{holding.stock.name}</div>
                  <div className="text-xs text-slate-500">{holding.stock.symbol}</div>
                </td>
                <td>{formatNumber(holding.quantity)}</td>
                <td>{formatNumber(holding.averagePrice)}</td>
                <td>{formatNumber(holding.currentPrice)}</td>
                <td>{formatWon(holding.evaluationAmount)}</td>
                <td className={cn(isUp(holding.profitLoss) ? 'text-emerald-400' : 'text-red-400')}>{formatWon(holding.profitLoss)}</td>
                <td className={cn(isUp(holding.returnRate) ? 'text-emerald-400' : 'text-red-400')}>{formatPercent(holding.returnRate)}</td>
                <td>{holding.weight.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {holdings.map((holding) => (
          <div key={holding.id} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-100">{holding.stock.name}</div>
                <div className="text-xs text-slate-500">{holding.stock.symbol}</div>
              </div>
              <div className={cn('font-semibold', isUp(holding.returnRate) ? 'text-emerald-400' : 'text-red-400')}>
                {formatPercent(holding.returnRate)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-400">
              <span>평가금액 {formatWon(holding.evaluationAmount)}</span>
              <span>비중 {holding.weight.toFixed(1)}%</span>
              <span>수량 {formatNumber(holding.quantity)}</span>
              <span>현재가 {formatNumber(holding.currentPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
