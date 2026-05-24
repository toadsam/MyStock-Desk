import { api, requestData } from './axios'
import {
  mockBriefing,
  mockPortfolioImpact,
  mockRecommendations,
  mockRisks,
  mockSentiment,
} from '../data/mockData'
import type {
  PortfolioImpact,
  Recommendation,
  ResearchBriefing,
  Risk,
  SentimentSummary,
} from '../types/research'

export function getResearchBriefing() {
  return requestData<ResearchBriefing>(api.get('/api/research/briefing'), mockBriefing)
}

export function getResearchSentiment() {
  return requestData<SentimentSummary>(api.get('/api/research/sentiment'), mockSentiment)
}

export function getResearchRisks() {
  return requestData<Risk[]>(api.get('/api/research/risks'), mockRisks)
}

export function getRecommendations() {
  return requestData<Recommendation[]>(api.get('/api/research/recommendations'), mockRecommendations)
}

export function getPortfolioImpact() {
  return requestData<PortfolioImpact[]>(api.get('/api/research/portfolio-impact'), mockPortfolioImpact)
}
