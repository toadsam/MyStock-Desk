import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, BookOpenCheck, Bot, GitBranch, Layers3, Search, ShieldCheck, Star, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { searchThemes } from '../api/themeApi'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { mockThemeDiscoveries } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { RelatedThemeStock, RelatednessLevel, ThemeDiscovery, ThemeMarket } from '../types/theme'
import { cn } from '../utils/cn'
import { formatNumber } from '../utils/format'

const budgetOptions = [
  { label: '10만원', value: 100000 },
  { label: '50만원', value: 500000 },
  { label: '100만원', value: 1000000 },
  { label: '300만원', value: 3000000 },
]

const marketTabs = [
  { label: '전체', value: 'ALL' },
  { label: '국내', value: 'KR' },
  { label: '미국', value: 'US' },
]

const difficultyTabs = [
  { label: '초보', value: 'BEGINNER' },
  { label: '상세', value: 'DETAIL' },
]

export default function ThemeDiscoveryPage() {
  const [keyword, setKeyword] = useState('엔비디아')
  const [submittedKeyword, setSubmittedKeyword] = useState('엔비디아')
  const [market, setMarket] = useState<ThemeMarket | 'ALL'>('ALL')
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'DETAIL'>('BEGINNER')
  const [budget, setBudget] = useState(500000)
  const [studyList, setStudyList] = useState<string[]>([])
  const { data: themes, setData: setThemes } = useAsyncData(() => searchThemes(submittedKeyword), mockThemeDiscoveries, [submittedKeyword])

  const theme = themes[0] ?? mockThemeDiscoveries[0]
  const visibleStocks = useMemo(() => {
    return [...theme.relatedStocks]
      .filter((stock) => market === 'ALL' || stock.market === market)
      .sort((left, right) => right.relationScore - left.relationScore)
  }, [market, theme.relatedStocks])

  const stocksByStage = theme.stages.map((stage) => ({
    stage,
    stocks: visibleStocks.filter((stock) => stock.stageId === stage.id),
  })).filter((group) => group.stocks.length > 0)

  const submitSearch = async () => {
    setSubmittedKeyword(keyword)
    setThemes(await searchThemes(keyword))
  }

  const toggleStudy = (symbol: string) => {
    setStudyList((previous) => previous.includes(symbol) ? previous.filter((item) => item !== symbol) : [...previous, symbol])
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="text-sm font-semibold text-sky-300">테마/공급망 연관 종목 탐색</div>
            <h1 className="mt-2 text-3xl font-black text-slate-50">호재가 어디로 퍼지는지 따라가며 공부하기</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              대장주를 바로 사기 어렵다면 관련 산업과 공급망을 먼저 이해하세요. 이 화면은 매수 추천이 아니라 함께 확인할 종목과 근거를 정리합니다.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-xs leading-5 text-slate-400">
            <span className="font-bold text-slate-200">원칙</span><br />
            관련도가 높아도 실제 실적 연결, 변동성, 내 포트폴리오 쏠림은 별도로 확인해야 합니다.
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr_0.65fr_0.65fr]">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
              value={keyword}
              placeholder="엔비디아, HBM, AI 데이터센터"
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            />
          </label>
          <Tabs items={marketTabs} value={market} onChange={(value) => setMarket(value as ThemeMarket | 'ALL')} className="flex-wrap" />
          <Tabs items={difficultyTabs} value={difficulty} onChange={(value) => setDifficulty(value as 'BEGINNER' | 'DETAIL')} />
          <Button onClick={submitSearch}>흐름 찾기</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">예산 기준</span>
          {budgetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                budget === option.value ? 'border-blue-400 bg-blue-500/15 text-blue-100' : 'border-slate-800 bg-slate-950/30 text-slate-400',
              )}
              onClick={() => setBudget(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <IssueFlowMap theme={theme} />

          <Card title="초보자 요약">
            <div className="grid gap-3 md:grid-cols-3">
              {theme.beginnerSummary.map((summary) => (
                <div key={summary} className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-sm leading-6 text-blue-50">
                  {summary}
                </div>
              ))}
            </div>
          </Card>

          {stocksByStage.map(({ stage, stocks }) => (
            <Card
              key={stage.id}
              title={
                <span className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-sky-300" />
                  {stage.name}
                </span>
              }
              action={<span className="hidden text-xs text-slate-500 md:inline">{stage.focus}</span>}
            >
              <p className="mb-4 text-sm text-slate-400">{stage.description}</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {stocks.map((stock) => (
                  <RelatedStockCard
                    key={stock.symbol}
                    stock={stock}
                    budget={budget}
                    difficulty={difficulty}
                    added={studyList.includes(stock.symbol)}
                    onToggleStudy={() => toggleStudy(stock.symbol)}
                  />
                ))}
              </div>
            </Card>
          ))}

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card title="관련 뉴스에서 반복해서 볼 키워드">
              <div className="flex flex-wrap gap-2">
                {theme.repeatedKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300">#{keyword}</span>
                ))}
              </div>
            </Card>
            <Card title="AI 체크포인트">
              <div className="space-y-3">
                {theme.aiCheckpoints.map((checkpoint) => (
                  <div key={checkpoint} className="flex gap-2 text-sm leading-6 text-slate-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    {checkpoint}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="실시간 뉴스 근거">
            <div className="grid gap-3 md:grid-cols-2">
              {theme.liveNews.slice(0, 6).map((news) => (
                <a
                  key={`${news.title}-${news.publishedAt}`}
                  href={news.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-800 bg-slate-950/25 p-3 transition hover:border-blue-400/60"
                >
                  <div className="text-sm font-bold leading-6 text-slate-100">{news.title}</div>
                  <div className="mt-2 text-xs text-slate-500">{news.source} · {formatNewsDate(news.publishedAt)}</div>
                </a>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <BeginnerDecisionPanel theme={theme} visibleStocks={visibleStocks} studyList={studyList} budget={budget} />
        </aside>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        본 서비스는 투자 기록 관리 및 참고용 정보 제공을 목적으로 하며, 투자 판단의 최종 책임은 본인에게 있습니다. 실제 주문·체결 기능은 제공하지 않습니다.
      </div>
    </div>
  )
}

function IssueFlowMap({ theme }: { theme: ThemeDiscovery }) {
  return (
    <Card title="이슈 흐름 맵">
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/25 p-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-50">
          <GitBranch className="h-5 w-5 text-sky-300" />
          {theme.catalyst.title}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{theme.catalyst.description}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {theme.catalyst.impactPaths.map((path, index) => (
          <div key={path} className="relative rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center text-sm font-bold text-slate-100">
            <div className="text-xs text-slate-500">STEP {index + 1}</div>
            <div className="mt-1">{path}</div>
            {index < theme.catalyst.impactPaths.length - 1 && <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-blue-400/60 md:block" />}
          </div>
        ))}
      </div>
    </Card>
  )
}

function RelatedStockCard({ stock, budget, difficulty, added, onToggleStudy }: {
  stock: RelatedThemeStock
  budget: number
  difficulty: 'BEGINNER' | 'DETAIL'
  added: boolean
  onToggleStudy: () => void
}) {
  const possibleShares = estimateShares(stock, budget)

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-50">{stock.stockName}</h3>
            <Badge tone={stock.market === 'KR' ? 'blue' : 'slate'}>{stock.market}</Badge>
            <Badge tone={toneForRelation(stock.relationLevel)}>{labelForRelation(stock.relationLevel)}</Badge>
          </div>
          <div className="mt-1 text-sm text-slate-500">{stock.symbol} · {stock.stageName}</div>
        </div>
        <div className="text-right">
          <div className={cn('text-lg font-black', scoreTone(stock.relationScore))}>{stock.relationScore || '-'}점</div>
          <div className="text-xs text-slate-500">실데이터 관련도</div>
          <div className="text-sm font-bold text-slate-100">{formatThemePrice(stock)}</div>
          <div className="text-xs text-slate-500">예산상 약 {possibleShares}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">{stock.relationReason}</p>
      <AiExplanationBlock stock={stock} />
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={cn('h-full rounded-full', scoreBarTone(stock.relationScore))} style={{ width: `${Math.max(stock.relationScore, 8)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {stock.scoreFactors.slice(0, 4).map((factor) => (
          <span key={factor} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{factor}</span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniList title="확인할 지표" items={stock.checkMetrics} />
        <MiniList title="주의할 점" items={stock.risks} danger />
      </div>

      {difficulty === 'DETAIL' && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {stock.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">#{tag}</span>)}
          </div>
          <EvidenceNewsList stock={stock} />
        </>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button variant={added ? 'ghost' : 'outline'} onClick={onToggleStudy}>
          <Star className="h-4 w-4" />
          {added ? '공부목록 추가됨' : '공부목록 추가'}
        </Button>
        <Link to={stock.market === 'KR' ? `/stock/${stock.symbol}` : '/research'} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900/40 px-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/80">
          상세 보기
        </Link>
        <Link to={`/transactions?symbol=${stock.symbol}`}>
          <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
            기록 추가
          </span>
        </Link>
      </div>
    </article>
  )
}

function AiExplanationBlock({ stock }: { stock: RelatedThemeStock }) {
  const explanation = stock.aiExplanation
  if (!explanation) return null

  return (
    <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/8 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-violet-100">
          <Bot className="h-4 w-4" />
          AI 근거 요약
        </div>
        <span className="rounded-full border border-violet-400/30 px-2 py-0.5 text-[11px] text-violet-200">{explanation.generatedBy}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-200">{explanation.summary}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MiniList title="왜 나왔나" items={explanation.evidence.slice(0, 3)} />
        <MiniList title="확인할 것" items={explanation.checkpoints.slice(0, 3)} />
        <MiniList title="주의할 것" items={explanation.risks.slice(0, 3)} danger />
      </div>
      <div className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/30 p-2 text-xs leading-5 text-slate-300">
        {explanation.verdict}
      </div>
    </div>
  )
}

function EvidenceNewsList({ stock }: { stock: RelatedThemeStock }) {
  if (stock.evidenceNews.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3 text-xs leading-5 text-yellow-100">
        이 종목은 현재 뉴스 검색 근거가 약합니다. 공급망 관계는 참고하되 실제 수주, 매출, 공시를 추가로 확인하세요.
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-bold text-slate-500">관련도 근거 기사</div>
      {stock.evidenceNews.map((news) => (
        <a
          key={`${stock.symbol}-${news.title}`}
          href={news.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-lg border border-slate-800 bg-slate-950/30 p-2 text-xs leading-5 text-slate-300 hover:border-blue-400/60"
        >
          <span className="font-semibold text-slate-100">{news.title}</span>
          <span className="mt-1 block text-slate-500">{news.source} · {formatNewsDate(news.publishedAt)}</span>
        </a>
      ))}
    </div>
  )
}

function BeginnerDecisionPanel({ theme, visibleStocks, studyList, budget }: { theme: ThemeDiscovery; visibleStocks: RelatedThemeStock[]; studyList: string[]; budget: number }) {
  const lowBudgetNames = visibleStocks
    .filter((stock) => estimateSharesNumber(stock, budget) >= 1)
    .slice(0, 4)
    .map((stock) => stock.stockName)

  return (
    <>
      <Card title="초보자 판단 패널">
        <div className="space-y-3">
          <PanelLine icon={<BookOpenCheck className="h-4 w-4 text-sky-300" />} label="먼저 이해할 것" value={theme.catalyst.impactPaths.slice(1, 4).join(' → ')} />
          <PanelLine icon={<WalletCards className="h-4 w-4 text-emerald-300" />} label="예산으로 1주 이상 가능" value={lowBudgetNames.length ? lowBudgetNames.join(', ') : '필터 결과 없음'} />
          <PanelLine icon={<Star className="h-4 w-4 text-yellow-300" />} label="공부목록" value={`${studyList.length}개 추가`} />
        </div>
      </Card>

      <Card title="테마성 과열 주의">
        <div className="space-y-3">
          {theme.riskNotes.map((risk) => (
            <div key={risk} className="flex gap-2 text-sm leading-6 text-slate-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
              {risk}
            </div>
          ))}
        </div>
      </Card>

      <Card title="다음 행동">
        <div className="space-y-2 text-sm text-slate-400">
          <p>1. 관련 이유를 읽고 이해되지 않는 종목은 제외합니다.</p>
          <p>2. 뉴스가 실제 매출, 수주, 이익률로 연결되는지 확인합니다.</p>
          <p>3. 마음이 흔들리기 전에 공부목록과 투자 기록에 기준을 남깁니다.</p>
        </div>
      </Card>
    </>
  )
}

function MiniList({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <div className={cn('text-xs font-bold', danger ? 'text-yellow-200' : 'text-blue-200')}>{title}</div>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
        {items.map((item) => <li key={item}>· {item}</li>)}
      </ul>
    </div>
  )
}

function PanelLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">{icon}{label}</div>
      <div className="mt-2 text-sm leading-5 text-slate-100">{value}</div>
    </div>
  )
}

function estimateShares(stock: RelatedThemeStock, budget: number) {
  const shares = estimateSharesNumber(stock, budget)
  return shares >= 1 ? `${formatNumber(Math.floor(shares))}주` : '1주 미만'
}

function estimateSharesNumber(stock: RelatedThemeStock, budget: number) {
  const fxRate = 1350
  const priceInWon = stock.market === 'US' ? stock.currentPrice * fxRate : stock.currentPrice
  return budget / priceInWon
}

function formatThemePrice(stock: RelatedThemeStock) {
  if (stock.market === 'US') return `$${formatNumber(stock.currentPrice)}`
  return `${formatNumber(stock.currentPrice)}원`
}

function formatNewsDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function labelForRelation(level: RelatednessLevel) {
  if (level === 'DIRECT') return '직접'
  if (level === 'INDIRECT') return '간접'
  return '테마성'
}

function toneForRelation(level: RelatednessLevel): 'green' | 'blue' | 'red' {
  if (level === 'DIRECT') return 'green'
  if (level === 'INDIRECT') return 'blue'
  return 'red'
}

function scoreTone(score: number) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-sky-300'
  return 'text-yellow-300'
}

function scoreBarTone(score: number) {
  if (score >= 70) return 'bg-emerald-400'
  if (score >= 45) return 'bg-blue-400'
  return 'bg-yellow-400'
}
