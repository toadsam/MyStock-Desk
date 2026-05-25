export type ThemeMarket = 'KR' | 'US'
export type RelatednessLevel = 'DIRECT' | 'INDIRECT' | 'THEME'

export interface ThemeCatalyst {
  title: string
  description: string
  impactPaths: string[]
}

export interface SupplyChainStage {
  id: string
  name: string
  description: string
  focus: string
  stockSymbols: string[]
}

export interface RelatedThemeStock {
  symbol: string
  stockName: string
  market: ThemeMarket
  stageId: string
  stageName: string
  currentPrice: number
  relationLevel: RelatednessLevel
  relationReason: string
  checkMetrics: string[]
  risks: string[]
  tags: string[]
  relationScore: number
  evidenceCount: number
  scoreFactors: string[]
  evidenceNews: ThemeNewsItem[]
  aiExplanation: ThemeAiExplanation
}

export interface ThemeNewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
}

export interface ThemeAiExplanation {
  summary: string
  evidence: string[]
  checkpoints: string[]
  risks: string[]
  verdict: string
  generatedBy: string
}

export interface ThemeDiscovery {
  id: string
  keyword: string
  title: string
  sourceCompany: string
  summary: string
  catalyst: ThemeCatalyst
  stages: SupplyChainStage[]
  relatedStocks: RelatedThemeStock[]
  beginnerSummary: string[]
  aiCheckpoints: string[]
  riskNotes: string[]
  repeatedKeywords: string[]
  liveNews: ThemeNewsItem[]
  updatedAt: string
}
