import { api, requestData } from './axios'
import { createMockOrder, mockExecutions, mockOrders } from '../data/mockData'
import type { Execution, TradeOrder, TradeOrderRequest } from '../types/trade'

export function createOrder(request: TradeOrderRequest) {
  return requestData<TradeOrder>(api.post('/api/trades/orders', request), createMockOrder(request))
}

export function getOrders() {
  return requestData<TradeOrder[]>(api.get('/api/trades/orders'), mockOrders)
}

export function getExecutions() {
  return requestData<Execution[]>(api.get('/api/trades/executions'), mockExecutions)
}

export function cancelOrder(orderId: number) {
  return requestData<TradeOrder>(
    api.patch(`/api/trades/orders/${orderId}/cancel`),
    { ...mockOrders[0], id: orderId, status: 'CANCELLED' },
  )
}
