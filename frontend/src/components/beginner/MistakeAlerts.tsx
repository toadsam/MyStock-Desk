import { AlertTriangle } from 'lucide-react'
import type { Holding } from '../../types/portfolio'
import type { InvestmentTransaction } from '../../types/transaction'
import { formatPercent } from '../../utils/format'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

export function MistakeAlerts({ holdings, transactions }: { holdings: Holding[]; transactions: InvestmentTransaction[] }) {
  const alerts = buildAlerts(holdings, transactions)

  return (
    <Card title="실수 방지 알림">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.title} className="rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                {alert.title}
              </div>
              <Badge tone={alert.level === '높음' ? 'red' : 'blue'}>{alert.level}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">{alert.text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function buildAlerts(holdings: Holding[], transactions: InvestmentTransaction[]) {
  const alerts: Array<{ title: string; text: string; level: '높음' | '점검' }> = []
  const top = [...holdings].sort((a, b) => b.weight - a.weight)[0]
  if (top && top.weight > 40) {
    alerts.push({ title: '한 종목 비중 과다', text: `${top.stock.name} 비중이 ${formatPercent(top.weight, false)}입니다. 추가 기록 전 쏠림을 확인하세요.`, level: '높음' })
  }
  const recentBuys = transactions.filter((item) => item.transactionType === 'BUY').slice(0, 4)
  const repeated = recentBuys.find((item, _, list) => list.filter((other) => other.symbol === item.symbol).length >= 2)
  if (repeated) {
    alerts.push({ title: '같은 종목 반복 매수 기록', text: `${repeated.stockName} 매수 기록이 최근에 반복됩니다. 처음 세운 투자 이유가 아직 유효한지 복기하세요.`, level: '점검' })
  }
  const missingReason = transactions.find((item) => !item.reason)
  if (missingReason) {
    alerts.push({ title: '투자 이유 누락', text: `${missingReason.stockName} 기록에 투자 이유가 없습니다. 나중에 판단을 복기하기 어렵습니다.`, level: '점검' })
  }
  alerts.push({ title: '수수료/세금 확인', text: '수수료와 세금을 입력하면 실현손익이 실제 결과에 더 가까워집니다.', level: '점검' })
  return alerts.slice(0, 4)
}
