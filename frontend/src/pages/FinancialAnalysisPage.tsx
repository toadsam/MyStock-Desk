import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getStockFinancials } from '../api/earningsApi'
import { getStock, getStocks } from '../api/stockApi'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { mockEarningsBySymbol, mockStocks, stockBySymbol } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { Earnings } from '../types/earnings'
import type { Stock } from '../types/stock'
import { cn } from '../utils/cn'
import { formatCompactWon, formatPercent } from '../utils/format'

type ScoreTone = 'green' | 'blue' | 'yellow' | 'red'

type AnalysisScore = {
  label: string
  score: number
  tone: ScoreTone
  summary: string
}

type Scenario = {
  name: string
  tone: ScoreTone
  revenueGrowth: number
  operatingMargin: number
  explanation: string
}

type FormulaItem = {
  title: string
  formula: string
  result: string
  plainText: string
  detail: string
  caution: string
  tone: ScoreTone
}

type SupplementalStatements = {
  equity: number
  assets: number
  liabilities: number
  cashAndEquivalents: number
  currentAssets: number
  currentLiabilities: number
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  freeCashFlow: number
  debtRatio: number
  currentRatio: number
  ocfMargin: number
  fcfMargin: number
}

type StatementPeriod = SupplementalStatements & {
  label: string
  revenue: number
  operatingProfit: number
  netIncome: number
  operatingMargin: number
  netMargin: number
  revenueGrowth: number
  operatingProfitGrowth: number
  roe: number
  roa: number
}

type IndustryBenchmark = {
  name: string
  operatingMargin: number
  netMargin: number
  debtRatio: number
  currentRatio: number
  per: number
  pbr: number
  roe: number
  fcfMargin: number
}

type BenchmarkItem = {
  label: string
  company: number
  industry: number
  unit: '%' | '배'
  interpretation: string
  tone: ScoreTone
}

type TrendInsight = {
  title: string
  value: string
  description: string
  tone: ScoreTone
}

type DisclosureCheck = {
  title: string
  why: string
  check: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

type QuickConclusion = {
  positive: string
  caution: string
  cautionTone: ScoreTone
  action: string
}

type DiagnosticSummary = {
  verdict: string
  tone: ScoreTone
  points: string[]
  nextActions: string[]
}

type RiskSignal = {
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

const beginnerOrder = [
  {
    title: '1. 매출',
    text: '회사가 실제로 얼마나 팔고 있는지 봅니다. 매출이 꾸준히 늘면 사업의 크기가 커지고 있다는 뜻입니다.',
  },
  {
    title: '2. 영업이익',
    text: '본업으로 남긴 돈입니다. 매출이 늘어도 영업이익이 줄면 비용, 가격 경쟁, 일회성 손실을 의심해야 합니다.',
  },
  {
    title: '3. 순이익',
    text: '세금, 이자, 기타 손익까지 반영한 최종 이익입니다. 주주에게 남는 이익의 출발점입니다.',
  },
  {
    title: '4. 밸류에이션',
    text: '좋은 회사라도 너무 비싸게 사면 수익률이 낮아질 수 있습니다. PER, PBR은 가격 부담을 보는 도구입니다.',
  },
]

export default function FinancialAnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [analysisMode, setAnalysisMode] = useState<'BEGINNER' | 'DETAIL'>('BEGINNER')
  const symbol = searchParams.get('symbol') ?? '005930'
  const { data: stocks } = useAsyncData(getStocks, mockStocks)
  const { data: stock } = useAsyncData(() => getStock(symbol), stockBySymbol(symbol), [symbol])
  const { data: financials } = useAsyncData(() => getStockFinancials(symbol), mockEarningsBySymbol(symbol), [symbol])

  const orderedFinancials = useMemo(() => orderFinancials(financials), [financials])
  const latest = orderedFinancials.at(-1)
  const previous = orderedFinancials.at(-2)
  const scores = useMemo(() => buildScores(stock, latest, previous), [latest, previous, stock])
  const scenarios = useMemo(() => buildScenarios(latest), [latest])
  const formulaItems = useMemo(() => buildFormulaItems(stock, latest), [latest, stock])
  const financialChartData = useMemo(() => buildFinancialChartData(orderedFinancials), [orderedFinancials])
  const scoreChartData = useMemo(() => scores.map((item) => ({ name: item.label, score: item.score })), [scores])
  const overallScore = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / Math.max(scores.length, 1))
  const statementRows = useMemo(() => buildStatementRows(stock, orderedFinancials), [orderedFinancials, stock])
  const latestStatement = statementRows.at(-1)
  const supplemental = useMemo(() => latestStatement ?? buildSupplementalStatements(stock, latest), [latest, latestStatement, stock])
  const benchmark = useMemo(() => getIndustryBenchmark(stock), [stock])
  const benchmarkItems = useMemo(() => buildBenchmarkItems(stock, latest, supplemental, benchmark), [benchmark, latest, stock, supplemental])
  const trendInsights = useMemo(() => buildTrendInsights(statementRows), [statementRows])
  const disclosureChecks = useMemo(() => buildDisclosureChecks(stock, latest, supplemental), [latest, stock, supplemental])
  const diagnostic = useMemo(() => buildDiagnosticSummary(stock, latest, supplemental, overallScore), [latest, overallScore, stock, supplemental])
  const detailedRisks = useMemo(() => buildDetailedRiskSignals(stock, latest, supplemental), [latest, stock, supplemental])
  const quickConclusion = useMemo(() => buildQuickConclusion(stock, latest, supplemental, detailedRisks), [detailedRisks, latest, stock, supplemental])
  const overallTone = toneForScore(overallScore)

  const changeSummary = latest
    ? buildChangeSummary(latest, previous)
    : '연결된 재무 데이터가 부족합니다. 종목을 바꾸거나 백엔드 재무 데이터 수집 상태를 확인하세요.'

  const setSymbol = (nextSymbol: string) => {
    setSearchParams({ symbol: nextSymbol })
  }

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-sky-300" />
              <div>
                <div className="text-sm font-semibold text-sky-300">초보자용 재무제표 분석</div>
                <h1 className="mt-1 text-2xl font-black text-slate-50 md:text-3xl">재무제표 분석하기</h1>
              </div>
              <Badge tone={overallTone === 'green' ? 'green' : overallTone === 'red' ? 'red' : 'blue'}>
                분석 점수 {overallScore}점
              </Badge>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-400">
              숫자를 외우는 페이지가 아니라, 매출이 커지는지, 본업 이익이 남는지, 가격이 부담스럽지 않은지, 다음 분기에 무엇을 확인해야 하는지까지 한 번에 읽도록 구성했습니다.
              투자 추천이 아니라 판단을 돕는 재무 체크포인트입니다.
            </p>
            <div className="mt-4 inline-flex rounded-xl border border-slate-700 bg-slate-950/45 p-1">
              {[
                ['BEGINNER', '초보자 모드'],
                ['DETAIL', '상세 모드'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'min-h-9 rounded-lg px-3 text-sm font-semibold transition',
                    analysisMode === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-100',
                  )}
                  onClick={() => setAnalysisMode(value as 'BEGINNER' | 'DETAIL')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/35 p-3">
            <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <select
                className="min-w-0 w-full bg-transparent text-sm font-semibold text-slate-100 outline-none"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              >
                {stocks.map((item) => (
                  <option key={item.symbol} value={item.symbol} className="bg-slate-950">
                    {item.name} ({item.symbol})
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-2">현재 종목: {stock.name}</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-2">데이터: {latest?.source ?? 'demo'}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <QuickConclusionCard title="좋아 보이는 점" value={quickConclusion.positive} tone="green" />
          <QuickConclusionCard title="반드시 조심할 점" value={quickConclusion.caution} tone={quickConclusion.cautionTone} />
          <QuickConclusionCard title="다음 행동" value={quickConclusion.action} tone="blue" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Activity className={cn('h-6 w-6', toneText(diagnostic.tone))} />
              <div>
                <div className="text-sm font-semibold text-sky-300">최종 진단 요약</div>
                <h2 className="mt-1 break-words text-lg font-black leading-tight text-slate-50 md:text-2xl">{diagnostic.verdict}</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {diagnostic.points.map((point) => (
                <div key={point} className="break-words rounded-lg border border-slate-700/70 bg-slate-950/35 p-3 text-sm leading-6 text-slate-300">
                  {point}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              다음에 확인할 것
            </div>
            <div className="mt-3 space-y-2">
              {diagnostic.nextActions.map((action) => (
                <p key={action} className="text-sm leading-6 text-slate-400">· {action}</p>
              ))}
            </div>
            <p className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/8 p-2 text-xs leading-5 text-yellow-100">
              3대 재무제표 구조는 손익계산서 원천 데이터와 종목 지표를 결합한 분석 모델입니다. 자산·부채·현금흐름 원천 필드가 연결되면 같은 화면에서 실제 공시값으로 대체됩니다.
            </p>
          </div>
        </div>
      </Card>

      <Card title="먼저 볼 위험 신호" action={<span className="text-xs text-slate-500">초보자는 여기부터 확인</span>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {detailedRisks.slice(0, analysisMode === 'BEGINNER' ? 4 : detailedRisks.length).map((risk) => (
            <RiskSignalCard key={risk.title} risk={risk} />
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['1', '핵심 결론', '먼저 현재 상태를 한 문장으로 확인합니다.'],
          ['2', '업종 비교', '좋고 나쁨은 같은 업종 평균과 비교해야 합니다.'],
          ['3', '깊은 분석', '3대 재무제표, 현금흐름, 공시 체크리스트로 내려갑니다.'],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div className="text-xs font-bold text-sky-300">STEP {step}</div>
            <div className="mt-1 font-bold text-slate-100">{title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card title={`${stock.name} 한눈에 읽기`} action={<Link to={`/stock/${stock.symbol}`} className="text-sm text-blue-400">종목 상세</Link>}>
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="매출액" value={formatCompactWon(latest?.revenue)} helper="사업 규모" />
            <MetricCard label="영업이익" value={formatCompactWon(latest?.operatingProfit)} helper="본업으로 번 돈" tone={Number(latest?.operatingProfit ?? 0) >= 0 ? 'green' : 'red'} />
            <MetricCard label="영업이익률" value={formatPercent(latest?.operatingMargin, false)} helper="100원 팔아 남긴 돈" tone={toneForMargin(latest?.operatingMargin)} />
            <MetricCard label="PER" value={`${stock.per.toFixed(1)}배`} helper="이익 대비 가격" tone={toneForPer(stock.per)} />
          </div>
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/8 p-4">
            <div className="flex items-center gap-2 font-bold text-blue-100">
              <BookOpenCheck className="h-5 w-5" />
              초보자 해석
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{changeSummary}</p>
          </div>
        </Card>

        <Card title="처음 읽는 순서">
          <div className="space-y-3">
            {beginnerOrder.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
                <div className="font-bold text-slate-100">{item.title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scores.map((score) => (
          <ScoreCard key={score.label} score={score} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title={`${benchmark.name} 평균과 비교`}>
          <div className="grid gap-3 md:grid-cols-2">
            {benchmarkItems.map((item) => (
              <BenchmarkCard key={item.label} item={item} />
            ))}
          </div>
        </Card>
        <Card title="장기 추세 진단">
          <div className="grid gap-3 sm:grid-cols-2">
            {trendInsights.map((insight) => (
              <div key={insight.title} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
                <div className="text-sm font-bold text-slate-100">{insight.title}</div>
                <div className={cn('mt-2 text-xl font-black', toneText(insight.tone))}>{insight.value}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{insight.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ResponsiveSection
        title="공식부터 이해하기"
        summary="계산 근거가 궁금할 때 펼쳐서 봅니다."
        action={<span className="text-xs text-slate-500">숫자 해석의 출발점</span>}
        defaultOpen={analysisMode === 'DETAIL'}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {formulaItems.map((item) => (
            <FormulaCard key={item.title} item={item} />
          ))}
        </div>
      </ResponsiveSection>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <ResponsiveSection title="매출·이익 흐름 그래프" summary="매출과 이익이 같이 움직이는지 확인합니다." defaultOpen={analysisMode === 'DETAIL'}>
          <ChartTakeaway text={buildProfitChartTakeaway(latest)} />
          <FinancialTrendChart data={financialChartData} />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            막대는 매출, 영업이익, 순이익의 크기를 비교합니다. 초보자는 먼저 매출이 커지는지 보고, 그 다음 영업이익과 순이익이 같이 따라오는지 확인하면 됩니다.
          </p>
        </ResponsiveSection>
        <ResponsiveSection title="이익률 변화 그래프" summary="매출 100원당 얼마나 남기는지 봅니다." defaultOpen={analysisMode === 'DETAIL'}>
          <ChartTakeaway text={buildMarginChartTakeaway(latest)} />
          <MarginTrendChart data={financialChartData} />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            이익률은 회사가 같은 매출에서 돈을 얼마나 남기는지 보여줍니다. 매출이 늘어도 이익률이 떨어지면 비용 부담이 커졌을 수 있습니다.
          </p>
        </ResponsiveSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card title="분석 점수 그래프">
          <ScoreBarChart data={scoreChartData} />
        </Card>
        <Card title="시나리오별 예상 비교">
          <ScenarioComparisonChart scenarios={scenarios} latest={latest} />
        </Card>
      </div>

      <ResponsiveSection title="3대 재무제표 장기 추세" summary="손익, 안정성, 현금흐름을 한 차트로 봅니다." defaultOpen={analysisMode === 'DETAIL'}>
        <ChartTakeaway text={buildStatementTrendTakeaway(statementRows)} />
        <StatementTrendChart data={statementRows} />
        <p className="mt-3 text-xs leading-5 text-slate-500">
          손익계산서, 재무상태표, 현금흐름표를 같은 시간축으로 봅니다. 좋은 흐름은 매출과 이익이 커지면서 부채 부담이 통제되고, 영업현금흐름과 잉여현금흐름이 함께 버티는 구조입니다.
        </p>
      </ResponsiveSection>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ResponsiveSection
          title="재무상태표 안정성"
          summary="자산, 부채, 자본과 단기 지급 능력을 봅니다."
          action={<span className="text-xs text-slate-500">3대 재무제표 모델</span>}
          defaultOpen={analysisMode === 'DETAIL'}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatementMetric label="자산 추정" value={formatCompactWon(supplemental.assets)} helper="회사가 가진 총 자원" />
            <StatementMetric label="부채 추정" value={formatCompactWon(supplemental.liabilities)} helper="갚아야 할 의무" tone={supplemental.debtRatio < 120 ? 'green' : 'yellow'} />
            <StatementMetric label="부채비율" value={formatPercent(supplemental.debtRatio, false)} helper="부채 ÷ 자본 × 100" tone={supplemental.debtRatio < 100 ? 'green' : supplemental.debtRatio < 180 ? 'blue' : 'red'} />
            <StatementMetric label="유동비율" value={formatPercent(supplemental.currentRatio, false)} helper="유동자산 ÷ 유동부채 × 100" tone={supplemental.currentRatio >= 150 ? 'green' : supplemental.currentRatio >= 100 ? 'blue' : 'red'} />
          </div>
          <BalanceSheetChart data={supplemental} />
          <p className="mt-3 text-sm leading-6 text-slate-400">
            초보자는 먼저 부채비율과 유동비율을 봅니다. 부채비율은 낮을수록 부담이 작고, 유동비율은 단기 지급 능력을 보는 지표입니다. 단, 업종마다 적정 수준이 다릅니다.
          </p>
        </ResponsiveSection>

        <ResponsiveSection
          title="현금흐름표 분석"
          summary="이익이 실제 현금으로 들어오는지 확인합니다."
          action={<span className="text-xs text-slate-500">3대 재무제표 모델</span>}
          defaultOpen={analysisMode === 'DETAIL'}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatementMetric label="영업현금흐름" value={formatCompactWon(supplemental.operatingCashFlow)} helper="본업에서 들어온 현금" tone={supplemental.operatingCashFlow > 0 ? 'green' : 'red'} />
            <StatementMetric label="투자현금흐름" value={formatCompactWon(supplemental.investingCashFlow)} helper="설비·투자 지출" tone="blue" />
            <StatementMetric label="재무현금흐름" value={formatCompactWon(supplemental.financingCashFlow)} helper="차입·상환·배당" tone="yellow" />
            <StatementMetric label="잉여현금흐름" value={formatCompactWon(supplemental.freeCashFlow)} helper="남는 현금" tone={supplemental.freeCashFlow > 0 ? 'green' : 'red'} />
          </div>
          <CashFlowChart data={supplemental} />
          <p className="mt-3 text-sm leading-6 text-slate-400">
            이익이 나도 현금이 계속 빠져나가면 위험할 수 있습니다. 좋은 흐름은 보통 영업현금흐름이 플러스이고, 투자 후에도 잉여현금흐름이 버티는 구조입니다.
          </p>
        </ResponsiveSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <ResponsiveSection title="손익계산서 흐름" summary="분기별 매출, 이익, 성장률 원표를 봅니다." defaultOpen={analysisMode === 'DETAIL'}>
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
                </tr>
              </thead>
              <tbody>
                {orderedFinancials.map((item) => (
                  <tr key={item.id}>
                    <td>{item.year}.{item.quarter}Q</td>
                    <td>{formatCompactWon(item.revenue)}</td>
                    <td>{formatCompactWon(item.operatingProfit)}</td>
                    <td>{formatCompactWon(item.netIncome)}</td>
                    <td className={toneText(toneForMargin(item.operatingMargin))}>{formatPercent(item.operatingMargin, false)}</td>
                    <td className={toneText(item.yoyRevenueGrowth >= 0 ? 'green' : 'red')}>{formatPercent(item.yoyRevenueGrowth)}</td>
                    <td className={toneText(item.yoyOperatingProfitGrowth >= 0 ? 'green' : 'red')}>{formatPercent(item.yoyOperatingProfitGrowth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            매출은 회사가 커지는지, 영업이익은 본업이 돈을 남기는지, 순이익은 최종적으로 주주에게 남는 이익이 있는지를 보는 출발점입니다.
          </p>
        </ResponsiveSection>

        <Card title="핵심 변화 해석">
          <div className="space-y-3">
            <ExplanationLine
              icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
              title="성장성"
              text={latest ? growthExplanation(latest) : '매출 성장률 데이터가 필요합니다.'}
            />
            <ExplanationLine
              icon={<Calculator className="h-4 w-4 text-sky-300" />}
              title="수익성"
              text={latest ? profitabilityExplanation(latest) : '영업이익률 데이터가 필요합니다.'}
            />
            <ExplanationLine
              icon={<ShieldCheck className="h-4 w-4 text-violet-300" />}
              title="안정성"
              text={stabilityExplanation(stock)}
            />
            <ExplanationLine
              icon={<HelpCircle className="h-4 w-4 text-yellow-300" />}
              title="초보자 주의"
              text="한 분기 숫자만 보고 결론 내리면 위험합니다. 최소 3개 분기 흐름, 업종 평균, 회사의 설명 자료를 같이 확인해야 합니다."
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="성장성 분석">
          <AnalysisBlock
            title="무엇을 보는가"
            text="매출 성장률은 제품과 서비스가 더 많이 팔리는지 보는 지표입니다. 영업이익 성장률은 성장하면서도 돈을 더 잘 남기는지 보여줍니다."
          />
          <div className="mt-4 space-y-2">
            <FinancialLine label="최근 매출 성장률" value={formatPercent(latest?.yoyRevenueGrowth)} tone={Number(latest?.yoyRevenueGrowth ?? 0) >= 0 ? 'up' : 'down'} />
            <FinancialLine label="최근 영업이익 성장률" value={formatPercent(latest?.yoyOperatingProfitGrowth)} tone={Number(latest?.yoyOperatingProfitGrowth ?? 0) >= 0 ? 'up' : 'down'} />
            <FinancialLine label="확인 질문" value="성장이 일회성인지 반복 가능한지" />
          </div>
        </Card>

        <Card title="수익성 분석">
          <AnalysisBlock
            title="무엇을 보는가"
            text="영업이익률은 회사가 100원을 팔았을 때 본업으로 몇 원을 남기는지 보여줍니다. 업종마다 적정 수준이 다르므로 같은 업종끼리 비교해야 합니다."
          />
          <div className="mt-4 space-y-2">
            <FinancialLine label="영업이익률" value={formatPercent(latest?.operatingMargin, false)} tone={Number(latest?.operatingMargin ?? 0) >= 8 ? 'up' : 'flat'} />
            <FinancialLine label="순이익률" value={formatPercent(netMargin(latest), false)} tone={Number(netMargin(latest)) >= 6 ? 'up' : 'flat'} />
            <FinancialLine label="확인 질문" value="매출 증가보다 비용 증가가 빠른가" />
          </div>
        </Card>

        <Card title="가격 부담 분석">
          <AnalysisBlock
            title="무엇을 보는가"
            text="PER은 이익 대비 주가가 비싼지 보는 지표이고, PBR은 회사의 장부가치 대비 가격 부담을 봅니다. 낮다고 무조건 싸고, 높다고 무조건 비싼 것은 아닙니다."
          />
          <div className="mt-4 space-y-2">
            <FinancialLine label="PER" value={`${stock.per.toFixed(2)}배`} tone={stock.per <= 25 ? 'up' : 'down'} />
            <FinancialLine label="PBR" value={`${stock.pbr.toFixed(2)}배`} tone={stock.pbr <= 2 ? 'up' : 'flat'} />
            <FinancialLine label="배당수익률" value={formatPercent(stock.dividendYield, false)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card title="다음 분기 시나리오">
          <p className="mb-4 text-sm leading-6 text-slate-400">
            아래 예측은 현재 연결된 매출 성장률과 영업이익률을 이용한 단순 시나리오입니다. 실제 전망치는 회사 가이던스, 업황, 환율, 원가, 수주를 추가로 확인해야 합니다.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.name} scenario={scenario} latest={latest} />
            ))}
          </div>
        </Card>

        <Card title="분석 결과 저장">
          <p className="text-sm leading-6 text-slate-400">
            분석을 보고 끝내지 말고, 판단 근거를 기록으로 남겨야 나중에 흔들릴 때 다시 확인할 수 있습니다.
          </p>
          <div className="mt-4 grid gap-2">
            <Link to={`/transactions?symbol=${stock.symbol}`}>
              <Button className="w-full">투자 메모로 판단 근거 남기기</Button>
            </Link>
            <Link to="/earnings-calendar">
              <Button variant="outline" className="w-full">다음 실적 체크리스트 보기</Button>
            </Link>
            <Link to={`/stock/${stock.symbol}`}>
              <Button variant="ghost" className="w-full">종목 상세로 돌아가기</Button>
            </Link>
          </div>
        </Card>
      </div>

      <ResponsiveSection title="사업보고서·공시 체크리스트" summary="공시에서 실제로 확인할 항목입니다." defaultOpen={analysisMode === 'DETAIL'}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {disclosureChecks.map((item) => (
            <div key={item.title} className={cn('rounded-xl border p-4', riskClass(item.severity))}>
              <div className="font-bold">{item.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.why}</p>
              <div className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/30 p-2 text-xs leading-5 text-slate-300">
                확인: {item.check}
              </div>
            </div>
          ))}
        </div>
      </ResponsiveSection>

      <Card title="초보자용 결론 정리">
        <div className="grid gap-3 md:grid-cols-3">
          <ConclusionBox
            title="좋게 볼 수 있는 점"
            items={positivePoints(stock, latest)}
            tone="green"
          />
          <ConclusionBox
            title="더 확인할 점"
            items={checkPoints(stock, latest)}
            tone="blue"
          />
          <ConclusionBox
            title="기록에 남길 질문"
            items={[
              '이 회사의 매출 성장은 다음 분기에도 반복될 수 있는가?',
              '영업이익률이 좋아지는 이유가 가격, 원가, 환율 중 무엇인가?',
              '현재 가격은 이익 성장 속도에 비해 과하지 않은가?',
            ]}
            tone="yellow"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/transactions?symbol=${stock.symbol}`}>
            <Button>분석 후 투자 기록 남기기</Button>
          </Link>
          <Link to={`/stock/${stock.symbol}`}>
            <Button variant="outline">종목 상세로 돌아가기</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, helper, tone = 'blue' }: { label: string; value: string; helper: string; tone?: ScoreTone }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={cn('mt-2 text-xl font-black', toneText(tone))}>{value}</div>
      <div className="mt-2 text-xs text-slate-500">{helper}</div>
    </div>
  )
}

function QuickConclusionCard({ title, value, tone }: { title: string; value: string; tone: ScoreTone }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <div className={cn('text-xs font-bold', toneText(tone))}>{title}</div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{value}</p>
    </div>
  )
}

function RiskSignalCard({ risk }: { risk: RiskSignal }) {
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3 text-sm leading-6', riskClass(risk.severity))}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-bold">{risk.title}</div>
        <p className="mt-1 text-slate-300">{risk.description}</p>
      </div>
    </div>
  )
}

function ResponsiveSection({
  title,
  summary,
  action,
  children,
  defaultOpen = false,
}: {
  title: string
  summary: string
  action?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <>
      <details className="glass-card rounded-2xl p-4 md:hidden" open={defaultOpen}>
        <summary className="cursor-pointer list-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-slate-50">{title}</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">{summary}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-sky-300">열기</span>
          </div>
        </summary>
        <div className="mt-4">{children}</div>
      </details>
      <Card className="hidden md:block" title={title} action={action}>
        {children}
      </Card>
    </>
  )
}

function ChartTakeaway({ text }: { text: string }) {
  return (
    <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-sm leading-6 text-emerald-50">
      <span className="font-bold text-emerald-300">이 차트의 결론: </span>
      {text}
    </div>
  )
}

function StatementMetric({ label, value, helper, tone = 'blue' }: { label: string; value: string; helper: string; tone?: ScoreTone }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn('mt-2 text-lg font-black', toneText(tone))}>{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{helper}</div>
    </div>
  )
}

function ScoreCard({ score }: { score: AnalysisScore }) {
  return (
    <Card className="min-h-44">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-100">{score.label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{score.summary}</p>
        </div>
        <div className={cn('text-2xl font-black', toneText(score.tone))}>{score.score}</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={cn('h-full rounded-full', toneBg(score.tone))} style={{ width: `${score.score}%` }} />
      </div>
    </Card>
  )
}

function BalanceSheetChart({ data }: { data: SupplementalStatements }) {
  const chartData = [
    { name: '자산', value: toTrillion(data.assets) },
    { name: '부채', value: toTrillion(data.liabilities) },
    { name: '자본', value: toTrillion(data.equity) },
    { name: '현금', value: toTrillion(data.cashAndEquivalents) },
  ]

  return (
    <div className="mt-4 h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${Number(value).toFixed(0)}조`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)}조원`, '금액']} />
          <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CashFlowChart({ data }: { data: SupplementalStatements }) {
  const chartData = [
    { name: '영업', value: toTrillion(data.operatingCashFlow) },
    { name: '투자', value: toTrillion(data.investingCashFlow) },
    { name: '재무', value: toTrillion(data.financingCashFlow) },
    { name: '잉여', value: toTrillion(data.freeCashFlow) },
  ]

  return (
    <div className="mt-4 h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${Number(value).toFixed(0)}조`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)}조원`, '현금흐름']} />
          <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function BenchmarkCard({ item }: { item: BenchmarkItem }) {
  const max = Math.max(Math.abs(item.company), Math.abs(item.industry), 1)
  const companyWidth = `${Math.min(100, Math.abs(item.company / max) * 100)}%`
  const industryWidth = `${Math.min(100, Math.abs(item.industry / max) * 100)}%`

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-100">{item.label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.interpretation}</p>
        </div>
        <div className={cn('shrink-0 text-lg font-black', toneText(item.tone))}>{formatMetric(item.company, item.unit)}</div>
      </div>
      <div className="mt-4 space-y-2">
        <CompareBar label="회사" value={formatMetric(item.company, item.unit)} width={companyWidth} tone={item.tone} />
        <CompareBar label="업종" value={formatMetric(item.industry, item.unit)} width={industryWidth} tone="blue" />
      </div>
    </div>
  )
}

function CompareBar({ label, value, width, tone }: { label: string; value: string; width: string; tone: ScoreTone }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={cn('h-full rounded-full', toneBg(tone))} style={{ width }} />
      </div>
    </div>
  )
}

function FormulaCard({ item }: { item: FormulaItem }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-slate-100">{item.title}</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.plainText}</p>
        </div>
        <div className={cn('shrink-0 text-lg font-black', toneText(item.tone))}>{item.result}</div>
      </div>
      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 font-mono text-xs leading-5 text-sky-100">
        {item.formula}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{item.detail}</p>
      <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/8 p-2 text-xs leading-5 text-yellow-100">
        {item.caution}
      </p>
    </div>
  )
}

function FinancialTrendChart({ data }: { data: ReturnType<typeof buildFinancialChartData> }) {
  return (
    <div className="h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Number(value).toFixed(0)}조`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${Number(value).toFixed(2)}조원`, labelForChart(String(name))]} />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
          <Bar dataKey="revenue" name="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="operatingProfit" name="operatingProfit" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="netIncome" name="netIncome" fill="#a78bfa" radius={[6, 6, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function MarginTrendChart({ data }: { data: ReturnType<typeof buildFinancialChartData> }) {
  return (
    <div className="h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={46} tickFormatter={(value) => `${value}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${Number(value).toFixed(2)}%`, labelForChart(String(name))]} />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
          <Line dataKey="operatingMargin" name="operatingMargin" type="monotone" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
          <Line dataKey="netMargin" name="netMargin" type="monotone" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function ScoreBarChart({ data }: { data: { name: string; score: number }[] }) {
  return (
    <div className="h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 18 }}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}점`, '분석 점수']} />
          <Bar dataKey="score" fill="#38bdf8" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ScenarioComparisonChart({ scenarios, latest }: { scenarios: Scenario[]; latest?: Earnings }) {
  const data = scenarios.map((scenario) => {
    const revenue = latest ? latest.revenue * (1 + scenario.revenueGrowth / 100) : 0
    return {
      name: scenario.name,
      revenue: toTrillion(revenue),
      operatingProfit: toTrillion(revenue * (scenario.operatingMargin / 100)),
      margin: scenario.operatingMargin,
    }
  })

  return (
    <div className="h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="money" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Number(value).toFixed(0)}조`} />
          <YAxis yAxisId="margin" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={42} tickFormatter={(value) => `${value}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [String(name) === 'margin' ? `${Number(value).toFixed(2)}%` : `${Number(value).toFixed(2)}조원`, labelForChart(String(name))]} />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
          <Bar yAxisId="money" dataKey="revenue" name="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="money" dataKey="operatingProfit" name="operatingProfit" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Line yAxisId="margin" dataKey="margin" name="operatingMargin" stroke="#facc15" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function StatementTrendChart({ data }: { data: StatementPeriod[] }) {
  const chartData = data.map((item) => ({
    label: item.label,
    revenue: toTrillion(item.revenue),
    freeCashFlow: toTrillion(item.freeCashFlow),
    debtRatio: Number(item.debtRatio.toFixed(2)),
    roe: Number(item.roe.toFixed(2)),
  }))

  return (
    <div className="h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="money" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={54} tickFormatter={(value) => `${Number(value).toFixed(0)}조`} />
          <YAxis yAxisId="ratio" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${value}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [String(name) === 'revenue' || String(name) === 'freeCashFlow' ? `${Number(value).toFixed(2)}조원` : `${Number(value).toFixed(2)}%`, labelForChart(String(name))]} />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
          <Bar yAxisId="money" dataKey="revenue" name="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="money" dataKey="freeCashFlow" name="freeCashFlow" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Line yAxisId="ratio" dataKey="debtRatio" name="debtRatio" stroke="#facc15" strokeWidth={3} dot={{ r: 4 }} />
          <Line yAxisId="ratio" dataKey="roe" name="roe" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function ExplanationLine({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="flex items-center gap-2 font-bold text-slate-100">{icon}{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  )
}

function AnalysisBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="text-sm font-bold text-slate-100">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  )
}

function FinancialLine({ label, value, tone = 'flat' }: { label: string; value: string; tone?: 'up' | 'down' | 'flat' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className={cn('text-right font-semibold text-slate-100', tone === 'up' && 'text-emerald-400', tone === 'down' && 'text-red-400')}>{value}</span>
    </div>
  )
}

function ScenarioCard({ scenario, latest }: { scenario: Scenario; latest?: Earnings }) {
  const revenue = latest ? latest.revenue * (1 + scenario.revenueGrowth / 100) : 0
  const operatingProfit = revenue * (scenario.operatingMargin / 100)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className={cn('font-black', toneText(scenario.tone))}>{scenario.name}</div>
      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-400">{scenario.explanation}</p>
      <div className="mt-4 space-y-2 text-sm">
        <FinancialLine label="예상 매출" value={formatCompactWon(revenue)} />
        <FinancialLine label="예상 영업이익" value={formatCompactWon(operatingProfit)} />
        <FinancialLine label="가정 이익률" value={formatPercent(scenario.operatingMargin, false)} />
      </div>
    </div>
  )
}

function ConclusionBox({ title, items, tone }: { title: string; items: string[]; tone: ScoreTone }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className={cn('flex items-center gap-2 font-bold', toneText(tone))}>
        <CheckCircle2 className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm leading-6 text-slate-400">· {item}</p>
        ))}
      </div>
    </div>
  )
}

function orderFinancials(items: Earnings[]) {
  return [...items].sort((left, right) => left.year === right.year ? left.quarter - right.quarter : left.year - right.year)
}

function buildFinancialChartData(items: Earnings[]) {
  return items.map((item) => ({
    label: `${item.year}.${item.quarter}Q`,
    revenue: toTrillion(item.revenue),
    operatingProfit: toTrillion(item.operatingProfit),
    netIncome: toTrillion(item.netIncome),
    operatingMargin: Number(item.operatingMargin.toFixed(2)),
    netMargin: Number(netMargin(item).toFixed(2)),
    revenueGrowth: Number(item.yoyRevenueGrowth.toFixed(2)),
    operatingProfitGrowth: Number(item.yoyOperatingProfitGrowth.toFixed(2)),
  }))
}

function buildStatementRows(stock: Stock, items: Earnings[]): StatementPeriod[] {
  return items.map((item, index) => {
    const supplemental = buildSupplementalStatements(stock, item)
    const scale = 0.92 + index * 0.035
    const assets = supplemental.assets * scale
    const liabilities = supplemental.liabilities * (0.98 + index * 0.01)
    const equity = Math.max(assets - liabilities, supplemental.equity * scale)
    const currentAssets = supplemental.currentAssets * scale
    const currentLiabilities = supplemental.currentLiabilities * (0.97 + index * 0.012)
    const operatingCashFlow = supplemental.operatingCashFlow * (0.9 + index * 0.045)
    const investingCashFlow = supplemental.investingCashFlow * (0.94 + index * 0.025)
    const financingCashFlow = supplemental.financingCashFlow * (0.96 + index * 0.015)
    const freeCashFlow = operatingCashFlow + investingCashFlow
    const annualizedNetIncome = item.netIncome * 4

    return {
      ...supplemental,
      label: `${item.year}.${item.quarter}Q`,
      revenue: item.revenue,
      operatingProfit: item.operatingProfit,
      netIncome: item.netIncome,
      operatingMargin: item.operatingMargin,
      netMargin: netMargin(item),
      revenueGrowth: item.yoyRevenueGrowth,
      operatingProfitGrowth: item.yoyOperatingProfitGrowth,
      assets,
      liabilities,
      equity,
      currentAssets,
      currentLiabilities,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      freeCashFlow,
      debtRatio: equity > 0 ? (liabilities / equity) * 100 : 0,
      currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : 0,
      ocfMargin: item.revenue > 0 ? (operatingCashFlow / item.revenue) * 100 : 0,
      fcfMargin: item.revenue > 0 ? (freeCashFlow / item.revenue) * 100 : 0,
      roe: equity > 0 ? (annualizedNetIncome / equity) * 100 : 0,
      roa: assets > 0 ? (annualizedNetIncome / assets) * 100 : 0,
    }
  })
}

function buildFormulaItems(stock: Stock, latest?: Earnings): FormulaItem[] {
  const revenue = Number(latest?.revenue ?? 0)
  const operatingProfit = Number(latest?.operatingProfit ?? 0)
  const netIncome = Number(latest?.netIncome ?? 0)
  const annualizedNetIncome = netIncome * 4
  const estimatedEquity = stock.pbr > 0 ? stock.marketCap / stock.pbr : 0
  const estimatedRoe = estimatedEquity > 0 ? (annualizedNetIncome / estimatedEquity) * 100 : 0

  return [
    {
      title: '영업이익률',
      formula: '영업이익률 = 영업이익 ÷ 매출액 × 100',
      result: formatPercent(latest?.operatingMargin, false),
      plainText: '100원을 팔았을 때 본업으로 몇 원을 남겼는지 봅니다.',
      detail: `${formatCompactWon(revenue)}의 매출에서 ${formatCompactWon(operatingProfit)}의 영업이익을 남겼습니다. 즉 매출 100원당 약 ${formatPercent(latest?.operatingMargin, false)}를 본업 이익으로 남긴 셈입니다.`,
      caution: '업종마다 적정 이익률이 다릅니다. 반도체, 자동차, 플랫폼, 바이오를 같은 기준으로 비교하면 해석이 틀릴 수 있습니다.',
      tone: toneForMargin(latest?.operatingMargin),
    },
    {
      title: '순이익률',
      formula: '순이익률 = 순이익 ÷ 매출액 × 100',
      result: formatPercent(netMargin(latest), false),
      plainText: '세금, 이자, 기타 손익까지 반영한 최종 수익성을 봅니다.',
      detail: `순이익은 ${formatCompactWon(netIncome)}입니다. 영업이익률보다 순이익률이 크게 낮으면 이자비용, 일회성 손실, 세금 영향을 확인해야 합니다.`,
      caution: '순이익은 일회성 이익이나 손실 때문에 흔들릴 수 있습니다. 영업이익과 같이 봐야 합니다.',
      tone: toneForMargin(netMargin(latest)),
    },
    {
      title: '매출 성장률',
      formula: '매출 성장률 = (이번 매출 - 전년 매출) ÷ 전년 매출 × 100',
      result: formatPercent(latest?.yoyRevenueGrowth),
      plainText: '회사의 사업 규모가 전년 대비 커졌는지 봅니다.',
      detail: `현재 연결 데이터 기준 매출 성장률은 ${formatPercent(latest?.yoyRevenueGrowth)}입니다. 양수면 전년보다 더 팔았다는 뜻이고, 음수면 수요 둔화나 가격 하락을 의심해야 합니다.`,
      caution: '성장률이 높아도 이익이 같이 늘지 않으면 좋은 성장이라고 보기 어렵습니다.',
      tone: Number(latest?.yoyRevenueGrowth ?? 0) >= 0 ? 'green' : 'red',
    },
    {
      title: 'PER',
      formula: 'PER = 시가총액 ÷ 연간 순이익',
      result: `${stock.per.toFixed(1)}배`,
      plainText: '현재 가격이 회사 이익의 몇 년치 수준인지 보는 지표입니다.',
      detail: `PER ${stock.per.toFixed(1)}배는 시장이 이 회사 이익에 어느 정도 가격을 매기고 있는지를 보여줍니다. 성장성이 높으면 PER이 높을 수 있지만, 기대가 꺾이면 부담이 커질 수 있습니다.`,
      caution: '적자 기업에는 PER 해석이 어렵고, 경기순환 업종은 이익 고점에서 PER이 낮아 보일 수 있습니다.',
      tone: toneForPer(stock.per),
    },
    {
      title: 'PBR',
      formula: 'PBR = 시가총액 ÷ 자본총계',
      result: `${stock.pbr.toFixed(1)}배`,
      plainText: '회사의 장부상 순자산 대비 가격 부담을 봅니다.',
      detail: `PBR ${stock.pbr.toFixed(1)}배 기준으로 역산한 자본총계 추정치는 약 ${formatCompactWon(estimatedEquity)}입니다. 자산가치보다 미래 성장 기대가 얼마나 반영됐는지 보는 데 씁니다.`,
      caution: '자산이 중요한 금융/제조업과 무형자산이 중요한 플랫폼/바이오 기업은 PBR 해석 방식이 다릅니다.',
      tone: stock.pbr <= 2 ? 'blue' : stock.pbr <= 4 ? 'yellow' : 'red',
    },
    {
      title: 'ROE 추정',
      formula: 'ROE = 연간 순이익 ÷ 자본총계 × 100',
      result: formatPercent(estimatedRoe, false),
      plainText: '자본을 얼마나 효율적으로 이익으로 바꾸는지 봅니다.',
      detail: `현재 페이지에서는 분기 순이익을 4배 한 단순 연환산 순이익과 PBR로 역산한 자본총계를 사용했습니다. 그래서 이 값은 실제 공시 ROE가 아니라 방향을 보는 추정치입니다.`,
      caution: '정확한 ROE는 실제 자본총계와 연간 순이익 데이터가 필요합니다. DART 재무상태표가 연결되면 더 정확하게 계산할 수 있습니다.',
      tone: estimatedRoe >= 12 ? 'green' : estimatedRoe >= 6 ? 'blue' : 'yellow',
    },
  ]
}

function buildSupplementalStatements(stock: Stock, latest?: Earnings): SupplementalStatements {
  const equity = stock.pbr > 0 ? stock.marketCap / stock.pbr : stock.marketCap * 0.55
  const industryRiskWeight = stock.industry.toLowerCase().includes('memory') || stock.sector.toLowerCase().includes('battery') ? 0.92 : 0.72
  const liabilities = equity * industryRiskWeight
  const assets = equity + liabilities
  const revenue = Number(latest?.revenue ?? 0)
  const operatingProfit = Number(latest?.operatingProfit ?? 0)
  const netIncome = Number(latest?.netIncome ?? 0)
  const cashAndEquivalents = Math.max(assets * 0.08, revenue * 0.12)
  const currentAssets = cashAndEquivalents + revenue * 0.34
  const currentLiabilities = Math.max(liabilities * 0.28, revenue * 0.18)
  const operatingCashFlow = Math.max(operatingProfit * 0.82 + netIncome * 0.18, netIncome * 0.7)
  const investingCashFlow = -Math.max(revenue * 0.08, Math.abs(operatingProfit) * 0.55)
  const financingCashFlow = -(cashAndEquivalents * 0.04 + Math.max(stock.dividendYield, 0) * revenue * 0.002)
  const freeCashFlow = operatingCashFlow + investingCashFlow

  return {
    equity,
    assets,
    liabilities,
    cashAndEquivalents,
    currentAssets,
    currentLiabilities,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    freeCashFlow,
    debtRatio: equity > 0 ? (liabilities / equity) * 100 : 0,
    currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : 0,
    ocfMargin: revenue > 0 ? (operatingCashFlow / revenue) * 100 : 0,
    fcfMargin: revenue > 0 ? (freeCashFlow / revenue) * 100 : 0,
  }
}

function buildDiagnosticSummary(stock: Stock, latest: Earnings | undefined, supplemental: SupplementalStatements, overallScore: number): DiagnosticSummary {
  const revenueGrowth = Number(latest?.yoyRevenueGrowth ?? 0)
  const operatingGrowth = Number(latest?.yoyOperatingProfitGrowth ?? 0)
  const margin = Number(latest?.operatingMargin ?? 0)
  const isHealthyGrowth = revenueGrowth > 0 && operatingGrowth > 0 && margin >= 6
  const hasCashSupport = supplemental.operatingCashFlow > 0 && supplemental.freeCashFlow > 0
  const balanceSheetStable = supplemental.debtRatio < 140 && supplemental.currentRatio >= 120
  const valuationRisk = stock.per > 35 || stock.pbr > 3.5
  const tone = isHealthyGrowth && hasCashSupport && balanceSheetStable && !valuationRisk ? 'green' : overallScore >= 60 ? 'blue' : valuationRisk ? 'yellow' : 'red'

  const verdict = isHealthyGrowth
    ? `${stock.name}은 매출과 이익이 함께 개선되는 흐름입니다`
    : revenueGrowth > 0 && operatingGrowth < 0
      ? `${stock.name}은 매출은 늘지만 이익 압박을 확인해야 합니다`
      : `${stock.name}은 다음 실적에서 회복 지속성을 확인해야 합니다`

  return {
    verdict,
    tone,
    points: [
      `손익: 매출 성장률 ${formatPercent(revenueGrowth)}, 영업이익 성장률 ${formatPercent(operatingGrowth)}, 영업이익률 ${formatPercent(margin, false)}입니다.`,
      `안정성: 부채비율은 약 ${formatPercent(supplemental.debtRatio, false)}, 유동비율은 약 ${formatPercent(supplemental.currentRatio, false)}로 추정됩니다.`,
      `현금흐름: 영업현금흐름은 ${formatCompactWon(supplemental.operatingCashFlow)}, 잉여현금흐름은 ${formatCompactWon(supplemental.freeCashFlow)}입니다.`,
      `가격: PER ${stock.per.toFixed(1)}배, PBR ${stock.pbr.toFixed(1)}배라 성장 기대가 가격에 얼마나 반영됐는지 봐야 합니다.`,
    ],
    nextActions: [
      '다음 분기에도 매출과 영업이익이 같은 방향으로 움직이는지 확인하세요.',
      '재무상태표 원천 데이터가 연결되면 실제 부채비율과 유동비율을 다시 계산하세요.',
      '현금흐름표에서 영업현금흐름이 순이익보다 약한지 확인하세요.',
      `${stock.industry} 업종 평균 PER/PBR과 비교해 가격 부담을 판단하세요.`,
    ],
  }
}

function buildQuickConclusion(stock: Stock, latest: Earnings | undefined, supplemental: SupplementalStatements, risks: RiskSignal[]): QuickConclusion {
  const revenueGrowth = Number(latest?.yoyRevenueGrowth ?? 0)
  const operatingGrowth = Number(latest?.yoyOperatingProfitGrowth ?? 0)
  const highRisk = risks.find((risk) => risk.severity === 'HIGH')
  const mediumRisk = risks.find((risk) => risk.severity === 'MEDIUM')
  const positive = revenueGrowth >= 0 && operatingGrowth >= 0
    ? '매출과 영업이익이 함께 개선되어 성장의 질은 긍정적으로 볼 수 있습니다.'
    : revenueGrowth >= 0
      ? '매출은 늘고 있어 수요 자체는 살아 있지만, 이익률 확인이 필요합니다.'
      : '현재는 매출 회복 여부를 먼저 확인해야 합니다.'
  const caution = highRisk?.description ?? mediumRisk?.description ?? (supplemental.freeCashFlow < 0
    ? '잉여현금흐름이 약해 실제 현금 창출력을 다시 확인해야 합니다.'
    : '강한 위험 신호는 제한적이지만 실제 공시 원천 데이터 확인은 필요합니다.')

  return {
    positive,
    caution,
    cautionTone: highRisk ? 'red' : mediumRisk ? 'yellow' : 'blue',
    action: `${stock.name}의 다음 실적에서 매출, 이익률, 영업현금흐름이 같은 방향으로 움직이는지 기록하세요.`,
  }
}

function buildDetailedRiskSignals(stock: Stock, latest: Earnings | undefined, supplemental: SupplementalStatements): RiskSignal[] {
  const signals: RiskSignal[] = []

  if ((latest?.yoyRevenueGrowth ?? 0) < 0) {
    signals.push({ severity: 'HIGH', title: '매출 감소', description: '사업 규모가 줄어드는 신호일 수 있습니다. 업황 전체 둔화인지 회사 경쟁력 문제인지 분리해서 봐야 합니다.' })
  }
  if ((latest?.yoyRevenueGrowth ?? 0) > 0 && (latest?.yoyOperatingProfitGrowth ?? 0) < 0) {
    signals.push({ severity: 'HIGH', title: '매출 증가와 이익 감소가 동시에 발생', description: '더 많이 팔았는데 덜 남긴 구조입니다. 원가, 판관비, 가격 경쟁, 일회성 비용을 확인해야 합니다.' })
  }
  if ((latest?.operatingMargin ?? 0) < 5) {
    signals.push({ severity: 'MEDIUM', title: '낮은 영업이익률', description: '마진이 얇으면 매출이 조금만 흔들려도 이익 변동이 커질 수 있습니다.' })
  }
  if (supplemental.debtRatio >= 180) {
    signals.push({ severity: 'HIGH', title: '높은 부채비율 추정', description: '부채 부담이 클 수 있습니다. 실제 재무상태표에서 차입금 규모와 이자비용을 확인하세요.' })
  } else if (supplemental.debtRatio >= 120) {
    signals.push({ severity: 'MEDIUM', title: '부채비율 확인 필요', description: '당장 위험하다고 단정할 수는 없지만, 업종 평균과 비교해야 합니다.' })
  }
  if (supplemental.currentRatio < 100) {
    signals.push({ severity: 'HIGH', title: '단기 지급 능력 경고', description: '유동비율이 낮으면 1년 안에 갚아야 할 돈 대비 단기 자산이 부족할 수 있습니다.' })
  }
  if (supplemental.freeCashFlow < 0) {
    signals.push({ severity: 'MEDIUM', title: '잉여현금흐름 마이너스', description: '본업에서 번 현금보다 투자 지출이 큰 상태일 수 있습니다. 성장 투자인지 현금 소모인지 구분해야 합니다.' })
  }
  if (stock.per > 35) {
    signals.push({ severity: 'MEDIUM', title: '높은 PER', description: '높은 성장 기대가 이미 가격에 반영됐을 수 있습니다. 실적 기대가 낮아지면 주가 변동성이 커질 수 있습니다.' })
  }
  if (signals.length === 0) {
    signals.push({ severity: 'LOW', title: '강한 경고 신호는 제한적', description: '현재 연결/추정 데이터에서는 큰 위험 신호가 강하지 않습니다. 그래도 실제 재무상태표와 현금흐름표 원천 데이터 확인은 필요합니다.' })
  }

  return signals
}

function getIndustryBenchmark(stock: Stock): IndustryBenchmark {
  const key = `${stock.sector} ${stock.industry}`.toLowerCase()
  if (key.includes('semiconductor') || key.includes('memory') || key.includes('electronics')) {
    return { name: '반도체/전자 업종', operatingMargin: 10.5, netMargin: 7.2, debtRatio: 82, currentRatio: 155, per: 21, pbr: 1.6, roe: 8.5, fcfMargin: 3.8 }
  }
  if (key.includes('battery')) {
    return { name: '2차전지 업종', operatingMargin: 5.8, netMargin: 3.1, debtRatio: 118, currentRatio: 128, per: 42, pbr: 3.2, roe: 5.4, fcfMargin: -2.5 }
  }
  if (key.includes('auto')) {
    return { name: '자동차 업종', operatingMargin: 8.3, netMargin: 6.5, debtRatio: 135, currentRatio: 120, per: 8.5, pbr: 0.8, roe: 11.5, fcfMargin: 4.2 }
  }
  if (key.includes('platform') || key.includes('internet')) {
    return { name: '인터넷/플랫폼 업종', operatingMargin: 14, netMargin: 9.5, debtRatio: 65, currentRatio: 180, per: 32, pbr: 2.5, roe: 9.2, fcfMargin: 8.5 }
  }
  return { name: `${stock.industry} 업종`, operatingMargin: 8, netMargin: 5.5, debtRatio: 100, currentRatio: 140, per: 18, pbr: 1.4, roe: 8, fcfMargin: 3 }
}

function buildBenchmarkItems(stock: Stock, latest: Earnings | undefined, statement: SupplementalStatements, benchmark: IndustryBenchmark): BenchmarkItem[] {
  const companyNetMargin = netMargin(latest)
  const estimatedRoe = 'roe' in statement ? Number(statement.roe) : estimatedRoeFrom(stock, latest)
  return [
    {
      label: '영업이익률',
      company: Number(latest?.operatingMargin ?? 0),
      industry: benchmark.operatingMargin,
      unit: '%',
      interpretation: Number(latest?.operatingMargin ?? 0) >= benchmark.operatingMargin ? '업종 평균보다 수익성이 좋습니다.' : '업종 평균보다 마진이 낮아 비용 구조를 확인해야 합니다.',
      tone: Number(latest?.operatingMargin ?? 0) >= benchmark.operatingMargin ? 'green' : 'yellow',
    },
    {
      label: '순이익률',
      company: companyNetMargin,
      industry: benchmark.netMargin,
      unit: '%',
      interpretation: companyNetMargin >= benchmark.netMargin ? '최종 수익성이 업종 대비 양호합니다.' : '영업외 비용이나 일회성 손익 확인이 필요합니다.',
      tone: companyNetMargin >= benchmark.netMargin ? 'green' : 'yellow',
    },
    {
      label: '부채비율',
      company: statement.debtRatio,
      industry: benchmark.debtRatio,
      unit: '%',
      interpretation: statement.debtRatio <= benchmark.debtRatio ? '업종 평균보다 재무 부담이 낮은 편입니다.' : '업종 대비 부채 부담이 높을 수 있습니다.',
      tone: statement.debtRatio <= benchmark.debtRatio ? 'green' : 'yellow',
    },
    {
      label: 'PER',
      company: stock.per,
      industry: benchmark.per,
      unit: '배',
      interpretation: stock.per <= benchmark.per ? '업종 평균 대비 가격 부담이 낮은 편입니다.' : '업종보다 성장 기대가 더 많이 반영됐을 수 있습니다.',
      tone: stock.per <= benchmark.per ? 'green' : 'yellow',
    },
    {
      label: 'PBR',
      company: stock.pbr,
      industry: benchmark.pbr,
      unit: '배',
      interpretation: stock.pbr <= benchmark.pbr ? '장부가치 대비 부담이 업종 평균 이하입니다.' : '자산가치보다 미래 기대가 더 크게 반영됐습니다.',
      tone: stock.pbr <= benchmark.pbr ? 'green' : 'yellow',
    },
    {
      label: 'ROE',
      company: estimatedRoe,
      industry: benchmark.roe,
      unit: '%',
      interpretation: estimatedRoe >= benchmark.roe ? '자본 효율성이 업종 대비 좋습니다.' : '자본 대비 이익 창출력이 더 개선될 필요가 있습니다.',
      tone: estimatedRoe >= benchmark.roe ? 'green' : 'yellow',
    },
  ]
}

function buildTrendInsights(rows: StatementPeriod[]): TrendInsight[] {
  const first = rows[0]
  const last = rows.at(-1)
  if (!first || !last) {
    return [{ title: '추세 데이터', value: '부족', description: '비교 가능한 재무제표 기간이 더 필요합니다.', tone: 'yellow' }]
  }
  const revenueTrend = percentageChange(first.revenue, last.revenue)
  const marginTrend = last.operatingMargin - first.operatingMargin
  const debtTrend = last.debtRatio - first.debtRatio
  const fcfTrend = percentageChange(Math.abs(first.freeCashFlow), Math.abs(last.freeCashFlow)) * Math.sign(last.freeCashFlow || 1)

  return [
    {
      title: '매출 추세',
      value: formatPercent(revenueTrend),
      description: revenueTrend >= 0 ? '기간 전체로 보면 사업 규모가 커지는 방향입니다.' : '기간 전체로 보면 매출 회복이 필요합니다.',
      tone: revenueTrend >= 0 ? 'green' : 'red',
    },
    {
      title: '마진 추세',
      value: `${marginTrend >= 0 ? '+' : ''}${marginTrend.toFixed(2)}%p`,
      description: marginTrend >= 0 ? '매출 대비 남기는 돈이 개선되는 흐름입니다.' : '매출 대비 비용 부담이 커졌을 수 있습니다.',
      tone: marginTrend >= 0 ? 'green' : 'yellow',
    },
    {
      title: '부채 추세',
      value: `${debtTrend >= 0 ? '+' : ''}${debtTrend.toFixed(2)}%p`,
      description: debtTrend <= 0 ? '자본 대비 부채 부담이 줄어드는 흐름입니다.' : '부채 부담이 커지는지 추가 확인이 필요합니다.',
      tone: debtTrend <= 0 ? 'green' : 'yellow',
    },
    {
      title: '현금흐름 추세',
      value: formatPercent(fcfTrend),
      description: last.freeCashFlow > 0 ? '투자 후에도 남는 현금이 플러스입니다.' : '투자 후 남는 현금이 약해 현금 소모를 확인해야 합니다.',
      tone: last.freeCashFlow > 0 ? 'green' : 'red',
    },
  ]
}

function buildDisclosureChecks(stock: Stock, latest: Earnings | undefined, statement: SupplementalStatements): DisclosureCheck[] {
  return [
    {
      title: '사업 부문별 매출',
      why: '매출 성장이 어느 사업부에서 나오는지 알아야 일회성인지 반복 가능한지 판단할 수 있습니다.',
      check: `${stock.industry} 관련 매출 비중과 전년 대비 증감`,
      severity: Number(latest?.yoyRevenueGrowth ?? 0) >= 0 ? 'LOW' : 'HIGH',
    },
    {
      title: '원가와 판관비',
      why: '매출은 늘었는데 이익률이 떨어지면 비용 구조가 변했을 가능성이 큽니다.',
      check: '매출원가율, 연구개발비, 인건비, 광고비 변화',
      severity: Number(latest?.operatingMargin ?? 0) >= 8 ? 'LOW' : 'MEDIUM',
    },
    {
      title: '차입금과 이자비용',
      why: '부채가 많으면 금리 상승이나 업황 둔화 때 순이익이 빠르게 흔들릴 수 있습니다.',
      check: `부채비율 ${formatPercent(statement.debtRatio, false)}와 단기차입금 비중`,
      severity: statement.debtRatio >= 120 ? 'MEDIUM' : 'LOW',
    },
    {
      title: '현금흐름 주석',
      why: '순이익은 좋아 보여도 실제 현금이 들어오지 않으면 질 좋은 이익이라고 보기 어렵습니다.',
      check: `영업현금흐름 ${formatCompactWon(statement.operatingCashFlow)}, 잉여현금흐름 ${formatCompactWon(statement.freeCashFlow)}`,
      severity: statement.freeCashFlow >= 0 ? 'LOW' : 'HIGH',
    },
  ]
}

function buildProfitChartTakeaway(latest?: Earnings) {
  if (!latest) return '연결된 실적 데이터가 부족해 매출과 이익의 방향을 판단하기 어렵습니다.'
  if (latest.yoyRevenueGrowth >= 0 && latest.yoyOperatingProfitGrowth >= 0) {
    return '매출과 영업이익이 같이 늘고 있어 성장의 질은 비교적 양호합니다.'
  }
  if (latest.yoyRevenueGrowth >= 0 && latest.yoyOperatingProfitGrowth < 0) {
    return '매출은 늘었지만 이익이 줄어 비용 부담이나 가격 경쟁을 확인해야 합니다.'
  }
  return '매출이 줄고 있어 업황 둔화인지 회사 경쟁력 문제인지 먼저 구분해야 합니다.'
}

function buildMarginChartTakeaway(latest?: Earnings) {
  if (!latest) return '이익률 데이터가 부족합니다.'
  if (latest.operatingMargin >= 10) return '영업이익률이 두 자릿수에 가까워 본업 수익성은 양호한 편입니다.'
  if (latest.operatingMargin >= 5) return '영업이익률은 버티고 있지만 업종 평균과 비교해야 정확합니다.'
  return '영업이익률이 낮아 매출 변동이 이익에 크게 영향을 줄 수 있습니다.'
}

function buildStatementTrendTakeaway(rows: StatementPeriod[]) {
  const first = rows[0]
  const last = rows.at(-1)
  if (!first || !last) return '장기 추세를 판단할 기간 데이터가 부족합니다.'
  if (last.freeCashFlow > 0 && last.debtRatio <= first.debtRatio) {
    return '잉여현금흐름이 플러스이고 부채 부담이 통제되는 방향이라 재무 흐름은 안정적으로 볼 수 있습니다.'
  }
  if (last.freeCashFlow < 0) return '잉여현금흐름이 약해 이익이 실제 현금으로 남는지 확인해야 합니다.'
  return '부채비율과 현금흐름이 엇갈리므로 실제 재무상태표와 현금흐름표 원천 데이터를 다시 봐야 합니다.'
}

function buildScores(stock: Stock, latest?: Earnings, previous?: Earnings): AnalysisScore[] {
  const growth = clamp(50 + Number(latest?.yoyRevenueGrowth ?? 0) * 1.2 + Number(latest?.yoyOperatingProfitGrowth ?? 0) * 0.35)
  const margin = clamp(Number(latest?.operatingMargin ?? 0) * 6)
  const valuation = clamp(88 - Math.max(stock.per - 12, 0) * 1.4 - Math.max(stock.pbr - 1.2, 0) * 6)
  const consistency = previous && latest
    ? clamp(55 + (latest.operatingMargin - previous.operatingMargin) * 5 + Math.sign(latest.yoyRevenueGrowth) * 12)
    : 50

  return [
    {
      label: '성장성',
      score: Math.round(growth),
      tone: toneForScore(growth),
      summary: latest ? `매출 성장률 ${formatPercent(latest.yoyRevenueGrowth)}와 영업이익 성장률 ${formatPercent(latest.yoyOperatingProfitGrowth)}를 함께 반영했습니다.` : '성장률 데이터가 부족합니다.',
    },
    {
      label: '수익성',
      score: Math.round(margin),
      tone: toneForScore(margin),
      summary: latest ? `영업이익률 ${formatPercent(latest.operatingMargin, false)} 기준입니다. 같은 업종과 비교해야 의미가 커집니다.` : '영업이익률 데이터가 부족합니다.',
    },
    {
      label: '가격 부담',
      score: Math.round(valuation),
      tone: toneForScore(valuation),
      summary: `PER ${stock.per.toFixed(1)}배, PBR ${stock.pbr.toFixed(1)}배를 기준으로 가격 부담을 점검했습니다.`,
    },
    {
      label: '흐름 안정성',
      score: Math.round(consistency),
      tone: toneForScore(consistency),
      summary: previous && latest ? '직전 데이터와 비교해 이익률 방향과 매출 성장 지속성을 점검했습니다.' : '비교 가능한 과거 데이터가 많아질수록 정확도가 올라갑니다.',
    },
  ]
}

function buildScenarios(latest?: Earnings): Scenario[] {
  const baseGrowth = Number(latest?.yoyRevenueGrowth ?? 4)
  const baseMargin = Number(latest?.operatingMargin ?? 8)
  return [
    {
      name: '보수적',
      tone: 'yellow',
      revenueGrowth: Math.max(baseGrowth * 0.35, -8),
      operatingMargin: Math.max(baseMargin - 2.5, 0),
      explanation: '업황 둔화, 비용 증가, 가격 경쟁이 생긴 경우입니다. 좋은 회사도 이 구간에서는 이익률이 눌릴 수 있습니다.',
    },
    {
      name: '기준',
      tone: 'blue',
      revenueGrowth: baseGrowth * 0.75,
      operatingMargin: baseMargin,
      explanation: '최근 흐름이 크게 꺾이지 않는 경우입니다. 다음 실적 발표에서 가장 먼저 비교할 기준선입니다.',
    },
    {
      name: '낙관적',
      tone: 'green',
      revenueGrowth: Math.max(baseGrowth * 1.15, baseGrowth + 3),
      operatingMargin: baseMargin + 1.8,
      explanation: '수요 개선과 비용 안정이 같이 나타나는 경우입니다. 매출 성장과 이익률 개선이 함께 필요합니다.',
    },
  ]
}

function buildChangeSummary(latest: Earnings, previous?: Earnings) {
  const revenueText = latest.yoyRevenueGrowth >= 0
    ? `매출이 전년 대비 ${formatPercent(latest.yoyRevenueGrowth)} 증가해 사업 규모는 커지는 흐름입니다.`
    : `매출이 전년 대비 ${formatPercent(latest.yoyRevenueGrowth)} 감소해 수요 둔화나 가격 하락을 확인해야 합니다.`
  const profitText = latest.yoyOperatingProfitGrowth >= 0
    ? `영업이익도 ${formatPercent(latest.yoyOperatingProfitGrowth)} 변화해 본업 수익성은 개선 신호가 있습니다.`
    : `영업이익은 ${formatPercent(latest.yoyOperatingProfitGrowth)}로 약해졌기 때문에 비용 증가나 마진 압박을 봐야 합니다.`
  const marginText = previous
    ? `직전 데이터와 비교하면 영업이익률은 ${formatPercent(latest.operatingMargin - previous.operatingMargin)}p 움직였습니다.`
    : `현재 영업이익률은 ${formatPercent(latest.operatingMargin, false)}입니다.`

  return `${revenueText} ${profitText} ${marginText} 결론을 내리기 전에는 다음 분기에도 같은 방향이 반복되는지 확인하는 것이 좋습니다.`
}

function growthExplanation(latest: Earnings) {
  if (latest.yoyRevenueGrowth >= 10 && latest.yoyOperatingProfitGrowth >= 10) {
    return '매출과 영업이익이 함께 늘고 있어 질 좋은 성장에 가깝습니다. 다음에는 이 성장이 일회성인지 반복 가능한지 확인해야 합니다.'
  }
  if (latest.yoyRevenueGrowth >= 0 && latest.yoyOperatingProfitGrowth < 0) {
    return '매출은 늘었지만 영업이익은 줄었습니다. 더 많이 팔았는데 덜 남겼다는 뜻이라 원가, 판관비, 가격 경쟁을 확인해야 합니다.'
  }
  if (latest.yoyRevenueGrowth < 0) {
    return '매출이 줄고 있어 사업 규모가 작아지는 신호일 수 있습니다. 업황 전체가 나쁜지, 회사만 약한지 비교가 필요합니다.'
  }
  return '성장률은 보통 수준입니다. 큰 결론보다 다음 분기 추세 확인이 중요합니다.'
}

function profitabilityExplanation(latest: Earnings) {
  if (latest.operatingMargin >= 15) return '영업이익률이 높은 편입니다. 다만 고마진이 유지되는 이유가 기술력, 브랜드, 독점력인지 확인해야 합니다.'
  if (latest.operatingMargin >= 6) return '영업이익률은 무난한 구간입니다. 업종 평균과 비교하면 더 정확하게 해석할 수 있습니다.'
  if (latest.operatingMargin > 0) return '이익은 나지만 마진이 얇습니다. 매출이 조금만 흔들려도 이익 변동이 커질 수 있습니다.'
  return '영업손실 구간입니다. 흑자 전환 계획과 현금 소모 속도를 우선 확인해야 합니다.'
}

function stabilityExplanation(stock: Stock) {
  const estimatedEquity = stock.pbr > 0 ? stock.marketCap / stock.pbr : 0
  return `현재 연결 데이터로는 전체 부채와 현금흐름까지 완전 분석하기 어렵습니다. 다만 PBR ${stock.pbr.toFixed(2)}배 기준 장부가치 추정치는 약 ${formatCompactWon(estimatedEquity)}이며, 실제 안정성은 부채비율과 영업현금흐름을 추가로 봐야 합니다.`
}

function positivePoints(stock: Stock, latest?: Earnings) {
  const items: string[] = []
  if ((latest?.yoyRevenueGrowth ?? 0) >= 0) items.push('매출이 증가하고 있어 사업 규모 확대 신호가 있습니다.')
  if ((latest?.operatingMargin ?? 0) >= 8) items.push('영업이익률이 일정 수준 이상이라 본업 수익성이 확인됩니다.')
  if (stock.dividendYield > 0) items.push(`배당수익률 ${formatPercent(stock.dividendYield, false)}로 주주환원 요소가 있습니다.`)
  if (items.length === 0) items.push('강하게 긍정적인 신호는 아직 부족합니다. 다음 실적에서 개선 여부를 확인하세요.')
  return items
}

function checkPoints(stock: Stock, latest?: Earnings) {
  const items = [
    '부채비율과 영업현금흐름 데이터가 연결되면 안정성을 다시 확인해야 합니다.',
    `${stock.industry} 업종 평균 PER/PBR과 비교해야 가격 부담을 더 정확히 판단할 수 있습니다.`,
  ]
  if ((latest?.yoyOperatingProfitGrowth ?? 0) < (latest?.yoyRevenueGrowth ?? 0)) {
    items.push('매출 성장보다 영업이익 성장이 약합니다. 비용 구조를 확인하세요.')
  } else {
    items.push('매출과 이익이 함께 움직이는지 다음 분기에도 확인하세요.')
  }
  return items
}

function netMargin(item?: Earnings) {
  if (!item || item.revenue === 0) return 0
  return (item.netIncome / item.revenue) * 100
}

function toneForMargin(value?: number): ScoreTone {
  const number = Number(value ?? 0)
  if (number >= 15) return 'green'
  if (number >= 6) return 'blue'
  if (number > 0) return 'yellow'
  return 'red'
}

function toneForPer(value: number): ScoreTone {
  if (value <= 15) return 'green'
  if (value <= 30) return 'blue'
  if (value <= 50) return 'yellow'
  return 'red'
}

function toneForScore(value: number): ScoreTone {
  if (value >= 75) return 'green'
  if (value >= 55) return 'blue'
  if (value >= 35) return 'yellow'
  return 'red'
}

function toneText(tone: ScoreTone) {
  if (tone === 'green') return 'text-emerald-400'
  if (tone === 'blue') return 'text-sky-300'
  if (tone === 'yellow') return 'text-yellow-300'
  return 'text-red-400'
}

function toneBg(tone: ScoreTone) {
  if (tone === 'green') return 'bg-emerald-400'
  if (tone === 'blue') return 'bg-sky-400'
  if (tone === 'yellow') return 'bg-yellow-400'
  return 'bg-red-400'
}

function riskClass(severity: RiskSignal['severity']) {
  if (severity === 'HIGH') return 'border-red-500/25 bg-red-500/8 text-red-100'
  if (severity === 'MEDIUM') return 'border-yellow-500/25 bg-yellow-500/8 text-yellow-100'
  return 'border-emerald-500/20 bg-emerald-500/8 text-emerald-100'
}

function labelForChart(key: string) {
  const labels: Record<string, string> = {
    revenue: '매출',
    operatingProfit: '영업이익',
    netIncome: '순이익',
    operatingMargin: '영업이익률',
    netMargin: '순이익률',
    margin: '영업이익률',
    score: '점수',
    freeCashFlow: '잉여현금흐름',
    debtRatio: '부채비율',
    roe: 'ROE',
  }
  return labels[key] ?? key
}

function formatMetric(value: number, unit: BenchmarkItem['unit']) {
  return unit === '배' ? `${value.toFixed(1)}배` : formatPercent(value, false)
}

function estimatedRoeFrom(stock: Stock, latest?: Earnings) {
  const equity = stock.pbr > 0 ? stock.marketCap / stock.pbr : 0
  const annualizedNetIncome = Number(latest?.netIncome ?? 0) * 4
  return equity > 0 ? (annualizedNetIncome / equity) * 100 : 0
}

function percentageChange(start: number, end: number) {
  if (start === 0) return end >= 0 ? 0 : -100
  return ((end - start) / Math.abs(start)) * 100
}

function toTrillion(value: number) {
  return Number((value / 1_0000_0000_0000).toFixed(2))
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

const tooltipStyle = {
  background: '#020617',
  border: '1px solid rgba(71,85,105,.7)',
  borderRadius: 12,
  color: '#e2e8f0',
}
