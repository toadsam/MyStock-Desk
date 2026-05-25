import type { Stock } from './stock'

export interface MarketIndex {
  id: number
  name: string
  code: string
  value: number
  changeValue: number
  changeRate: number
  type: string
  displayOrder: number
}

export interface HeatmapStock {
  symbol: string
  name: string
  changeRate: number
  marketCap: number
}

export interface HeatmapSector {
  sectorName: string
  changeRate: number
  stocks: HeatmapStock[]
}

export interface SectorPerformance {
  sectorName: string
  changeRate: number
  ranking: number
  type: 'TOP' | 'BOTTOM'
}

export interface MarketBreadth {
  rising: number
  falling: number
  unchanged: number
  risingRatio: number
  fallingRatio: number
  foreignNetBuy: number
  institutionNetBuy: number
  individualNetBuy: number
}

export interface WatchlistItem {
  id: number
  stock: Stock
  reason: string
  checkPoints: string
  priceMemo: string
  updatedAt: string
  createdAt: string
}
