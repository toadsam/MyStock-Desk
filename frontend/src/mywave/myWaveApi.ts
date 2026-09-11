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

// ---------------------------------------------------------------------------
// 소비 기록 간편 입력
//
// 문자든 캡처든 결과는 같은 모양의 후보 목록(MyWaveParseResultResponse)으로 돌아온다.
// 확인 화면을 하나만 만들기 위해서다. 입력 경로가 늘어나도 이 타입은 바뀌지 않는다.
// ---------------------------------------------------------------------------

export type MyWaveParsedExpenseResponse = {
  category: string
  merchant: string
  amount: number
  spentDate: string
  source: 'SMS' | 'IMAGE'
  rawText?: string | null
  duplicate: boolean
  warning?: string | null
}

export type MyWaveParseResultResponse = {
  items: MyWaveParsedExpenseResponse[]
  parsedCount: number
  duplicateCount: number
  totalAmount: number
  reportedTotal?: number | null
  totalMatched: boolean
  warnings: string[]
}

export type MyWaveImportStatusResponse = {
  imageParsingAvailable: boolean
  remainingImageQuota: number
  dailyImageLimit: number
}

export type MyWaveMerchantSuggestionResponse = {
  merchant: string
  category: string
  suggestedAmount: number
  usageCount: number
}

export type MyWaveExpenseTemplateResponse = {
  id: number
  name: string
  category: string
  merchant: string
  amount: number
  usageCount: number
}

export type MyWaveTemplateSuggestionResponse = {
  merchant: string
  category: string
  amount: number
  usageCount: number
  message: string
}

export type MyWaveCashFlowItemResponse = {
  kind: 'SPEND' | 'INVEST'
  refId: number
  category: string
  title: string
  amount: number
  date: string
  /** false = 사라진 돈(소비), true = 형태만 바뀐 내 돈(투자) */
  moneyKept: boolean
}

export type MyWaveCashFlowResponse = {
  month: string
  incomeAmount: number
  spentTotal: number
  investedTotal: number
  savedTotal: number
  keptTotal: number
  remainingAmount: number
  items: MyWaveCashFlowItemResponse[]
}

export async function parseMyWaveExpenseSms(text: string) {
  return unwrap(api.post<ApiResponse<MyWaveParseResultResponse>>('/api/expenses/parse-sms', { text }))
}

export async function parseMyWaveExpenseImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  return unwrap(api.post<ApiResponse<MyWaveParseResultResponse>>('/api/expenses/parse-image', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }))
}

export async function getMyWaveImportStatus() {
  return unwrap(api.get<ApiResponse<MyWaveImportStatusResponse>>('/api/expenses/import-status'))
}

export async function createMyWaveExpensesBulk(items: Array<{
  category: string
  merchant: string
  amount: number
  spentDate: string
  memo?: string
}>) {
  return unwrap(api.post<ApiResponse<MyWaveExpenseResponse[]>>('/api/expenses/bulk', { items }))
}

export async function suggestMyWaveMerchants(q: string) {
  return unwrap(api.get<ApiResponse<MyWaveMerchantSuggestionResponse[]>>('/api/expenses/merchants/suggest', { params: { q } }))
}

export async function getMyWaveCashFlow(month?: string) {
  return unwrap(api.get<ApiResponse<MyWaveCashFlowResponse>>('/api/expenses/cash-flow', { params: { month } }))
}

export async function getMyWaveExpenseTemplates() {
  return unwrap(api.get<ApiResponse<MyWaveExpenseTemplateResponse[]>>('/api/expense-templates'))
}

export async function getMyWaveTemplateSuggestions() {
  return unwrap(api.get<ApiResponse<MyWaveTemplateSuggestionResponse[]>>('/api/expense-templates/suggestions'))
}

export async function createMyWaveExpenseTemplate(request: {
  name: string
  category: string
  merchant: string
  amount: number
}) {
  return unwrap(api.post<ApiResponse<MyWaveExpenseTemplateResponse>>('/api/expense-templates', request))
}

export async function deleteMyWaveExpenseTemplate(id: number) {
  return unwrap(api.delete<ApiResponse<void>>(`/api/expense-templates/${id}`))
}

export async function logMyWaveExpenseTemplate(id: number, request?: { amount?: number; spentDate?: string }) {
  return unwrap(api.post<ApiResponse<MyWaveExpenseResponse>>(`/api/expense-templates/${id}/log`, request ?? {}))
}
