export interface DataRefreshResult {
  provider: string
  refreshedStocks: number
  refreshedAt: string
  externalReady: boolean
  message: string
}
