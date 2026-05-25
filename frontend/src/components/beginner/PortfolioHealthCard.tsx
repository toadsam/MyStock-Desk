import { ShieldCheck } from 'lucide-react'
import type { Allocation, Holding, Portfolio } from '../../types/portfolio'
import { formatPercent } from '../../utils/format'
import { Card } from '../ui/Card'

export function PortfolioHealthCard({ portfolio, holdings, allocation }: { portfolio: Portfolio; holdings: Holding[]; allocation: Allocation[] }) {
  const topWeight = Math.max(...holdings.map((holding) => holding.weight), 0)
  const cashRate = portfolio.totalAsset ? (portfolio.cash / portfolio.totalAsset) * 100 : 0
  const losingCount = holdings.filter((holding) => holding.profitLoss < 0).length
  const recordScore = 82
  const diversificationScore = Math.max(35, Math.round(100 - Math.max(0, topWeight - 20) * 1.8))
  const cashScore = cashRate >= 5 && cashRate <= 30 ? 88 : 62
  const lossScore = Math.max(45, 100 - losingCount * 12)
  const score = Math.round((diversificationScore + cashScore + lossScore + recordScore) / 4)

  const rows = [
    ['분산 점수', diversificationScore, topWeight > 35 ? '특정 종목 비중을 확인하세요' : '종목 비중이 비교적 균형적입니다'],
    ['현금 비중', cashScore, `현금 비중 ${formatPercent(cashRate, false)}`],
    ['손실 관리', lossScore, `손실 종목 ${losingCount}개`],
    ['기록 충실도', recordScore, '투자 이유와 메모 기록이 쌓이고 있습니다'],
  ] as const

  return (
    <Card title="포트폴리오 건강 점수" action={<span className="text-2xl font-black text-emerald-400">{score}</span>}>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
        <ShieldCheck className="h-6 w-6 text-emerald-300" />
        <div>
          <div className="font-semibold text-slate-100">{score >= 75 ? '균형 양호' : score >= 60 ? '점검 필요' : '기록 보강 필요'}</div>
          <div className="text-sm text-slate-400">점수는 기록 누락과 쏠림을 줄이기 위한 참고 지표입니다.</div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map(([label, value, text]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-300">{label}</span>
              <span className="font-semibold text-slate-100">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${value}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-500">{text}</div>
          </div>
        ))}
      </div>
      {allocation[0] && <div className="mt-3 text-xs text-slate-500">가장 큰 자산군: {allocation[0].name} {formatPercent(allocation[0].rate, false)}</div>}
    </Card>
  )
}
