import { ChevronDown, ChevronRight, Save } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../format'
import { Notice } from '../motion'
import { callBeluga } from '../roaming'
import { Card, ConfirmDeleteButton, EmptyGuide, Field, NumberField, ListRow } from '../uiKit'
import { BelugaSays } from '../Beluga'
import {
  createMyWaveTransaction,
  deleteMyWaveTransaction,
  getMyWaveStocks,
  getMyWaveTransactions,
  saveMyWavePortfolioRiskAction,
  updateMyWaveTransaction,
  type MyWaveInvestmentTransactionResponse,
  type MyWaveStockResponse,
} from '../myWaveApi'
import {
  BlueCard,
  BlueMetric,
  Donut,
  HeroAmount,
  InlineAction,
  Legend,
  MobileBlueSummary,
  MobileCard,
  MobileCssDonut,
  MobileTitle,
  Progress,
  RiskGauge,
  SummaryLine,
} from '../components'
import { gainClass, portfolioInsightLine, signed, signedWon, useMyWaveData } from '../runtime'
import { todayDateString } from '../format'

export function PortfolioPage() {
  const navigate = useNavigate()
  const { status, holdings, portfolioAllocation } = useMyWaveData()
  // 거래를 하나도 적지 않았으면 0원 카드 여러 장 대신 안내 한 장을 보여 준다.
  if (status === 'ready' && holdings.length === 0 && portfolioAllocation.length === 0) {
    return (
      <div className="reveal-stack space-y-5">
        <MobileTitle title="투자" />
        <EmptyGuide
          title="아직 투자 기록이 없어요"
          body="주식을 사거나 판 기록을 적으면 지금 얼마가 됐는지, 한 종목에 너무 몰려 있지 않은지 보여 드려요. 증권사에 연결하지 않고 직접 적는 방식이에요."
          actionLabel="첫 거래 기록하기"
          onAction={() => navigate('/portfolio/detail')}
        />
      </div>
    )
  }

  return (
    <>
      <div className="lg:hidden">
        <MobilePortfolioPage />
      </div>
      <div className="reveal-stack hidden space-y-5 lg:block">
        <PortfolioHero />
        {/* 원금·평가금액·수익·수익률 카드 넷은 히어로가 이미 말하는 숫자라 뺐다. 화면이 숨을 쉰다. */}
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.95fr_.95fr]">
          <PortfolioAllocationCard />
          <TopHoldingsCard />
          <AssetBars />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.45fr_.9fr]">
          <HoldingsTable />
          <div className="space-y-5">
            <PortfolioInsight />
          </div>
        </div>
        <InvestmentTransactionManager />
      </div>
    </>
  )
}

function MobilePortfolioPage() {
  const { financeSummary } = useMyWaveData()

  return (
    <div className="mobile-page reveal-stack space-y-4">
      <MobileTitle title="투자 포트폴리오" />
      <MobileBlueSummary tone="navy" title="주식의 지금 가치" value={won(financeSummary.investmentValue)} detail={`번 돈 ${signedWon(financeSummary.investmentProfit)} · 수익률 ${signed(financeSummary.investmentReturn)}`} />
      <MobilePortfolioCard compact />
      <MobileHoldingsList />
      <MobileInsightBox />
    </div>
  )
}

function MobilePortfolioCard({ compact = false }: { compact?: boolean }) {
  const { portfolioAllocation, holdings } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <MobileCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">포트폴리오 {compact ? '구성' : '현황'}</h2>
        <button onClick={() => navigate('/portfolio/allocation')} className="pressable text-[13px] font-semibold text-slate-400">자산 배분 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-3">
        <MobileCssDonut
          // 도넛 조각에는 예수금도 들어 있다. 가운데 숫자도 조각의 합(투자 자산)이어야 조각과 맞는다.
          center={compact ? `총 ${portfolioAllocation.length}개` : won(portfolioAllocation.reduce((sum, item) => sum + item.amount, 0))}
          label={compact ? '자산' : '투자 자산'}
          items={portfolioAllocation}
        />
        <Legend items={portfolioAllocation} />
      </div>
      {!compact && (
        <div className="mt-4">
          <BelugaSays mood="calm" size="sm">{portfolioInsightLine(portfolioAllocation, holdings)}</BelugaSays>
        </div>
      )}
    </MobileCard>
  )
}

function MobileHoldingsList() {
  const { holdings } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">보유 자산</h2>
        <button onClick={() => navigate('/portfolio/detail')} className="pressable text-[13px] font-semibold text-slate-400">지금 가치 순 <ChevronDown className="inline h-4 w-4" /></button>
      </div>
      <MobileCard className="px-4 py-2">
        {holdings.slice(0, 4).map((item) => (
          <ListRow
            key={item.symbol}
            title={item.name}
            detail={`${item.symbol} · ${item.quantity}주`}
            value={won(item.value)}
            valueDetail={signedWon(item.profit)}
            valueDetailTone={item.profit >= 0 ? 'gain' : 'loss'}
          />
        ))}
      </MobileCard>
    </section>
  )
}

function MobileInsightBox() {
  const { portfolioAllocation, holdings } = useMyWaveData()
  return (
    <MobileCard>
      <BelugaSays mood="calm" size="sm">{portfolioInsightLine(portfolioAllocation, holdings)}</BelugaSays>
    </MobileCard>
  )
}

function PortfolioHero({ artBump = 0 }: { artBump?: number }) {
  const { financeSummary, holdings } = useMyWaveData()

  return (
    <BlueCard className="min-h-[220px]" art="cheer" artBump={artBump} targetId="portfolio-hero" tone="navy">
      {/* 큰 숫자와 작은 숫자 셋은 폭이 넉넉할 때만 나란히 선다. 그 전에는 위아래로. */}
      <div className="grid gap-7 2xl:grid-cols-[auto_1fr] 2xl:gap-12">
        <div>
          <div className="text-lg font-black">전체 투자 자산</div>
          <div className="mt-4 text-5xl lg:text-6xl"><HeroAmount value={financeSummary.investmentValue} prefix="₩" /></div>
          <div className="tnum mt-6 text-lg font-black text-white/90">전일 대비 {signedWon(financeSummary.dailyProfit)} ({signed(financeSummary.dailyReturn)})</div>
        </div>
        <div className="grid grid-cols-3 gap-5 self-center">
          <BlueMetric label="총 투자 수익" value={signedWon(financeSummary.investmentProfit)} />
          <BlueMetric label="총 수익률" value={signed(financeSummary.investmentReturn)} />
          <BlueMetric label="보유 종목" value={`${holdings.length}개`} />
        </div>
      </div>
    </BlueCard>
  )
}

function PortfolioAllocationCard() {
  const { financeSummary, portfolioAllocation } = useMyWaveData()

  return (
    <Card title="포트폴리오 자산 배분">
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <Donut data={portfolioAllocation} center={won(portfolioAllocation.reduce((sum, item) => sum + item.amount, 0))} label="투자 자산" />
        <Legend items={portfolioAllocation} />
      </div>
      <div className="mt-4 text-sm font-medium text-slate-400">{financeSummary.month} 기록 기준</div>
    </Card>
  )
}

function TopHoldingsCard() {
  const { holdings } = useMyWaveData()

  return (
    <Card title="보유 종목 상위 성과" action="더보기" actionTo="/portfolio/detail">
      <div className="space-y-5">
        {holdings.length === 0 && <p className="text-sm font-bold text-slate-500">아직 보유 종목이 없어요.</p>}
        {[...holdings].sort((a, b) => b.returnRate - a.returnRate).slice(0, 3).map((item, index) => (
          <div key={item.symbol} className="grid grid-cols-[28px_1fr_auto] items-center gap-4">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-sm font-black text-orange-600">{index + 1}</span>
            <div>
              <div className="font-black">{item.symbol}</div>
              <div className="text-sm font-medium text-slate-500">{item.name}</div>
            </div>
            <div className="text-right">
              <div className="font-black">{won(item.value)}</div>
              <div className={`text-sm font-black ${gainClass(item.returnRate)}`}>{signed(item.returnRate)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AssetBars() {
  const { portfolioAllocation } = useMyWaveData()

  return (
    <Card title="자산군별 배분" action="더보기" actionTo="/portfolio/allocation">
      <div className="space-y-5">
        {portfolioAllocation.map((item) => (
          <div key={item.name} className="grid grid-cols-[70px_1fr_56px] items-center gap-4 text-sm font-black">
            <span>{item.name}</span>
            <Progress value={item.rate} barClassName="" color={item.color} />
            <span className="text-right text-slate-500">{item.rate}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HoldingsTable() {
  const { holdings } = useMyWaveData()

  return (
    <Card title="보유 종목 현황" action="더보기" actionTo="/portfolio/detail">
      <div className="overflow-x-auto">
        <table className="mywave-table">
          <thead>
            <tr>
              <th>종목명</th>
              <th>수량</th>
              <th>평균 산 가격</th>
              <th>지금 가치</th>
              <th>수익률</th>
              <th>수익/손익</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 && (
              <tr><td colSpan={6} className="text-slate-500">아직 보유 종목이 없어요. 아래에서 거래 기록을 추가해 보세요.</td></tr>
            )}
            {holdings.map((item) => (
              <tr key={item.symbol}>
                <td><b>{item.symbol}</b> <span className="ml-2 text-slate-400">{item.name}</span></td>
                <td>{item.quantity}</td>
                <td>{won(item.averagePrice)}</td>
                <td>{won(item.value)}</td>
                <td className={gainClass(item.returnRate)}>{signed(item.returnRate)}</td>
                <td className={gainClass(item.profit)}>{signedWon(item.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

type InvestmentTransactionFormState = {
  symbol: string
  stockName: string
  transactionType: string
  quantity: number
  price: number
  fee: number
  tax: number
  transactionDate: string
  memo: string
  reason: string
  tagsText: string
}

function defaultInvestmentTransactionForm(): InvestmentTransactionFormState {
  return {
    symbol: '',
    stockName: '',
    transactionType: 'BUY',
    quantity: 1,
    price: 0,
    fee: 0,
    tax: 0,
    transactionDate: todayDateString(),
    memo: '',
    reason: '',
    tagsText: '',
  }
}

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    BUY: '샀어요',
    SELL: '팔았어요',
    DEPOSIT: '넣었어요',
    WITHDRAWAL: '뺐어요',
    DIVIDEND: '배당',
  }
  return labels[type] ?? type
}

/** 돈만 오가는 거래. 종목과 수량이 없다. */
const MONEY_ONLY_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND']
const MONEY_ONLY_NAMES: Record<string, string> = { DEPOSIT: '입금', WITHDRAWAL: '출금', DIVIDEND: '배당' }

/** 거래 종류를 고르는 버튼과, 그 말이 무슨 뜻인지. */
const TRANSACTION_TYPES: Array<{ value: string; label: string; hint: string }> = [
  { value: 'BUY', label: '샀어요', hint: '주식을 산 기록이에요.' },
  { value: 'SELL', label: '팔았어요', hint: '주식을 판 기록이에요.' },
  { value: 'DEPOSIT', label: '넣었어요', hint: '투자 계좌에 돈을 넣은 기록이에요.' },
  { value: 'WITHDRAWAL', label: '뺐어요', hint: '투자 계좌에서 돈을 뺀 기록이에요.' },
  { value: 'DIVIDEND', label: '배당', hint: '주식을 갖고 있어서 받은 돈이에요.' },
]

/**
 * 종목 고르기. 이름으로 찾는다.
 *
 * 전에는 종목코드(005930)를 외워서 쳐야 했다. 이제 이름이나 코드 일부를 치면 MyWave 가 아는 종목이 아래에 뜨고,
 * 고르면 코드와 이름이 같이 들어간다. 목록에 없는 종목은 코드와 이름을 직접 적을 수 있다.
 */
function StockPicker({
  symbol,
  stockName,
  onPick,
}: {
  symbol: string
  stockName: string
  onPick: (next: { symbol: string; stockName: string; price?: number }) => void
}) {
  const [stocks, setStocks] = useState<MyWaveStockResponse[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    let live = true
    getMyWaveStocks()
      .then((items) => { if (live) setStocks(items) })
      .catch(() => { if (live) setManual(true) })
    return () => { live = false }
  }, [])

  const keyword = query.trim().toLowerCase()
  const matches = keyword
    ? stocks.filter((stock) => stock.name.toLowerCase().includes(keyword) || stock.symbol.toLowerCase().includes(keyword)).slice(0, 6)
    : []

  if (manual) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={stockName} onChange={(event) => onPick({ symbol, stockName: event.target.value })} placeholder="종목 이름 (예: 삼성전자)" aria-label="종목 이름" className="form-input" />
          <input value={symbol} onChange={(event) => onPick({ symbol: event.target.value, stockName })} placeholder="종목코드 (예: 005930)" aria-label="종목코드" className="form-input" />
        </div>
        {stocks.length > 0 && (
          <button type="button" onClick={() => setManual(false)} className="pressable text-sm font-bold text-blue-700">이름으로 찾기</button>
        )}
      </div>
    )
  }

  if (symbol) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3">
        <span className="min-w-0 truncate font-black">{stockName || symbol} <span className="text-sm font-bold text-slate-400">{symbol}</span></span>
        <button type="button" onClick={() => { onPick({ symbol: '', stockName: '' }); setQuery('') }} className="pressable shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600">바꾸기</button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="종목 이름으로 찾기 (예: 삼성전자)"
          aria-label="종목 이름으로 찾기"
          className="form-input"
        />
        {open && matches.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[14px] bg-white shadow-[0_8px_28px_rgba(25,31,40,.12)]">
            {matches.map((stock) => (
              <li key={stock.symbol}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { onPick({ symbol: stock.symbol, stockName: stock.name, price: Number(stock.currentPrice) }); setOpen(false) }}
                  className="pressable flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate text-[15px] font-semibold text-slate-900">{stock.name}</span>
                  <span className="shrink-0 text-[13px] font-medium text-slate-400">{stock.symbol} · {won(Number(stock.currentPrice))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {keyword && matches.length === 0 && <p className="text-sm font-bold text-slate-500">찾는 종목이 목록에 없어요. 아래에서 직접 적을 수 있어요.</p>}
      <button type="button" onClick={() => setManual(true)} className="pressable text-sm font-bold text-blue-700">목록에 없으면 직접 적기</button>
    </div>
  )
}

/**
 * 거래 기록을 넣고 고치고 지우는 자리.
 *
 * 폼이 먼저다. 꼭 필요한 것만 묻는다: 무슨 거래인지, 어느 종목인지, 몇 주를 얼마에. 수수료와 이유, 메모는 접어 둔다.
 * 저장이 끝나면 이 카드의 목록만이 아니라 화면 전체의 숫자(히어로, 보유 종목)를 다시 불러온다. 그래서 새로고침 버튼은 없다.
 * onSaved 는 화면이 "방금 저장됐다"를 보여 주는 데 쓴다 (벨루가가 뛴다).
 */
function InvestmentTransactionManager({ onSaved }: { onSaved?: () => void } = {}) {
  const { reload } = useMyWaveData()
  const formRef = useRef<HTMLDivElement>(null)
  const [transactions, setTransactions] = useState<MyWaveInvestmentTransactionResponse[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<InvestmentTransactionFormState>(() => defaultInvestmentTransactionForm())
  const [message, setMessage] = useState('')
  const moneyOnly = MONEY_ONLY_TYPES.includes(form.transactionType)

  const refreshTransactions = useCallback(async () => {
    try {
      setTransactions(await getMyWaveTransactions())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '거래 기록을 불러오지 못했습니다.')
    }
  }, [])

  useEffect(() => {
    let live = true
    getMyWaveTransactions()
      .then((items) => { if (live) setTransactions(items) })
      .catch((error) => { if (live) setMessage(error instanceof Error ? error.message : '거래 기록을 불러오지 못했습니다.') })
    return () => { live = false }
  }, [])

  function editTransaction(transaction: MyWaveInvestmentTransactionResponse) {
    setEditingId(transaction.id)
    setForm({
      symbol: transaction.symbol,
      stockName: transaction.stockName,
      transactionType: transaction.transactionType,
      quantity: Number(transaction.quantity),
      price: Number(transaction.price),
      fee: Number(transaction.fee),
      tax: Number(transaction.tax),
      transactionDate: transaction.transactionDate,
      memo: transaction.memo ?? '',
      reason: transaction.reason ?? '',
      tagsText: transaction.tags.join(', '),
    })
    setMessage('')
    // 폼은 목록 위에 있다. 고칠 기록을 눌렀으면 폼이 보이는 곳으로 데려간다.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  function resetTransactionForm() {
    setEditingId(null)
    setForm(defaultInvestmentTransactionForm())
  }

  function transactionRequest() {
    return {
      symbol: moneyOnly ? form.transactionType : form.symbol.trim(),
      // 저장되는 이름은 화면의 버튼 글자가 아니라 예전부터 쓰던 낱말이다. 이미 저장된 기록과 같아야 한다.
      stockName: moneyOnly ? MONEY_ONLY_NAMES[form.transactionType] ?? form.transactionType : form.stockName.trim(),
      transactionType: form.transactionType,
      quantity: moneyOnly ? 0 : form.quantity,
      price: form.price,
      fee: form.fee,
      tax: form.tax,
      transactionDate: form.transactionDate,
      memo: form.memo,
      reason: form.reason,
      tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
    }
  }

  async function saveTransaction() {
    if (!moneyOnly && !form.symbol.trim()) {
      setMessage('어느 종목인지 골라 주세요.')
      return
    }
    if (!moneyOnly && form.quantity <= 0) {
      setMessage('몇 주인지 적어 주세요.')
      return
    }
    if (form.price <= 0) {
      setMessage(moneyOnly ? '금액을 적어 주세요.' : '한 주에 얼마였는지 적어 주세요.')
      return
    }
    if (!form.transactionDate) {
      setMessage('거래한 날짜를 골라 주세요.')
      return
    }
    try {
      const request = transactionRequest()
      if (editingId) {
        await updateMyWaveTransaction(editingId, request)
        setMessage('고친 내용을 저장했어요.')
      } else {
        await createMyWaveTransaction(request)
        setMessage('거래를 기록했어요.')
      }
      resetTransactionForm()
      await refreshTransactions()
      reload()
      onSaved?.()
      callBeluga({ kind: 'hop', element: document.querySelector<HTMLElement>('[data-beluga-target="portfolio-hero"]'), line: '거래를 적었어요!' })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '거래 기록 저장에 실패했습니다.')
    }
  }

  async function removeTransaction(id: number) {
    try {
      await deleteMyWaveTransaction(id)
      if (editingId === id) resetTransactionForm()
      setMessage('기록을 지웠어요.')
      await refreshTransactions()
      reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '거래 기록 삭제에 실패했습니다.')
    }
  }

  const total = moneyOnly ? form.price : form.quantity * form.price
  const hasDetails = form.fee > 0 || form.reason !== '' || form.memo !== '' || form.tagsText !== ''

  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <div ref={formRef} id="transaction-form" className="scroll-mt-4">
        <Card title={editingId ? '거래 기록 고치기' : '거래 기록하기'}>
          <div className="space-y-4">
            <div>
              <div id="transaction-type-label" className="mb-2 text-sm font-black text-slate-600">어떤 거래인가요</div>
              <div role="radiogroup" aria-labelledby="transaction-type-label" className="flex flex-wrap gap-2">
                {TRANSACTION_TYPES.map((type) => {
                  const selected = form.transactionType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm((value) => ({ ...value, transactionType: type.value }))}
                      className={`pressable rounded-full px-3.5 py-2 text-sm font-bold ${selected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">{TRANSACTION_TYPES.find((type) => type.value === form.transactionType)?.hint}</p>
            </div>
            {!moneyOnly && (
              <Field label="어느 종목인가요">
                <StockPicker
                  key={editingId ?? 'new'}
                  symbol={form.symbol}
                  stockName={form.stockName}
                  onPick={(next) => setForm((value) => ({
                    ...value,
                    symbol: next.symbol,
                    stockName: next.stockName,
                    // 단가를 아직 안 적었으면 지금 시세를 넣어 둔다. 실제로 산 값과 다르면 고치면 된다.
                    price: value.price === 0 && next.price ? next.price : value.price,
                  }))}
                />
              </Field>
            )}
            <div className={`grid gap-4 ${moneyOnly ? '' : 'sm:grid-cols-2'}`}>
              {!moneyOnly && (
                <Field label="몇 주인가요">
                  <NumberField value={form.quantity} onChange={(next) => setForm((value) => ({ ...value, quantity: next }))} />
                </Field>
              )}
              <Field label={moneyOnly ? '얼마인가요' : '한 주에 얼마였나요'}>
                <NumberField money decimal value={form.price} onChange={(next) => setForm((value) => ({ ...value, price: next }))} />
              </Field>
            </div>
            {!moneyOnly && total > 0 && <p className="tnum text-sm font-bold text-slate-500">모두 {won(total)}</p>}
            <Field label="언제 했나요">
              <input type="date" max={todayDateString()} value={form.transactionDate} onChange={(event) => setForm((value) => ({ ...value, transactionDate: event.target.value }))} className="form-input" />
            </Field>
            {/* 수수료와 이유, 메모는 적지 않아도 기록이 된다. 적어 둔 기록을 고칠 때만 펼쳐 둔다. */}
            <details key={editingId ?? 'new'} open={hasDetails} className="rounded-2xl bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-600">더 자세히 (수수료, 이유, 메모)</summary>
              <div className="mt-4 space-y-4">
                <Field label="수수료">
                  <NumberField money decimal value={form.fee} onChange={(next) => setForm((value) => ({ ...value, fee: next }))} />
                </Field>
                <Field label="왜 이 거래를 했나요">
                  <input value={form.reason} onChange={(event) => setForm((value) => ({ ...value, reason: event.target.value }))} maxLength={500} className="form-input" />
                </Field>
                <Field label="메모">
                  <input value={form.memo} onChange={(event) => setForm((value) => ({ ...value, memo: event.target.value }))} maxLength={500} className="form-input" />
                </Field>
                <Field label="꼬리표 (쉼표로 구분)">
                  <input value={form.tagsText} onChange={(event) => setForm((value) => ({ ...value, tagsText: event.target.value }))} className="form-input" placeholder="반도체, 장기보유" />
                </Field>
              </div>
            </details>
            {message && <Notice text={message} />}
            <div className="flex gap-3">
              {editingId && <button onClick={resetTransactionForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveTransaction} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingId ? '고친 내용 저장' : '기록하기'}
              </button>
            </div>
          </div>
        </Card>
      </div>
      <Card title="적어 둔 거래">
        {transactions.length === 0 && <p className="text-sm font-bold text-slate-500">아직 적은 거래가 없어요.</p>}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <button onClick={() => editTransaction(transaction)} aria-label={`${transaction.stockName} ${transactionLabel(transaction.transactionType)} 기록 고치기`} className="pressable min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">{transactionLabel(transaction.transactionType)}</span>
                  <span className="text-base font-black">{transaction.stockName}</span>
                  {!MONEY_ONLY_TYPES.includes(transaction.transactionType) && <span className="text-sm font-bold text-slate-400">{transaction.symbol}</span>}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">{transaction.transactionDate}{transaction.reason || transaction.memo ? ` · ${transaction.reason || transaction.memo}` : ''}</div>
              </button>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <div className="text-lg font-black">{won(Number(transaction.totalAmount))}</div>
                  {!MONEY_ONLY_TYPES.includes(transaction.transactionType) && <div className="text-xs font-bold text-slate-400">{transaction.quantity}주 · {won(Number(transaction.price))}</div>}
                </div>
                <ConfirmDeleteButton compact label="거래 기록 삭제" onConfirm={() => removeTransaction(transaction.id)} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PortfolioInsight() {
  const { portfolioAllocation, holdings } = useMyWaveData()
  return (
    <Card className="bg-blue-50/70" title="포트폴리오 인사이트" action={<InlineAction to="/coach" label="AI 코치" primary />}>
      <p className="text-base leading-8 text-slate-600">{portfolioInsightLine(portfolioAllocation, holdings)}</p>
      <p className="mt-3 text-xs font-bold text-slate-400">투자 판단이 아니라, 지금 구성을 이해하기 위한 참고예요.</p>
    </Card>
  )
}

/**
 * 보유 종목 비중으로 셈할 수 있는 것만 보여준다. 쏠림(가장 큰 종목 비중), 종목 수, 현금 비중.
 * 시장·변동성 위험처럼 데이터로 계산하지 않는 항목은 그럴듯한 "보통"으로 채우지 않는다.
 */
export function RiskPanel() {
  const { holdings, portfolioAllocation } = useMyWaveData()
  const top = [...holdings].sort((a, b) => b.weight - a.weight)[0]
  const topWeight = top?.weight ?? 0
  const level = holdings.length === 0 ? '기록 없음' : topWeight >= 50 ? '높음' : topWeight >= 30 ? '보통' : '낮음'
  const cash = portfolioAllocation.find((item) => item.name.includes('현금'))

  return (
    <Card title="한 종목에 몰린 정도" action="자세히 보기" actionTo="/portfolio/risk">
      <RiskGauge value={topWeight} level={level} />
      <div className="mt-5 space-y-2 text-sm font-bold">
        <SummaryLine label="가장 큰 종목" value={top ? `${top.name} ${Math.round(topWeight)}%` : '-'} />
        <SummaryLine label="보유 종목 수" value={`${holdings.length}개`} />
        <SummaryLine label="현금 비중" value={cash ? `${Math.round(cash.rate)}%` : '-'} />
      </div>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">{portfolioInsightLine(portfolioAllocation, holdings)}</div>
    </Card>
  )
}

export function PortfolioDetailPage() {
  // 거래를 저장하면 히어로의 벨루가가 한 번 뛴다. 숫자도 함께 새로 계산된다.
  const [bump, setBump] = useState(0)
  const { status, holdings, portfolioAllocation } = useMyWaveData()
  // 첫 거래를 적으러 온 사람에게 0원짜리 요약과 빈 표를 먼저 보여 주지 않는다. 적는 칸부터 보여 준다.
  const empty = status === 'ready' && holdings.length === 0 && portfolioAllocation.length === 0
  return (
    <div className="reveal-stack space-y-5">
      <MobileTitle title={empty ? '첫 거래 기록' : '보유 자산'} />
      {!empty && <PortfolioHero artBump={bump} />}
      {!empty && <HoldingsTable />}
      <InvestmentTransactionManager onSaved={() => setBump((value) => value + 1)} />
    </div>
  )
}

export function PortfolioAllocationDetailPage() {
  const { portfolioAllocation } = useMyWaveData()
  return (
    <div className="reveal-stack space-y-5">
      <MobileTitle title="자산 배분" />
      <Card title="포트폴리오 구성">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Donut data={portfolioAllocation} center={won(portfolioAllocation.reduce((sum, item) => sum + item.amount, 0))} label="투자 자산" />
          <Legend items={portfolioAllocation} />
        </div>
      </Card>
      <AssetBars />
      <PortfolioInsight />
    </div>
  )
}

export function RiskDetailPage() {
  const [selectedAction, setSelectedAction] = useState('')
  const [savedAction, setSavedAction] = useState('')

  async function chooseAction(action: string) {
    setSelectedAction(action)
    try {
      const saved = await saveMyWavePortfolioRiskAction(action)
      setSavedAction(saved.action)
    } catch {
      setSavedAction('')
    }
  }

  return (
    <div className="reveal-stack space-y-5">
      <MobileTitle title="포트폴리오 리스크" />
      <RiskPanel />
      <Card title="리스크 조정 액션">
        <div className="grid gap-3 sm:grid-cols-3">
          {['여러 종목에 나눠 담기', '현금 일부 남겨 두기', '한 종목 비중 줄이기'].map((item) => (
            <button key={item} onClick={() => chooseAction(item)} className={`pressable rounded-2xl border p-4 text-left font-black ${selectedAction === item ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-blue-50'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">내가 정한 원칙: <span className="text-blue-700">{selectedAction || '아직 고르지 않았어요'}</span></div>
        {savedAction && <div className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-700">저장했어요: {savedAction}</div>}
      </Card>
    </div>
  )
}
