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
  role: string
  content: string
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
