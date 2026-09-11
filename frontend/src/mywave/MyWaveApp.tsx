import {
  Bell,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Edit3,
  FileText,
  Info,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Search,
  SendHorizontal,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { won } from './format'
import { Card, Field, ListRow } from './uiKit'
import { Beluga, BelugaSays } from './Beluga'
import { Amount } from './Amount'
import {
  CashFlowCard,
  ExpenseImportCard,
  MerchantAutocomplete,
  QuickExpenseButtons,
} from './ExpenseCapture'
import {
  activities as defaultActivities,
  coachMessages as defaultCoachMessages,
  financeSummary as defaultFinanceSummary,
  goals as defaultGoals,
  holdings as defaultHoldings,
  mobileNavItems,
  navItems,
  portfolioAllocation as defaultPortfolioAllocation,
  recommendedActions as defaultRecommendedActions,
  spendingBlockers as defaultSpendingBlockers,
  spendingCategories as defaultSpendingCategories,
  spendingTrend as defaultSpendingTrend,
} from './myWaveData'
import waveHero from '../assets/mywave/wave-hero.png'
import {
  addMyWaveWatchlist,
  chatWithMyWaveCoach,
  createMyWaveAccount,
  createMyWaveExpense,
  createMyWaveGoal,
  createMyWaveTransaction,
  deleteMyWaveAccount,
  deleteMyWaveExpense,
  deleteMyWaveGoal,
  deleteMyWaveNotification,
  deleteReadMyWaveNotifications,
  deleteMyWaveTransaction,
  getMyWaveAccounts,
  getMyWaveAssetSummary,
  getMyWaveCompanyAnalysis,
  getMyWaveActions,
  getMyWaveCoachMessages,
  getMyWaveDashboard,
  getMyWaveExpenses,
  getMyWaveExpenseSummary,
  getMyWaveGoals,
  getMyWaveHoldings,
  getMyWaveMember,
  getMyWaveNotifications,
  getMyWavePortfolio,
  getMyWaveTransactions,
  markAllMyWaveNotificationsRead,
  markMyWaveNotificationRead,
  removeMyWaveWatchlist,
  saveMyWavePortfolioRiskAction,
  searchMyWave,
  simulateMyWaveSaving,
  saveMyWaveMonthlyBudget,
  updateMyWaveAccount,
  updateMyWaveExpense,
  updateMyWaveGoal,
  updateMyWaveTransaction,
  updateMyWaveMembership,
  changeMyWavePassword,
  logoutMyWaveSession,
  updateMyWaveProfile,
  type MyWaveActionResponse,
  type MyWaveCompanyAnalysisResponse,
  type MyWaveCoachMessageResponse,
  type MyWaveDashboardResponse,
  type MyWaveExpenseResponse,
  type MyWaveExpenseSummaryResponse,
  type MyWaveFinancialAccountResponse,
  type MyWaveGoalResponse,
  type MyWaveHoldingResponse,
  type MyWaveInvestmentTransactionResponse,
  type MyWaveMemberResponse,
  type MyWaveMonthlyBudgetResponse,
  type MyWaveNotificationResponse,
  type MyWavePortfolioResponse,
  type MyWaveSearchResultResponse,
} from './myWaveApi'
import AuthPage from '../pages/AuthPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/useAuth'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const activeClass = 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,.04)]'
const inactiveClass = 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'

type RuntimeGoal = (typeof defaultGoals)[number]
type RuntimeAction = (typeof defaultRecommendedActions)[number]
type RuntimeCategory = (typeof defaultSpendingCategories)[number]
type RuntimeBlocker = (typeof defaultSpendingBlockers)[number]
type RuntimeAllocation = (typeof defaultPortfolioAllocation)[number]
type RuntimeCoachMessage = (typeof defaultCoachMessages)[number]

type MyWaveRuntimeData = {
  financeSummary: typeof defaultFinanceSummary
  goals: RuntimeGoal[]
  recommendedActions: RuntimeAction[]
  spendingCategories: RuntimeCategory[]
  spendingBlockers: RuntimeBlocker[]
  spendingTrend: typeof defaultSpendingTrend
  portfolioAllocation: RuntimeAllocation[]
  holdings: typeof defaultHoldings
  activities: typeof defaultActivities
  coachMessages: RuntimeCoachMessage[]
  source: 'api' | 'demo'
}

const defaultRuntimeData: MyWaveRuntimeData = {
  financeSummary: defaultFinanceSummary,
  goals: defaultGoals,
  recommendedActions: defaultRecommendedActions,
  spendingCategories: defaultSpendingCategories,
  spendingBlockers: defaultSpendingBlockers,
  spendingTrend: defaultSpendingTrend,
  portfolioAllocation: defaultPortfolioAllocation,
  holdings: defaultHoldings,
  activities: defaultActivities,
  coachMessages: defaultCoachMessages,
  source: 'demo',
}

const MyWaveDataContext = createContext<MyWaveRuntimeData>(defaultRuntimeData)

function useMyWaveData() {
  return useContext(MyWaveDataContext)
}

export default function MyWaveApp() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage />} />
      <Route path="register" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="spending" element={<SpendingPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="coach" element={<CoachPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="goals/new" element={<GoalEditorPage />} />
          <Route path="spending/detail" element={<SpendingDetailPage />} />
          <Route path="spending/simulation" element={<SimulationDetailPage />} />
          <Route path="portfolio/detail" element={<PortfolioDetailPage />} />
          <Route path="portfolio/allocation" element={<PortfolioAllocationDetailPage />} />
          <Route path="portfolio/risk" element={<RiskDetailPage />} />
          <Route path="assets" element={<AssetDetailPage />} />
          <Route path="company/:symbol" element={<CompanyDetailPage />} />
          <Route path="transactions" element={<Navigate to="/spending" replace />} />
          <Route path="ai-report" element={<Navigate to="/coach" replace />} />
          <Route path="financial-analysis" element={<Navigate to="/reports" replace />} />
          <Route path="watchlist" element={<Navigate to="/portfolio" replace />} />
          <Route path="earnings-calendar" element={<Navigate to="/reports" replace />} />
          <Route path="market" element={<Navigate to="/portfolio" replace />} />
          <Route path="research" element={<Navigate to="/reports" replace />} />
          <Route path="themes" element={<Navigate to="/portfolio" replace />} />
          <Route path="stock/:symbol" element={<Navigate to="/company/005930" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

function Shell() {
  const runtimeData = useMyWaveRuntimeData()

  return (
    <MyWaveDataContext.Provider value={runtimeData}>
      <div className="min-h-screen bg-[var(--bg)] p-0 text-slate-900 lg:p-8">
        <div className="mx-auto min-h-screen w-full max-w-[1760px] overflow-hidden bg-[var(--bg)] lg:min-h-[calc(100vh-4rem)] lg:rounded-[20px]">
          <WindowBar />
          <div className="flex min-h-screen lg:min-h-[calc(100vh-7rem)]">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-24 lg:pb-0">
              <MobileTop />
              <div className="mx-auto w-full max-w-[1460px] px-5 py-5 sm:px-7 lg:px-10 lg:py-8">
                <DesktopHeader />
                <Outlet />
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </div>
    </MyWaveDataContext.Provider>
  )
}

function useMyWaveRuntimeData() {
  const [data, setData] = useState<MyWaveRuntimeData>(defaultRuntimeData)

  useEffect(() => {
    let ignore = false

    Promise.allSettled([getMyWaveDashboard(), getMyWaveGoals(), getMyWaveActions(), getMyWaveCoachMessages()]).then((results) => {
      if (ignore) return
      const dashboard = settledValue<MyWaveDashboardResponse>(results[0])
      if (!dashboard) {
        setData(defaultRuntimeData)
        return
      }
      setData({
        ...defaultRuntimeData,
        financeSummary: mapFinanceSummary(dashboard),
        goals: mapGoals(settledValue<MyWaveGoalResponse[]>(results[1]) ?? [], dashboard),
        recommendedActions: mapActions(settledValue<MyWaveActionResponse[]>(results[2]) ?? []),
        spendingCategories: mapSpendingCategories(dashboard),
        spendingBlockers: mapSpendingBlockers(dashboard),
        spendingTrend: mapSpendingTrend(dashboard),
        portfolioAllocation: mapPortfolioAllocation(dashboard),
        coachMessages: mapCoachMessages(settledValue<MyWaveCoachMessageResponse[]>(results[3]) ?? []),
        source: 'api',
      })
    })

    return () => {
      ignore = true
    }
  }, [])

  return data
}

function settledValue<T>(result: PromiseSettledResult<unknown>) {
  return result.status === 'fulfilled' ? (result.value as T) : null
}

function mapFinanceSummary(dashboard: MyWaveDashboardResponse): typeof defaultFinanceSummary {
  const mainGoal = dashboard.goalSummary.mainGoal
  const portfolio = dashboard.portfolio
  return {
    ...defaultFinanceSummary,
    month: formatMonth(dashboard.assetSummary.month),
    goalRate: toNumber(dashboard.goalProgressRate, defaultFinanceSummary.goalRate),
    targetAmount: toNumber(mainGoal?.targetAmount, defaultFinanceSummary.targetAmount),
    savedAmount: toNumber(dashboard.currentSavingAmount, defaultFinanceSummary.savedAmount),
    remainingAmount: toNumber(dashboard.remainingGoalAmount, defaultFinanceSummary.remainingAmount),
    daysLeft: toNumber(mainGoal?.remainingDays, defaultFinanceSummary.daysLeft),
    dailyTarget: toNumber(mainGoal?.dailyRequiredAmount, defaultFinanceSummary.dailyTarget),
    totalAsset: toNumber(dashboard.totalAsset, defaultFinanceSummary.totalAsset),
    livingBudgetLeft: toNumber(dashboard.remainingLivingBudget, defaultFinanceSummary.livingBudgetLeft),
    investableAmount: toNumber(dashboard.investmentAvailableAmount, defaultFinanceSummary.investableAmount),
    totalSpending: toNumber(dashboard.expenseSummary.totalAmount, defaultFinanceSummary.totalSpending),
    dailySpending: toNumber(dashboard.expenseSummary.dailyAverageAmount, defaultFinanceSummary.dailySpending),
    goalImpact: toNumber(dashboard.expenseSummary.changeRate, defaultFinanceSummary.goalImpact),
    investmentProfit: toNumber(portfolio?.totalProfitLoss, defaultFinanceSummary.investmentProfit),
    investmentReturn: toNumber(portfolio?.totalReturnRate, defaultFinanceSummary.investmentReturn),
    yearlyReturn: toNumber(portfolio?.dailyReturnRate, defaultFinanceSummary.yearlyReturn),
    savingRate: toNumber(dashboard.assetSummary.savingRate, defaultFinanceSummary.savingRate),
  }
}

function mapGoals(apiGoals: MyWaveGoalResponse[], dashboard: MyWaveDashboardResponse): RuntimeGoal[] {
  const goals = apiGoals.length > 0 ? apiGoals : dashboard.goalSummary.mainGoal ? [dashboard.goalSummary.mainGoal] : []
  if (goals.length === 0) return defaultGoals
  return goals.map((goal, index) => ({
    ...defaultGoals[index % defaultGoals.length],
    title: goal.title,
    dueDate: formatDate(goal.targetDate),
    status: goal.status === 'ACTIVE' ? '진행 중' : goal.status,
    saved: toNumber(goal.currentAmount, 0),
    target: toNumber(goal.targetAmount, 0),
    rate: toNumber(goal.progressRate, 0),
    daysLeft: toNumber(goal.remainingDays, 0),
  }))
}

function mapActions(actions: MyWaveActionResponse[]): RuntimeAction[] {
  if (actions.length === 0) return defaultRecommendedActions
  return actions.map((action, index) => ({
    ...defaultRecommendedActions[index % defaultRecommendedActions.length],
    title: action.title,
    detail: action.description,
    saving: toNumber(action.monthlySavingAmount, 0),
  }))
}

function mapSpendingCategories(dashboard: MyWaveDashboardResponse): RuntimeCategory[] {
  const categories = dashboard.expenseSummary.categories
  if (categories.length === 0) return defaultSpendingCategories
  return categories.map((category, index) => {
    const fallback = findCategoryFallback(category.category, index)
    return {
      ...fallback,
      name: category.category,
      amount: toNumber(category.amount, 0),
      rate: toNumber(category.ratio, 0),
      change: toNumber(dashboard.expenseSummary.changeRate, fallback.change),
    }
  })
}

function mapSpendingBlockers(dashboard: MyWaveDashboardResponse): RuntimeBlocker[] {
  const blockers = dashboard.expenseSummary.goalBlockers
  if (blockers.length === 0) return defaultSpendingBlockers
  return blockers.map((blocker, index) => {
    const fallback = findBlockerFallback(blocker.category, index)
    return {
      ...fallback,
      name: blocker.category,
      amount: toNumber(blocker.amount, 0),
      impact: toNumber(blocker.goalImpactRate, fallback.impact),
    }
  })
}

function mapSpendingTrend(dashboard: MyWaveDashboardResponse) {
  const trends = dashboard.expenseSummary.trends
  if (trends.length === 0) return defaultSpendingTrend
  return trends.map((trend) => ({
    month: formatMonth(trend.month),
    amount: toNumber(trend.amount, 0),
    budget: toNumber(trend.budget, 0),
    goal: toNumber(trend.goalImpactAmount, 0),
  }))
}

function mapPortfolioAllocation(dashboard: MyWaveDashboardResponse): RuntimeAllocation[] {
  if (dashboard.portfolioAllocation.length === 0) return defaultPortfolioAllocation
  return dashboard.portfolioAllocation.map((item, index) => ({
    ...defaultPortfolioAllocation[index % defaultPortfolioAllocation.length],
    name: item.name,
    amount: toNumber(item.value, 0),
    rate: toNumber(item.rate, 0),
  }))
}

function mapCoachMessages(messages: MyWaveCoachMessageResponse[]): RuntimeCoachMessage[] {
  if (messages.length === 0) return defaultCoachMessages
  return messages.map((message) => ({
    from: message.role === 'USER' ? 'user' : 'bot',
    text: message.content,
  }))
}

function findCategoryFallback(name: string, index: number) {
  return defaultSpendingCategories.find((item) => name.includes(item.name) || item.name.includes(name)) ?? defaultSpendingCategories[index % defaultSpendingCategories.length]
}

function findBlockerFallback(name: string, index: number) {
  return defaultSpendingBlockers.find((item) => name.includes(item.name) || item.name.includes(name)) ?? defaultSpendingBlockers[index % defaultSpendingBlockers.length]
}

function toNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatMonth(value: string) {
  if (!value) return defaultFinanceSummary.month
  const [year, month] = value.split('-')
  return year && month ? `${year}.${month}` : value
}

function formatDate(value: string) {
  return value ? value.replaceAll('-', '.') : ''
}

function WindowBar() {
  return (
    <div className="hidden h-14 items-center gap-2 border-b border-slate-200 px-6 lg:flex">
      <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
      <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]" />
      <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
    </div>
  )
}

function Logo() {
  return (
    <div>
      <div className="text-[24px] font-black leading-none tracking-[-0.02em] text-blue-700 lg:text-3xl">MyWave</div>
      <div className="mt-1.5 text-xs font-medium text-slate-500 lg:mt-2 lg:text-sm">나만의 투자 흐름을 만든다.</div>
    </div>
  )
}

function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 px-7 py-8 lg:flex lg:flex-col">
      <Logo />
      <nav className="mt-16 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex h-14 items-center gap-4 rounded-2xl px-4 text-[15px] font-bold transition ${isActive ? activeClass : inactiveClass}`}
            >
              <Icon className="h-6 w-6" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-auto rounded-[20px] bg-white p-5 shadow-card">
        <div className="font-black text-blue-700">MyWave 시작하기</div>
        <p className="mt-3 text-sm leading-6 text-slate-500">3분 만에 나에게 맞는 투자 흐름을 설계해보세요.</p>
        <button onClick={() => navigate('/onboarding')} className="mt-4 rounded-full border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700">시작하기 <ChevronRight className="inline h-4 w-4" /></button>
        <img src={waveHero} alt="" className="ml-auto mt-2 h-20 w-32 object-contain" />
      </div>
      <div className="mt-10 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-4">
          <Avatar />
          <div className="min-w-0 flex-1">
            <div className="font-black">김마이 님</div>
            <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">프리미엄</span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </aside>
  )
}

function MobileTop() {
  return (
    <header className="flex items-start justify-between px-5 pb-1 pt-8 lg:hidden">
      <Logo />
      <div className="flex items-center gap-3 pt-1">
        <BellButton />
        <Avatar />
      </div>
    </header>
  )
}

function DesktopHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const meta = pageMeta(location.pathname)
  const submitSearch = () => {
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }
  return (
    <header className="mb-7 hidden items-start justify-between gap-6 lg:flex">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.02em]">{meta.title}</h1>
        <p className="mt-2 text-base font-medium text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-5">
        <label className="flex h-12 w-80 items-center gap-3 rounded-full bg-white px-5 text-slate-400">
          <Search className="h-5 w-5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            placeholder={meta.search}
          />
        </label>
        <BellButton />
        <Avatar />
      </div>
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid max-w-[1760px] grid-cols-5 border-t border-slate-200 bg-white px-3 pb-[calc(.55rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-tab flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
          >
            <Icon className="h-6 w-6" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function BellButton() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/notifications')} className="pressable relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 lg:h-10 lg:w-10">
      <Bell className="h-5 w-5 lg:h-6 lg:w-6" />
      <span className="notification-dot absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
    </button>
  )
}

function Avatar() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/profile')} className="pressable grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-50 lg:h-12 lg:w-12">
      <UserRound className="h-6 w-6 fill-blue-500 text-blue-500 lg:h-7 lg:w-7" />
    </button>
  )
}

function HomePage() {
  const { financeSummary } = useMyWaveData()

  return (
    <>
      <div className="lg:hidden">
        <MobileHomePage />
      </div>
      <div className="hidden space-y-5 lg:block lg:space-y-7">
        <HeroGoalCard />
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard icon={<WalletCards />} label="총자산" value={won(financeSummary.totalAsset)} detail="▲ 1.8% (전일 대비)" tone="blue" />
          <MetricCard icon={<CreditIcon />} label="남은 생활비" value={won(financeSummary.livingBudgetLeft)} detail="이번 달" tone="green" />
          <MetricCard icon={<RocketMini />} label="투자 가능 금액" value={won(financeSummary.investableAmount)} detail="바로 투자 가능" tone="violet" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1fr_.95fr]">
          <div className="space-y-5">
            <SpendingWarning />
            <RecentActivity />
          </div>
          <div className="space-y-5">
            <PortfolioMini />
            <MonthSummary />
          </div>
        </div>
      </div>
    </>
  )
}

function GoalsPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileGoalsPage />
      </div>
      <div className="hidden gap-6 lg:grid xl:grid-cols-[1fr_440px]">
        <div className="space-y-5">
          <MainGoalCard />
          <ActionPanel />
          <GoalsList />
          <GoalManagementPanel />
        </div>
        <div className="space-y-5">
          <GoalPrediction />
          <GoalSummary />
        </div>
      </div>
    </>
  )
}

function SpendingPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileSpendingPage />
      </div>
      <div className="hidden space-y-5 lg:block">
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

function PortfolioPage() {
  const { financeSummary } = useMyWaveData()

  return (
    <>
      <div className="lg:hidden">
        <MobilePortfolioPage />
      </div>
      <div className="hidden space-y-5 lg:block">
        <PortfolioHero />
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard icon={<BriefcaseIcon />} label="투자 원금" value={won(20_650_000)} tone="blue" />
          <MetricCard icon={<WalletCards />} label="총 평가금액" value={won(financeSummary.totalAsset)} tone="blue" />
          <MetricCard icon={<BarIcon />} label="총 수익" value={won(financeSummary.investmentProfit)} detail="▲ 20.3%" tone="green" />
          <MetricCard icon={<BarIcon />} label="총 수익률" value={`▲ ${financeSummary.investmentReturn}%`} tone="violet" />
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
            <CompanyPreview />
          </div>
        </div>
        <InvestmentTransactionManager />
      </div>
    </>
  )
}

function ReportsPage() {
  const { spendingTrend } = useMyWaveData()

  return (
    <div className="space-y-5">
      <MobileTitle title="리포트" />
      <Card>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="text-sm font-black text-blue-700">기업 재무제표 분석</div>
            <h2 className="mt-3 text-3xl font-black">삼성전자 재무 상태 요약</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              재무 안정성은 높은 편이지만 최근 수익성은 확인이 필요합니다. 메모리 업황 회복과 AI 수요 증가로 실적 개선이 기대되지만 경쟁 심화 리스크도 함께 봐야 합니다.
            </p>
          </div>
          <img src={waveHero} alt="" className="h-40 w-full object-contain" />
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-5">
        {['매출 증가', '영업이익 변동', '부채비율 안정', '현금흐름 양호', '배당 있음'].map((item, index) => (
          <Card key={item} className="min-h-32">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl ${index === 1 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {index === 1 ? <Info className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <div className="mt-4 text-lg font-black">{item}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card title="매출 추이">
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={spendingTrend}>
                <defs>
                  <linearGradient id="reportLine" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8eef7" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 10000}만`} />
                <Tooltip formatter={(value) => won(Number(value))} />
                <Area dataKey="amount" stroke="#2563eb" strokeWidth={3} fill="url(#reportLine)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="AI 요약">
          <p className="text-base leading-8 text-slate-600">
            이 기업은 현금흐름과 부채비율 측면에서 안정적입니다. 다만 영업이익률 변동성이 있어 다음 분기 실적 발표에서 메모리 가격, AI 서버 수요, 설비투자 계획을 함께 확인하는 것이 좋습니다.
          </p>
          <div className="mt-6 rounded-[20px] bg-blue-50 p-5 text-sm font-bold leading-7 text-blue-800">
            투자 판단이 아니라, 사용자가 기업 상태를 이해하기 위한 참고 요약입니다.
          </div>
        </Card>
      </div>
    </div>
  )
}

function CoachPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <div className="space-y-5">
        <MobileTitle title="AI코치" />
        <CoachBanner />
        <ChatPanel />
      </div>
      <div className="space-y-5">
        <FinanceState />
        <GoalOutlook />
        <RiskPanel />
      </div>
    </div>
  )
}

function MobileHomePage() {
  const { financeSummary } = useMyWaveData()

  return (
    <div className="mobile-page reveal-stack space-y-4">
      <MobileHeroCard />
      <div className="grid grid-cols-3 gap-3">
        <MobileMiniMetric icon={<WalletCards className="h-6 w-6" />} label="총자산" value={`${Math.round(financeSummary.totalAsset / 10000).toLocaleString()}만원`} detail="▲ 1.8%" />
        <MobileMiniMetric icon={<CreditIcon />} label="남은 생활비" value={`${Math.round(financeSummary.livingBudgetLeft / 10000)}만원`} detail="이번 달" tone="green" />
        <MobileMiniMetric icon={<BarIcon />} label="투자 가능" value={`${Math.round(financeSummary.investableAmount / 10000)}만원`} detail="바로 가능" tone="violet" />
      </div>
      <MobileNotice />
      <MobilePortfolioCard />
    </div>
  )
}

function MobileGoalsPage() {
  const navigate = useNavigate()

  return (
    <div className="mobile-page reveal-stack space-y-5">
      <div className="flex items-center justify-between">
        <MobileTitle title="목표 관리" />
        <button onClick={() => navigate('/goals/new')} className="pressable pb-2 text-sm font-black text-blue-700">+ 목표 추가</button>
      </div>
      <SegmentedTabs items={['전체', '진행 중', '완료']} active="전체" />
      <MobileGoalMainCard />
      <MobileActionCards />
      <MobileOtherGoals />
    </div>
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
      <MobileBlueSummary title="이번 달 총 소비" value={won(financeSummary.totalSpending)} detail={`지난 달 대비 ${Math.abs(financeSummary.goalImpact).toFixed(1)}% ▲`} />
      <ExpenseQuickEntry />
      <MobileSpendingCategories />
      <MobileTopSpending />
      <MobileSavingBox />
    </div>
  )
}

function MobilePortfolioPage() {
  const { financeSummary } = useMyWaveData()

  return (
    <div className="mobile-page reveal-stack space-y-4">
      <MobileTitle title="투자 포트폴리오" />
      <MobileBlueSummary title="총 투자금액" value={won(financeSummary.totalAsset)} detail={`평가손익 ${won(financeSummary.investmentProfit)} · 수익률 +${financeSummary.investmentReturn}%`} />
      <MobilePortfolioCard compact />
      <MobileHoldingsList />
      <MobileInsightBox />
    </div>
  )
}

function MobileHeroCard() {
  const { financeSummary } = useMyWaveData()

  return (
    <section className="motion-card pressable rounded-[20px] bg-blue-50 p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-black text-blue-700">
        <TargetDot /> 이번 달 투자 목표
      </div>
      <div className="mt-4 grid grid-cols-[1fr_120px] items-center gap-2">
        <div>
          <div className="text-4xl font-black tracking-[-0.04em]">{financeSummary.goalRate}% <span className="text-2xl font-black">달성</span></div>
          <Progress value={financeSummary.goalRate} className="mt-5 h-2.5" />
          <div className="mt-6 grid grid-cols-2 divide-x divide-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-500">현재 저축 금액</div>
              <div className="mt-1 text-xl font-black text-blue-700">{Math.round(financeSummary.savedAmount / 10000).toLocaleString()}만원</div>
            </div>
            <div className="pl-5">
              <div className="text-xs font-bold text-slate-500">남은 금액</div>
              <div className="mt-1 text-xl font-black">{Math.round(financeSummary.remainingAmount / 10000).toLocaleString()}만원</div>
            </div>
          </div>
        </div>
        <img src={waveHero} alt="" className="animate-wave h-28 w-32 object-contain opacity-90 mix-blend-multiply" />
      </div>
    </section>
  )
}

function MobileGoalMainCard() {
  const { financeSummary, goals } = useMyWaveData()
  const navigate = useNavigate()
  const mainGoal = goals[0]

  return (
    <MobileCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-400">메인 목표</div>
          <h2 className="mt-1.5 text-[22px] font-bold tracking-[-0.02em] text-slate-900">{mainGoal.title}</h2>
        </div>
        <button onClick={() => navigate('/goals/new')} aria-label="목표 수정" className="pressable -mr-1 grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-slate-50">
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-[132px_1fr] items-center gap-4">
        <MobileRing value={financeSummary.goalRate} />
        <div className="min-w-0">
          <MobileGoalLine label="현재 금액" value={won(financeSummary.savedAmount)} icon={<WalletCards className="h-4 w-4" />} />
          <MobileGoalLine label="남은 금액" value={won(financeSummary.remainingAmount)} icon={<FlagIcon />} />
          <MobileGoalLine label="남은 기간" value={`${financeSummary.daysLeft}일`} icon={<CalendarDays className="h-4 w-4" />} />
          <MobileGoalLine label="1일 목표 금액" value={won(financeSummary.dailyTarget)} icon={<TargetDot />} />
        </div>
      </div>
      <div className="mt-4">
        <BelugaSays mood={financeSummary.goalRate >= 50 ? 'cheer' : 'concern'} size="sm">
          {financeSummary.goalRate >= 50
            ? '이 흐름이면 이번 달 목표까지 갈 수 있어요.'
            : '지금 페이스로는 조금 빠듯해요. 어디를 조정할 수 있을지 같이 볼까요?'}
        </BelugaSays>
      </div>
    </MobileCard>
  )
}

function MobileActionCards() {
  const { recommendedActions } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">목표 달성을 위한 추천</h2>
        <button onClick={() => navigate('/spending/simulation')} className="pressable text-[13px] font-semibold text-slate-400">더보기 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {recommendedActions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.title} onClick={() => navigate('/spending/simulation')} className="motion-card pressable rounded-[20px] bg-white p-4 text-left">
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-slate-100 text-slate-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 whitespace-nowrap text-[14px] font-bold leading-5 text-slate-900">
                {action.title === '카페 지출 줄이기' ? '카페 줄이기' : action.title === '대중교통 이용하기' ? '교통 이용' : '구독 정리'}
              </div>
              <div className="mt-1 text-[12px] font-medium text-slate-400">월 {won(action.saving)} 절약</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MobileOtherGoals() {
  const { goals } = useMyWaveData()

  return (
    <section>
      <h2 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-slate-900">다른 목표</h2>
      <div className="space-y-3">
        {goals.slice(1, 3).map((goal) => {
          const Icon = goal.icon
          return (
            <MobileCard key={goal.title} className="p-4">
              <div className="grid grid-cols-[56px_1fr_34px] items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[15px] font-bold text-slate-900">{goal.title}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">진행 중</span>
                  </div>
                  <Progress value={goal.rate} className="mt-2.5 h-1.5" />
                  <div className="mt-2 text-[12px] font-medium text-slate-400">목표 {Math.round(goal.target / 10000)}만원 · 현재 {Math.round(goal.saved / 10000)}만원</div>
                </div>
                <div className="tnum text-right text-[15px] font-bold text-slate-900">{goal.rate}%</div>
              </div>
            </MobileCard>
          )
        })}
      </div>
    </section>
  )
}

function MobileBlueSummary({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className="motion-card pressable relative overflow-hidden rounded-[20px] bg-blue-700 p-5 text-white shadow-blue">
      <div className="relative z-10">
        <div className="text-sm font-black text-white/90">{title} <Info className="inline h-4 w-4" /></div>
        <div className="mt-4 text-4xl font-black tracking-[-0.04em]">{value}</div>
        <div className="mt-4 text-sm font-black text-white/85">{detail}</div>
      </div>
      <div className="absolute -bottom-8 -right-8 h-32 w-44 rounded-full bg-white/15 blur-xl" />
    </section>
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
                <div className="text-xs font-bold text-slate-400">월 {index === 0 ? '18회' : index === 1 ? '6회' : '16회'}</div>
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
  const [amount, setAmount] = useState(100000)
  const expectedRate = Math.min(100, financeSummary.goalRate + Math.round(amount / 5500))

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
        이 금액을 저축하면 목표 달성률이 {financeSummary.goalRate}% → <span className="text-2xl">{expectedRate}%</span>로 올라요.
      </div>
      <button onClick={() => navigate('/spending/simulation')} className="mt-4 w-full rounded-2xl bg-blue-700 py-3 text-sm font-black text-white">자세히 조정하기</button>
    </MobileCard>
  )
}

function MobilePortfolioCard({ compact = false }: { compact?: boolean }) {
  const { financeSummary, portfolioAllocation } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <MobileCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">포트폴리오 {compact ? '구성' : '현황'}</h2>
        <button onClick={() => navigate('/portfolio/allocation')} className="pressable text-[13px] font-semibold text-slate-400">자산 배분 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-3">
        <MobileCssDonut
          center={compact ? `총 ${portfolioAllocation.length}개` : won(financeSummary.totalAsset)}
          label={compact ? '자산' : '총자산'}
          items={portfolioAllocation}
        />
        <Legend items={portfolioAllocation} />
      </div>
      {!compact && (
        <div className="mt-4">
          <BelugaSays mood="cheer" size="sm">지난달보다 자산이 1,250,000원 늘었어요.</BelugaSays>
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
            valueDetail={`+${won(item.profit)}`}
            valueDetailTone="gain"
          />
        ))}
      </MobileCard>
    </section>
  )
}

function MobileInsightBox() {
  return (
    <MobileCard>
      <BelugaSays mood="calm" size="sm">
        IT 섹터 비중이 높은 편이에요. 한쪽에 몰려 있지 않은지 확인해볼 만해요.
      </BelugaSays>
    </MobileCard>
  )
}

function HeroGoalCard() {
  const { financeSummary } = useMyWaveData()

  return (
    <BlueCard className="min-h-[240px] lg:min-h-[300px]">
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-black">이번 달 목표 달성률 <Pill>{financeSummary.month}</Pill></div>
          <div className="mt-6 text-7xl font-black leading-none tracking-[-0.04em] text-white lg:text-8xl">{financeSummary.goalRate}%</div>
          <Progress value={financeSummary.goalRate} className="mt-6 max-w-xl bg-white/25" barClassName="bg-[#65dbc2]" />
        </div>
        <div className="grid max-w-2xl grid-cols-2 gap-5 pt-6 lg:grid-cols-4">
          <BlueMetric label="현재 저축 금액" value={won(financeSummary.savedAmount)} />
          <BlueMetric label="남은 금액" value={won(financeSummary.remainingAmount)} />
          <BlueMetric label="남은 기간" value={`${financeSummary.daysLeft}일`} />
          <BlueMetric label="하루 목표 금액" value={won(financeSummary.dailyTarget)} />
        </div>
      </div>
      <img src={waveHero} alt="" className="absolute bottom-0 right-2 h-40 w-56 object-contain opacity-90 mix-blend-multiply sm:h-48 sm:w-72 lg:right-8 lg:h-64 lg:w-[420px]" />
      <ChevronRight className="absolute right-6 top-8 h-6 w-6 text-white/80" />
    </BlueCard>
  )
}

function MainGoalCard() {
  const { financeSummary, goals } = useMyWaveData()
  const mainGoal = goals[0]

  return (
    <BlueCard className="min-h-[300px]">
      <div className="relative z-10">
        <span className="rounded-xl bg-[#67d8aa] px-3 py-1.5 text-sm font-black text-blue-950">진행 중</span>
        <div className="mt-5 flex items-center gap-3 text-3xl font-black lg:text-4xl">
          {mainGoal.title} <Edit3 className="h-6 w-6" />
        </div>
        <div className="mt-7 text-7xl font-black leading-none">{financeSummary.goalRate}%</div>
        <Progress value={financeSummary.goalRate} className="mt-5 bg-white/25" barClassName="bg-[#62d8bd]" />
        <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <BlueMetric label="현재 모은 금액" value={won(financeSummary.savedAmount)} />
          <BlueMetric label="남은 금액" value={won(financeSummary.remainingAmount)} />
          <BlueMetric label="남은 기간" value={`${financeSummary.daysLeft}일`} />
          <BlueMetric label="하루 목표 금액" value={won(financeSummary.dailyTarget)} />
        </div>
      </div>
      <img src={waveHero} alt="" className="absolute bottom-0 right-0 hidden h-44 w-64 object-contain opacity-90 mix-blend-multiply md:block lg:h-72 lg:w-[420px]" />
    </BlueCard>
  )
}

function BlueCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#194fe5_0%,#1d67f2_48%,#51b9ff_100%)] p-7 text-white shadow-blue ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.24),transparent_28%),linear-gradient(90deg,rgba(0,0,0,.10),transparent_55%)]" />
      {children}
    </section>
  )
}

function BlueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-white/20 lg:border-l lg:pl-8 first:lg:border-l-0 first:lg:pl-0">
      <div className="text-sm font-bold text-white/80">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  )
}

function MetricCard({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail?: string; tone: 'blue' | 'green' | 'violet' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <Card className="min-h-36">
      <div className="flex h-full items-center gap-6">
        <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${colors[tone]}`}>{icon}</div>
        <div>
          <div className="flex items-center gap-1.5 text-base font-black text-slate-900">{label}<CircleHelp className="h-4 w-4 text-slate-400" /></div>
          <div className="mt-3 text-3xl font-black tracking-[-0.03em]">{value}</div>
          {detail && <div className={`mt-2 text-sm font-bold ${tone === 'blue' ? 'text-blue-700' : 'text-slate-500'}`}>{detail}</div>}
        </div>
      </div>
    </Card>
  )
}

function SpendingWarning() {
  const navigate = useNavigate()

  return (
    <Card className="border-orange-100 bg-orange-50/45">
      <div className="flex items-center gap-6">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[28px] bg-orange-100 text-orange-600">
          <ShieldAlert className="h-11 w-11 fill-orange-500/10" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-black text-orange-600">소비 위험도: 주의</div>
          <p className="mt-2 text-base leading-7 text-slate-500">외식/배달 소비 금액이 평소보다 많아요. 예산을 조금만 조정해보세요!</p>
        </div>
        <button onClick={() => navigate('/spending/detail')} className="hidden rounded-full border border-orange-200 px-5 py-2.5 text-sm font-black text-slate-800 lg:block">자세히 보기 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
    </Card>
  )
}

function RecentActivity() {
  const { activities } = useMyWaveData()

  return (
    <Card title="최근 활동" action="모두 보기" actionTo="/spending/detail">
      <div className="space-y-4">
        {activities.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: item.color }}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black">{item.title}</div>
                <div className="mt-1 truncate text-sm font-medium text-slate-500">{item.detail}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400">{item.when}</div>
                <div className={`mt-1 font-black ${item.amount > 0 ? 'text-blue-700' : 'text-slate-900'}`}>{item.amount > 0 ? '+' : '-'}{won(Math.abs(item.amount))}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PortfolioMini() {
  const { financeSummary, portfolioAllocation } = useMyWaveData()

  return (
    <Card title="포트폴리오 현황" action="자세히 보기" actionTo="/portfolio/allocation">
      <div className="grid items-center gap-5 sm:grid-cols-[220px_1fr]">
        <Donut data={portfolioAllocation} center={`${won(financeSummary.totalAsset)}`} />
        <Legend items={portfolioAllocation} />
      </div>
    </Card>
  )
}

function MonthSummary() {
  const { financeSummary } = useMyWaveData()

  return (
    <Card className="bg-blue-50/70">
      <h3 className="text-lg font-black text-blue-800">이번 달 한눈에 보기</h3>
      <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <MiniStat label="수입" value={won(4_200_000)} change="▲ 12.5%" />
        <MiniStat label="지출" value={won(financeSummary.totalSpending)} change="▼ 4.3%" />
        <MiniStat label="저축" value={won(financeSummary.savedAmount)} change="▲ 8.1%" />
        <MiniStat label="투자 수익" value={won(financeSummary.investmentProfit)} change="▲ 5.7%" />
      </div>
    </Card>
  )
}

function ActionPanel() {
  const { recommendedActions } = useMyWaveData()

  return (
    <Card title={<span>목표 달성을 위한 추천 행동 <Info className="inline h-4 w-4 text-slate-400" /></span>}>
      <div className="grid gap-4 lg:grid-cols-3">
        {recommendedActions.map((action) => {
          const Icon = action.icon
          return (
            <div key={action.title} className={`flex items-center gap-4 rounded-2xl border p-4 ${action.tone === 'orange' ? 'border-orange-100 bg-orange-50' : action.tone === 'green' ? 'border-emerald-100 bg-emerald-50/50' : 'border-violet-100 bg-violet-50/50'}`}>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${action.tone === 'orange' ? 'bg-orange-100 text-orange-600' : action.tone === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black">{action.title}</div>
                <div className="mt-1 text-sm font-medium text-slate-500">{action.detail}</div>
                <div className="mt-1 font-black text-blue-700">+{won(action.saving)} 절약</div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function GoalsList() {
  const { goals } = useMyWaveData()

  return (
    <Card title="나의 다른 목표">
      <div className="divide-y divide-slate-100">
        {goals.slice(1).map((goal) => {
          const Icon = goal.icon
          return (
            <div key={goal.title} className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[1fr_280px_80px] lg:items-center">
              <div className="flex min-w-0 items-center gap-5">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `${goal.accent}18`, color: goal.accent }}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-black">{goal.title}</div>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{goal.status}</span>
                  </div>
                  <Progress value={goal.rate} className="mt-4" barClassName="bg-[#58cfb2]" />
                </div>
              </div>
              <div className="text-right text-sm font-bold text-slate-500">
                <div>{won(goal.saved)} / {won(goal.target)}</div>
                <div className="mt-1">D-{goal.daysLeft}일</div>
              </div>
              <div className="text-right text-lg font-black text-slate-500">{goal.rate}%</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function GoalManagementPanel() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<MyWaveGoalResponse[]>([])
  const [message, setMessage] = useState('')

  async function loadGoals() {
    try {
      const result = await getMyWaveGoals()
      setGoals(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    void loadGoals()
  }, [])

  async function changeGoalStatus(goal: MyWaveGoalResponse, status: string) {
    try {
      await updateMyWaveGoal(goal.id, {
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
        currentAmount: status === 'COMPLETED' ? Number(goal.targetAmount) : Number(goal.currentAmount),
        targetDate: goal.targetDate,
        status,
        priority: goal.priority,
      })
      setMessage(status === 'COMPLETED' ? '목표를 완료 처리했습니다.' : '목표 상태가 변경되었습니다.')
      await loadGoals()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 상태 변경에 실패했습니다.')
    }
  }

  async function removeGoal(id: number) {
    try {
      await deleteMyWaveGoal(id)
      setMessage('목표가 삭제되었습니다.')
      await loadGoals()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 삭제에 실패했습니다.')
    }
  }

  return (
    <Card
      title="목표 관리"
      action={<button onClick={() => navigate('/goals/new')} className="pressable rounded-full bg-blue-700 px-4 py-2 text-sm font-black text-white">+ 목표 추가</button>}
    >
      {message && <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</div>}
      <div className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black">{goal.title}</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{goal.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">{won(Number(goal.currentAmount))} / {won(Number(goal.targetAmount))} · D-{goal.remainingDays}일</div>
              </div>
              <div className="text-right text-lg font-black text-blue-700">{Math.round(Number(goal.progressRate))}%</div>
            </div>
            <Progress value={Number(goal.progressRate)} className="mt-4" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => navigate(`/goals/new?id=${goal.id}`)} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600">수정</button>
              <button onClick={() => changeGoalStatus(goal, 'ACTIVE')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-blue-700">진행</button>
              <button onClick={() => changeGoalStatus(goal, 'PAUSED')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600">일시정지</button>
              <button onClick={() => changeGoalStatus(goal, 'COMPLETED')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-emerald-700">완료</button>
              <button onClick={() => removeGoal(goal.id)} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-red-500">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function GoalPrediction() {
  const { spendingTrend } = useMyWaveData()

  return (
    <Card title={<span>목표 달성 예상 <CircleHelp className="inline h-4 w-4 text-slate-400" /></span>}>
      <div className="rounded-2xl bg-emerald-50/40 p-4 text-sm font-black text-emerald-700">
        <CheckCircle2 className="mr-2 inline h-5 w-5" /> 예상대로 진행 중이에요!
      </div>
      <div className="mt-5 grid grid-cols-2 divide-x divide-slate-100 text-center">
        <MiniStat label="예상 완료일" value="2024. 06. 01" />
        <MiniStat label="목표 달성 확률" value="87%" />
      </div>
      <div className="mt-5 h-56">
        <ResponsiveContainer>
          <AreaChart data={spendingTrend}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 10000}만`} />
            <Tooltip formatter={(value) => won(Number(value))} />
            <Line dataKey="budget" stroke="#9aa8bd" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            <Area dataKey="goal" stroke="#2563eb" strokeWidth={3} fill="#2563eb22" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500">지금과 같은 페이스를 유지하면 목표 달성이 가능해요!</p>
    </Card>
  )
}

function GoalSummary() {
  const { financeSummary, goals } = useMyWaveData()

  return (
    <Card title="목표 요약">
      <div className="space-y-4">
        <SummaryLine label="진행 중인 목표" value={`${goals.length}개`} />
        <SummaryLine label="연간 목표 달성률" value={`${financeSummary.goalRate}%`} />
        <SummaryLine label="이번 달 목표 저축액" value={won(880_000)} muted />
        <SummaryLine label="이번 달 저축 달성률" value="71%" />
        <Progress value={71} className="mt-3" />
      </div>
    </Card>
  )
}

function SpendingHero() {
  const { financeSummary } = useMyWaveData()

  return (
    <BlueCard className="min-h-[245px]">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-lg font-black">총 소비 금액 <Pill>{financeSummary.month}</Pill></div>
        <div className="mt-6 text-5xl font-black lg:text-6xl">{won(financeSummary.totalSpending)}</div>
        <div className="mt-5 text-lg font-black">전월 대비 ▲ 8.6% (+₩196,400)</div>
        <div className="mt-12 grid grid-cols-3 gap-6">
          <BlueMetric label="일평균 소비" value={won(financeSummary.dailySpending)} />
          <BlueMetric label="예산 대비" value={`${financeSummary.budgetRate}%`} />
          <BlueMetric label="목표 달성률 영향" value={`▼ ${financeSummary.goalImpact}%p`} />
        </div>
      </div>
      <img src={waveHero} alt="" className="absolute right-4 top-5 h-36 w-56 object-contain opacity-90 mix-blend-multiply lg:h-52 lg:w-80" />
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
            <Line dataKey="budget" stroke="#aeb9c9" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            <Area dataKey="goal" stroke="#4fcfb0" strokeWidth={3} fill="#4fcfb022" />
            <Line dataKey="amount" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
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
      <div className="mt-5 text-sm font-medium text-slate-400">기준일: 2024.05.20</div>
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
              <div className="text-sm font-black text-orange-600">목표 달성률 {item.impact}%p</div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-2xl border border-orange-200 bg-white/70 p-4 text-sm font-bold text-slate-600">
        위 3개 항목을 줄이면 목표 달성률이 최대 <span className="text-orange-600">+4.8%p</span> 개선될 수 있어요!
      </div>
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
              <th>전월 대비</th>
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
                  <td>▲ {item.change}%</td>
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

function SavingSimulation() {
  const { financeSummary } = useMyWaveData()
  const [delivery, setDelivery] = useState(30)
  const [cafe, setCafe] = useState(30)
  const [shopping, setShopping] = useState(20)
  const [applied, setApplied] = useState(false)
  const [savingResult, setSavingResult] = useState<{ amount: number; rate: number } | null>(null)
  const savingAmount = delivery * 1800 + cafe * 2100 + shopping * 2900
  const improvedRate = Math.min(100, financeSummary.goalRate + Math.round(savingAmount / 36500))
  const displaySavingAmount = savingResult?.amount ?? savingAmount
  const displayImprovedRate = savingResult?.rate ?? improvedRate
  const simulations: Array<{ name: string; rate: number; setRate: (value: number) => void; unit: number }> = [
    { name: '배달', rate: delivery, setRate: setDelivery, unit: 1800 },
    { name: '카페/간식', rate: cafe, setRate: setCafe, unit: 2100 },
    { name: '쇼핑', rate: shopping, setRate: setShopping, unit: 2900 },
  ]

  async function applySimulation() {
    setApplied(true)
    try {
      const result = await simulateMyWaveSaving({
        categoryReductionRates: {
          배달비: delivery,
          카페: cafe,
          쇼핑: shopping,
        },
      })
      setSavingResult({
        amount: Number(result.monthlySavingAmount),
        rate: Number(result.expectedGoalRate),
      })
    } catch {
      setSavingResult({ amount: savingAmount, rate: improvedRate })
    }
  }

  return (
    <Card title="소비 줄이면 목표 달성률이 이렇게 달라져요!" action={<span className="text-xs text-slate-400">시뮬레이션 기준: 월간</span>}>
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
          <div className="mt-5 text-sm font-bold text-slate-500">목표 달성률 개선</div>
          <div className="mt-2 text-3xl font-black text-emerald-500">{financeSummary.goalRate}% → {displayImprovedRate}%</div>
          <button onClick={applySimulation} className="mt-5 w-full rounded-2xl bg-blue-700 py-3 font-black text-white">{applied ? '적용 완료' : '이대로 적용해보기'}</button>
        </div>
      </div>
    </Card>
  )
}

function PortfolioHero() {
  const { financeSummary } = useMyWaveData()

  return (
    <BlueCard className="min-h-[220px]">
      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="text-lg font-black">전체 투자 자산</div>
          <div className="mt-4 text-5xl font-black lg:text-6xl">{won(financeSummary.totalAsset)}</div>
          <div className="mt-6 text-lg font-black text-emerald-200">전일 대비 ▲ ₩425,000 (1.74%)</div>
        </div>
        <div className="grid grid-cols-3 gap-5 self-center">
          <BlueMetric label="총 투자 수익" value={won(financeSummary.investmentProfit)} />
          <BlueMetric label="총 수익률" value={`▲ ${financeSummary.investmentReturn}%`} />
          <BlueMetric label="연환산 수익률" value={`▲ ${financeSummary.yearlyReturn}%`} />
        </div>
      </div>
      <img src={waveHero} alt="" className="absolute bottom-0 right-3 hidden h-44 w-72 object-contain opacity-90 mix-blend-multiply lg:block" />
    </BlueCard>
  )
}

function PortfolioAllocationCard() {
  const { financeSummary, portfolioAllocation } = useMyWaveData()

  return (
    <Card title="포트폴리오 자산 배분">
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <Donut data={portfolioAllocation} center={won(financeSummary.totalAsset)} />
        <Legend items={portfolioAllocation} />
      </div>
      <div className="mt-4 text-sm font-medium text-slate-400">기준일: 2024.05.20</div>
    </Card>
  )
}

function TopHoldingsCard() {
  const { holdings } = useMyWaveData()

  return (
    <Card title="보유 종목 상위 성과" action="더보기" actionTo="/portfolio/detail">
      <div className="space-y-5">
        {holdings.slice(0, 3).map((item, index) => (
          <div key={item.symbol} className="grid grid-cols-[28px_1fr_auto] items-center gap-4">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-sm font-black text-orange-600">{index + 1}</span>
            <div>
              <div className="font-black">{item.symbol}</div>
              <div className="text-sm font-medium text-slate-500">{item.name}</div>
            </div>
            <div className="text-right">
              <div className="font-black">{won(item.value)}</div>
              <div className="text-sm font-black text-emerald-600">▲ {item.returnRate}%</div>
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
            {holdings.map((item) => (
              <tr key={item.symbol}>
                <td><b>{item.symbol}</b> <span className="ml-2 text-slate-400">{item.name}</span></td>
                <td>{item.quantity}</td>
                <td>{item.avgPrice}</td>
                <td>{won(item.value)}</td>
                <td className="text-emerald-600">▲ {item.returnRate}%</td>
                <td className="text-blue-700">+{won(item.profit)}</td>
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
    symbol: '005930',
    stockName: '삼성전자',
    transactionType: 'BUY',
    quantity: 1,
    price: 79600,
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
    void refreshPortfolioRecords()
  }, [refreshPortfolioRecords])

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
  return (
    <Card className="bg-blue-50/70" title="포트폴리오 인사이트" action={<InlineAction to="/coach" label="AI 코치" primary />}>
      <p className="text-base leading-8 text-slate-600">현재 포트폴리오는 성장주 비중이 높아 변동성이 클 수 있어요. 안정적인 수익을 위해 채권 비중을 10~15%까지 늘리는 것을 추천드려요.</p>
    </Card>
  )
}

function CompanyPreview() {
  return (
    <Card title="관련 기업 분석 미리보기" action="자세히 보기" actionTo="/company/AAPL">
      <div className="grid grid-cols-[1fr_140px] items-center gap-4">
        <div>
          <div className="text-lg font-black">AAPL <span className="text-sm text-slate-500">애플</span></div>
          <div className="mt-1 text-sm font-medium text-slate-500">미국 · 기술 · 시가총액 2.8조 USD</div>
        </div>
        <TinySparkline />
      </div>
      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 text-center">
        <MiniStat label="투자 의견" value="매수" />
        <MiniStat label="목표가 (12M)" value="$210.00" />
        <MiniStat label="상승 여력" value="+22.4%" />
      </div>
    </Card>
  )
}

/**
 * 코치 화면의 첫 인상.
 *
 * 벨루가가 상황을 한 줄로 말하고, 숫자는 그 아래에서 숫자대로 선다.
 * 둘을 한 문장에 섞지 않는 것이 이 화면의 규칙이다.
 */
function CoachBanner() {
  const { financeSummary } = useMyWaveData()
  const behind = financeSummary.goalRate < 50

  return (
    <Card>
      <div className="space-y-6">
        <BelugaSays mood={behind ? 'concern' : 'calm'} size="lg">
          {behind
            ? '이번 달은 목표 페이스가 조금 느려요. 어디를 조정할 수 있을지 같이 볼까요?'
            : '이번 달 흐름을 정리해뒀어요. 아래 숫자부터 같이 볼까요?'}
        </BelugaSays>

        <div className="grid gap-3 sm:grid-cols-3">
          <CoachStat label="목표 달성률" value={financeSummary.goalRate} suffix="%" highlight />
          <CoachStat label="남은 목표 금액" value={financeSummary.remainingAmount} currency />
          <CoachStat label="바로 투자 가능" value={financeSummary.investableAmount} currency />
        </div>
      </div>
    </Card>
  )
}

/** 라벨은 작게, 숫자는 크게. 값이 바뀌면 새로 세어 올린다. */
function CoachStat({ label, value, suffix, currency, highlight }: { label: string; value: number; suffix?: string; currency?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-[14px] px-4 py-4 ${highlight ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className={`text-[12px] font-semibold ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.02em]">
        <Amount value={value} currency={currency} suffix={suffix} />
      </div>
    </div>
  )
}

function ChatPanel() {
  const { coachMessages } = useMyWaveData()
  const [messages, setMessages] = useState<RuntimeCoachMessage[]>(coachMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setMessages(coachMessages)
  }, [coachMessages])

  const sendMessage = async (text = draft) => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setMessages((items) => [...items, { from: 'user', text: message }])
    try {
      const response = await chatWithMyWaveCoach(message)
      setMessages((items) => [...items, { from: 'bot', text: response.answer.content }])
    } catch {
      setMessages((items) => [...items, { from: 'bot', text: '지금은 서버 연결이 불안정해서 데모 기준으로 답변할게요. 목표와 소비를 같이 보면 이번 달은 지출 조정 후 투자 여력을 확인하는 흐름이 좋아요.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-5">
      {messages.map((message, index) => (
        <div key={`${message.from}-${index}`} className={`chat-row flex ${message.from === 'user' ? 'justify-end' : 'justify-start'} gap-4`} style={{ animationDelay: `${index * 120}ms` }}>
          {message.from === 'bot' && <Beluga mood="calm" size="sm" float={false} className="mt-1" />}
          <div className={`max-w-[720px] px-5 py-3.5 text-[15px] font-medium leading-7 ${message.from === 'user' ? 'rounded-[18px] rounded-br-[6px] bg-blue-700 text-white' : 'rounded-[18px] rounded-bl-[6px] bg-wave-foam text-blue-950'}`}>
            {message.text}
            {message.stats && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-blue-50 p-4 sm:grid-cols-3">
                {message.stats.map((stat) => <MiniStat key={stat.label} label={stat.label} value={stat.value} />)}
              </div>
            )}
            {message.suggestions && (
              <div className="mt-4 rounded-2xl p-4 text-sm leading-7">
                <div className="font-black">이렇게 해보는 건 어때요?</div>
                {message.suggestions.map((item) => <div key={item} className="mt-1 text-slate-600">· {item}</div>)}
              </div>
            )}
          </div>
        </div>
      ))}
      {sending && (
        <div className="flex items-center gap-3">
          <Beluga mood="calm" size="sm" />
          <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-lg bg-wave-foam px-5 py-4">
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
          </div>
        </div>
      )}
      <div className="pt-2">
        <div className="mb-3 flex flex-wrap gap-2">
          {['이번 달 소비 어땠어?', '지금 투자해도 괜찮을까?', '목표까지 얼마나 남았어?', '어디를 줄이면 좋을까?'].map((item) => (
            <button key={item} onClick={() => sendMessage(item)} className="pressable rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50">{item}</button>
          ))}
        </div>
        <label className="flex h-16 items-center gap-4 rounded-[18px] bg-white px-5">
          <Plus className="h-6 w-6 text-slate-300" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
            placeholder="벨루가에게 물어보세요"
          />
          <button type="button" onClick={() => sendMessage()} className="pressable grid h-11 w-11 place-items-center rounded-full bg-blue-700 text-white disabled:bg-slate-200" disabled={sending}>
            <SendHorizontal className="h-5 w-5" />
          </button>
        </label>
      </div>
    </section>
  )
}

function FinanceState() {
  const { financeSummary } = useMyWaveData()

  return (
    <Card title="이번 달 재무 상태" action="자세히 보기" actionTo="/assets">
      <div className="space-y-5">
        <SummaryLine label="총 자산" value={won(financeSummary.totalAsset)} />
        <SummaryLine label="총 지출" value={won(2_420_000)} />
        <SummaryLine label="저축률" value={`${financeSummary.savingRate}%`} />
      </div>
    </Card>
  )
}

function GoalOutlook() {
  const { financeSummary } = useMyWaveData()

  return (
    <Card title="목표 달성 전망" action="자세히 보기" actionTo="/goals">
      <div className="grid grid-cols-[120px_1fr] items-center gap-5">
        <RingProgress value={financeSummary.goalRate} />
        <div>
          <div className="text-sm font-bold text-slate-500">이번 달 목표 달성 가능성</div>
          <div className="mt-2 text-4xl font-black text-emerald-500">88%</div>
          <div className="mt-2 text-sm font-bold text-slate-500">추가 투자 시 95%+ 달성 가능</div>
          <div className="mt-4 rounded-2xl bg-blue-50 p-3 font-black text-blue-700">필요 투자 금액<br />₩320,000</div>
        </div>
      </div>
    </Card>
  )
}

function RiskPanel() {
  return (
    <Card title="포트폴리오 리스크" action="자세히 보기" actionTo="/portfolio/risk">
      <div className="mx-auto h-28 w-40 rounded-t-full border-[18px] border-b-0 border-emerald-400 border-r-red-400 border-t-amber-400 text-center">
        <div className="mt-10 text-lg font-black">보통</div>
      </div>
      <div className="mt-5 space-y-2 text-sm font-bold">
        <SummaryLine label="시장 리스크" value="보통" />
        <SummaryLine label="변동성 리스크" value="보통" />
        <SummaryLine label="집중 리스크" value="높음" />
        <SummaryLine label="유동성 리스크" value="낮음" />
      </div>
      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">AI 코치 TIP: 미국 기술주 비중이 높아요. ETF로 분산 투자하면 리스크를 줄일 수 있어요.</div>
    </Card>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState('전체')
  const [items, setItems] = useState<MyWaveNotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let ignore = false
    getMyWaveNotifications(selectedFilter).then((summary) => {
      if (ignore) return
      setItems(summary.notifications)
      setUnreadCount(summary.unreadCount)
    }).catch(() => {
      if (ignore) return
      setItems(defaultNotificationItems)
      setUnreadCount(defaultNotificationItems.length)
    })
    return () => {
      ignore = true
    }
  }, [selectedFilter])

  async function openNotification(item: MyWaveNotificationResponse) {
    setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice))
    setUnreadCount((current) => Math.max(0, current - (item.read ? 0 : 1)))
    try {
      await markMyWaveNotificationRead(item.id)
    } catch {
      // 화면 이동은 유지합니다.
    }
    navigate(item.targetPath)
  }

  async function removeNotification(id: number) {
    setItems((current) => current.filter((notice) => notice.id !== id))
    try {
      await deleteMyWaveNotification(id)
    } catch {
      // 백엔드가 꺼져 있어도 UI 삭제 흐름은 유지합니다.
    }
  }

  async function clearReadNotifications() {
    setItems((current) => current.filter((notice) => !notice.read))
    try {
      await deleteReadMyWaveNotifications()
    } catch {
      // 백엔드가 꺼져 있어도 UI 정리 흐름은 유지합니다.
    }
  }

  async function markAllRead() {
    setItems((current) => current.map((notice) => ({ ...notice, read: true })))
    setUnreadCount(0)
    try {
      await markAllMyWaveNotificationsRead()
    } catch {
      // 백엔드가 꺼져 있어도 UI 읽음 흐름은 유지합니다.
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <MobileTitle title="알림" />
        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={markAllRead} className="pressable rounded-full px-4 py-2 text-sm font-black text-blue-700">전체 읽음 {unreadCount > 0 ? unreadCount : ''}</button>
          <button onClick={clearReadNotifications} className="pressable flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-slate-600">
          <Trash2 className="h-4 w-4" /> 읽은 알림 정리
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', '목표', '소비', '투자', 'AI 코치', '이벤트'].map((filter, index) => (
          <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-5 py-3 text-sm font-black ${selectedFilter === filter ? 'bg-blue-700 text-white shadow-blue' : 'bg-slate-100 text-slate-500'}`}>
            {index === 0 && <SlidersHorizontal className="mr-1 inline h-4 w-4" />}
            {filter}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-blue-700" />
              <div className="mt-4 text-xl font-black">새 알림이 없습니다</div>
              <p className="mt-2 text-sm font-bold text-slate-500">새로운 흐름이 생기면 이곳에 보여드릴게요.</p>
            </div>
          </Card>
        ) : items.map((item) => {
          const Icon = notificationIcon(item.category, item.title)
          return (
            <Card key={item.id} className="motion-card">
              <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${toneBg(item.tone)}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <button onClick={() => openNotification(item)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-black">{item.title}</div>
                    <div className="shrink-0 text-xs font-bold text-slate-400">{relativeTime(item.createdAt)}</div>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{item.body}</p>
                  <div className="mt-3 text-sm font-black text-blue-700">{item.read ? '다시 보기' : '새 알림'} <ChevronRight className="inline h-4 w-4" /></div>
                </button>
                <button onClick={() => removeNotification(item.id)} className="pressable rounded-full p-2 text-slate-400 hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { financeSummary } = useMyWaveData()
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [member, setMember] = useState<MyWaveMemberResponse | null>(null)
  const [profileName, setProfileName] = useState(auth.member?.name ?? '')
  const [profileEmail, setProfileEmail] = useState(auth.member?.email ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [logoutSaving, setLogoutSaving] = useState(false)
  const rows = [
    { icon: UserRound, title: '계정 설정', detail: '프로필, 이메일, 비밀번호 변경', to: '/profile' },
    { icon: Bell, title: '알림 설정', detail: '푸시 알림 및 이메일 알림 관리', to: '/notifications' },
    { icon: WalletCards, title: '연결 계좌 관리', detail: '계좌 연결 및 갱신', to: '/assets' },
    { icon: ShieldAlert, title: '보안 설정', detail: '2단계 인증, 로그인 관리', to: '/profile' },
    { icon: MessageCircle, title: 'AI 설정', detail: '투자 성향 및 리포트 설정', to: '/coach' },
    { icon: CircleHelp, title: '도움말', detail: 'FAQ 및 고객센터', to: '/onboarding' },
  ]

  function syncAuthMember(updated: MyWaveMemberResponse) {
    auth.updateMember({
      id: auth.member?.id ?? updated.id,
      name: updated.name,
      email: updated.email,
      profileImageUrl: updated.profileImageUrl ?? auth.member?.profileImageUrl ?? '',
      membershipGrade: updated.membershipGrade ?? auth.member?.membershipGrade ?? 'Wave 사용자',
      createdAt: auth.member?.createdAt ?? new Date().toISOString(),
    })
  }

  async function toggleMembership() {
    const open = !membershipOpen
    setMembershipOpen(open)
    try {
      const updated = await updateMyWaveMembership(open ? '프리미엄' : 'Wave 사용자')
      setMember(updated)
      syncAuthMember(updated)
    } catch {
      // 백엔드가 꺼져 있어도 멤버십 패널 흐름은 유지합니다.
    }
  }

  async function saveProfile() {
    const name = profileName.trim()
    const email = profileEmail.trim()
    if (!name || !email) {
      setProfileMessage('이름과 이메일을 모두 입력해주세요.')
      return
    }
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const updated = await updateMyWaveProfile({
        name,
        email,
        profileImageUrl: member?.profileImageUrl ?? auth.member?.profileImageUrl,
      })
      setMember(updated)
      setProfileName(updated.name)
      setProfileEmail(updated.email)
      syncAuthMember(updated)
      setProfileMessage('프로필이 저장되었습니다.')
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword() {
    if (newPassword.length < 8) {
      setPasswordMessage('새 비밀번호는 8자 이상이어야 합니다.')
      return
    }
    setPasswordSaving(true)
    setPasswordMessage('')
    try {
      await changeMyWavePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage('비밀번호가 변경되었습니다.')
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleLogout() {
    setLogoutSaving(true)
    try {
      await logoutMyWaveSession()
    } catch {
      // 서버 세션 만료 상태여도 로컬 인증 정보는 정리합니다.
    } finally {
      auth.logout()
      navigate('/login', { replace: true })
    }
  }

  useEffect(() => {
    let ignore = false
    getMyWaveMember().then((profile) => {
      if (!ignore) {
        setMember(profile)
        setProfileName(profile.name)
        setProfileEmail(profile.email)
      }
    }).catch(() => {
      if (!ignore) {
        setMember(null)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <MobileTitle title="마이" />
      <Card>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-50">
            <UserRound className="h-11 w-11 fill-blue-500 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{member?.name ?? financeSummary.userName}</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{member?.membershipGrade ?? 'Wave 사용자'}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-500">{member?.email ?? 'mywave.user@example.com'}</p>
          </div>
          <ChevronRight className="h-6 w-6 text-slate-400" />
        </div>
        <div className="mt-6 rounded-[20px] bg-blue-700 p-5 text-white">
          <div className="text-lg font-black">MyWave 프리미엄</div>
          <p className="mt-2 text-sm font-bold text-blue-100">다양한 데이터와 AI 인사이트를 무제한으로 이용해 보세요.</p>
          <button onClick={toggleMembership} className="pressable mt-4 rounded-full border border-white/35 px-4 py-2 text-sm font-black">
            {membershipOpen ? '멤버십 상세 닫기' : '멤버십 관리'} <ChevronRight className="inline h-4 w-4" />
          </button>
          {membershipOpen && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm font-bold text-blue-50">현재 플랜은 프리미엄입니다. AI 코치와 기업 분석 리포트가 활성화되어 있어요.</p>}
        </div>
      </Card>
      <Card title="계정 요약">
        <div className="grid gap-5 sm:grid-cols-3">
          <MiniStat label="연결 계좌" value="3개" change="은행/증권 계좌" />
          <MiniStat label="총 자산" value={won(financeSummary.totalAsset)} change="방금 전 업데이트" />
          <MiniStat label="저축률" value={`${financeSummary.savingRate}%`} change="이번 달" />
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="프로필 수정">
          <div className="space-y-4">
            <Field label="이름">
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="form-input" />
            </Field>
            <Field label="이메일">
              <input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} className="form-input" />
            </Field>
            {profileMessage && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{profileMessage}</p>}
            <button onClick={saveProfile} disabled={profileSaving} className="pressable h-13 w-full rounded-2xl bg-blue-700 font-black text-white shadow-blue disabled:opacity-60">
              <Save className="inline h-5 w-5" /> {profileSaving ? '저장 중' : '프로필 저장'}
            </button>
          </div>
        </Card>
        <Card title="비밀번호 변경">
          <div className="space-y-4">
            <Field label="현재 비밀번호">
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-input" autoComplete="current-password" />
            </Field>
            <Field label="새 비밀번호">
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-input" autoComplete="new-password" />
            </Field>
            {passwordMessage && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">{passwordMessage}</p>}
            <button onClick={savePassword} disabled={passwordSaving || !currentPassword || !newPassword} className="pressable h-13 w-full rounded-2xl bg-blue-50 font-black text-blue-700 disabled:opacity-50">
              <ShieldAlert className="inline h-5 w-5" /> {passwordSaving ? '변경 중' : '비밀번호 변경'}
            </button>
          </div>
        </Card>
      </div>
      <Card>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => {
            const Icon = row.icon
            return (
              <button key={row.title} onClick={() => navigate(row.to)} className="pressable flex w-full items-center gap-4 py-4 text-left">
                <Icon className="h-6 w-6 text-blue-700" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">{row.title}</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500">{row.detail}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            )
          })}
        </div>
      </Card>
      <button onClick={handleLogout} disabled={logoutSaving} className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-red-500 shadow-card disabled:opacity-60">
        <LogOut className="h-5 w-5" /> {logoutSaving ? '로그아웃 중' : '로그아웃'}
      </button>
    </div>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const steps = [
    { title: '모든 금융을 하나의 흐름으로', body: '계좌, 소비, 투자, 목표를 연결해 현재 돈 상태를 한눈에 확인합니다.', icon: WalletCards },
    { title: '목표 달성 가능성을 계산해요', body: '목표 금액과 남은 기간을 기준으로 필요한 저축액과 줄일 소비를 보여줍니다.', icon: Target },
    { title: 'AI 코치가 다음 행동을 제안해요', body: '투자 추천이 아니라 판단에 필요한 정보를 쉽게 정리해줍니다.', icon: MessageCircle },
  ]
  const CurrentIcon = steps[step].icon

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
      <Card>
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-blue-50 text-blue-700">
            <CurrentIcon className="h-12 w-12" />
          </div>
          <h1 className="mt-8 text-3xl font-black tracking-[-0.04em] lg:text-5xl">{steps[step].title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-7 text-slate-500 lg:text-lg">{steps[step].body}</p>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2">
          {steps.map((item, index) => <span key={item.title} className={`h-2 rounded-full ${index === step ? 'w-8 bg-blue-700' : 'w-2 bg-slate-200'}`} />)}
        </div>
        <div className="mt-10 flex gap-3">
          <button onClick={() => step === 0 ? navigate('/') : setStep((value) => value - 1)} className="pressable h-14 flex-1 rounded-2xl font-black text-slate-600">
            이전
          </button>
          <button onClick={() => step === steps.length - 1 ? navigate('/') : setStep((value) => value + 1)} className="pressable h-14 flex-[1.4] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
            {step === steps.length - 1 ? '시작하기' : '다음'} <ChevronRight className="inline h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  )
}

function SearchResultsPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const { goals, spendingCategories, holdings, recommendedActions } = useMyWaveData()
  const fallbackResults = useMemo(() => {
    const keyword = query.toLowerCase()
    const sources = [
      ...goals.map((item) => ({ title: item.title, detail: `목표 달성률 ${item.rate}%`, targetPath: '/goals' })),
      ...spendingCategories.map((item) => ({ title: item.name, detail: `이번 달 ${won(item.amount)} 지출`, targetPath: '/spending/detail' })),
      ...holdings.map((item) => ({ title: `${item.symbol} ${item.name}`, detail: `수익률 ${item.returnRate}%`, targetPath: `/company/${item.symbol}` })),
      ...recommendedActions.map((item) => ({ title: item.title, detail: `${won(item.saving)} 절약 가능`, targetPath: '/spending/simulation' })),
    ]
    return keyword ? sources.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(keyword)) : sources
  }, [goals, holdings, query, recommendedActions, spendingCategories])
  const [results, setResults] = useState<Array<Pick<MyWaveSearchResultResponse, 'title' | 'detail' | 'targetPath'>>>(fallbackResults)

  useEffect(() => {
    let ignore = false
    searchMyWave(query).then((items) => {
      if (!ignore) setResults(items)
    }).catch(() => {
      if (!ignore) setResults(fallbackResults)
    })
    return () => {
      ignore = true
    }
  }, [fallbackResults, query])

  return (
    <div className="space-y-5">
      <MobileTitle title="검색" />
      <Card>
        <div className="text-sm font-black text-blue-700">검색 결과</div>
        <h1 className="mt-2 text-2xl font-black">{query ? `"${query}"` : '전체 항목'}</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">목표, 소비, 투자, AI 액션을 한 번에 찾습니다.</p>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {results.map((result) => (
          <SearchResultRow key={`${result.targetPath}-${result.title}`} title={result.title} detail={result.detail} to={result.targetPath} />
        ))}
        {results.length === 0 && (
          <Card>
            <div className="py-8 text-center text-sm font-bold text-slate-500">검색 결과가 없습니다.</div>
          </Card>
        )}
      </div>
    </div>
  )
}

function SearchResultRow({ title, detail, to }: { title: string; detail: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="pressable rounded-[20px] bg-white p-5 text-left shadow-card">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Search className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black">{title}</div>
          <div className="mt-1 text-sm font-bold text-slate-500">{detail}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  )
}

function GoalEditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = Number(searchParams.get('id') ?? 0)
  const [title, setTitle] = useState('새 저축 목표')
  const [targetAmount, setTargetAmount] = useState(1_000_000)
  const [currentAmount, setCurrentAmount] = useState(0)
  const [targetDate, setTargetDate] = useState('2026-07-21')
  const [goalStatus, setGoalStatus] = useState('ACTIVE')
  const [priority, setPriority] = useState(1)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!editingId) return
    let ignore = false
    getMyWaveGoals().then((items) => {
      if (ignore) return
      const goal = items.find((item) => item.id === editingId)
      if (!goal) {
        setMessage('수정할 목표를 찾지 못했습니다.')
        return
      }
      setTitle(goal.title)
      setTargetAmount(Number(goal.targetAmount))
      setCurrentAmount(Number(goal.currentAmount))
      setTargetDate(goal.targetDate)
      setGoalStatus(goal.status)
      setPriority(goal.priority)
    }).catch((error) => {
      if (!ignore) setMessage(error instanceof Error ? error.message : '목표를 불러오지 못했습니다.')
    })
    return () => {
      ignore = true
    }
  }, [editingId])

  async function submit() {
    setStatus('saving')
    setMessage('')
    try {
      const request = { title, targetAmount, currentAmount, targetDate, status: goalStatus, priority }
      if (editingId) {
        await updateMyWaveGoal(editingId, request)
      } else {
        await createMyWaveGoal(request)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 저장에 실패했습니다.')
      setStatus('idle')
      return
    }
    setStatus('saved')
    window.setTimeout(() => navigate('/goals'), 500)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <MobileTitle title={editingId ? '목표 수정' : '새 목표 만들기'} />
      {message && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-500">{message}</div>}
      <Card title="목표 정보">
        <div className="space-y-4">
          <Field label="목표 이름">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="목표 금액">
              <input type="number" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))} className="form-input" />
            </Field>
            <Field label="현재 모은 금액">
              <input type="number" value={currentAmount} onChange={(event) => setCurrentAmount(Number(event.target.value))} className="form-input" />
            </Field>
          </div>
          <Field label="목표 날짜">
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="form-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="상태">
              <select value={goalStatus} onChange={(event) => setGoalStatus(event.target.value)} className="form-input">
                <option value="ACTIVE">진행 중</option>
                <option value="PAUSED">일시정지</option>
                <option value="COMPLETED">완료</option>
              </select>
            </Field>
            <Field label="우선순위">
              <input type="number" min="1" value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="form-input" />
            </Field>
          </div>
        </div>
      </Card>
      <Card title="예상 결과">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="달성률" value={`${Math.round((currentAmount / Math.max(targetAmount, 1)) * 100)}%`} />
          <MiniStat label="남은 금액" value={won(Math.max(targetAmount - currentAmount, 0))} />
          <MiniStat label="하루 목표" value={won(Math.max(targetAmount - currentAmount, 0) / 30)} />
        </div>
      </Card>
      <div className="flex gap-3">
        <button onClick={() => navigate('/goals')} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>
        <button onClick={submit} disabled={status === 'saving'} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue disabled:opacity-60">
          <Save className="inline h-5 w-5" /> {status === 'saving' ? '저장 중' : status === 'saved' ? '저장 완료' : editingId ? '수정 저장' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

function SpendingDetailPage() {
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
          <div className="space-y-3">
            {spendingBlockers.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">{index + 1}</span>
                <div className="flex-1">
                  <div className="font-black">{item.name}</div>
                  <div className="text-sm font-bold text-slate-500">목표 달성률 {item.impact}%p 영향</div>
                </div>
                <div className="font-black">{won(item.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="이번 달 소비 판단">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="총 소비" value={won(financeSummary.totalSpending)} change="전월 대비 상승" />
          <MiniStat label="일평균 소비" value={won(financeSummary.dailySpending)} />
          <MiniStat label="예산 대비" value={`${financeSummary.budgetRate}%`} change="조정 필요" />
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

function todayDateString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
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
    void loadExpenses()
  }, [])

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
        {message && <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</div>}
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
                <button onClick={() => removeExpense(expense.id)} className="pressable grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
              <input type="number" value={form.amount} onChange={(event) => setForm((value) => ({ ...value, amount: Number(event.target.value) }))} className="form-input" />
            </Field>
            <Field label="사용일">
              <input type="date" value={form.spentDate} onChange={(event) => setForm((value) => ({ ...value, spentDate: event.target.value }))} className="form-input" />
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
  )
}

function SimulationDetailPage() {
  return (
    <div className="space-y-5">
      <MobileTitle title="절약 시뮬레이션" />
      <SavingSimulation />
      <ActionPanel />
      <Card title="적용 후 예상 루틴">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="주간 배달 횟수" value="4회 -> 2회" change="+78,000원" />
          <MiniStat label="카페 지출" value="-30%" change="+45,000원" />
          <MiniStat label="구독 정리" value="2개 해지" change="+32,000원" />
        </div>
      </Card>
    </div>
  )
}

function PortfolioDetailPage() {
  return (
    <div className="space-y-5">
      <MobileTitle title="보유 자산" />
      <PortfolioHero />
      <HoldingsTable />
      <CompanyPreview />
      <InvestmentTransactionManager />
    </div>
  )
}

function PortfolioAllocationDetailPage() {
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

function RiskDetailPage() {
  const [selectedAction, setSelectedAction] = useState('ETF 비중 10~15% 확대')
  const [savedAction, setSavedAction] = useState('')

  async function chooseAction(action: string) {
    setSelectedAction(action)
    try {
      const saved = await saveMyWavePortfolioRiskAction(action)
      setSavedAction(saved.action)
    } catch {
      setSavedAction(action)
    }
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="포트폴리오 리스크" />
      <RiskPanel />
      <Card title="리스크 조정 액션">
        <div className="grid gap-3 sm:grid-cols-3">
          {['ETF 비중 10~15% 확대', '현금 비중 5% 확보', '단일 종목 비중 35% 이하 유지'].map((item) => (
            <button key={item} onClick={() => chooseAction(item)} className={`pressable rounded-2xl border p-4 text-left font-black ${selectedAction === item ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-blue-50'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">선택한 액션: <span className="text-blue-700">{selectedAction}</span></div>
        {savedAction && <div className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-700">백엔드에 저장됨: {savedAction}</div>}
      </Card>
    </div>
  )
}

type AccountFormState = {
  name: string
  accountType: string
  institutionName: string
  balance: number
  includedInAssets: boolean
}

type BudgetFormState = {
  budgetMonth: string
  incomeAmount: number
  livingBudgetAmount: number
  fixedExpenseAmount: number
  plannedSavingAmount: number
  plannedInvestmentAmount: number
}

const emptyAccountForm: AccountFormState = {
  name: '',
  accountType: 'BANK',
  institutionName: '',
  balance: 0,
  includedInAssets: true,
}

function toAccountForm(account: MyWaveFinancialAccountResponse): AccountFormState {
  return {
    name: account.name,
    accountType: account.accountType,
    institutionName: account.institutionName,
    balance: Number(account.balance),
    includedInAssets: Boolean(account.includedInAssets),
  }
}

function toBudgetForm(budget: MyWaveMonthlyBudgetResponse): BudgetFormState {
  return {
    budgetMonth: budget.budgetMonth,
    incomeAmount: Number(budget.incomeAmount),
    livingBudgetAmount: Number(budget.livingBudgetAmount),
    fixedExpenseAmount: Number(budget.fixedExpenseAmount),
    plannedSavingAmount: Number(budget.plannedSavingAmount),
    plannedInvestmentAmount: Number(budget.plannedInvestmentAmount),
  }
}

function defaultBudgetForm(): BudgetFormState {
  const now = new Date()
  return {
    budgetMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    incomeAmount: 4_200_000,
    livingBudgetAmount: 2_100_000,
    fixedExpenseAmount: 620_000,
    plannedSavingAmount: 630_000,
    plannedInvestmentAmount: 530_000,
  }
}

function accountTypeLabel(type: string) {
  const labels: Record<string, string> = {
    BANK: '입출금',
    SAVINGS: '저축',
    INVESTMENT: '증권',
    CASH: '현금',
  }
  return labels[type] ?? type
}

function AssetDetailPage() {
  const { financeSummary, activities } = useMyWaveData()
  const [accounts, setAccounts] = useState<MyWaveFinancialAccountResponse[]>([])
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(() => defaultBudgetForm())
  const [assetMetrics, setAssetMetrics] = useState({
    totalAsset: financeSummary.totalAsset,
    accountBalance: 0,
    investmentAsset: financeSummary.totalAsset,
    monthlyExpense: financeSummary.totalSpending,
    remainingLivingBudget: financeSummary.livingBudgetLeft,
    investmentAvailableAmount: financeSummary.investableAmount,
    savingRate: financeSummary.savingRate,
  })
  const [statusMessage, setStatusMessage] = useState('')

  async function refreshAssets(month = budgetForm.budgetMonth) {
    const summary = await getMyWaveAssetSummary(month)
    setAccounts(summary.accounts)
    setBudgetForm(toBudgetForm(summary.budget))
    setAssetMetrics({
      totalAsset: Number(summary.totalAsset),
      accountBalance: Number(summary.accountBalance),
      investmentAsset: Number(summary.investmentAsset),
      monthlyExpense: Number(summary.monthlyExpense),
      remainingLivingBudget: Number(summary.remainingLivingBudget),
      investmentAvailableAmount: Number(summary.investmentAvailableAmount),
      savingRate: Number(summary.savingRate),
    })
  }

  useEffect(() => {
    let ignore = false
    getMyWaveAssetSummary().then((summary) => {
      if (ignore) return
      setAccounts(summary.accounts)
      setBudgetForm(toBudgetForm(summary.budget))
      setAssetMetrics({
        totalAsset: Number(summary.totalAsset),
        accountBalance: Number(summary.accountBalance),
        investmentAsset: Number(summary.investmentAsset),
        monthlyExpense: Number(summary.monthlyExpense),
        remainingLivingBudget: Number(summary.remainingLivingBudget),
        investmentAvailableAmount: Number(summary.investmentAvailableAmount),
        savingRate: Number(summary.savingRate),
      })
    }).catch(() => {
      if (!ignore) setStatusMessage('자산 데이터를 불러오지 못했습니다.')
    })
    return () => {
      ignore = true
    }
  }, [])

  function editAccount(account: MyWaveFinancialAccountResponse) {
    setEditingAccountId(account.id)
    setAccountForm(toAccountForm(account))
    setStatusMessage('')
  }

  function resetAccountForm() {
    setEditingAccountId(null)
    setAccountForm(emptyAccountForm)
  }

  async function saveAccount() {
    if (!accountForm.name.trim() || !accountForm.institutionName.trim()) {
      setStatusMessage('계좌명과 금융기관을 입력해주세요.')
      return
    }
    try {
      if (editingAccountId) {
        await updateMyWaveAccount(editingAccountId, accountForm)
        setStatusMessage('계좌가 수정되었습니다.')
      } else {
        await createMyWaveAccount(accountForm)
        setStatusMessage('새 계좌가 연결되었습니다.')
      }
      resetAccountForm()
      await refreshAssets()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 저장에 실패했습니다.')
    }
  }

  async function removeAccount(id: number) {
    try {
      await deleteMyWaveAccount(id)
      if (editingAccountId === id) resetAccountForm()
      setStatusMessage('계좌가 삭제되었습니다.')
      await refreshAssets()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.')
    }
  }

  async function saveBudget() {
    try {
      await saveMyWaveMonthlyBudget(budgetForm)
      setStatusMessage('이번 달 예산이 저장되었습니다.')
      await refreshAssets(budgetForm.budgetMonth)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '예산 저장에 실패했습니다.')
    }
  }

  async function loadAccountsOnly() {
    try {
      const result = await getMyWaveAccounts()
      setAccounts(result)
      setStatusMessage('계좌 목록을 새로고침했습니다.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 목록 새로고침에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="자산" />
      <Card title="이번 달 재무 상태">
        <div className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="총 자산" value={won(assetMetrics.totalAsset)} change="계좌+투자" />
          <MiniStat label="계좌 잔액" value={won(assetMetrics.accountBalance)} change={`${accounts.length}개 연결`} />
          <MiniStat label="남은 생활비" value={won(assetMetrics.remainingLivingBudget)} change={`저축률 ${assetMetrics.savingRate}%`} />
          <MiniStat label="투자 가능 금액" value={won(assetMetrics.investmentAvailableAmount)} />
        </div>
      </Card>
      {statusMessage && <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{statusMessage}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card
          title="연결 계좌"
          action={<button onClick={loadAccountsOnly} className="pressable rounded-full px-3 py-1.5 text-xs font-black text-blue-700">새로고침</button>}
        >
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <button onClick={() => editAccount(account)} className="pressable flex min-w-0 items-center gap-3 text-left">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-700">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <span className="min-w-0">
                    <span className="block text-base font-black">{account.name}</span>
                    <span className="mt-1 block text-sm font-bold text-slate-500">{account.institutionName} · {accountTypeLabel(account.accountType)} · {account.includedInAssets ? '자산 포함' : '자산 제외'}</span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
                    <div className="text-lg font-black">{won(Number(account.balance))}</div>
                    <div className="text-xs font-bold text-slate-400">ID {account.id}</div>
                  </div>
                  <button onClick={() => removeAccount(account.id)} className="pressable grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={editingAccountId ? '계좌 수정' : '새 계좌 연결'}>
          <div className="space-y-4">
            <Field label="계좌명">
              <input value={accountForm.name} onChange={(event) => setAccountForm((value) => ({ ...value, name: event.target.value }))} className="form-input" />
            </Field>
            <Field label="금융기관">
              <input value={accountForm.institutionName} onChange={(event) => setAccountForm((value) => ({ ...value, institutionName: event.target.value }))} className="form-input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="계좌 유형">
                <select value={accountForm.accountType} onChange={(event) => setAccountForm((value) => ({ ...value, accountType: event.target.value }))} className="form-input">
                  <option value="BANK">입출금</option>
                  <option value="SAVINGS">저축</option>
                  <option value="INVESTMENT">증권</option>
                  <option value="CASH">현금</option>
                </select>
              </Field>
              <Field label="잔액">
                <input type="number" value={accountForm.balance} onChange={(event) => setAccountForm((value) => ({ ...value, balance: Number(event.target.value) }))} className="form-input" />
              </Field>
            </div>
            <label className="flex items-center justify-between rounded-2xl p-4 text-sm font-black">
              총자산 계산에 포함
              <input type="checkbox" checked={accountForm.includedInAssets} onChange={(event) => setAccountForm((value) => ({ ...value, includedInAssets: event.target.checked }))} className="h-5 w-5 accent-blue-700" />
            </label>
            <div className="flex gap-3">
              {editingAccountId && <button onClick={resetAccountForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveAccount} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingAccountId ? '수정 저장' : '계좌 연결'}
              </button>
            </div>
          </div>
        </Card>
      </div>
      <Card title="월 예산 설정">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="기준 월">
            <input type="month" value={budgetForm.budgetMonth} onChange={(event) => setBudgetForm((value) => ({ ...value, budgetMonth: event.target.value }))} className="form-input" />
          </Field>
          <Field label="월 수입">
            <input type="number" value={budgetForm.incomeAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, incomeAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="생활비 예산">
            <input type="number" value={budgetForm.livingBudgetAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, livingBudgetAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="고정 지출">
            <input type="number" value={budgetForm.fixedExpenseAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, fixedExpenseAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="목표 저축액">
            <input type="number" value={budgetForm.plannedSavingAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, plannedSavingAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="계획 투자액">
            <input type="number" value={budgetForm.plannedInvestmentAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, plannedInvestmentAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-500">예산 저장 후 남은 생활비와 투자 가능 금액이 다시 계산됩니다.</div>
          <button onClick={saveBudget} className="pressable rounded-2xl bg-blue-700 px-5 py-3 font-black text-white shadow-blue">
            <Save className="inline h-5 w-5" /> 예산 저장
          </button>
        </div>
      </Card>
      <Card title="최근 활동">
        <div className="divide-y divide-slate-100">
          {activities.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex items-center gap-4 py-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: item.color }}><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="font-black">{item.title}</div>
                  <div className="text-sm font-bold text-slate-500">{item.detail}</div>
                </div>
                <div className={`font-black ${item.amount >= 0 ? 'text-blue-700' : 'text-slate-900'}`}>{won(item.amount)}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function CompanyDetailPage() {
  const { symbol = '005930' } = useParams()
  const [watched, setWatched] = useState(false)
  const [analysis, setAnalysis] = useState<MyWaveCompanyAnalysisResponse>(() => fallbackCompanyAnalysis(symbol))
  const company = {
    name: analysis.stock.name,
    ticker: analysis.stock.symbol,
    market: `${analysis.stock.market ?? 'MARKET'} · ${analysis.stock.industry ?? analysis.stock.sector ?? '기업'}`,
    price: formatCompanyPrice(analysis.stock.currentPrice, analysis.stock.market),
    change: `${Number(analysis.stock.changeRate ?? 0) >= 0 ? '+' : ''}${Number(analysis.stock.changeRate ?? 0).toFixed(2)}%`,
    logo: analysis.stock.name.slice(0, 1).toUpperCase(),
  }

  useEffect(() => {
    let ignore = false
    getMyWaveCompanyAnalysis(symbol).then((result) => {
      if (!ignore) setAnalysis(result)
    }).catch(() => {
      if (!ignore) setAnalysis(fallbackCompanyAnalysis(symbol))
    })
    return () => {
      ignore = true
    }
  }, [symbol])

  async function toggleWatch() {
    const next = !watched
    setWatched(next)
    try {
      if (next) {
        await addMyWaveWatchlist(symbol)
      } else {
        await removeMyWaveWatchlist(symbol)
      }
    } catch {
      // 백엔드가 꺼져 있어도 UI 토글은 유지합니다.
    }
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="기업 분석" />
      <Card>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-[20px] bg-blue-700 text-3xl font-black text-white">{company.logo}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end gap-2">
              <h1 className="text-2xl font-black">{company.name}</h1>
              <span className="font-bold text-slate-500">{company.ticker}</span>
            </div>
            <div className="mt-2 text-sm font-bold text-slate-500">{company.market}</div>
            <div className="mt-4 text-2xl font-black">{company.price} <span className={company.change.startsWith('+') ? 'text-red-500' : 'text-blue-700'}>{company.change}</span></div>
          </div>
          <button onClick={toggleWatch} className={`pressable grid h-11 w-11 place-items-center rounded-full ${watched ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
            <Save className="h-5 w-5" />
          </button>
        </div>
        {watched && <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-700">관심 기업에 저장되었습니다.</div>}
      </Card>
      <div className="grid gap-3 sm:grid-cols-5">
        {analysis.metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${toneBg(metric.tone)}`}><CheckCircle2 className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-black">{metric.label}</div>
            <div className="mt-2 text-xl font-black text-blue-700">{metric.value}{metric.unit}</div>
          </Card>
        ))}
      </div>
      <Card title="실적 추이">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={analysis.performance}>
              <CartesianGrid stroke="#e8eef7" vertical={false} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area dataKey="sales" stroke="#2563eb" fill="#dbeafe" strokeWidth={3} />
              <Line dataKey="operatingProfit" stroke="#60a5fa" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="AI 요약" action="AI 코치에게 묻기" actionTo="/coach">
        <p className="text-base font-bold leading-8 text-slate-600">
          {analysis.aiSummary}
        </p>
      </Card>
    </div>
  )
}


function toneBg(tone: string) {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-600'
  if (tone === 'orange') return 'bg-orange-50 text-orange-600'
  if (tone === 'violet') return 'bg-violet-50 text-violet-600'
  if (tone === 'yellow') return 'bg-amber-50 text-amber-600'
  return 'bg-blue-50 text-blue-700'
}

const defaultNotificationItems: MyWaveNotificationResponse[] = [
  { id: 1, category: '목표', title: '목표 달성률 업데이트', body: '"다음 달까지 100만원 모으기" 목표가 63% 달성되었어요.', targetPath: '/goals', tone: 'green', read: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 2, category: '소비', title: '소비 경고', body: '이번 달 카페/간식 지출이 지난 달보다 32% 증가했어요.', targetPath: '/spending/detail', tone: 'orange', read: false, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 3, category: '투자', title: '포트폴리오 변동', body: '국내 주식 비중이 2.3% 감소했어요.', targetPath: '/portfolio/allocation', tone: 'blue', read: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 4, category: 'AI 코치', title: 'AI 코치 추천', body: '현금 비중을 10% 높이면 변동성 리스크를 줄일 수 있어요.', targetPath: '/coach', tone: 'violet', read: false, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, category: '이벤트', title: '관심 종목 리포트 알림', body: '삼성전자 리포트가 업데이트 되었어요.', targetPath: '/company/005930', tone: 'yellow', read: false, createdAt: new Date(Date.now() - 33 * 60 * 60 * 1000).toISOString() },
]

function notificationIcon(category: string, title: string) {
  if (category.includes('소비')) return ShieldAlert
  if (category.includes('투자') || title.includes('포트폴리오')) return BarChart3
  if (category.includes('AI')) return MessageCircle
  if (category.includes('이벤트') || title.includes('리포트')) return FileText
  return Target
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.round(hours / 24)}일 전`
}

function formatCompanyPrice(price: number, market?: string) {
  if (market?.toUpperCase().includes('NASDAQ') || market?.toUpperCase().includes('NYSE')) {
    return `$${Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  return `${Number(price).toLocaleString('ko-KR')}원`
}

function fallbackCompanyAnalysis(symbol: string): MyWaveCompanyAnalysisResponse {
  const apple = symbol.toUpperCase() === 'AAPL'
  return {
    stock: apple
      ? { symbol: 'AAPL', name: 'Apple', market: 'NASDAQ', currentPrice: 210, changePrice: 2.4, changeRate: 1.24, sector: '기술', industry: '소비자 전자' }
      : { symbol: '005930', name: '삼성전자', market: 'KOSPI', currentPrice: 79600, changePrice: -1100, changeRate: -1.36, sector: '반도체', industry: '전자 장비 및 기기' },
    metrics: [
      { label: '매출 증가', value: apple ? 8.7 : 15.4, unit: '%', tone: 'green', description: '전년 대비 매출 성장' },
      { label: '영업이익 변동', value: apple ? 12.3 : -5.2, unit: '%', tone: apple ? 'green' : 'orange', description: '수익성 변동' },
      { label: '부채비율 안정', value: apple ? 62.1 : 39.8, unit: '%', tone: 'green', description: '재무 안정성' },
      { label: '현금흐름 양호', value: apple ? 96.9 : 12.8, unit: apple ? 'B USD' : '조원', tone: 'blue', description: 'FCF 기준' },
      { label: '배당 있음', value: apple ? 0.5 : 2.1, unit: '%', tone: 'violet', description: '배당 수익률' },
    ],
    performance: apple
      ? [
        { year: '2020', sales: 274.5, operatingProfit: 66.3 },
        { year: '2021', sales: 365.8, operatingProfit: 108.9 },
        { year: '2022', sales: 394.3, operatingProfit: 119.4 },
        { year: '2023', sales: 383.3, operatingProfit: 114.3 },
        { year: '2024', sales: 391.0, operatingProfit: 123.2 },
      ]
      : [
        { year: '2020', sales: 236.8, operatingProfit: 35.9 },
        { year: '2021', sales: 279.6, operatingProfit: 51.6 },
        { year: '2022', sales: 302.2, operatingProfit: 43.4 },
        { year: '2023', sales: 258.9, operatingProfit: 6.6 },
        { year: '2024', sales: 298.1, operatingProfit: 32.7 },
      ],
    aiSummary: apple
      ? '브랜드 충성도와 현금흐름은 강하지만 성장률 둔화와 규제 리스크를 함께 확인해야 합니다.'
      : '재무 안정성은 높은 편이지만 최근 수익성은 확인이 필요합니다. 메모리 업황 회복과 AI 수요 증가로 실적 개선이 기대됩니다.',
    portfolioImpact: '현재 포트폴리오에서 성장 노출도를 높이는 역할을 합니다.',
    dividendAvailable: true,
  }
}


function InlineAction({ to, label, primary = false }: { to: string; label: string; primary?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={primary ? 'rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white' : 'text-sm font-bold text-slate-500'}
    >
      {label} <ChevronRight className="inline h-4 w-4" />
    </button>
  )
}

function MobileCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`motion-card rounded-[20px] bg-white p-4 ${className}`}>
      {children}
    </section>
  )
}

function SegmentedTabs({ items, active }: { items: string[]; active: string }) {
  const [selected, setSelected] = useState(active)

  return (
    <div className="grid grid-cols-3 rounded-[14px] bg-slate-100 p-1">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => setSelected(item)}
          className={`pressable h-10 rounded-[11px] text-[14px] font-bold ${item === selected ? 'bg-white text-slate-900' : 'text-slate-400'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function MobileMiniMetric({ icon, label, value, detail, tone = 'blue' }: { icon: ReactNode; label: string; value: string; detail: string; tone?: 'blue' | 'green' | 'violet' }) {
  void tone
  return (
    <MobileCard className="min-h-30 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-slate-100 text-slate-400">{icon}</div>
      <div className="mt-3 text-[12px] font-medium text-slate-400">{label}</div>
      <div className="mt-1.5 whitespace-nowrap text-[17px] font-bold leading-tight tracking-[-0.02em] text-slate-900">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-400">{detail}</div>
    </MobileCard>
  )
}

function MobileNotice() {
  return (
    <section className="rounded-[20px] bg-white p-4">
      <div className="flex items-center gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-slate-900">지출이 평소보다 많아요</div>
          <p className="mt-0.5 text-[13px] font-medium leading-5 text-slate-400">카페·간식 지출이 지난달보다 32% 늘었어요.</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
      </div>
    </section>
  )
}

function MobileRing({ value }: { value: number }) {
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" stroke="#e7eefb" strokeWidth="10" fill="none" />
        <circle className="ring-progress" cx="60" cy="60" r="48" stroke="#1568f4" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${value * 3.02} 302`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-black text-blue-700">{value}%</div>
          <div className="text-xs font-bold text-slate-500">달성률</div>
        </div>
      </div>
    </div>
  )
}

function MobileGoalLine({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  void icon
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="whitespace-nowrap text-[13px] font-medium text-slate-400">{label}</span>
      <span className="tnum text-[15px] font-bold text-slate-900">{value}</span>
    </div>
  )
}

/**
 * 자산 배분 도넛.
 *
 * 전에는 조각 비율이 코드에 박혀 있어서 범례가 "현금 100%" 인데 그림은 다섯 조각으로
 * 갈라져 있었다. 화면이 사실과 다른 말을 하면 안 되므로 실제 배분으로 그린다.
 */
function MobileCssDonut({ center, label, items }: { center: string; label: string; items?: Array<{ name: string; rate: number; color: string }> }) {
  const slices = items && items.length > 0 ? items : [{ name: '없음', rate: 100, color: '#e9ecef' }]
  const { stops, filled } = slices.reduce<{ stops: string[]; filled: number }>(
    (acc, item) => {
      const end = Math.min(100, acc.filled + item.rate)
      return { stops: [...acc.stops, `${item.color} ${acc.filled}% ${end}%`], filled: end }
    },
    { stops: [], filled: 0 },
  )
  // 합이 100 에 못 미치면 나머지를 회색으로 채워 도넛이 끊겨 보이지 않게 한다.
  const ring = filled < 100 ? [...stops, `#e9ecef ${filled}% 100%`] : stops

  return (
    <div className="relative h-36 w-36">
      <div
        className="donut-animate h-full w-full rounded-full"
        style={{ background: `conic-gradient(${ring.join(', ')})` }}
      />
      <div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-[11px] font-medium text-slate-400">{label}</div>
          <div className="mt-0.5 text-[13px] font-bold leading-tight text-slate-900">{center}</div>
        </div>
      </div>
    </div>
  )
}

function TargetDot() {
  return <span className="inline-block h-4 w-4 rounded-full border-4 border-blue-700 bg-white" />
}

function FlagIcon() {
  return <span className="block h-4 w-4 rounded-sm bg-blue-700" />
}

function Progress({ value, className, barClassName, color }: { value: number; className?: string; barClassName?: string; color?: string }) {
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-slate-100 ${className ?? ''}`}>
      <div className={`progress-fill h-full rounded-full ${barClassName ?? 'bg-blue-700'}`} style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function Donut({ data, center, label = '총 자산' }: { data: Array<{ name: string; rate: number; color: string; amount?: number }>; center: string; label?: string }) {
  return (
    <div className="relative h-40 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="rate" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
            {data.map((item) => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-sm font-bold text-slate-400">{label}</div>
          <div className="mt-1 text-lg font-black">{center}</div>
        </div>
      </div>
    </div>
  )
}

function Legend({ items }: { items: Array<{ name: string; rate: number; color: string; amount?: number }> }) {
  return (
    <div className="space-y-3 self-center">
      {items.map((item) => (
        <div key={item.name} className="grid grid-cols-[1fr_46px] items-center gap-2 text-[14px] sm:grid-cols-[1fr_auto_58px] sm:gap-4">
          <span className="flex items-center gap-2 font-semibold text-slate-900"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}</span>
          {item.amount !== undefined && <span className="hidden font-medium text-slate-400 sm:block">{won(item.amount)}</span>}
          <span className="tnum text-right font-bold text-slate-900">{item.rate}%</span>
        </div>
      ))}
    </div>
  )
}

function RingProgress({ value }: { value: number }) {
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" stroke="#e9eef7" strokeWidth="14" fill="none" />
        <circle className="ring-progress" cx="60" cy="60" r="48" stroke="#2563eb" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={`${value * 3.02} 302`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-black text-blue-700">{value}%</div>
          <div className="text-xs font-bold text-slate-400">2024.05 목표</div>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">{value}</div>
      {change && <div className="mt-1 text-sm font-black text-blue-700">{change}</div>}
    </div>
  )
}

function SummaryLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-bold text-slate-500">{label}</span>
      <span className={`font-black ${muted ? 'text-slate-500' : 'text-blue-700'}`}>{value}</span>
    </div>
  )
}

function MobileTitle({ title }: { title: string }) {
  return <h1 className="mb-2 text-[28px] font-black leading-tight tracking-[-0.04em] lg:hidden">{title}</h1>
}

function MonthPicker() {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState('2024.05')
  const months = ['2024.05', '2024.04', '2024.03']

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-slate-600 lg:h-12 lg:gap-3 lg:px-5 lg:text-sm">
        <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5" /> {month} <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-32 rounded-2xl bg-white p-2 shadow-card">
          {months.map((item) => (
            <button key={item} onClick={() => { setMonth(item); setOpen(false) }} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-black hover:bg-blue-50">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black text-white">{children}</span>
}

function TinySparkline() {
  return (
    <svg viewBox="0 0 140 48" className="h-12 w-36">
      <polyline points="0,38 15,25 28,30 42,18 56,31 70,24 84,28 98,12 112,18 126,10 140,4" fill="none" stroke="#2563eb" strokeWidth="3" />
    </svg>
  )
}

function CreditIcon() {
  return <WalletCards className="h-8 w-8" />
}

function RocketMini() {
  return <BarChart3 className="h-8 w-8" />
}

function BriefcaseIcon() {
  return <BriefcaseBusiness className="h-7 w-7" />
}

function BarIcon() {
  return <BarChart3 className="h-7 w-7" />
}

function pageMeta(pathname: string) {
  if (pathname.startsWith('/goals')) return { title: '목표 관리', subtitle: '구체적인 목표로 더 좋은 금융 습관을 만들어보세요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/spending')) return { title: '소비 분석', subtitle: '소비 흐름을 분석하고, 목표 달성에 최적화된 소비 습관을 만들어보세요.', search: '검색 (예: 배달비 리포트)' }
  if (pathname.startsWith('/portfolio')) return { title: '투자 포트폴리오', subtitle: '내 자산의 흐름을 한눈에 분석하고, 더 나은 결정을 내려세요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/reports')) return { title: '리포트', subtitle: '기업 재무제표와 포트폴리오 리포트를 쉽게 이해하세요.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/coach')) return { title: 'AI코치', subtitle: '데이터 기반 AI가 당신의 투자 여정을 함께 설계합니다.', search: '검색 (예: 투자 리포트)' }
  return { title: '홈', subtitle: '목표, 소비, 투자 흐름을 한눈에 확인하세요.', search: '검색 (예: 투자 리포트)' }
}

