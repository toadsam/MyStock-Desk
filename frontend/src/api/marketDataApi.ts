import type { DataRefreshResult } from '../types/marketData'
import { api, requestData, requestStrictData } from './axios'

const fallbackStatus: DataRefreshResult = {
  provider: 'StockFlow Demo Feed',
  refreshedStocks: 0,
  refreshedAt: new Date().toISOString(),
  externalReady: false,
  message: '백엔드 연결이 꺼져 있어 로컬 mock 데이터를 표시합니다.',
}

export function getDataRefreshStatus() {
  return requestData<DataRefreshResult>(api.get('/api/data/status'), fallbackStatus)
}

export function refreshMarketData() {
  return requestStrictData<DataRefreshResult>(api.post('/api/data/refresh'))
}
