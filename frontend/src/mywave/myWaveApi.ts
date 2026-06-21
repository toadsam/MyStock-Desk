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
  id?: number
  title: string
  targetAmount: number
  currentAmount: number
  progressRate: number
  targetDate: string
  remainingDays: number
  status: string
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

export type MyWaveMemberResponse = {
  id: number
  name: string
  email: string
  profileImageUrl?: string | null
  membershipGrade?: string | null
}

export type MyWavePortfolioRiskActionResponse = {
  id: number
  action: string
  status: string
  createdAt: string
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

export async function getMyWaveMember() {
  return unwrap(api.get<ApiResponse<MyWaveMemberResponse>>('/api/members/me'))
}

export async function updateMyWaveMembership(membershipGrade: string) {
  return unwrap(api.patch<ApiResponse<MyWaveMemberResponse>>('/api/members/me/membership', { membershipGrade }))
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

export async function getMyWaveCompanyAnalysis(symbol: string) {
  return unwrap(api.get<ApiResponse<MyWaveCompanyAnalysisResponse>>(`/api/companies/${symbol}/analysis`))
}
