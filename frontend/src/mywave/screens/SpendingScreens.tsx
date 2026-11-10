import { ChevronRight, CircleHelp, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { won } from '../format'
import { Card, ConfirmDeleteButton, Field } from '../uiKit'
import { CashFlowCard, ExpenseImportCard, MerchantAutocomplete, QuickExpenseButtons } from '../ExpenseCapture'
import {
  createMyWaveExpense,
  deleteMyWaveExpense,
  getMyWaveExpenses,
  getMyWaveExpenseSummary,
  simulateMyWaveSaving,
  updateMyWaveExpense,
  type MyWaveExpenseResponse,
  type MyWaveExpenseSummaryResponse,
} from '../myWaveApi'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  BlueCard,
  BlueMetric,
  HeroAmount,
  Donut,
  InlineAction,
  Legend,
  MiniStat,
  MobileBlueSummary,
  MobileCard,
  MobileCssDonut,
  MobileTitle,
  MonthPicker,
  Pill,
  Progress,
} from '../components'
import { signed, signedWon, useMyWaveData } from '../runtime'
import { LiveDot, Notice } from '../motion'
import { ActionPanel } from './GoalsScreens'
import { todayDateString } from '../format'

export function SpendingPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSpendingPage />
      </div>
      <div className="reveal-stack hidden space-y-5 lg:block">
        <div className="flex justify-end">
          <MonthPicker />
        </div>
        <ExpenseQuickEntry />
        <div className="grid gap-5 xl:grid-cols-[.98fr_.92fr]">
          <SpendingHero />
          <TrendCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-[.98fr_.92fr]">
          <SpendingDonutCard />
          <SpendingBlockers />
        </div>
        <div className="grid gap-5 xl:grid-cols-[.98fr_.92fr]">
          <SpendingTable />
          <SavingSimulation />
        </div>
      </div>
    </>
  )
}

function MobileSpendingPage() {
  const { financeSummary } = useMyWaveData()

  return (
    <div className="mobile-page reveal-stack space-y-4">
      <div className="flex items-center justify-between">
        <MobileTitle title="소비 분석" />
        <MonthPicker />
      </div>
      <MobileBlueSummary tone="violet" title="이번 달 총 소비" value={won(financeSummary.totalSpending)} detail={financeSummary.previousSpending > 0 ? `지난 달 같은 기간 대비 ${signed(financeSummary.spendingChangeRate)}` : '지난 달 기록이 없어요'} />
      <ExpenseQuickEntry />
      <MobileSpendingCategories />
      <MobileTopSpending />
      <MobileSavingBox />
    </div>
  )
}

function MobileSpendingCategories() {
  const { financeSummary, spendingCategories } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <MobileCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black">카테고리별 소비 비중</h2>
        <button onClick={() => navigate('/spending/detail')} className="pressable rounded-full px-3 py-1.5 text-xs font-bold text-slate-500">상세보기</button>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-3">
        <MobileCssDonut center={won(financeSummary.totalSpending)} label="총 소비" />
        <div className="space-y-3">
          {spendingCategories.slice(0, 5).map((item) => {
            const Icon = item.icon
            return (
              <div key={item.name} className="grid grid-cols-[22px_1fr_auto] items-center gap-2 text-sm font-bold">
                <Icon className="h-5 w-5" style={{ color: item.color }} />
                <span>{item.name}</span>
                <span className="text-slate-500">{Math.round(item.rate)}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </MobileCard>
  )
}

function MobileTopSpending() {
  const { spendingBlockers } = useMyWaveData()

  // 소비 기록이 없으면 순위도 없다. 제목만 남기지 않는다.
  if (spendingBlockers.length === 0) return null

  return (
    <MobileCard>
      <h2 className="mb-1 text-lg font-black">목표 달성을 방해하는 소비 TOP 3</h2>
      <p className="mb-4 text-xs font-bold text-slate-500">이 항목을 줄이면 목표 달성률을 올릴 수 있어요.</p>
      <div className="divide-y divide-slate-100">
        {spendingBlockers.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="grid grid-cols-[30px_32px_1fr_auto_20px] items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-700 text-sm font-black text-white">{index + 1}</span>
              <Icon className="h-6 w-6" style={{ color: item.color }} />
              <div>
                <div className="font-black">{item.name}</div>
                <div className="text-xs font-bold text-slate-400">이번 달 {item.count}건 · 소비의 {Math.round(item.rate)}%</div>
              </div>
              <div className="font-black">{won(item.amount)}</div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          )
        })}
      </div>
    </MobileCard>
  )
}

function MobileSavingBox() {
  const { financeSummary } = useMyWaveData()
  const navigate = useNavigate()
  const [amount, setAmount] = useState(10000)
  const hasGoal = financeSummary.targetAmount > 0
  // 이 금액이 그대로 가장 가까운 목표에 더해진다고 보고 다시 계산한다.
  const expectedRate = hasGoal
    ? Math.min(100, Math.round(((financeSummary.savedAmount + amount) / financeSummary.targetAmount) * 1000) / 10)
    : financeSummary.goalRate

  // 목표가 없으면 오를 달성률도 없다. 계산하는 척하지 않고 목표부터 만들게 한다.
  if (!hasGoal) {
    return (
      <MobileCard>
        <h2 className="text-lg font-black">저축 시뮬레이션</h2>
        <p className="mt-3 text-sm font-bold text-slate-500">목표를 만들면 얼마를 더 모을 때 달성률이 얼마나 오르는지 보여 드려요.</p>
        <button onClick={() => navigate('/goals/new')} className="pressable mt-4 w-full rounded-2xl bg-blue-700 py-3 text-sm font-black text-white">목표 만들기</button>
      </MobileCard>
    )
  }

  return (
    <MobileCard>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">저축 시뮬레이션</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">시뮬레이션 안내</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setAmount((value) => Math.max(0, value - 10000))} className="pressable grid h-10 w-10 place-items-center rounded-full text-2xl">-</button>
        <div className="text-2xl font-black text-blue-700">{won(amount)}</div>
        <button onClick={() => setAmount((value) => value + 10000)} className="pressable grid h-10 w-10 place-items-center rounded-full text-2xl">+</button>
      </div>
      <div className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-black text-blue-700">
        {expectedRate > financeSummary.goalRate ? (
          <>이 금액을 저축하면 목표 달성률이 {financeSummary.goalRate}% → <span className="text-2xl">{expectedRate}%</span>로 올라요.</>
        ) : financeSummary.goalRate >= 100 ? (
          <>목표 금액을 이미 다 모았어요.</>
        ) : (
          // 0원이거나, 목표에 비해 너무 작아서 소수 첫째 자리까지는 차이가 안 나는 경우.
          <>이 금액으로는 목표 달성률이 {financeSummary.goalRate}%에서 거의 그대로예요.</>
        )}
      </div>
      <button onClick={() => navigate('/spending/simulation')} className="mt-4 w-full rounded-2xl bg-blue-700 py-3 text-sm font-black text-white">자세히 조정하기</button>
    </MobileCard>
  )
}

function SpendingHero() {
  const { financeSummary } = useMyWaveData()

  return (
    <BlueCard className="min-h-[245px]" art="point" tone="violet">
      <div className="flex items-center gap-2 text-lg font-black">총 소비 금액 <Pill>{financeSummary.month}</Pill></div>
      <div className="mt-6 text-5xl lg:text-6xl"><HeroAmount value={financeSummary.totalSpending} prefix="₩" /></div>
      <div className="tnum mt-5 text-lg font-black">
        {financeSummary.previousSpending > 0
          ? `지난 달 같은 기간 대비 ${signed(financeSummary.spendingChangeRate)} (${signedWon(financeSummary.totalSpending - financeSummary.previousSpending)})`
          : '지난 달 기록이 없어 비교할 수 없어요'}
      </div>
      {/* 두 열 화면에서는 벨루가 열을 빼면 셋을 한 줄에 못 세운다. 각자 제 폭만큼 차지하고 모자라면 다음 줄로 넘어간다. */}
      <div className="mt-10 flex flex-wrap gap-x-9 gap-y-5">
        <BlueMetric label="일평균 소비" value={won(financeSummary.dailySpending)} />
        <BlueMetric label="예산 대비" value={financeSummary.budgetRate === null ? '예산 없음' : `${financeSummary.budgetRate}%`} />
        <BlueMetric label="지난 달 같은 기간" value={won(financeSummary.previousSpending)} />
      </div>
    </BlueCard>
  )
}

function TrendCard() {
  const { spendingTrend } = useMyWaveData()

  return (
    <Card title={<span>월별 소비 추이 <CircleHelp className="inline h-4 w-4 text-slate-400" /></span>}>
      <div className="h-[245px]">
        <ResponsiveContainer>
          <AreaChart data={spendingTrend}>
            <CartesianGrid stroke="#e8eef7" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 10000}만`} />
            <Tooltip formatter={(value) => won(Number(value))} />
            <Line dataKey="budget" name="생활비 예산" stroke="#aeb9c9" strokeDasharray="4 4" strokeWidth={2} dot={false} animationDuration={1100} animationEasing="ease-out" />
            <Area dataKey="amount" name="소비" stroke="#2563eb" strokeWidth={3} fill="#2563eb1a" dot={(props) => <LiveDot {...props} />} activeDot={{ r: 7, strokeWidth: 3 }} animationDuration={1100} animationEasing="ease-out" />
            {/* 신나게 단계에서 선 위를 흐르는 빛 */}
            <Area dataKey="amount" className="chart-pulse" fill="none" stroke="#bfe0ff" strokeWidth={4} strokeLinecap="round" dot={false} activeDot={false} isAnimationActive={false} tooltipType="none" legendType="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function SpendingDonutCard() {
  const { financeSummary, spendingCategories } = useMyWaveData()

  return (
    <Card title="카테고리별 소비 비중" action={<InlineAction to="/spending/detail" label="상세" />}>
      <div className="grid gap-5 md:grid-cols-[230px_1fr]">
        <Donut data={spendingCategories.map((item) => ({ name: item.name, rate: item.rate, color: item.color, amount: item.amount }))} center={won(financeSummary.totalSpending)} label="총 소비" />
        <Legend items={spendingCategories.map((item) => ({ name: item.name, rate: item.rate, amount: item.amount, color: item.color }))} />
      </div>
      <div className="mt-5 text-sm font-medium text-slate-400">{financeSummary.month} 기록 기준</div>
    </Card>
  )
}

function SpendingBlockers() {
  const { spendingBlockers } = useMyWaveData()

  return (
    <Card className="border-orange-100 bg-orange-50/25" title={<span className="text-orange-600">목표 달성을 방해하는 소비 TOP 3 <CircleHelp className="inline h-4 w-4 text-slate-400" /></span>}>
      <div className="space-y-3">
        {spendingBlockers.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="grid grid-cols-[36px_42px_1fr_auto_auto] items-center gap-4 rounded-2xl bg-white p-4">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">{index + 1}</div>
              <Icon className="h-7 w-7" style={{ color: item.color }} />
              <div className="font-black">{item.name}</div>
              <div className="font-black">{won(item.amount)}</div>
              <div className="text-sm font-black text-orange-600">{item.count}건 · 소비의 {Math.round(item.rate)}%</div>
            </div>
          )
        })}
      </div>
      {spendingBlockers.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-white/70 p-4 text-sm font-bold text-slate-600">
          이 {spendingBlockers.length}가지가 이번 달 소비의 <span className="text-orange-600">{Math.round(spendingBlockers.reduce((sum, item) => sum + item.rate, 0))}%</span>예요. 여기서 줄이면 목표에 가장 빨리 닿아요.
        </div>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">이번 달 소비 기록이 아직 없어요.</p>
      )}
    </Card>
  )
}

function SpendingTable() {
  const { spendingCategories } = useMyWaveData()

  return (
    <Card title="카테고리별 상세 내역" action="전체 보기" actionTo="/spending/detail">
      <div className="overflow-x-auto">
        <table className="mywave-table">
          <thead>
            <tr>
              <th>카테고리</th>
              <th>이번 달</th>
              <th>건수</th>
              <th>한 번에 평균</th>
              <th>비중</th>
            </tr>
          </thead>
          <tbody>
            {spendingCategories.slice(0, 5).map((item) => {
              const Icon = item.icon
              return (
                <tr key={item.name}>
                  <td><span className="flex items-center gap-2"><Icon className="h-5 w-5" style={{ color: item.color }} />{item.name}</span></td>
                  <td>{won(item.amount)}</td>
                  <td>{item.count}건</td>
                  <td>{won(item.average)}</td>
                  <td>{item.rate}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/**
 * 이번 달 소비가 큰 카테고리 세 개를 몇 % 줄이면 얼마가 남고, 그 돈이 가장 가까운 목표에
 * 들어가면 달성률이 어떻게 바뀌는지. 화면 계산과 서버 계산은 같은 식이다.
 */
function SavingSimulation() {
  const { financeSummary, spendingCategories } = useMyWaveData()
  const targets = useMemo(() => [...spendingCategories].sort((a, b) => b.amount - a.amount).slice(0, 3), [spendingCategories])
  const [rates, setRates] = useState<Record<string, number>>({})
  const [applied, setApplied] = useState(false)
  const [savingResult, setSavingResult] = useState<{ amount: number; rate: number } | null>(null)
  const rateOf = (name: string) => rates[name] ?? 20
  const savingAmount = targets.reduce((sum, item) => sum + Math.round((item.amount * rateOf(item.name)) / 100), 0)
  const improvedRate = financeSummary.targetAmount > 0
    ? Math.min(100, Math.round(((financeSummary.savedAmount + savingAmount) / financeSummary.targetAmount) * 1000) / 10)
    : 0
  const displaySavingAmount = savingResult?.amount ?? savingAmount
  const displayImprovedRate = savingResult?.rate ?? improvedRate
  const simulations = targets.map((item) => ({
    name: item.name,
    rate: rateOf(item.name),
    setRate: (value: number) => { setRates((current) => ({ ...current, [item.name]: value })); setSavingResult(null); setApplied(false) },
    unit: item.amount / 100,
  }))

  async function applySimulation() {
    setApplied(true)
    try {
      const result = await simulateMyWaveSaving({
        categoryReductionRates: Object.fromEntries(targets.map((item) => [item.name, rateOf(item.name)])),
      })
      setSavingResult({
        amount: Number(result.monthlySavingAmount),
        rate: Number(result.expectedGoalRate),
      })
    } catch {
      setApplied(false)
    }
  }

  if (targets.length === 0) {
    return (
      <Card title="소비를 줄이면 목표가 얼마나 가까워질까요?">
        <p className="text-sm font-bold text-slate-500">이번 달 소비 기록이 쌓이면 줄일 만한 곳을 골라 계산해 드려요.</p>
      </Card>
    )
  }

  const hasGoal = financeSummary.targetAmount > 0

  return (
    <Card title={hasGoal ? '소비 줄이면 목표 달성률이 이렇게 달라져요!' : '소비를 줄이면 한 달에 이만큼 남아요'} action={<span className="text-xs text-slate-400">시뮬레이션 기준: 월간</span>}>
      <div className="grid gap-5 lg:grid-cols-[1fr_210px]">
        <div className="space-y-4">
          {simulations.map(({ name, rate, setRate, unit }) => (
            <div key={name} className="grid grid-cols-[80px_70px_1fr_80px] items-center gap-3 text-sm font-bold">
              <span>{name}</span>
              <span className="rounded-lg py-1 text-center text-blue-700">-{rate}%</span>
              <input type="range" min="0" max="50" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="accent-blue-600" />
              <span className="text-blue-700">-{won(Math.round(rate * unit))}</span>
            </div>
          ))}
        </div>
        <div className="rounded-[20px] p-5">
          <div className="text-sm font-bold text-slate-500">예상 월 절약 금액</div>
          <div className="mt-2 text-3xl font-black text-blue-700">{won(displaySavingAmount)}</div>
          {hasGoal ? (
            <>
              <div className="mt-5 text-sm font-bold text-slate-500">목표 달성률 개선</div>
              <div className="mt-2 text-3xl font-black text-emerald-500">{financeSummary.goalRate}% → {displayImprovedRate}%</div>
              <button onClick={applySimulation} className="mt-5 w-full rounded-2xl bg-blue-700 py-3 font-black text-white">{applied ? '적용 완료' : '이대로 적용해보기'}</button>
            </>
          ) : (
            // 목표가 없으면 달성률은 0% 에서 0% 다. 그 숫자를 "개선"이라고 보여 주지 않는다.
            <p className="mt-5 text-sm font-bold leading-6 text-slate-500">목표를 만들면 이 돈으로 달성률이 얼마나 오르는지도 보여 드려요.</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function SpendingDetailPage() {
  const { spendingCategories, spendingBlockers, financeSummary } = useMyWaveData()
  return (
    <div className="space-y-5">
      <MobileTitle title="소비 상세" />
      <SpendingHero />
      <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
        <Card title="카테고리별 지출">
          <div className="space-y-3">
            {spendingCategories.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700"><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-black">{item.name}</div>
                    <Progress value={item.rate} className="mt-2 h-2" color={item.color} />
                  </div>
                  <div className="text-right">
                    <div className="font-black">{won(item.amount)}</div>
                    <div className="text-xs font-bold text-slate-500">{item.rate}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card title="목표 달성을 방해하는 소비 TOP 3" action="조정하기" actionTo="/spending/simulation">
          {spendingBlockers.length === 0 && <p className="text-sm font-bold text-slate-500">이번 달 소비 기록이 아직 없어요.</p>}
          <div className="space-y-3">
            {spendingBlockers.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">{index + 1}</span>
                <div className="flex-1">
                  <div className="font-black">{item.name}</div>
                  <div className="text-sm font-bold text-slate-500">{item.count}건 · 소비의 {Math.round(item.rate)}%</div>
                </div>
                <div className="font-black">{won(item.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="이번 달 소비 판단">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat
            label="총 소비"
            value={won(financeSummary.totalSpending)}
            change={financeSummary.previousSpending > 0 ? `지난 달 같은 기간 대비 ${signed(financeSummary.spendingChangeRate)}` : '지난 달 기록 없음'}
          />
          <MiniStat label="일평균 소비" value={won(financeSummary.dailySpending)} />
          <MiniStat
            label="예산 대비"
            value={financeSummary.budgetRate === null ? '예산 없음' : `${financeSummary.budgetRate}%`}
            change={financeSummary.budgetRate === null ? '생활비 예산을 정해 주세요' : financeSummary.budgetRate > 100 ? '예산을 넘었어요' : `예산 안에서 쓰는 중`}
          />
        </div>
      </Card>
      <ExpenseRecordsManager />
    </div>
  )
}

type ExpenseFormState = {
  category: string
  merchant: string
  amount: number
  spentDate: string
  memo: string
}

function monthStringFromDate(value: string) {
  return value.slice(0, 7)
}

/**
 * 소비 기록 간편 입력 묶음.
 *
 * 퀵버튼, 붙여넣기·캡처, 돈 흐름이 같은 refreshKey 를 공유한다.
 * 어느 경로로 기록하든 나머지 카드가 함께 새로고침되어야 하기 때문이다.
 */
function ExpenseQuickEntry() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  // 카드가 한꺼번에 튀어나오지 않고 위에서 아래로 차례차례 들어온다.
  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="rise-in"><QuickExpenseButtons onLogged={refresh} /></div>
      <div className="rise-in" style={{ animationDelay: '70ms' }}><ExpenseImportCard onSaved={refresh} /></div>
      <div className="rise-in" style={{ animationDelay: '140ms' }}><CashFlowCard refreshKey={refreshKey} /></div>
    </div>
  )
}

function ExpenseRecordsManager() {
  const location = useLocation()
  const navigate = useNavigate()
  const formCardRef = useRef<HTMLDivElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const [expenses, setExpenses] = useState<MyWaveExpenseResponse[]>([])
  const [summary, setSummary] = useState<MyWaveExpenseSummaryResponse | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ExpenseFormState>({
    category: '배달비',
    merchant: '',
    amount: 0,
    spentDate: todayDateString(),
    memo: '',
  })
  const [message, setMessage] = useState('')
  // 위쪽 요약 카드들은 화면 틀이 한 번 불러 둔 공용 데이터를 쓴다. 여기서 기록을 바꾸면 그것도 다시 불러야 같은 숫자를 말한다.
  const { reload } = useMyWaveData()

  async function loadExpenses(month = monthStringFromDate(form.spentDate)) {
    try {
      const [items, monthlySummary] = await Promise.all([
        getMyWaveExpenses(month),
        getMyWaveExpenseSummary(month),
      ])
      setExpenses(items)
      setSummary(monthlySummary)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '소비 내역을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    let live = true
    const month = monthStringFromDate(todayDateString())
    Promise.all([getMyWaveExpenses(month), getMyWaveExpenseSummary(month)])
      .then(([items, monthlySummary]) => {
        if (!live) return
        setExpenses(items)
        setSummary(monthlySummary)
      })
      .catch((error) => { if (live) setMessage(error instanceof Error ? error.message : '소비 내역을 불러오지 못했습니다.') })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!(location.state as { focusExpenseForm?: boolean } | null)?.focusExpenseForm) return

    const timer = window.setTimeout(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      formCardRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      amountInputRef.current?.focus({ preventScroll: true })
      amountInputRef.current?.select()
      navigate(location.pathname, { replace: true, state: null })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [location.pathname, location.state, navigate])

  function editExpense(expense: MyWaveExpenseResponse) {
    setEditingId(expense.id)
    setForm({
      category: expense.category,
      merchant: expense.merchant,
      amount: Number(expense.amount),
      spentDate: expense.spentDate,
      memo: expense.memo ?? '',
    })
    setMessage('')
  }

  function resetExpenseForm() {
    setEditingId(null)
    setForm({ category: '배달비', merchant: '', amount: 0, spentDate: todayDateString(), memo: '' })
  }

  async function saveExpense() {
    if (!form.category.trim() || !form.merchant.trim() || form.amount <= 0) {
      setMessage('카테고리, 사용처, 금액을 입력해주세요.')
      return
    }
    try {
      if (editingId) {
        await updateMyWaveExpense(editingId, form)
        setMessage('소비 내역이 수정되었습니다.')
      } else {
        await createMyWaveExpense(form)
        setMessage('소비 내역이 추가되었습니다.')
      }
      const month = monthStringFromDate(form.spentDate)
      resetExpenseForm()
      await loadExpenses(month)
      reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '소비 내역 저장에 실패했습니다.')
    }
  }

  async function removeExpense(id: number) {
    try {
      await deleteMyWaveExpense(id)
      if (editingId === id) resetExpenseForm()
      setMessage('소비 내역이 삭제되었습니다.')
      await loadExpenses()
      reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '소비 내역 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Card
        title="소비 내역"
        action={<button onClick={() => loadExpenses()} className="pressable rounded-full px-3 py-1.5 text-xs font-black text-blue-700">새로고침</button>}
      >
        {summary && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="월 총 지출" value={won(Number(summary.totalAmount))} />
            <MiniStat label="전월 대비" value={`${Number(summary.changeRate).toFixed(1)}%`} />
            <MiniStat label="일평균" value={won(Number(summary.dailyAverageAmount))} />
          </div>
        )}
        {message && <Notice text={message} className="mb-4" />}
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <button onClick={() => editExpense(expense)} className="pressable min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">{expense.category}</span>
                  <span className="text-base font-black">{expense.merchant}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">{expense.spentDate}{expense.memo ? ` · ${expense.memo}` : ''}</div>
              </button>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right text-lg font-black">{won(Number(expense.amount))}</div>
                <ConfirmDeleteButton compact label="소비 기록 삭제" onConfirm={() => removeExpense(expense.id)} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div ref={formCardRef}>
        <Card title={editingId ? '소비 내역 수정' : '소비 내역 추가'}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="카테고리">
                <select value={form.category} onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))} className="form-input">
                  {['배달비', '쇼핑', '식비', '카페', '교통', '구독', '기타'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="사용처">
                <MerchantAutocomplete
                  value={form.merchant}
                  onChange={(merchant) => setForm((value) => ({ ...value, merchant }))}
                  onPick={(suggestion) => setForm((value) => ({
                    ...value,
                    merchant: suggestion.merchant,
                    category: suggestion.category,
                    amount: Number(suggestion.suggestedAmount),
                  }))}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="금액">
                <input ref={amountInputRef} type="number" min="0" max="100000000" value={form.amount} onChange={(event) => setForm((value) => ({ ...value, amount: Number(event.target.value) }))} className="form-input" />
              </Field>
              <Field label="사용일">
                <input type="date" max={todayDateString()} value={form.spentDate} onChange={(event) => setForm((value) => ({ ...value, spentDate: event.target.value }))} className="form-input" />
              </Field>
            </div>
            <Field label="메모">
              <input value={form.memo} onChange={(event) => setForm((value) => ({ ...value, memo: event.target.value }))} className="form-input" />
            </Field>
            <div className="flex gap-3">
              {editingId && <button onClick={resetExpenseForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveExpense} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingId ? '수정 저장' : '내역 추가'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function SimulationDetailPage() {
  return (
    <div className="space-y-5">
      <MobileTitle title="절약 시뮬레이션" />
      <SavingSimulation />
      <ActionPanel />
    </div>
  )
}
