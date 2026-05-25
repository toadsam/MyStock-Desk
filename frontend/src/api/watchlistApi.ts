import { api, requestData, requestStrictData } from './axios'
import { mockWatchlist, stockBySymbol } from '../data/mockData'
import type { WatchlistItem } from '../types/market'

export function getWatchlist() {
  return requestData<WatchlistItem[]>(api.get('/api/watchlist'), mockWatchlist)
}

export function addWatchlist(symbol: string) {
  const stock = stockBySymbol(symbol)
  return requestData<WatchlistItem>(api.post(`/api/watchlist/${symbol}`), {
    id: Date.now(),
    stock,
    reason: '관심 등록 이유를 적어두면 나중에 판단 기준을 복기하기 쉽습니다.',
    checkPoints: '실적 발표 일정, 최근 뉴스, 내 보유 종목과의 연관성',
    priceMemo: '관심 가격대 메모 없음',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  })
}

export function updateWatchlistMemo(symbol: string, request: Pick<WatchlistItem, 'reason' | 'checkPoints' | 'priceMemo'>) {
  return requestStrictData<WatchlistItem>(api.patch(`/api/watchlist/${symbol}`, request))
}

export function deleteWatchlist(symbol: string) {
  return requestData<void>(api.delete(`/api/watchlist/${symbol}`), undefined)
}
