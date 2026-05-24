import { api, requestData } from './axios'
import { mockNews, mockStocks, orderBook, stockBySymbol, stockPrices } from '../data/mockData'
import type { News } from '../types/news'
import type { OrderBook, PricePoint, Stock } from '../types/stock'

export function getStocks() {
  return requestData<Stock[]>(api.get('/api/stocks'), mockStocks)
}

export function getStock(symbol: string) {
  return requestData<Stock>(api.get(`/api/stocks/${symbol}`), stockBySymbol(symbol))
}

export function getStockPrices(symbol: string) {
  return requestData<PricePoint[]>(api.get(`/api/stocks/${symbol}/prices`), stockPrices(symbol))
}

export function getOrderBook(symbol: string) {
  return requestData<OrderBook>(api.get(`/api/stocks/${symbol}/orderbook`), orderBook(symbol))
}

export function getStockNews(symbol: string) {
  return requestData<News[]>(
    api.get(`/api/stocks/${symbol}/news`),
    mockNews.filter((news) => news.relatedStockSymbol === symbol),
  )
}
