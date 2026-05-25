export interface Earnings {
  id: number
  symbol: string
  companyName: string
  year: number
  quarter: number
  revenue: number
  operatingProfit: number
  netIncome: number
  operatingMargin: number
  yoyRevenueGrowth: number
  yoyOperatingProfitGrowth: number
  announcementDate: string
  estimated: boolean
  source: string
  lastUpdatedAt: string
}

export interface EarningsCalendarItem {
  id: number
  symbol: string
  companyName: string
  announcementDate: string
  daysUntil: number
  estimated: boolean
  relationType: 'HOLDING' | 'WATCHLIST' | 'MARKET_REFERENCE'
  checklist: string[]
  reviewQuestion: string
  source: string
  lastUpdatedAt: string
}
