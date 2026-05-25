export interface ApiResponse<T> {
  success: boolean
  data: T
  error: { code: string; message: string } | null
}

export type ImpactType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
export type InsightType =
  | 'HOME'
  | 'MARKET'
  | 'STOCK'
  | 'PORTFOLIO'
  | 'RESEARCH'
  | 'RISK'
  | 'RECOMMENDATION'
export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
