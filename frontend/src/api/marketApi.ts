import { api, requestData } from './axios'
import { indexPrices, mockBreadth, mockHeatmap, mockIndices, mockSectors } from '../data/mockData'
import type { HeatmapSector, MarketBreadth, MarketIndex, SectorPerformance } from '../types/market'
import type { PricePoint } from '../types/stock'

export function getMarketIndices() {
  return requestData<MarketIndex[]>(api.get('/api/market/indices'), mockIndices)
}

export function getIndexPrices(code: string) {
  return requestData<PricePoint[]>(api.get(`/api/market/indices/${code}/prices`), indexPrices(code))
}

export function getMarketHeatmap() {
  return requestData<HeatmapSector[]>(api.get('/api/market/heatmap'), mockHeatmap)
}

export function getMarketSectors() {
  return requestData<SectorPerformance[]>(api.get('/api/market/sectors'), mockSectors)
}

export function getMarketBreadth() {
  return requestData<MarketBreadth>(api.get('/api/market/breadth'), mockBreadth)
}
