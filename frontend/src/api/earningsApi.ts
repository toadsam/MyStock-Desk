import { api, requestData } from './axios'
import { mockEarningsCalendar, mockEarningsBySymbol } from '../data/mockData'
import type { Earnings, EarningsCalendarItem } from '../types/earnings'

export function getEarningsCalendar() {
  return requestData<EarningsCalendarItem[]>(api.get('/api/earnings/calendar'), mockEarningsCalendar)
}

export function getStockEarnings(symbol: string) {
  return requestData<Earnings[]>(api.get(`/api/stocks/${symbol}/earnings`), mockEarningsBySymbol(symbol))
}

export function getStockFinancials(symbol: string) {
  return requestData<Earnings[]>(api.get(`/api/stocks/${symbol}/financials`), mockEarningsBySymbol(symbol))
}
