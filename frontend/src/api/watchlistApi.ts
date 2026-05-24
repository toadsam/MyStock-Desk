import { api, requestData } from './axios'
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
    createdAt: new Date().toISOString(),
  })
}

export function deleteWatchlist(symbol: string) {
  return requestData<void>(api.delete(`/api/watchlist/${symbol}`), undefined)
}
