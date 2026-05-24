import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStock, getStockNews, getStockPrices, getOrderBook } from '../api/stockApi'
import { BarChartList } from '../components/charts/BarChartCard'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { MiniCandleChart } from '../components/charts/MiniCandleChart'
import { AiSummaryCard } from '../components/stock/AiSummaryCard'
import { NewsBriefing } from '../components/stock/NewsBriefing'
import { OrderBook } from '../components/stock/OrderBook'
import { StockHeader } from '../components/stock/StockHeader'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { mockNews, orderBook, stockBySymbol, stockPrices } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatCompactWon, formatNumber } from '../utils/format'

export default function StockDetailPage() {
  const { symbol = '005930' } = useParams()
  const [period, setPeriod] = useState('1D')
  const { data: stock } = useAsyncData(() => getStock(symbol), stockBySymbol(symbol))
  const { data: prices } = useAsyncData(() => getStockPrices(symbol), stockPrices(symbol))
  const { data: book } = useAsyncData(() => getOrderBook(symbol), orderBook(symbol))
  const { data: news } = useAsyncData(() => getStockNews(symbol), mockNews.filter((item) => item.relatedStockSymbol === symbol))

  return (
    <div className="space-y-4">
      <StockHeader stock={stock} />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr_0.85fr]">
        <Card className="xl:row-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              items={[
                { label: '1일', value: '1D' },
                { label: '1주', value: '1W' },
                { label: '1개월', value: '1M' },
                { label: '3개월', value: '3M' },
                { label: '1년', value: '1Y' },
              ]}
              value={period}
              onChange={setPeriod}
            />
            <div className="text-sm text-slate-500">차트 설정 · 자동</div>
          </div>
          <LineAreaChart data={prices} height={360} showVolume />
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/25 p-3">
            <MiniCandleChart data={prices} />
          </div>
        </Card>

        <Card title="호가">
          <OrderBook orderBook={book} />
        </Card>

        <Card title="기업 정보">
          <InfoRow label="시가총액" value={formatCompactWon(stock.marketCap)} />
          <InfoRow label="PER" value={`${stock.per.toFixed(2)}배`} />
          <InfoRow label="PBR" value={`${stock.pbr.toFixed(2)}배`} />
          <InfoRow label="배당수익률" value={`${stock.dividendYield.toFixed(2)}%`} />
          <InfoRow label="52주 최고" value={formatNumber(stock.week52High)} />
          <InfoRow label="52주 최저" value={formatNumber(stock.week52Low)} />
          <InfoRow label="업종" value={stock.industry} />
        </Card>

        <AiSummaryCard
          title="AI 투자 요약"
          content={`${stock.name}는 업황 개선과 AI 수요 증가에 따른 수혜가 예상됩니다. 다만 단기 가격 변동성과 환율 변수를 함께 점검해야 합니다.`}
          score={78}
        />

        <Card title="실적 추이">
          <BarChartList
            items={[
              { label: '2023.1Q', value: 6.2 },
              { label: '2023.2Q', value: 3.4 },
              { label: '2023.3Q', value: 7.1 },
              { label: '2023.4Q', value: 11.4 },
              { label: '2024.1Q', value: 16.2 },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card title="관련 뉴스" action={<span className="text-sm text-blue-400">더보기</span>}>
          <NewsBriefing news={news.length ? news : mockNews.slice(0, 4)} />
        </Card>
        <Card title="재무 요약">
          <div className="grid grid-cols-2 gap-3">
            <FinanceMetric label="매출액" value="300.87조원" change="+16.21%" />
            <FinanceMetric label="영업이익" value="32.73조원" change="+398.91%" />
            <FinanceMetric label="순이익" value="26.19조원" change="+145.23%" />
            <FinanceMetric label="영업이익률" value="10.88%" change="+8.64%p" />
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-2.5 text-sm last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  )
}

function FinanceMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-100">{value}</div>
      <div className="mt-2 text-sm text-emerald-400">YoY {change}</div>
    </div>
  )
}
