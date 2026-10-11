import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { won } from './format'
import { actionTone, allocationColor, categoryStyle, goalStyle } from './myWaveData'
import {
  getMyWaveActions,
  getMyWaveCoachMessages,
  getMyWaveDashboard,
  getMyWaveExpenses,
  getMyWaveGoals,
  getMyWaveHoldings,
  type MyWaveActionResponse,
  type MyWaveCoachMessageResponse,
  type MyWaveDashboardResponse,
  type MyWaveExpenseResponse,
  type MyWaveGoalResponse,
  type MyWaveHoldingResponse,
} from './myWaveApi'

type IconType = ComponentType<{ className?: string; style?: { color?: string } }>

/**
 * 화면 전체가 같이 쓰는 숫자. 전부 API 에서 온다.
 *
 * 불러오기 전과 실패했을 때는 0 과 빈 목록이다. 그럴듯한 데모 숫자로 채우지 않는다.
 * 대신 status 를 보고 Shell 이 "불러오는 중 / 불러오지 못함"을 따로 알린다.
 */
type FinanceSummary = {
  month: string
  goalRate: number
  averageGoalRate: number
  targetAmount: number
  savedAmount: number
  remainingAmount: number
  daysLeft: number
  dailyTarget: number
  mainGoalTargetDate: string
  totalAsset: number
  accountBalance: number
  livingBudget: number
  livingBudgetLeft: number
  investableAmount: number
  plannedSaving: number
  totalSpending: number
  previousSpending: number
  spendingChangeRate: number
  dailySpending: number
  /** 생활비 예산 대비 이번 달 소비. 예산이 없으면 null. */
  budgetRate: number | null
  investmentValue: number
  investmentPrincipal: number
  investmentProfit: number
  investmentReturn: number
  dailyProfit: number
  dailyReturn: number
  savingRate: number
}

type RuntimeGoal = {
  id: number
  title: string
  dueDate: string
  status: string
  saved: number
  target: number
  rate: number
  daysLeft: number
  accent: string
  icon: IconType
}

type RuntimeAction = { title: string; detail: string; saving: number; category: string; icon: IconType; tone: 'violet' | 'green' | 'orange' }

type RuntimeCategory = { name: string; amount: number; rate: number; count: number; average: number; icon: IconType; color: string }

type RuntimeBlocker = { name: string; amount: number; count: number; rate: number; icon: IconType; color: string }

type RuntimeAllocation = { name: string; amount: number; rate: number; color: string }

type RuntimeHolding = { symbol: string; name: string; quantity: number; averagePrice: number; value: number; profit: number; returnRate: number; weight: number }

type RuntimeActivity = { id: number; title: string; detail: string; amount: number; icon: IconType; color: string }

export type RuntimeCoachMessage = { from: 'bot' | 'user'; text: string; stats?: Array<{ label: string; value: string }>; suggestions?: string[] }

type RuntimeTrend = { month: string; amount: number; budget: number }

type MyWaveRuntimeData = {
  financeSummary: FinanceSummary
  goals: RuntimeGoal[]
  recommendedActions: RuntimeAction[]
  spendingCategories: RuntimeCategory[]
  spendingBlockers: RuntimeBlocker[]
  spendingTrend: RuntimeTrend[]
  portfolioAllocation: RuntimeAllocation[]
  holdings: RuntimeHolding[]
  activities: RuntimeActivity[]
  coachMessages: RuntimeCoachMessage[]
  status: 'loading' | 'ready' | 'error'
  reload: () => void
}

const emptyFinanceSummary: FinanceSummary = {
  month: '',
  goalRate: 0,
  averageGoalRate: 0,
  targetAmount: 0,
  savedAmount: 0,
  remainingAmount: 0,
  daysLeft: 0,
  dailyTarget: 0,
  mainGoalTargetDate: '',
  totalAsset: 0,
  accountBalance: 0,
  livingBudget: 0,
  livingBudgetLeft: 0,
  investableAmount: 0,
  plannedSaving: 0,
  totalSpending: 0,
  previousSpending: 0,
  spendingChangeRate: 0,
  dailySpending: 0,
  budgetRate: null,
  investmentValue: 0,
  investmentPrincipal: 0,
  investmentProfit: 0,
  investmentReturn: 0,
  dailyProfit: 0,
  dailyReturn: 0,
  savingRate: 0,
}

const emptyRuntimeData: MyWaveRuntimeData = {
  financeSummary: emptyFinanceSummary,
  goals: [],
  recommendedActions: [],
  spendingCategories: [],
  spendingBlockers: [],
  spendingTrend: [],
  portfolioAllocation: [],
  holdings: [],
  activities: [],
  coachMessages: [],
  status: 'loading',
  reload: () => {},
}

export const MyWaveDataContext = createContext<MyWaveRuntimeData>(emptyRuntimeData)

export function useMyWaveData() {
  return useContext(MyWaveDataContext)
}

export function useMyWaveRuntimeData(): MyWaveRuntimeData {
  const [data, setData] = useState<Omit<MyWaveRuntimeData, 'reload'>>(emptyRuntimeData)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let ignore = false
    const month = new Date().toISOString().slice(0, 7)

    Promise.allSettled([
      getMyWaveDashboard(),
      getMyWaveGoals(),
      getMyWaveActions(),
      getMyWaveCoachMessages(),
      getMyWaveHoldings(),
      getMyWaveExpenses(month),
    ]).then((results) => {
      if (ignore) return
      const dashboard = settledValue<MyWaveDashboardResponse>(results[0])
      if (!dashboard) {
        setData((previous) => ({ ...previous, status: 'error' }))
        return
      }
      setData({
        financeSummary: mapFinanceSummary(dashboard),
        goals: mapGoals(settledValue<MyWaveGoalResponse[]>(results[1]) ?? [], dashboard),
        recommendedActions: mapActions(settledValue<MyWaveActionResponse[]>(results[2]) ?? []),
        spendingCategories: mapSpendingCategories(dashboard),
        spendingBlockers: mapSpendingBlockers(dashboard),
        spendingTrend: mapSpendingTrend(dashboard),
        portfolioAllocation: mapPortfolioAllocation(dashboard),
        holdings: mapHoldings(settledValue<MyWaveHoldingResponse[]>(results[4]) ?? []),
        activities: mapActivities(settledValue<MyWaveExpenseResponse[]>(results[5]) ?? []),
        coachMessages: mapCoachMessages(settledValue<MyWaveCoachMessageResponse[]>(results[3]) ?? []),
        status: 'ready',
      })
    })

    return () => {
      ignore = true
    }
  }, [reloadKey])

  return useMemo(() => ({ ...data, reload }), [data, reload])
}

function settledValue<T>(result: PromiseSettledResult<unknown>) {
  return result.status === 'fulfilled' ? (result.value as T) : null
}

function mapFinanceSummary(dashboard: MyWaveDashboardResponse): FinanceSummary {
  const mainGoal = dashboard.goalSummary.mainGoal
  const portfolio = dashboard.portfolio
  const budget = dashboard.assetSummary.budget
  const livingBudget = toNumber(budget?.livingBudgetAmount)
  const totalSpending = toNumber(dashboard.expenseSummary.totalAmount)
  return {
    month: formatMonth(dashboard.assetSummary.month),
    goalRate: toNumber(dashboard.goalProgressRate),
    averageGoalRate: toNumber(dashboard.goalSummary.averageProgressRate),
    targetAmount: toNumber(mainGoal?.targetAmount),
    savedAmount: toNumber(dashboard.currentSavingAmount),
    remainingAmount: toNumber(dashboard.remainingGoalAmount),
    daysLeft: toNumber(mainGoal?.remainingDays),
    dailyTarget: toNumber(mainGoal?.dailyRequiredAmount),
    mainGoalTargetDate: formatDate(mainGoal?.targetDate ?? ''),
    totalAsset: toNumber(dashboard.totalAsset),
    accountBalance: toNumber(dashboard.assetSummary.accountBalance),
    livingBudget,
    livingBudgetLeft: toNumber(dashboard.remainingLivingBudget),
    investableAmount: toNumber(dashboard.investmentAvailableAmount),
    plannedSaving: toNumber(budget?.plannedSavingAmount),
    totalSpending,
    previousSpending: toNumber(dashboard.expenseSummary.previousMonthAmount),
    spendingChangeRate: toNumber(dashboard.expenseSummary.changeRate),
    dailySpending: toNumber(dashboard.expenseSummary.dailyAverageAmount),
    budgetRate: livingBudget > 0 ? Math.round((totalSpending / livingBudget) * 100) : null,
    investmentValue: toNumber(portfolio?.totalEvaluationAmount),
    investmentPrincipal: toNumber(portfolio?.totalPurchaseAmount),
    investmentProfit: toNumber(portfolio?.totalProfitLoss),
    investmentReturn: toNumber(portfolio?.totalReturnRate),
    dailyProfit: toNumber(portfolio?.dailyProfitLoss),
    dailyReturn: toNumber(portfolio?.dailyReturnRate),
    savingRate: toNumber(dashboard.assetSummary.savingRate),
  }
}

export const GOAL_STATUS_LABEL: Record<string, string> = { ACTIVE: '진행 중', PAUSED: '일시정지', COMPLETED: '완료' }

/** 목표 목록. 대시보드가 고른 "가장 가까운 목표"를 맨 앞에 둔다. 화면은 첫 번째를 메인 목표로 그린다. */
function mapGoals(apiGoals: MyWaveGoalResponse[], dashboard: MyWaveDashboardResponse): RuntimeGoal[] {
  const mainId = dashboard.goalSummary.mainGoal?.id
  const ordered = [...apiGoals].sort((a, b) => (a.id === mainId ? -1 : b.id === mainId ? 1 : 0))
  return ordered.map((goal, index) => ({
    id: goal.id,
    title: goal.title,
    dueDate: formatDate(goal.targetDate),
    status: GOAL_STATUS_LABEL[goal.status] ?? goal.status,
    saved: toNumber(goal.currentAmount),
    target: toNumber(goal.targetAmount),
    rate: toNumber(goal.progressRate),
    daysLeft: toNumber(goal.remainingDays),
    ...goalStyle(index),
  }))
}

function mapActions(actions: MyWaveActionResponse[]): RuntimeAction[] {
  return actions.map((action, index) => ({
    title: action.title,
    detail: action.description,
    saving: toNumber(action.monthlySavingAmount),
    category: action.category,
    icon: categoryStyle(action.category).icon,
    tone: actionTone(index),
  }))
}

function mapSpendingCategories(dashboard: MyWaveDashboardResponse): RuntimeCategory[] {
  return dashboard.expenseSummary.categories.map((category) => ({
    name: category.category,
    amount: toNumber(category.amount),
    rate: toNumber(category.ratio),
    count: toNumber(category.count),
    average: toNumber(category.averageAmount),
    ...categoryStyle(category.category),
  }))
}

function mapSpendingBlockers(dashboard: MyWaveDashboardResponse): RuntimeBlocker[] {
  return dashboard.expenseSummary.goalBlockers.map((blocker) => ({
    name: blocker.category,
    amount: toNumber(blocker.amount),
    count: toNumber(blocker.count),
    rate: toNumber(blocker.ratio),
    ...categoryStyle(blocker.category),
  }))
}

function mapSpendingTrend(dashboard: MyWaveDashboardResponse): RuntimeTrend[] {
  return dashboard.expenseSummary.trends.map((trend) => ({
    month: formatMonth(trend.month),
    amount: toNumber(trend.amount),
    budget: toNumber(trend.budget),
  }))
}

function mapPortfolioAllocation(dashboard: MyWaveDashboardResponse): RuntimeAllocation[] {
  return dashboard.portfolioAllocation.map((item, index) => ({
    name: item.name,
    amount: toNumber(item.value),
    rate: toNumber(item.rate),
    color: allocationColor(item.name, index),
  }))
}

function mapHoldings(holdings: MyWaveHoldingResponse[]): RuntimeHolding[] {
  return holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.stockName,
    quantity: toNumber(holding.quantity),
    averagePrice: toNumber(holding.averagePrice),
    value: toNumber(holding.evaluationAmount),
    profit: toNumber(holding.profitLoss),
    returnRate: toNumber(holding.returnRate),
    weight: toNumber(holding.weight),
  }))
}

/** 최근 활동은 이번 달 소비 기록 최근 다섯 건이다. */
function mapActivities(expenses: MyWaveExpenseResponse[]): RuntimeActivity[] {
  return expenses.slice(0, 5).map((expense) => ({
    id: expense.id,
    title: expense.merchant,
    detail: `${expense.category} · ${formatDate(expense.spentDate)}`,
    amount: -toNumber(expense.amount),
    ...categoryStyle(expense.category),
  }))
}

function mapCoachMessages(messages: MyWaveCoachMessageResponse[]): RuntimeCoachMessage[] {
  return messages.map((message) => ({
    from: message.role === 'USER' ? 'user' : 'bot',
    text: message.content,
  }))
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatMonth(value: string) {
  if (!value) return ''
  const [year, month] = value.split('-')
  return year && month ? `${year}.${month}` : value
}

function formatDate(value: string) {
  return value ? value.replaceAll('-', '.') : ''
}

/** 오르면 ▲, 내리면 ▼. 부호를 코드에 박지 않는다. */
export function signed(value: number, suffix = '%') {
  if (value === 0) return `0${suffix}`
  return `${value > 0 ? '▲' : '▼'} ${Math.abs(value).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${suffix}`
}

export function signedWon(value: number) {
  if (value === 0) return won(0)
  return `${value > 0 ? '▲' : '▼'} ${won(Math.abs(value))}`
}

/** 국내 시세 관행: 오르면 빨강, 내리면 파랑. */
export function gainClass(value: number) {
  return value > 0 ? 'text-[#f04452]' : value < 0 ? 'text-blue-600' : 'text-slate-500'
}

/**
 * 보유 구성을 보고 한 줄 안내를 만든다. 금액은 말하지 않는다.
 * 무엇을 사라고 하지 않고, 확인해 볼 점만 짚는다.
 */
export function portfolioInsightLine(allocation: RuntimeAllocation[], holdings: RuntimeHolding[]) {
  if (holdings.length === 0) return '아직 보유 종목이 없어요. 거래 기록을 넣으면 구성과 쏠림을 정리해 드려요.'
  const top = [...holdings].sort((a, b) => b.weight - a.weight)[0]
  if (top && top.weight >= 50) return `${top.name} 한 종목이 절반 이상을 차지해요. 한쪽에 몰려 있지 않은지 확인해 볼 만해요.`
  const topGroup = [...allocation].sort((a, b) => b.rate - a.rate)[0]
  if (topGroup && topGroup.rate >= 60) return `${topGroup.name} 비중이 높은 편이에요. 같은 방향으로 움직이는 자산이 많은지 살펴보세요.`
  return '한 종목이나 한 자산군에 크게 쏠려 있지는 않아요.'
}
