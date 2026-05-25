import { api, requestData, requestStrictData } from './axios'
import { mockExecutions, mockOrders } from '../data/mockData'
import type { Execution, TradeLedger, TradeOrder, TradeOrderRequest } from '../types/trade'

export function createOrder(request: TradeOrderRequest) {
  return requestStrictData<TradeOrder>(api.post('/api/trades/orders', request))
}

export function getOrders() {
  return requestData<TradeOrder[]>(api.get('/api/trades/orders'), mockOrders)
}

export function getExecutions() {
  return requestData<Execution[]>(api.get('/api/trades/executions'), mockExecutions)
}

export function getTradeLedger() {
  return requestData<TradeLedger[]>(api.get('/api/trades/ledger'), [])
}

export function cancelOrder(orderId: number) {
  return requestStrictData<TradeOrder>(api.patch(`/api/trades/orders/${orderId}/cancel`))
}
