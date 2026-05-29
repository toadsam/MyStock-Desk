import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStockEarnings, getStockFinancials } from '../api/earningsApi'
import { getStock, getStockNews, getStockPrices } from '../api/stockApi'
import { getInvestmentMemos } from '../api/transactionApi'
import { BeginnerNewsExplainer } from '../components/beginner/BeginnerNewsExplainer'
import { BeginnerSummaryCard } from '../components/beginner/BeginnerSummaryCard'
import { GlossaryTip } from '../components/beginner/GlossaryTip'
import { InvestmentChecklist } from '../components/beginner/InvestmentChecklist'
import { LearningModeCard } from '../components/beginner/LearningModeCard'
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
import { mockEarningsBySymbol, mockNews, stockBySymbol, stockPrices } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatCompactWon, formatNumber, formatPercent } from '../utils/format'

export default function StockDetailPage() {
  const { symbol = '005930' } = useParams()
  const [period, setPeriod] = useState('1D')
  const { data: stock } = useAsyncData(() => getStock(symbol), stockBySymbol(symbol))
  const { data: prices } = useAsyncData(() => getStockPrices(symbol), stockPrices(symbol))
  const { data: news, loading: newsLoading, error: newsError } = useAsyncData(() => getStockNews(symbol), mockNews.filter((item) => item.relatedStockSymbol === symbol))
  const { data: earnings } = useAsyncData(() => getStockEarnings(symbol), mockEarningsBySymbol(symbol))
  const { data: financials } = useAsyncData(() => getStockFinancials(symbol), mockEarningsBySymbol(symbol))
  const { data: memos } = useAsyncData(getInvestmentMemos, [])
  const latestEarnings = earnings[0]
  const stockMemos = memos.filter((memo) => memo.symbol === stock.symbol)

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
            <Link to={`/transactions?symbol=${stock.symbol}`}><Button variant="outline" className="w-full">투자 메모 작성</Button></Link>
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
          <div className="mt-4">
            <Link to={`/financial-analysis?symbol=${stock.symbol}`}>
              <Button variant="outline" className="w-full">재무제표 분석하기</Button>
            </Link>
          </div>
        </Card>

        <AiSummaryCard
          title="AI 체크포인트"
          content={`${stock.name} 관련 뉴스에서는 업황 개선과 AI 수요 증가 이슈가 반복됩니다. 다만 내 보유 비중, 단기 가격 변동성, 환율 변수를 함께 확인해야 합니다.`}
          score={78}
        />

        <Card title="실적 체크">
          {latestEarnings ? (
            <div className="space-y-3">
              <InfoRow label="다음 실적 발표" value={latestEarnings.announcementDate} />
              <InfoRow label="매출 성장률" value={formatPercent(latestEarnings.yoyRevenueGrowth)} />
              <InfoRow label="영업이익 성장률" value={formatPercent(latestEarnings.yoyOperatingProfitGrowth)} />
              <InfoRow label="영업이익률" value={formatPercent(latestEarnings.operatingMargin, false)} />
              <p className="rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm leading-6 text-slate-400">
                매출은 증가했지만 영업이익률이 낮아졌다면 많이 팔았어도 수익성이 약해졌을 수 있습니다. 실적 발표 전 기존 투자 이유가 유지되는지 확인하세요.
              </p>
              <div className="text-xs text-slate-500">출처: {latestEarnings.source} · 갱신: {latestEarnings.lastUpdatedAt.slice(0, 10)}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">아직 연결된 실적 데이터가 없습니다. 일부 종목은 데모 데이터로 표시됩니다.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card title="관련 뉴스" action={<span className="text-sm text-blue-400">더보기</span>}>
          <NewsBriefing news={news} loading={newsLoading} error={newsError} />
        </Card>
        <BeginnerNewsExplainer news={news} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <InvestmentChecklist />
        <Card title="재무 요약">
          {latestEarnings ? (
            <div className="grid grid-cols-2 gap-3">
              <FinanceMetric label="매출액" value={formatCompactWon(latestEarnings.revenue)} change={formatPercent(latestEarnings.yoyRevenueGrowth)} />
              <FinanceMetric label={<span>영업이익 <GlossaryTip term="영업이익률" /></span>} value={formatCompactWon(latestEarnings.operatingProfit)} change={formatPercent(latestEarnings.yoyOperatingProfitGrowth)} />
              <FinanceMetric label="순이익" value={formatCompactWon(latestEarnings.netIncome)} change="실적 발표 후 확인" />
              <FinanceMetric label={<span>영업이익률 <GlossaryTip term="영업이익률" /></span>} value={formatPercent(latestEarnings.operatingMargin, false)} change="수익성 체크" />
            </div>
          ) : (
            <p className="text-sm text-slate-500">실적 데이터가 준비되면 매출, 영업이익, 순이익, 영업이익률을 표시합니다.</p>
          )}
        </Card>
      </div>

      <Card title="이 종목 투자 메모">
        {stockMemos.length === 0 ? (
          <p className="text-sm text-slate-500">아직 이 종목에 연결된 메모가 없습니다. 거래 기록 화면에서 매수 이유, 리스크, 실적 체크 메모를 남길 수 있습니다.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {stockMemos.slice(0, 3).map((memo) => (
              <div key={memo.id} className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
                <div className="text-xs font-semibold text-sky-300">{memo.memoType}</div>
                <div className="mt-2 font-bold text-slate-100">{memo.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{memo.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="실적·재무 상세">
        {financials.length === 0 ? (
          <p className="text-sm text-slate-500">이 종목에 연결된 재무 데이터가 아직 없습니다. 데이터가 준비되면 분기별 매출, 영업이익, 순이익, 성장률을 표시합니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="compact-table text-sm">
              <thead>
                <tr>
                  <th>기간</th>
                  <th>매출</th>
                  <th>영업이익</th>
                  <th>순이익</th>
                  <th>영업이익률</th>
                  <th>매출 성장률</th>
                  <th>영업이익 성장률</th>
                  <th>발표일</th>
                  <th>출처</th>
                </tr>
              </thead>
              <tbody>
                {financials.map((item) => (
                  <tr key={item.id}>
                    <td>{item.year}.{item.quarter}Q</td>
                    <td>{formatCompactWon(item.revenue)}</td>
                    <td>{formatCompactWon(item.operatingProfit)}</td>
                    <td>{formatCompactWon(item.netIncome)}</td>
                    <td>{formatPercent(item.operatingMargin, false)}</td>
                    <td>{formatPercent(item.yoyRevenueGrowth)}</td>
                    <td>{formatPercent(item.yoyOperatingProfitGrowth)}</td>
                    <td>{item.announcementDate}</td>
                    <td>{item.estimated ? '예상 · ' : ''}{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              매출은 늘었지만 영업이익률이 하락했다면 많이 팔았어도 수익성이 약해졌을 수 있습니다. 이 표는 투자 판단을 대신하지 않고 확인할 항목을 정리합니다.
            </p>
          </div>
        )}
      </Card>

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
