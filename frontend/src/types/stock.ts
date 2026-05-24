import type { ImpactType } from './common'

export interface Stock {
  id: number
  symbol: string
  name: string
  market: string
  currentPrice: number
  previousClose: number
  changePrice: number
  changeRate: number
  highPrice: number
  lowPrice: number
  volume: number
  tradingValue: number
  sector: string
  industry: string
  marketCap: number
  per: number
  pbr: number
  dividendYield: number
  week52High: number
  week52Low: number
}

export interface PricePoint {
  id: number
  targetType: 'STOCK' | 'INDEX'
  targetCode: string
  label: string
  price: number
  volume: number
  createdAt: string
}

export interface OrderBookLevel {
  price: number
  quantity: number
  changeRate: number
}

export interface OrderBook {
  symbol: string
  currentPrice: number
  asks: OrderBookLevel[]
  bids: OrderBookLevel[]
  executionStrength: number
}

export interface StockNews {
  id: number
  title: string
  summary: string
  category: string
  source: string
  impactType: ImpactType
  relatedStockSymbol: string | null
  publishedAt: string
  aiImportanceScore: number
}
