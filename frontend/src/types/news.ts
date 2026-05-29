import type { ImpactType } from './common'

export interface News {
  id: number
  title: string
  summary: string
  category: string
  source: string
  sourceUrl: string | null
  dataProvider: string
  fetchedAt: string
  reliability: 'OFFICIAL' | 'MAJOR_MEDIA' | 'AGGREGATED' | 'DEMO' | string
  officialSource: boolean
  impactType: ImpactType
  relatedStockSymbol: string | null
  publishedAt: string
  aiImportanceScore: number
}
