import { CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react'
import type { Stock } from '../../types/stock'
import { formatCompactWon, formatPercent } from '../../utils/format'
import { Card } from '../ui/Card'

export function BeginnerSummaryCard({ stock }: { stock: Stock }) {
  const items = [
    ['이 회사는 뭐 하는 회사인가', `${stock.industry} 분야의 ${stock.market} 상장 기업입니다.`],
    ['돈을 잘 벌고 있는가', `PER ${stock.per.toFixed(1)}배, PBR ${stock.pbr.toFixed(1)}배입니다. 업종 평균과 비교가 필요합니다.`],
    ['최근 뉴스 분위기', '관련 뉴스에서 실적, 수급, 업황 변화가 반복되는지 확인하세요.'],
    ['주가가 많이 오른 상태인가', `52주 최고가 대비 현재 위치를 보고 추격 기록을 피해야 합니다.`],
    ['내가 이미 많이 들고 있는가', '포트폴리오 비중이 30%를 넘으면 종목 쏠림을 먼저 확인하세요.'],
    ['현금흐름은 있는가', `배당수익률은 ${formatPercent(stock.dividendYield, false)}입니다.`],
  ]

  return (
    <Card title="초보 요약">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(([title, text], index) => {
          const Icon = index < 2 ? CheckCircle2 : index < 4 ? HelpCircle : ShieldAlert
          return (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <Icon className="h-4 w-4 text-sky-300" />
                {title}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-sm text-sky-200">
        시가총액 {formatCompactWon(stock.marketCap)} 규모의 기업입니다. 숫자는 단독 판단보다 업종 비교와 최근 실적 흐름으로 확인하세요.
      </div>
    </Card>
  )
}
