import { api } from '../api/axios'

type ApiResponse<T> = {
  success: boolean
  data: T
  error?: { code: string; message: string } | null
}

export type MyWaveDashboardResponse = {
  totalAsset: number
  remainingLivingBudget: number
  investmentAvailableAmount: number
  goalProgressRate: number
  currentSavingAmount: number
  remainingGoalAmount: number
  assetSummary: {
    month: string
    monthlyIncome: number
    monthlyExpense: number
    savingRate: number
  }
  goalSummary: {
    mainGoal?: {
      title: string
      targetAmount: number
      currentAmount: number
      remainingAmount: number
      progressRate: number
      targetDate: string
      remainingDays: number
      dailyRequiredAmount: number
      status: string
    } | null
  }
  expenseSummary: {
    totalAmount: number
    changeRate: number
    dailyAverageAmount: number
    categories: Array<{ category: string; amount: number; ratio: number; count: number; averageAmount: number }>
    goalBlockers: Array<{ rank: number; category: string; amount: number; count: number; goalImpactRate: number }>
    trends: Array<{ month: string; amount: number; budget: number; goalImpactAmount: number }>
  }
  portfolio?: {
    totalAsset: number
    totalProfitLoss: number
    totalReturnRate: number
    dailyReturnRate: number
  } | null
  portfolioAllocation: Array<{ name: string; value: number; rate: number }>
  insights: string[]
}

export type MyWaveGoalResponse = {
  id: number
  title: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  progressRate: number
  targetDate: string
  remainingDays: number
  dailyRequiredAmount: number
  status: string
  priority: number
}

export type MyWaveActionResponse = {
  title: string
  description: string
  monthlySavingAmount: number
  category: string
}

export type MyWaveCoachMessageResponse = {
  id?: number
  role: string
  content: string
  createdAt?: string
}

export type MyWaveCoachChatResponse = {
  answer: MyWaveCoachMessageResponse
  suggestedQuestions: string[]
  context: MyWaveDashboardResponse
}

export type MyWaveNotificationResponse = {
  id: number
  category: string
  title: string
  body: string
  targetPath: string
  tone: string
  read: boolean
  createdAt: string
}

export type MyWaveNotificationSummaryResponse = {
  unreadCount: number
  notifications: MyWaveNotificationResponse[]
}

export type MyWaveSearchResultResponse = {
  type: string
  title: string
  detail: string
  targetPath: string
}

export type MyWaveSavingSimulationResponse = {
  currentGoalRate: number
  expectedGoalRate: number
  monthlySavingAmount: number
  categorySavings: Record<string, number>
}

export type MyWaveExpenseResponse = {
  id: number
  category: string
  merchant: string
  amount: number
  spentDate: string
  memo?: string | null
}

export type MyWaveExpenseSummaryResponse = {
  month: string
  totalAmount: number
  previousMonthAmount: number
  changeRate: number
  dailyAverageAmount: number
  categories: Array<{ category: string; amount: number; ratio: number; count: number; averageAmount: number }>
  goalBlockers: Array<{ rank: number; category: string; amount: number; count: number; goalImpactRate: number }>
  trends: Array<{ month: string; amount: number; budget: number; goalImpactAmount: number }>
}

export type MyWaveMemberResponse = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  membershipGrade?: string | null
}

export type MyWaveFinancialAccountResponse = {
  id: number
  name: string
  accountType: string
  institutionName: string
  balance: number
  includedInAssets: boolean
}

export type MyWaveMonthlyBudgetResponse = {
  budgetMonth: string
  incomeAmount: number
  livingBudgetAmount: number
  fixedExpenseAmount: number
  plannedSavingAmount: number
  plannedInvestmentAmount: number
}

export type MyWaveAssetSummaryResponse = {
  month: string
  totalAsset: number
  accountBalance: number
  investmentAsset: number
  monthlyIncome: number
  monthlyExpense: number
  remainingLivingBudget: number
  investmentAvailableAmount: number
  savingRate: number
  accounts: MyWaveFinancialAccountResponse[]
  budget: MyWaveMonthlyBudgetResponse
}

export type MyWavePortfolioRiskActionResponse = {
  id: number
  action: string
  status: string
  createdAt: string
}

export type MyWavePortfolioResponse = {
  id: number
  memberId: number
  cash: number
  totalAsset: number
  totalPurchaseAmount: number
  totalEvaluationAmount: number
  totalProfitLoss: number
  totalReturnRate: number
  dailyProfitLoss: number
  dailyReturnRate: number
}

export type MyWaveHoldingResponse = {
  symbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  evaluationAmount: number
  profitLoss: number
  returnRate: number
  realizedProfitLoss: number
  weight: number
}

export type MyWaveInvestmentTransactionResponse = {
  id: number
  symbol: string
  stockName: string
  transactionType: string
  quantity: number
  price: number
  fee: number
  tax: number
  totalAmount: number
  realizedProfitLoss: number
  transactionDate: string
  memo?: string | null
  reason?: string | null
  tags: string[]
  createdAt: string
}

export type MyWaveTransactionSummaryResponse = {
  monthlyTransactionCount: number
  buyAmount: number
  sellAmount: number
  realizedProfitLoss: number
}

export type MyWaveCompanyAnalysisResponse = {
  stock: {
    symbol: string
    name: string
    market: string
    currentPrice: number
    changePrice: number
    changeRate: number
    sector?: string
    industry?: string
    dividendYield?: number
  }
  metrics: Array<{ label: string; value: number; unit: string; tone: string; description: string }>
  performance: Array<{ year: string; sales: number; operatingProfit: number }>
  aiSummary: string
  portfolioImpact: string
  dividendAvailable: boolean
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await request
  if (!response.data.success) {
    throw new Error(response.data.error?.message ?? 'API 요청 실패')
  }
  return response.data.data
}

export async function getMyWaveDashboard() {
  return unwrap(api.get<ApiResponse<MyWaveDashboardResponse>>('/api/dashboard/mywave'))
}

export async function getMyWaveGoals() {
  return unwrap(api.get<ApiResponse<MyWaveGoalResponse[]>>('/api/goals'))
}

export async function getMyWaveActions() {
  return unwrap(api.get<ApiResponse<MyWaveActionResponse[]>>('/api/goals/actions'))
}

export async function getMyWaveCoachMessages() {
  return unwrap(api.get<ApiResponse<MyWaveCoachMessageResponse[]>>('/api/ai/financial-coach/messages'))
}

export async function createMyWaveGoal(request: {
  title: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  status?: string
  priority?: number
}) {
  return unwrap(api.post<ApiResponse<MyWaveGoalResponse>>('/api/goals', request))
}

export async function updateMyWaveGoal(id: number, request: {
  title: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  status?: string
  priority?: number
}) {
  return unwrap(api.patch<ApiResponse<MyWaveGoalResponse>>(`/api/goals/${id}`, request))
}

export async function deleteMyWaveGoal(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/goals/${id}`))
}

export async function chatWithMyWaveCoach(message: string) {
  return unwrap(api.post<ApiResponse<MyWaveCoachChatResponse>>('/api/ai/financial-coach/chat', { message }))
}

export async function getMyWaveNotifications(category?: string) {
  return unwrap(api.get<ApiResponse<MyWaveNotificationSummaryResponse>>('/api/notifications', { params: { category } }))
}

export async function markMyWaveNotificationRead(id: number) {
  return unwrap(api.patch<ApiResponse<MyWaveNotificationResponse>>(`/api/notifications/${id}/read`))
}

export async function markAllMyWaveNotificationsRead() {
  return unwrap(api.patch<ApiResponse<void>>('/api/notifications/read-all'))
}

export async function deleteMyWaveNotification(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/notifications/${id}`))
}

export async function deleteReadMyWaveNotifications() {
  return unwrap(api.delete<ApiResponse<void>>('/api/notifications/read'))
}

export async function searchMyWave(query: string) {
  return unwrap(api.get<ApiResponse<MyWaveSearchResultResponse[]>>('/api/search', { params: { query } }))
}

export async function simulateMyWaveSaving(request: {
  categoryReductionRates: Record<string, number>
  fixedSavingAmount?: number
}) {
  return unwrap(api.post<ApiResponse<MyWaveSavingSimulationResponse>>('/api/expenses/saving-simulation', request))
}

export async function getMyWaveExpenses(month?: string) {
  return unwrap(api.get<ApiResponse<MyWaveExpenseResponse[]>>('/api/expenses', { params: { month } }))
}

export async function getMyWaveExpenseSummary(month?: string) {
  return unwrap(api.get<ApiResponse<MyWaveExpenseSummaryResponse>>('/api/expenses/monthly-summary', { params: { month } }))
}

export async function createMyWaveExpense(request: {
  category: string
  merchant: string
  amount: number
  spentDate: string
  memo?: string
}) {
  return unwrap(api.post<ApiResponse<MyWaveExpenseResponse>>('/api/expenses', request))
}

export async function updateMyWaveExpense(id: number, request: {
  category: string
  merchant: string
  amount: number
  spentDate: string
  memo?: string
}) {
  return unwrap(api.patch<ApiResponse<MyWaveExpenseResponse>>(`/api/expenses/${id}`, request))
}

export async function deleteMyWaveExpense(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/expenses/${id}`))
}

export async function getMyWaveMember() {
  return unwrap(api.get<ApiResponse<MyWaveMemberResponse>>('/api/members/me'))
}

export async function updateMyWaveMembership(membershipGrade: string) {
  return unwrap(api.patch<ApiResponse<MyWaveMemberResponse>>('/api/members/me/membership', { membershipGrade }))
}

export async function updateMyWaveProfile(request: {
  name: string
  email: string
  profileImageUrl?: string | null
}) {
  return unwrap(api.patch<ApiResponse<MyWaveMemberResponse>>('/api/members/me/profile', request))
}

export async function changeMyWavePassword(request: {
  currentPassword: string
  newPassword: string
}) {
  return unwrap(api.post<ApiResponse<void>>('/api/members/me/password', request))
}

export async function logoutMyWaveSession() {
  return unwrap(api.post<ApiResponse<void>>('/api/auth/logout'))
}

export async function getMyWaveAssetSummary(month?: string) {
  return unwrap(api.get<ApiResponse<MyWaveAssetSummaryResponse>>('/api/assets/summary', { params: { month } }))
}

export async function getMyWaveAccounts() {
  return unwrap(api.get<ApiResponse<MyWaveFinancialAccountResponse[]>>('/api/assets/accounts'))
}

export async function createMyWaveAccount(request: {
  name: string
  accountType: string
  institutionName: string
  balance: number
  includedInAssets: boolean
}) {
  return unwrap(api.post<ApiResponse<MyWaveFinancialAccountResponse>>('/api/assets/accounts', request))
}

export async function updateMyWaveAccount(id: number, request: {
  name: string
  accountType: string
  institutionName: string
  balance: number
  includedInAssets: boolean
}) {
  return unwrap(api.patch<ApiResponse<MyWaveFinancialAccountResponse>>(`/api/assets/accounts/${id}`, request))
}

export async function deleteMyWaveAccount(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/assets/accounts/${id}`))
}

export async function saveMyWaveMonthlyBudget(request: {
  budgetMonth: string
  incomeAmount: number
  livingBudgetAmount: number
  fixedExpenseAmount: number
  plannedSavingAmount: number
  plannedInvestmentAmount: number
}) {
  return unwrap(api.post<ApiResponse<MyWaveMonthlyBudgetResponse>>('/api/assets/budgets/monthly', request))
}

export async function addMyWaveWatchlist(symbol: string) {
  return unwrap(api.post<ApiResponse<unknown>>(`/api/watchlist/${symbol}`))
}

export async function removeMyWaveWatchlist(symbol: string) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/watchlist/${symbol}`))
}

export async function saveMyWavePortfolioRiskAction(action: string) {
  return unwrap(api.post<ApiResponse<MyWavePortfolioRiskActionResponse>>('/api/portfolio/risk-actions', { action }))
}

export async function getMyWavePortfolio() {
  return unwrap(api.get<ApiResponse<MyWavePortfolioResponse>>('/api/portfolio'))
}

export async function getMyWaveHoldings() {
  return unwrap(api.get<ApiResponse<MyWaveHoldingResponse[]>>('/api/holdings'))
}

export async function getMyWaveTransactions() {
  return unwrap(api.get<ApiResponse<MyWaveInvestmentTransactionResponse[]>>('/api/transactions'))
}

export async function getMyWaveTransactionSummary() {
  return unwrap(api.get<ApiResponse<MyWaveTransactionSummaryResponse>>('/api/transactions/summary'))
}

export async function createMyWaveTransaction(request: {
  symbol: string
  stockName: string
  transactionType: string
  quantity: number
  price: number
  fee: number
  tax: number
  transactionDate: string
  memo?: string
  reason?: string
  tags?: string[]
}) {
  return unwrap(api.post<ApiResponse<MyWaveInvestmentTransactionResponse>>('/api/transactions', request))
}

export async function updateMyWaveTransaction(id: number, request: {
  symbol: string
  stockName: string
  transactionType: string
  quantity: number
  price: number
  fee: number
  tax: number
  transactionDate: string
  memo?: string
  reason?: string
  tags?: string[]
}) {
  return unwrap(api.patch<ApiResponse<MyWaveInvestmentTransactionResponse>>(`/api/transactions/${id}`, request))
}

export async function deleteMyWaveTransaction(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/transactions/${id}`))
}

export async function getMyWaveCompanyAnalysis(symbol: string) {
  return unwrap(api.get<ApiResponse<MyWaveCompanyAnalysisResponse>>(`/api/companies/${symbol}/analysis`))
}
