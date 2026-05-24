import type { OrderMethod, OrderStatus, OrderType } from './common'
import type { Stock } from './stock'

export interface TradeOrderRequest {
  symbol: string
  orderType: OrderType
  orderMethod: OrderMethod
  orderPrice: number
  quantity: number
}

export interface TradeOrder {
  id: number
  stock: Stock
  orderType: OrderType
  orderMethod: OrderMethod
  orderPrice: number
  quantity: number
  estimatedAmount: number
  fee: number
  status: OrderStatus
  createdAt: string
}

export interface Execution {
  id: number
  orderId: number
  stock: Stock
  executionPrice: number
  quantity: number
  executedAt: string
}
