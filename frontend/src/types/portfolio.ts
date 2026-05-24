import type { OrderStatus, OrderType } from './common'
import type { Stock } from './stock'

export interface Portfolio {
  id: number
  memberId: number
  totalAsset: number
  cash: number
  totalPurchaseAmount: number
  totalEvaluationAmount: number
  totalProfitLoss: number
  totalReturnRate: number
  dailyProfitLoss: number
  dailyReturnRate: number
}

export interface Holding {
  id: number
  stock: Stock
  quantity: number
  averagePrice: number
  currentPrice: number
  evaluationAmount: number
  profitLoss: number
  returnRate: number
  weight: number
}

export interface PerformancePoint {
  label: string
  portfolioValue: number
  kospiValue: number
}

export interface Allocation {
  name: string
  value: number
  rate: number
}

export interface Transaction {
  id: number
  stockName: string
  symbol: string
  orderType: OrderType
  price: number
  quantity: number
  amount: number
  status: OrderStatus
  createdAt: string
}
