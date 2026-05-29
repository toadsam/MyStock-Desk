import { AlertTriangle, Bot, CalendarClock, Settings2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getLatestPortfolioReport } from '../api/aiApi'
import { getSecDisclosures } from '../api/disclosureApi'
import { getResearchNews } from '../api/newsApi'
import {
  getPortfolioImpact,
  getResearchBriefing,
  getResearchRisks,
  getResearchSentiment,
  getStudyCandidates,
} from '../api/researchApi'
import { BeginnerNewsExplainer } from '../components/beginner/BeginnerNewsExplainer'
import { DonutChart } from '../components/charts/DonutChart'
import { Sparkline } from '../components/charts/Sparkline'
import { DisclosureBriefing } from '../components/stock/DisclosureBriefing'
import { NewsBriefing } from '../components/stock/NewsBriefing'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import {
  indexPrices,
  mockBriefing,
  mockNews,
  mockPortfolioImpact,
  mockPortfolioReport,
  mockStudyCandidates,
  mockRisks,
  mockSentiment,
} from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { cn } from '../utils/cn'
import { formatNumber, formatPercent, isUp } from '../utils/format'

export default function ResearchPage() {
  const { data: briefing } = useAsyncData(getResearchBriefing, mockBriefing)
  const { data: sentiment } = useAsyncData(getResearchSentiment, mockSentiment)
  const { data: news, loading: newsLoading, error: newsError } = useAsyncData(getResearchNews, mockNews)
  const { data: secDisclosures, loading: disclosuresLoading, error: disclosuresError } = useAsyncData(() => getSecDisclosures({ limit: 8 }), [])
  const { data: risks } = useAsyncData(getResearchRisks, mockRisks)
  const { data: impact } = useAsyncData(getPortfolioImpact, mockPortfolioImpact)
  const { data: studyCandidates } = useAsyncData(getStudyCandidates, mockStudyCandidates)
  const { data: portfolioReport } = useAsyncData(getLatestPortfolioReport, mockPortfolioReport)

  const sentimentTotal = Math.max(sentiment.total, 1)
  const sentimentDonut = [
    { name: '호재', value: sentiment.positive, rate: Math.round((sentiment.positive / sentimentTotal) * 100) },
    { name: '악재', value: sentiment.negative, rate: Math.round((sentiment.negative / sentimentTotal) * 100) },
    { name: '중립', value: sentiment.neutral, rate: Math.round((sentiment.neutral / sentimentTotal) * 100) },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-50 md:text-3xl">AI 체크포인트 브리핑</h1>
              <span className="text-sm text-slate-500">AI가 정리한 확인 항목과 포트폴리오 관심도</span>
            </div>
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-600/8 p-4">
              <div className="flex items-center gap-3">
                <Bot className="h-7 w-7 text-sky-300" />
                <div>
                  <div className="text-xl font-bold text-slate-50">{briefing.greeting}</div>
                  <p className="mt-1 text-slate-300">{briefing.summary}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {briefing.snapshots.map((snapshot) => (
                  <div key={snapshot.code} className="rounded-xl border border-slate-700/70 bg-slate-950/30 p-4">
                    <div className="text-sm font-semibold text-slate-300">{snapshot.name}</div>
                    <div className="mt-3 text-2xl font-bold text-emerald-400">{formatNumber(snapshot.value)}</div>
                    <div className="mt-1 text-sm text-emerald-400">▲ {formatNumber(snapshot.changeValue)} ({formatPercent(snapshot.changeRate)})</div>
                    <Sparkline data={indexPrices(snapshot.code).slice(-24)} positive />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-slate-400">
            <CalendarClock className="h-4 w-4" />
            최근 갱신: {new Date(briefing.basedAt).toLocaleString('ko-KR')}
            <button type="button" className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200">
              <Settings2 className="mr-1 inline h-4 w-4" /> 브리핑 설정
            </button>
          </div>
        </div>
      </Card>

      <Card title="시장 한눈에 보기" action={<span className="text-sm text-blue-400">더보기</span>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['관심종목', '12', 'from-blue-600/30'],
            ['시장', '8', 'from-sky-600/30'],
            ['기업', '15', 'from-violet-600/30'],
            ['글로벌', '10', 'from-blue-500/30'],
          ].map(([label, count, tone]) => (
            <div key={label} className={cn('min-h-28 rounded-2xl border border-slate-700 bg-gradient-to-br to-slate-950 p-4', tone)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100">{label}</span>
                <Badge tone="blue">{count}</Badge>
              </div>
              <Sparkline data={indexPrices('KOSPI').slice(-20)} positive />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.3fr_1fr]">
        <Card title="시장 심리지수">
          <DonutChart data={sentimentDonut} centerLabel={`+${sentiment.sentimentScore.toFixed(2)}`} />
        </Card>
        <Card title="뉴스 Sentiment 분석">
          <div className="grid gap-3 md:grid-cols-3">
            <SentimentBox label="호재" value={sentiment.positive} ratio={54} tone="green" />
            <SentimentBox label="악재" value={sentiment.negative} ratio={27} tone="red" />
            <SentimentBox label="중립" value={sentiment.neutral} ratio={19} tone="slate" />
          </div>
          <p className="mt-4 text-xs text-slate-500">AI 분석은 오늘 발행된 뉴스 2,300건 기준입니다.</p>
        </Card>
        <Card title="주의할 리스크">
          <div className="space-y-3">
            {risks.slice(0, 3).map((risk, index) => (
              <div key={risk.title} className="rounded-xl border border-red-500/20 bg-red-500/8 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-red-200">{index + 1}. {risk.title}</span>
                  <Badge tone="red">위험도 {risk.riskScore}%</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{risk.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <Card title="SEC 공식 공시" action={<Badge tone="green">Official</Badge>}>
          <DisclosureBriefing disclosures={secDisclosures.slice(0, 5)} loading={disclosuresLoading} error={disclosuresError} />
        </Card>
        <Card title="뉴스 변화 감지" action={<Badge tone="blue">Beta</Badge>}>
          <NewsBriefing news={news.slice(0, 5)} loading={newsLoading} error={newsError} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <BeginnerNewsExplainer news={news.slice(0, 3)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
        <Card title="내 포트폴리오 확인 우선 뉴스" action={<span className="text-sm text-blue-400">더보기</span>}>
          <div className="space-y-3">
            {impact.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/25 p-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.relatedStockSymbol} · {item.impactLabel}</div>
                </div>
                <div className={cn('font-bold', isUp(item.expectedImpact) ? 'text-emerald-400' : 'text-red-400')}>
                  {formatPercent(item.expectedImpact)}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="AI 포트폴리오 리포트" action={<Link to="/ai-report" className="text-sm text-blue-400">전체 보기</Link>}>
          <p className="text-sm leading-6 text-slate-300">{portfolioReport.summary}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            {[...portfolioReport.performanceNotes, ...portfolioReport.concentrationNotes, ...portfolioReport.upcomingEarnings].slice(0, 5).map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">{item}</div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{portfolioReport.disclaimer}</p>
        </Card>
      </div>

      <Card title="공부 후보 종목" action={<span className="text-sm text-blue-400">더보기</span>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {studyCandidates.map((item) => (
            <div key={item.symbol} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-50">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.symbol}</div>
                </div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm leading-6 text-slate-400">{item.studyReason}</div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {item.checkPoints.slice(0, 2).map((point) => <div key={point}>확인 포인트 · {point}</div>)}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-slate-400">관심도 점수</span>
                <span className="text-lg font-bold text-sky-300">{item.relevanceScore.toFixed(0)}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-yellow-100">{item.riskNote}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        <AlertTriangle className="mr-2 inline h-4 w-4 text-yellow-400" />
        AI 분석은 사용자의 기록과 공개 참고 데이터를 정리한 자료이며 매수·매도 추천이나 실제 주문 권유가 아닙니다.
      </div>
    </div>
  )
}

function SentimentBox({ label, value, ratio, tone }: { label: string; value: number; ratio: number; tone: 'green' | 'red' | 'slate' }) {
  const toneClass = tone === 'green' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-slate-700 bg-slate-800/40 text-slate-300'
  return (
    <div className={cn('rounded-2xl border p-5 text-center', toneClass)}>
      <div className="font-bold">{label}</div>
      <div className="mt-3 text-3xl font-black">{formatNumber(value)}</div>
      <div className="mt-1 text-sm">({ratio}%)</div>
    </div>
  )
}
