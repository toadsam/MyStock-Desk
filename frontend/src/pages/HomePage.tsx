import { ArrowRight, Bot, ShoppingCart, Star, TrendingUp, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getMarketBreadth, getMarketIndices, getIndexPrices } from '../api/marketApi'
import { getNewsBriefing } from '../api/newsApi'
import { getAllocation, getPortfolio } from '../api/portfolioApi'
import { getWatchlist } from '../api/watchlistApi'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { Sparkline } from '../components/charts/Sparkline'
import { AiSummaryCard } from '../components/stock/AiSummaryCard'
import { NewsBriefing } from '../components/stock/NewsBriefing'
import { Watchlist } from '../components/stock/Watchlist'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { indexPrices, mockAllocation, mockBreadth, mockIndices, mockNews, mockPortfolio, mockWatchlist } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { cn } from '../utils/cn'
import { formatCompactWon, formatNumber, formatPercent, formatWon, isUp } from '../utils/format'

export default function HomePage() {
  const { data: portfolio } = useAsyncData(getPortfolio, mockPortfolio)
  const { data: watchlist } = useAsyncData(getWatchlist, mockWatchlist)
  const { data: indices } = useAsyncData(getMarketIndices, mockIndices)
  const { data: chartData } = useAsyncData(() => getIndexPrices('KOSPI'), indexPrices('KOSPI'))
  const { data: news } = useAsyncData(getNewsBriefing, mockNews.slice(0, 6))
  const { data: breadth } = useAsyncData(getMarketBreadth, mockBreadth)
  const { data: allocation } = useAsyncData(getAllocation, mockAllocation)

  const kospi = indices[0]

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_1.4fr_1fr]">
      <div className="space-y-4">
        <Card className="min-h-80">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-50">내 포트폴리오</h1>
              <p className="mt-4 text-sm text-slate-400">총 자산</p>
              <p className="mt-2 text-4xl font-black text-white">{formatWon(portfolio.totalAsset)}</p>
              <p className="mt-3 text-lg font-bold text-emerald-400">
                전일 대비 +{formatWon(portfolio.dailyProfitLoss)} ({formatPercent(portfolio.dailyReturnRate)})
              </p>
            </div>
            <WalletCards className="h-8 w-8 text-slate-400" />
          </div>
          <Sparkline data={chartData.slice(-34)} positive />
          <div className="mt-7 grid grid-cols-3 gap-4 border-t border-slate-800 pt-5">
            <Metric label="총 매입금액" value={formatWon(portfolio.totalPurchaseAmount)} />
            <Metric label="총 평가손익" value={formatWon(portfolio.totalProfitLoss)} up />
            <Metric label="수익률" value={formatPercent(portfolio.totalReturnRate)} up />
          </div>
        </Card>

        <Card title="포트폴리오 구성">
          <div className="space-y-3">
            {allocation.slice(0, 5).map((item) => (
              <div key={item.name} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-slate-300">{item.name}</span>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.rate}%` }} />
                </div>
                <span className="text-right text-slate-400">{item.rate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card
          title={
            <span className="flex items-center gap-3">
              코스피 <span className="text-2xl text-emerald-400">{formatNumber(kospi?.value)}</span>
              <span className="text-sm text-emerald-400">▲ {formatNumber(kospi?.changeValue)} ({formatPercent(kospi?.changeRate)})</span>
            </span>
          }
          action={<Link to="/market" className="text-sm font-semibold text-blue-400">지수 더보기 <ArrowRight className="inline h-4 w-4" /></Link>}
        >
          <div className="mb-3 flex gap-2 text-sm text-slate-400">
            {['1일', '1주', '1개월', '3개월', '6개월', '1년', '3년'].map((item, index) => (
              <span key={item} className={cn('rounded-lg px-3 py-1.5', index === 0 && 'bg-blue-600/25 text-sky-200')}>{item}</span>
            ))}
          </div>
          <LineAreaChart data={chartData} height={310} showVolume />
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-center text-sm md:grid-cols-6">
            <Metric label="거래대금" value="13.2조" />
            <Metric label="외국인 순매수" value={`+${formatNumber(breadth.foreignNetBuy)}억`} up />
            <Metric label="기관 순매수" value={`+${formatNumber(breadth.institutionNetBuy)}억`} up />
            <Metric label="개인 순매도" value={`${formatNumber(breadth.individualNetBuy)}억`} />
            <Metric label="상승" value={formatNumber(breadth.rising)} up />
            <Metric label="하락" value={formatNumber(breadth.falling)} down />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard icon={<ShoppingCart />} title="매수" text="원하는 종목을 매수합니다" to="/trade?symbol=005930&type=BUY" tone="blue" />
          <ActionCard icon={<TrendingUp />} title="매도" text="보유 종목을 매도합니다" to="/trade?symbol=005930&type=SELL" tone="red" />
          <ActionCard icon={<Star />} title="관심종목 추가" text="관심 종목을 등록하세요" to="/stock/005930" tone="violet" />
        </div>

        <Card title="오늘의 시장 한눈에" action={<Link to="/market" className="text-sm text-blue-400">더보기</Link>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {indices.slice(0, 4).map((item) => (
              <div key={item.code} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <div className="text-sm text-slate-400">{item.name}</div>
                <div className={cn('mt-2 text-xl font-bold', isUp(item.changeRate) ? 'text-emerald-400' : 'text-red-400')}>{formatNumber(item.value)}</div>
                <div className={cn('mt-1 text-xs', isUp(item.changeRate) ? 'text-emerald-400' : 'text-red-400')}>{formatPercent(item.changeRate)}</div>
                <Sparkline data={indexPrices(item.code).slice(-18)} positive={isUp(item.changeRate)} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="관심종목" action={<Link to="/stock/005930" className="text-sm text-blue-400">더보기</Link>}>
          <Watchlist items={watchlist} />
        </Card>
        <Card title="뉴스 브리핑" action={<Link to="/research" className="text-sm text-blue-400">더보기</Link>}>
          <NewsBriefing news={news.slice(0, 5)} />
        </Card>
        <AiSummaryCard content="시장 강세가 이어지고 있으며 반도체와 AI 인프라 업종의 수급 개선이 확인됩니다. 단기 변동성은 있지만 포트폴리오의 핵심 비중은 유지하는 전략이 적합합니다." />
      </div>
    </div>
  )
}

function Metric({ label, value, up, down }: { label: string; value: string; up?: boolean; down?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cn('mt-1 font-semibold text-slate-100', up && 'text-emerald-400', down && 'text-red-400')}>{value}</div>
    </div>
  )
}

function ActionCard({ icon, title, text, to, tone }: { icon: ReactNode; title: string; text: string; to: string; tone: 'blue' | 'red' | 'violet' }) {
  const tones = {
    blue: 'from-blue-600/25 to-slate-950 border-blue-500/25',
    red: 'from-red-600/25 to-slate-950 border-red-500/25',
    violet: 'from-violet-600/25 to-slate-950 border-violet-500/25',
  }
  return (
    <Link to={to} className={cn('flex min-h-28 items-center justify-between rounded-2xl border bg-gradient-to-br p-4 transition hover:scale-[1.01]', tones[tone])}>
      <div>
        <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/8 text-slate-100">{icon}</div>
        <div className="font-bold text-slate-50">{title}</div>
        <div className="mt-1 text-sm text-slate-400">{text}</div>
      </div>
      <ArrowRight className="h-5 w-5 text-slate-300" />
    </Link>
  )
}
