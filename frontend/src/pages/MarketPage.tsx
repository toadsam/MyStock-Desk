import { ArrowRight, Info, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDataRefreshStatus, refreshMarketData } from '../api/marketDataApi'
import { getMarketBreadth, getMarketHeatmap, getMarketIndices, getMarketSectors } from '../api/marketApi'
import { getNewsBriefing } from '../api/newsApi'
import { BarChartList } from '../components/charts/BarChartCard'
import { Sparkline } from '../components/charts/Sparkline'
import { Heatmap } from '../components/stock/Heatmap'
import { NewsBriefing } from '../components/stock/NewsBriefing'
import { AiSummaryCard } from '../components/stock/AiSummaryCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { indexPrices, mockBreadth, mockHeatmap, mockIndices, mockNews, mockSectors } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { cn } from '../utils/cn'
import { formatNumber, formatPercent, isUp } from '../utils/format'
import { useState } from 'react'

export default function MarketPage() {
  const [sectorTab, setSectorTab] = useState<'TOP' | 'BOTTOM'>('TOP')
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const { data: refreshStatus } = useAsyncData(getDataRefreshStatus, {
    provider: 'StockFlow Demo Feed',
    refreshedStocks: 0,
    refreshedAt: new Date().toISOString(),
    externalReady: false,
    message: '',
  })
  const { data: indices } = useAsyncData(getMarketIndices, mockIndices, [refreshKey])
  const { data: heatmap } = useAsyncData(getMarketHeatmap, mockHeatmap, [refreshKey])
  const { data: sectors } = useAsyncData(getMarketSectors, mockSectors, [refreshKey])
  const { data: breadth } = useAsyncData(getMarketBreadth, mockBreadth, [refreshKey])
  const { data: news, loading: newsLoading, error: newsError } = useAsyncData(getNewsBriefing, mockNews)
  const visibleSectors = sectors.filter((item) => item.type === sectorTab)

  const refresh = async () => {
    setRefreshing(true)
    setRefreshMessage(null)
    try {
      const result = await refreshMarketData()
      setRefreshMessage(`${result.refreshedStocks}개 종목 시세가 갱신되었습니다.`)
      setRefreshKey((value) => value + 1)
    } catch (exception) {
      setRefreshMessage(exception instanceof Error ? exception.message : '시세 갱신에 실패했습니다.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/35 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-blue-300">{refreshStatus.provider}</div>
          <div className="mt-1 text-sm text-slate-400">
            {refreshMessage ?? (refreshStatus.externalReady ? '외부 시세 Provider 사용 가능' : '현재 데모 시세 Provider 사용 중')}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          시세 갱신
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {indices.map((item) => (
          <Card key={item.code} className="min-h-48">
            <div className="text-sm font-semibold text-slate-300">{item.name}</div>
            <div className={cn('mt-3 text-3xl font-black', isUp(item.changeRate) ? 'text-emerald-400' : 'text-red-400')}>
              {formatNumber(item.value)}
            </div>
            <div className={cn('mt-2 text-sm font-semibold', isUp(item.changeRate) ? 'text-emerald-400' : 'text-red-400')}>
              {isUp(item.changeRate) ? '▲' : '▼'} {formatNumber(Math.abs(item.changeValue))} ({formatPercent(item.changeRate)})
            </div>
            <Sparkline data={indexPrices(item.code).slice(-26)} positive={isUp(item.changeRate)} />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title={
            <span className="flex items-center gap-2">
              시장 히트맵 <Info className="h-4 w-4 text-slate-500" />
            </span>
          }
          action={<Link to="/market" className="text-sm font-semibold text-slate-300">전체 시장 <ArrowRight className="inline h-4 w-4" /></Link>}
        >
          <div className="mb-3">
            <Tabs items={[{ label: '섹터', value: 'sector' }, { label: '테마', value: 'theme' }]} value="sector" onChange={() => undefined} />
          </div>
          <Heatmap sectors={heatmap} />
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span>변동률 기준</span>
            <span className="h-2 w-16 rounded-full bg-red-500" />
            <span>-3%</span>
            <span className="h-2 w-16 rounded-full bg-slate-600" />
            <span>0%</span>
            <span className="h-2 w-16 rounded-full bg-emerald-500" />
            <span>+3%</span>
          </div>
        </Card>

        <Card title="마켓 속보" action={<Link to="/research" className="text-sm text-blue-400">더보기</Link>}>
          <NewsBriefing news={news.slice(0, 6)} loading={newsLoading} error={newsError} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="섹터 등락률 TOP & BOTTOM">
          <div className="mb-4">
            <Tabs
              items={[{ label: 'TOP', value: 'TOP' }, { label: 'BOTTOM', value: 'BOTTOM' }]}
              value={sectorTab}
              onChange={setSectorTab}
            />
          </div>
          <BarChartList items={visibleSectors.map((item) => ({ label: item.sectorName, value: item.changeRate }))} />
        </Card>

        <Card title="시장 브레드스">
          <Tabs items={[{ label: 'KOSPI', value: 'KOSPI' }, { label: 'KOSDAQ', value: 'KOSDAQ' }]} value="KOSPI" onChange={() => undefined} />
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <MarketCount label="상승" value={breadth.rising} tone="up" />
            <MarketCount label="보합" value={breadth.unchanged} tone="flat" />
            <MarketCount label="하락" value={breadth.falling} tone="down" />
          </div>
          <div className="mt-5 flex h-8 overflow-hidden rounded-lg text-center text-sm font-bold text-slate-950">
            <div className="bg-emerald-500" style={{ width: `${breadth.risingRatio}%` }}>{breadth.risingRatio}%</div>
            <div className="bg-slate-400" style={{ width: `${100 - breadth.risingRatio - breadth.fallingRatio}%` }}>중립</div>
            <div className="bg-red-500" style={{ width: `${breadth.fallingRatio}%` }}>{breadth.fallingRatio}%</div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
            <MarketCount label="외국인" value={breadth.foreignNetBuy} suffix="억" tone="up" />
            <MarketCount label="기관" value={breadth.institutionNetBuy} suffix="억" tone="up" />
            <MarketCount label="개인" value={breadth.individualNetBuy} suffix="억" tone="down" />
          </div>
        </Card>

        <AiSummaryCard
          title="AI 마켓 코멘트"
          content="국내 증시는 대형 반도체주 강세에 힘입어 상승 출발했습니다. 외국인 순매수가 이어지고 있으며 업종별로 반도체, 금융, 자동차 강세가 두드러집니다."
          score={82}
        />
      </div>

      <Card title="주요 경제지표 & 이벤트">
        <div className="overflow-x-auto">
          <table className="compact-table text-sm">
            <thead>
              <tr>
                <th>시간</th>
                <th>국가</th>
                <th>지표</th>
                <th>발표</th>
                <th>예상</th>
                <th>중요도</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['08:50', '일본', '1분기 GDP', '-1.8%', '-1.2%', '★★★'],
                ['10:30', '호주', '5월 고용보고서', '25.4K', '15.0K', '★★'],
                ['21:30', '미국', '4월 소매판매', '0.2%', '0.3%', '★★★'],
                ['23:00', '미국', '5월 미시간대 소비심리', '67.4', '67.0', '★★★'],
              ].map((row) => (
                <tr key={`${row[0]}-${row[2]}`}>
                  {row.map((cell) => <td key={cell}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function MarketCount({ label, value, suffix = '', tone }: { label: string; value: number; suffix?: string; tone: 'up' | 'down' | 'flat' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={cn('mt-2 text-2xl font-black', tone === 'up' && 'text-emerald-400', tone === 'down' && 'text-red-400', tone === 'flat' && 'text-slate-300')}>
        {formatNumber(value)}{suffix}
      </div>
    </div>
  )
}
