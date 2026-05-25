import type { InsightType, Sentiment } from './common'
import type { MarketIndex } from './market'

export interface AiInsight {
  id: number
  type: InsightType
  title: string
  content: string
  sentiment: Sentiment
  score: number
  createdAt: string
}

export interface ResearchBriefing {
  greeting: string
  summary: string
  basedAt: string
  snapshots: MarketIndex[]
  keyPoints: string[]
  insights: AiInsight[]
}

export interface SentimentSummary {
  positive: number
  negative: number
  neutral: number
  total: number
  sentimentScore: number
}

export interface Risk {
  title: string
  description: string
  riskScore: number
}

export interface StudyCandidate {
  symbol: string
  name: string
  category: string
  relationType: string
  studyReason: string
  checkPoints: string[]
  relevanceScore: number
  riskNote: string
  dataSource: string
}

export interface PortfolioImpact {
  title: string
  relatedStockSymbol: string
  expectedImpact: number
  impactLabel: string
}
