import { api, requestData } from './axios'
import {
  mockBriefing,
  mockPortfolioImpact,
  mockStudyCandidates,
  mockRisks,
  mockSentiment,
} from '../data/mockData'
import type {
  PortfolioImpact,
  ResearchBriefing,
  Risk,
  SentimentSummary,
  StudyCandidate,
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

export function getStudyCandidates() {
  return requestData<StudyCandidate[]>(api.get('/api/research/study-candidates'), mockStudyCandidates)
}

export function getPortfolioImpact() {
  return requestData<PortfolioImpact[]>(api.get('/api/research/portfolio-impact'), mockPortfolioImpact)
}
