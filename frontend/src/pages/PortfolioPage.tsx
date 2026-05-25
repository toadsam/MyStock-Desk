import { Eye, Info } from 'lucide-react'
import { getAllocation, getHoldings, getPerformance, getPortfolio, getTransactions } from '../api/portfolioApi'
import { MistakeAlerts } from '../components/beginner/MistakeAlerts'
import { PortfolioHealthCard } from '../components/beginner/PortfolioHealthCard'
import { ReviewPromptCard } from '../components/beginner/ReviewPromptCard'
import { BarChartList } from '../components/charts/BarChartCard'
import { DonutChart } from '../components/charts/DonutChart'
import { PortfolioLineChart } from '../components/charts/LineAreaChart'
import { AiSummaryCard } from '../components/stock/AiSummaryCard'
import { HoldingsTable } from '../components/stock/HoldingsTable'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { mockAllocation, mockHoldings, mockInvestmentTransactions, mockPerformance, mockPortfolio, mockTransactions } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { cn } from '../utils/cn'
import { formatNumber, formatPercent, formatWon, isUp } from '../utils/format'

export default function PortfolioPage() {
  const { data: portfolio } = useAsyncData(getPortfolio, mockPortfolio)
  const { data: holdings } = useAsyncData(getHoldings, mockHoldings)
  const { data: performance } = useAsyncData(getPerformance, mockPerformance)
  const { data: allocation } = useAsyncData(getAllocation, mockAllocation)
  const { data: transactions } = useAsyncData(getTransactions, mockTransactions)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Card className="xl:col-span-1">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-50">
            내 포트폴리오 <Eye className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 text-sm text-slate-400">총 자산</div>
          <div className="mt-2 text-4xl font-black text-white">{formatWon(portfolio.totalAsset)}</div>
          <div className="mt-4 text-lg font-bold text-emerald-400">
            전일 대비 +{formatWon(portfolio.dailyProfitLoss)} ({formatPercent(portfolio.dailyReturnRate)})
          </div>
        </Card>
        <StatCard label="일간 수익" value={formatWon(portfolio.dailyProfitLoss)} change={portfolio.dailyReturnRate} />
        <StatCard label="누적 수익" value={formatWon(portfolio.totalProfitLoss)} change={portfolio.totalReturnRate} />
        <StatCard label="예수금" value={formatWon(portfolio.cash)} detail="총 자산 대비 5.49%" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PortfolioHealthCard portfolio={portfolio} holdings={holdings} allocation={allocation} />
        <MistakeAlerts holdings={holdings} transactions={mockInvestmentTransactions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_0.9fr]">
        <Card
          title={
            <span className="flex items-center gap-2">
              포트폴리오 성과 <Info className="h-4 w-4 text-slate-500" />
            </span>
          }
          action={
            <div className="hidden gap-2 text-sm text-slate-400 md:flex">
              {['1개월', '3개월', '6개월', '1년', '연초 대비', '전체'].map((item, index) => (
                <span key={item} className={cn('rounded-lg px-3 py-1.5', index === 3 && 'bg-blue-600/25 text-sky-200')}>{item}</span>
              ))}
            </div>
          }
        >
          <PortfolioLineChart data={performance} />
        </Card>

        <Card title="자산 배분">
          <DonutChart data={allocation} centerLabel={formatWon(portfolio.totalAsset)} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card title="보유 종목 현황">
          <HoldingsTable holdings={holdings} />
        </Card>
        <Card title="섹터 비중 (국내 주식)">
          <BarChartList
            items={[
              { label: '전기전자', value: 29.6 },
              { label: 'IT 서비스', value: 16.2 },
              { label: '금융', value: 11.3 },
              { label: '자동차', value: 9.3 },
              { label: '화학', value: 7.8 },
              { label: '헬스케어', value: 6.4 },
              { label: '기타', value: 19.6 },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card title="최근 투자 기록" action={<span className="text-sm text-blue-400">더보기</span>}>
          <div className="overflow-x-auto">
            <table className="compact-table text-sm">
              <thead>
                <tr>
                  <th>일자</th>
                  <th>종목명</th>
                  <th>구분</th>
                  <th>수량</th>
                  <th>기록 가격</th>
                  <th>금액</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 6).map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.createdAt.slice(0, 10)}</td>
                    <td>{transaction.stockName}</td>
                    <td className={transaction.transactionType === 'BUY' ? 'text-red-400' : transaction.transactionType === 'SELL' ? 'text-blue-400' : 'text-emerald-400'}>
                      {transaction.transactionType === 'BUY' ? '매수' : transaction.transactionType === 'SELL' ? '매도' : transaction.transactionType === 'DIVIDEND' ? '배당' : transaction.transactionType === 'DEPOSIT' ? '입금' : '출금'}
                    </td>
                    <td>{formatNumber(transaction.quantity)}</td>
                    <td>{formatNumber(transaction.price)}</td>
                    <td className={isUp(transaction.amount) ? 'text-slate-200' : 'text-blue-400'}>{formatWon(Math.abs(transaction.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <AiSummaryCard
            title="AI 체크포인트"
            content="현재 포트폴리오는 전기전자 섹터 비중이 높습니다. 추가 기록을 남기기 전 특정 섹터 쏠림, 최근 뉴스 변화, 보유 이유의 유효성을 함께 확인하세요."
            score={76}
          />
          <ReviewPromptCard transactions={mockInvestmentTransactions} />
        </div>
      </div>
    </div>
  )
}
