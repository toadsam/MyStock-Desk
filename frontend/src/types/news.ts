import type { ImpactType } from './common'

export interface News {
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
