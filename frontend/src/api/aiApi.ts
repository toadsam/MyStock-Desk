import { api, requestData } from './axios'
import { mockPortfolioReport } from '../data/mockData'
import type { PortfolioReport } from '../types/ai'

export function getLatestPortfolioReport() {
  return requestData<PortfolioReport>(api.get('/api/ai/portfolio-report/latest'), mockPortfolioReport)
}

export function generatePortfolioReport() {
  return requestData<PortfolioReport>(api.post('/api/ai/portfolio-report'), mockPortfolioReport)
}
