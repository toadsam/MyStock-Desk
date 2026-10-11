import { ChevronDown, ChevronRight, Save, Trash2, WalletCards } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../format'
import { Card, Field, ListRow } from '../uiKit'
import { BelugaSays } from '../Beluga'
import belugaPhoneArt from '../../assets/mywave/beluga-phone.png'
import {
  createMyWaveTransaction,
  deleteMyWaveTransaction,
  getMyWaveHoldings,
  getMyWavePortfolio,
  getMyWaveTransactions,
  saveMyWavePortfolioRiskAction,
  updateMyWaveTransaction,
  type MyWaveHoldingResponse,
  type MyWaveInvestmentTransactionResponse,
  type MyWavePortfolioResponse,
} from '../myWaveApi'
import {
  BarIcon,
  BlueCard,
  BlueMetric,
  BriefcaseIcon,
  Donut,
  InlineAction,
  Legend,
  MetricCard,
  MiniStat,
  MobileBlueSummary,
  MobileCard,
  MobileCssDonut,
  MobileTitle,
  Progress,
  SummaryLine,
} from '../components'
import { gainClass, portfolioInsightLine, signed, signedWon, useMyWaveData } from '../runtime'
import { todayDateString } from '../format'

export function PortfolioPage() {
  const { financeSummary } = useMyWaveData()

  return (
    <>
      <div className="lg:hidden">
        <MobilePortfolioPage />
      </div>
      <div className="hidden space-y-5 lg:block">
        <PortfolioHero />
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard icon={<BriefcaseIcon />} label="투자 원금" value={won(financeSummary.investmentPrincipal)} tone="blue" />
          <MetricCard icon={<WalletCards />} label="총 평가금액" value={won(financeSummary.investmentValue)} tone="blue" />
          <MetricCard icon={<BarIcon />} label="총 수익" value={signedWon(financeSummary.investmentProfit)} detail={signed(financeSummary.investmentReturn)} tone="green" />
          <MetricCard icon={<BarIcon />} label="총 수익률" value={signed(financeSummary.investmentReturn)} tone="violet" />
        </div>
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
      <MobileBlueSummary title="총 평가금액" value={won(financeSummary.investmentValue)} detail={`평가손익 ${signedWon(financeSummary.investmentProfit)} · 수익률 ${signed(financeSummary.investmentReturn)}`} />
      <MobilePortfolioCard compact />
      <MobileHoldingsList />
      <MobileInsightBox />
    </div>
  )
}

function MobilePortfolioCard({ compact = false }: { compact?: boolean }) {
  const { financeSummary, portfolioAllocation, holdings } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <MobileCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">포트폴리오 {compact ? '구성' : '현황'}</h2>
        <button onClick={() => navigate('/portfolio/allocation')} className="pressable text-[13px] font-semibold text-slate-400">자산 배분 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-3">
        <MobileCssDonut
          center={compact ? `총 ${portfolioAllocation.length}개` : won(financeSummary.investmentValue)}
          label={compact ? '자산' : '총자산'}
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
        <button onClick={() => navigate('/portfolio/detail')} className="pressable text-[13px] font-semibold text-slate-400">평가금액 기준 <ChevronDown className="inline h-4 w-4" /></button>
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

function PortfolioHero() {
  const { financeSummary, holdings } = useMyWaveData()

  return (
    <BlueCard className="min-h-[220px]">
      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="text-lg font-black">전체 투자 자산</div>
          <div className="mt-4 text-5xl font-black lg:text-6xl">{won(financeSummary.investmentValue)}</div>
          <div className="mt-6 text-lg font-black text-white/90">전일 대비 {signedWon(financeSummary.dailyProfit)} ({signed(financeSummary.dailyReturn)})</div>
        </div>
        <div className="grid grid-cols-3 gap-5 self-center">
          <BlueMetric label="총 투자 수익" value={signedWon(financeSummary.investmentProfit)} />
          <BlueMetric label="총 수익률" value={signed(financeSummary.investmentReturn)} />
          <BlueMetric label="보유 종목" value={`${holdings.length}개`} />
        </div>
      </div>
      <img src={belugaPhoneArt} alt="" className="wave-bob absolute bottom-4 right-6 hidden h-40 w-40 object-contain drop-shadow-[0_14px_20px_rgba(10,40,140,.35)] lg:block" />
    </BlueCard>
  )
}

function PortfolioAllocationCard() {
  const { financeSummary, portfolioAllocation } = useMyWaveData()

  return (
    <Card title="포트폴리오 자산 배분">
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <Donut data={portfolioAllocation} center={won(portfolioAllocation.reduce((sum, item) => sum + item.amount, 0))} />
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
              <th>평균 매입가</th>
              <th>평가금액</th>
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
    BUY: '매수',
    SELL: '매도',
    DEPOSIT: '입금',
    WITHDRAWAL: '출금',
    DIVIDEND: '배당',
  }
  return labels[type] ?? type
}

function InvestmentTransactionManager() {
  const [portfolio, setPortfolio] = useState<MyWavePortfolioResponse | null>(null)
  const [holdings, setHoldings] = useState<MyWaveHoldingResponse[]>([])
  const [transactions, setTransactions] = useState<MyWaveInvestmentTransactionResponse[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<InvestmentTransactionFormState>(() => defaultInvestmentTransactionForm())
  const [message, setMessage] = useState('')

  const refreshPortfolioRecords = useCallback(async () => {
    try {
      const [portfolioResult, holdingResult, transactionResult] = await Promise.all([
        getMyWavePortfolio(),
        getMyWaveHoldings(),
        getMyWaveTransactions(),
      ])
      setPortfolio(portfolioResult)
      setHoldings(holdingResult)
      setTransactions(transactionResult)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '포트폴리오 데이터를 불러오지 못했습니다.')
    }
  }, [])

  useEffect(() => {
    let live = true
    Promise.all([getMyWavePortfolio(), getMyWaveHoldings(), getMyWaveTransactions()])
      .then(([portfolioResult, holdingResult, transactionResult]) => {
        if (!live) return
        setPortfolio(portfolioResult)
        setHoldings(holdingResult)
        setTransactions(transactionResult)
      })
      .catch((error) => { if (live) setMessage(error instanceof Error ? error.message : '포트폴리오 데이터를 불러오지 못했습니다.') })
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
  }

  function resetTransactionForm() {
    setEditingId(null)
    setForm(defaultInvestmentTransactionForm())
  }

  function transactionRequest() {
    const moneyOnly = ['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType)
    return {
      symbol: moneyOnly ? form.transactionType : form.symbol.trim(),
      stockName: moneyOnly ? transactionLabel(form.transactionType) : form.stockName.trim(),
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
    if (!['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType) && (!form.symbol.trim() || form.quantity <= 0)) {
      setMessage('매수/매도 기록에는 종목코드와 수량이 필요합니다.')
      return
    }
    if (form.price < 0 || !form.transactionDate) {
      setMessage('금액과 거래일을 확인해주세요.')
      return
    }
    try {
      const request = transactionRequest()
      if (editingId) {
        await updateMyWaveTransaction(editingId, request)
        setMessage('거래 기록이 수정되었습니다.')
      } else {
        await createMyWaveTransaction(request)
        setMessage('거래 기록이 추가되었습니다.')
      }
      resetTransactionForm()
      await refreshPortfolioRecords()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '거래 기록 저장에 실패했습니다.')
    }
  }

  async function removeTransaction(id: number) {
    try {
      await deleteMyWaveTransaction(id)
      if (editingId === id) resetTransactionForm()
      setMessage('거래 기록이 삭제되었습니다.')
      await refreshPortfolioRecords()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '거래 기록 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Card
        title="투자 거래 기록"
        action={<button onClick={refreshPortfolioRecords} className="pressable rounded-full px-3 py-1.5 text-xs font-black text-blue-700">새로고침</button>}
      >
        {portfolio && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="총 평가금액" value={won(Number(portfolio.totalEvaluationAmount))} />
            <MiniStat label="예수금" value={won(Number(portfolio.cash))} />
            <MiniStat label="총 수익률" value={`${Number(portfolio.totalReturnRate).toFixed(2)}%`} />
          </div>
        )}
        {message && <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</div>}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <button onClick={() => editTransaction(transaction)} className="pressable min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">{transactionLabel(transaction.transactionType)}</span>
                  <span className="text-base font-black">{transaction.stockName}</span>
                  <span className="text-sm font-bold text-slate-400">{transaction.symbol}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">{transaction.transactionDate} · {transaction.reason || transaction.memo || '거래 기록'}</div>
              </button>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <div className="text-lg font-black">{won(Number(transaction.totalAmount))}</div>
                  <div className="text-xs font-bold text-slate-400">{transaction.quantity}주 · {won(Number(transaction.price))}</div>
                </div>
                <button onClick={() => removeTransaction(transaction.id)} className="pressable grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="space-y-5">
        <Card title={editingId ? '거래 기록 수정' : '거래 기록 추가'}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="거래 유형">
                <select value={form.transactionType} onChange={(event) => setForm((value) => ({ ...value, transactionType: event.target.value }))} className="form-input">
                  <option value="BUY">매수</option>
                  <option value="SELL">매도</option>
                  <option value="DEPOSIT">입금</option>
                  <option value="WITHDRAWAL">출금</option>
                  <option value="DIVIDEND">배당</option>
                </select>
              </Field>
              <Field label="거래일">
                <input type="date" value={form.transactionDate} onChange={(event) => setForm((value) => ({ ...value, transactionDate: event.target.value }))} className="form-input" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="종목코드">
                <input value={form.symbol} onChange={(event) => setForm((value) => ({ ...value, symbol: event.target.value }))} className="form-input" disabled={['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType)} />
              </Field>
              <Field label="종목명">
                <input value={form.stockName} onChange={(event) => setForm((value) => ({ ...value, stockName: event.target.value }))} className="form-input" disabled={['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="수량">
                <input type="number" value={form.quantity} onChange={(event) => setForm((value) => ({ ...value, quantity: Number(event.target.value) }))} className="form-input" disabled={['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType)} />
              </Field>
              <Field label={['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND'].includes(form.transactionType) ? '금액' : '단가'}>
                <input type="number" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: Number(event.target.value) }))} className="form-input" />
              </Field>
              <Field label="수수료">
                <input type="number" value={form.fee} onChange={(event) => setForm((value) => ({ ...value, fee: Number(event.target.value) }))} className="form-input" />
              </Field>
            </div>
            <Field label="투자 이유">
              <input value={form.reason} onChange={(event) => setForm((value) => ({ ...value, reason: event.target.value }))} className="form-input" />
            </Field>
            <Field label="메모">
              <input value={form.memo} onChange={(event) => setForm((value) => ({ ...value, memo: event.target.value }))} className="form-input" />
            </Field>
            <Field label="태그">
              <input value={form.tagsText} onChange={(event) => setForm((value) => ({ ...value, tagsText: event.target.value }))} className="form-input" placeholder="반도체, 장기보유" />
            </Field>
            <div className="flex gap-3">
              {editingId && <button onClick={resetTransactionForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveTransaction} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingId ? '수정 저장' : '거래 추가'}
              </button>
            </div>
          </div>
        </Card>
        <Card title="API 보유 종목">
          <div className="space-y-3">
            {holdings.length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">아직 API 기준 보유 종목이 없습니다.</div>}
            {holdings.map((holding) => (
              <div key={holding.symbol} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="font-black">{holding.stockName} <span className="text-sm text-slate-400">{holding.symbol}</span></div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{holding.quantity}주 · 평균 {won(Number(holding.averagePrice))}</div>
                </div>
                <div className="text-right">
                  <div className="font-black">{won(Number(holding.evaluationAmount))}</div>
                  <div className={Number(holding.profitLoss) >= 0 ? 'text-sm font-black text-red-500' : 'text-sm font-black text-blue-700'}>{Number(holding.returnRate).toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
    <Card title="포트폴리오 쏠림" action="자세히 보기" actionTo="/portfolio/risk">
      <div className="mx-auto h-28 w-40 rounded-t-full border-[18px] border-b-0 border-emerald-400 border-r-red-400 border-t-amber-400 text-center">
        <div className="mt-10 text-lg font-black">{level}</div>
      </div>
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
  return (
    <div className="space-y-5">
      <MobileTitle title="보유 자산" />
      <PortfolioHero />
      <HoldingsTable />
      <InvestmentTransactionManager />
    </div>
  )
}

export function PortfolioAllocationDetailPage() {
  const { portfolioAllocation } = useMyWaveData()
  return (
    <div className="space-y-5">
      <MobileTitle title="자산 배분" />
      <Card title="포트폴리오 구성">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Donut data={portfolioAllocation} center={won(portfolioAllocation.reduce((sum, item) => sum + item.amount, 0))} />
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
    <div className="space-y-5">
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
