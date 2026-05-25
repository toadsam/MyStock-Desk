import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStock, getStockNews, getStockPrices } from '../api/stockApi'
import { BeginnerNewsExplainer } from '../components/beginner/BeginnerNewsExplainer'
import { BeginnerSummaryCard } from '../components/beginner/BeginnerSummaryCard'
import { GlossaryTip } from '../components/beginner/GlossaryTip'
import { InvestmentChecklist } from '../components/beginner/InvestmentChecklist'
import { LearningModeCard } from '../components/beginner/LearningModeCard'
import { BarChartList } from '../components/charts/BarChartCard'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { MiniCandleChart } from '../components/charts/MiniCandleChart'
import { AiSummaryCard } from '../components/stock/AiSummaryCard'
import { NewsBriefing } from '../components/stock/NewsBriefing'
import { StockHeader } from '../components/stock/StockHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { mockNews, stockBySymbol, stockPrices } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatCompactWon, formatNumber, formatPercent } from '../utils/format'

export default function StockDetailPage() {
  const { symbol = '005930' } = useParams()
  const [period, setPeriod] = useState('1D')
  const { data: stock } = useAsyncData(() => getStock(symbol), stockBySymbol(symbol))
  const { data: prices } = useAsyncData(() => getStockPrices(symbol), stockPrices(symbol))
  const { data: news } = useAsyncData(() => getStockNews(symbol), mockNews.filter((item) => item.relatedStockSymbol === symbol))

  return (
    <div className="space-y-4">
      <StockHeader stock={stock} />
      <BeginnerSummaryCard stock={stock} />
      <LearningModeCard stock={stock} />

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

        <Card title="내 보유 기준 분석">
          <InfoRow label="현재 보유 수량" value="20주" />
          <InfoRow label={<span>평균 매수가 <GlossaryTip term="평균매수가" /></span>} value="72,400원" />
          <InfoRow label="평가손익" value="+124,000원" />
          <InfoRow label="수익률" value="+8.56%" />
          <InfoRow label="포트폴리오 비중" value="18.4%" />
          <div className="mt-4 grid gap-2">
            <Link to={`/transactions?symbol=${stock.symbol}`}><Button className="w-full">거래 기록 추가</Button></Link>
            <Button variant="outline" className="w-full">투자 메모 작성</Button>
          </div>
        </Card>

        <Card title="기업 정보">
          <InfoRow label="시가총액" value={formatCompactWon(stock.marketCap)} />
          <InfoRow label={<span>PER <GlossaryTip term="PER" /></span>} value={`${stock.per.toFixed(2)}배`} />
          <InfoRow label={<span>PBR <GlossaryTip term="PBR" /></span>} value={`${stock.pbr.toFixed(2)}배`} />
          <InfoRow label={<span>배당수익률 <GlossaryTip term="배당수익률" /></span>} value={`${stock.dividendYield.toFixed(2)}%`} />
          <InfoRow label="52주 최고" value={formatNumber(stock.week52High)} />
          <InfoRow label="52주 최저" value={formatNumber(stock.week52Low)} />
          <InfoRow label="업종" value={stock.industry} />
        </Card>

        <AiSummaryCard
          title="AI 체크포인트"
          content={`${stock.name} 관련 뉴스에서는 업황 개선과 AI 수요 증가 이슈가 반복됩니다. 다만 내 보유 비중, 단기 가격 변동성, 환율 변수를 함께 확인해야 합니다.`}
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
        <BeginnerNewsExplainer news={news.length ? news : mockNews.slice(0, 4)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <InvestmentChecklist />
        <Card title="재무 요약">
          <div className="grid grid-cols-2 gap-3">
            <FinanceMetric label="매출액" value="300.87조원" change="+16.21%" />
            <FinanceMetric label={<span>영업이익 <GlossaryTip term="영업이익률" /></span>} value="32.73조원" change="+398.91%" />
            <FinanceMetric label="순이익" value="26.19조원" change="+145.23%" />
            <FinanceMetric label={<span>영업이익률 <GlossaryTip term="영업이익률" /></span>} value="10.88%" change="+8.64%p" />
          </div>
        </Card>
      </div>

      <Card title="다음 확인 항목">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['뉴스 변화', 'HBM 공급 확대 이슈가 반복되는지 확인'],
            ['보유 비중', `현재 비중 ${formatPercent(18.4, false)}가 과도하지 않은지 점검`],
            ['재무지표', '영업이익률과 현금흐름 개선 여부 확인'],
            ['실적 일정', '다음 분기 실적 발표 전 가정 재검토'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
              <div className="font-bold text-slate-100">{title}</div>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-2.5 text-sm last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  )
}

function FinanceMetric({ label, value, change }: { label: ReactNode; value: string; change: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-bold text-slate-100">{value}</div>
      <div className="mt-2 text-sm text-emerald-400">YoY {change}</div>
    </div>
  )
}
