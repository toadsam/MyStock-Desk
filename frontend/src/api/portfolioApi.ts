import { api, requestData } from './axios'
import {
  mockAllocation,
  mockHoldings,
  mockPerformance,
  mockPortfolio,
  mockPortfolioStudyCandidates,
  mockTransactions,
} from '../data/mockData'
import type { Allocation, Holding, PerformancePoint, Portfolio, PortfolioStudyCandidate, Transaction } from '../types/portfolio'

export function getPortfolio() {
  return requestData<Portfolio>(api.get('/api/portfolio'), mockPortfolio)
}

export function getHoldings() {
  return requestData<Holding[]>(api.get('/api/portfolio/holdings'), mockHoldings)
}

export function getPerformance() {
  return requestData<PerformancePoint[]>(api.get('/api/portfolio/performance'), mockPerformance)
}

export function getAllocation() {
  return requestData<Allocation[]>(api.get('/api/portfolio/allocation'), mockAllocation)
}

export function getPortfolioStudyCandidates() {
  return requestData<PortfolioStudyCandidate[]>(api.get('/api/portfolio/study-candidates'), mockPortfolioStudyCandidates)
}

export function getTransactions() {
  return requestData<Transaction[]>(api.get('/api/portfolio/transactions'), mockTransactions)
}
