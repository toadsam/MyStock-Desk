import type { Member } from '../types/member'
import type { PortfolioReport } from '../types/ai'
import type { Earnings, EarningsCalendarItem } from '../types/earnings'
import type { HeatmapSector, MarketBreadth, MarketIndex, SectorPerformance, WatchlistItem } from '../types/market'
import type { News } from '../types/news'
import type { Allocation, Holding, PerformancePoint, Portfolio, PortfolioStudyCandidate, Transaction } from '../types/portfolio'
import type { PortfolioImpact, ResearchBriefing, Risk, SentimentSummary, StudyCandidate } from '../types/research'
import type { OrderBook, PricePoint, Stock } from '../types/stock'
import type { ThemeDiscovery } from '../types/theme'
import type { HoldingSummary, InvestmentTransaction, TransactionSummary } from '../types/transaction'

const now = new Date()

export const mockMember: Member = {
  id: 1,
  name: 'Kim Investor',
  email: 'investor@stockflow.com',
  profileImageUrl:
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=80',
  membershipGrade: 'VIP',
  createdAt: now.toISOString(),
}

export const mockStocks: Stock[] = [
  stock(1, '005930', 'Samsung Electronics', 'KOSPI', 78600, 77200, 1400, 1.82, 79200, 77100, 12824912, 1005832000000, 'Electronics', 'Semiconductor', 4690245000000000, 16.35, 1.34, 2.45, 86800, 63600),
  stock(2, '000660', 'SK hynix', 'KOSPI', 196500, 190400, 6100, 3.21, 198200, 188100, 7892100, 1287600000000, 'Semiconductor', 'Memory', 142900000000000, 22.1, 1.82, 0.75, 212000, 111000),
  stock(3, '035420', 'NAVER', 'KOSPI', 198300, 199800, -1500, -0.75, 201000, 196200, 2345900, 654300000000, 'Internet', 'Platform', 32200000000000, 31.24, 1.19, 0.6, 242000, 172000),
  stock(4, '035720', 'Kakao', 'KOSPI', 45150, 45800, -650, -1.42, 46200, 44850, 4231200, 234100000000, 'Internet', 'Platform', 20100000000000, 44.2, 1.26, 0, 61200, 37200),
  stock(5, '373220', 'LG Energy Solution', 'KOSPI', 347000, 339800, 7200, 2.11, 350500, 337000, 931200, 421000000000, 'Battery', 'Battery', 81200000000000, 63.18, 4.1, 0, 612000, 308000),
  stock(6, '005380', 'Hyundai Motor', 'KOSPI', 236500, 235000, 1500, 0.64, 239000, 233000, 1382000, 398700000000, 'Auto', 'Auto', 49900000000000, 5.68, 0.61, 4.25, 298000, 172000),
  stock(7, '005490', 'POSCO Holdings', 'KOSPI', 368000, 363100, 4900, 1.35, 373000, 360500, 821000, 211200000000, 'Steel', 'Materials', 31200000000000, 10.12, 0.48, 2.2, 658000, 298000),
  stock(8, '207940', 'Samsung Biologics', 'KOSPI', 880000, 883000, -3000, -0.34, 889000, 871000, 203100, 276500000000, 'Bio', 'CDMO', 62600000000000, 71.4, 5.72, 0, 982000, 698000),
  stock(9, '010120', 'LS ELECTRIC', 'KOSPI', 130000, 124500, 5500, 4.42, 132700, 122000, 1210000, 157900000000, 'Electronics', 'Power equipment', 3900000000000, 18.2, 2.02, 1.1, 146000, 72000),
]

function stock(
  id: number,
  symbol: string,
  name: string,
  market: string,
  currentPrice: number,
  previousClose: number,
  changePrice: number,
  changeRate: number,
  highPrice: number,
  lowPrice: number,
  volume: number,
  tradingValue: number,
  sector: string,
  industry: string,
  marketCap: number,
  per: number,
  pbr: number,
  dividendYield: number,
  week52High: number,
  week52Low: number,
): Stock {
  return {
    id,
    symbol,
    name,
    market,
    currentPrice,
    previousClose,
    changePrice,
    changeRate,
    highPrice,
    lowPrice,
    volume,
    tradingValue,
    sector,
    industry,
    marketCap,
    per,
    pbr,
    dividendYield,
    week52High,
    week52Low,
  }
}

export const mockIndices: MarketIndex[] = [
  { id: 1, name: 'KOSPI', code: 'KOSPI', value: 2678.56, changeValue: 28.51, changeRate: 1.08, type: 'STOCK', displayOrder: 1 },
  { id: 2, name: 'KOSDAQ', code: 'KOSDAQ', value: 872.35, changeValue: 9.12, changeRate: 1.06, type: 'STOCK', displayOrder: 2 },
  { id: 3, name: 'NASDAQ', code: 'NASDAQ', value: 16902.55, changeValue: 201.21, changeRate: 1.2, type: 'GLOBAL', displayOrder: 3 },
  { id: 4, name: 'S&P 500', code: 'SP500', value: 5303.27, changeValue: 27.74, changeRate: 0.53, type: 'GLOBAL', displayOrder: 4 },
  { id: 5, name: 'USD/KRW', code: 'USDKRW', value: 1357.8, changeValue: -5.4, changeRate: -0.4, type: 'FX', displayOrder: 5 },
  { id: 6, name: 'KTB 3Y', code: 'KTB3Y', value: 3.245, changeValue: -0.028, changeRate: -0.86, type: 'BOND', displayOrder: 6 },
]

export function generateSeries(targetType: 'STOCK' | 'INDEX', targetCode: string, start: number, count = 72, drift = 1) {
  return Array.from({ length: count }, (_, index): PricePoint => {
    const price = start + index * drift + Math.sin(index / 4.8) * 7 + Math.cos(index / 8) * 4
    const hour = 9 + Math.floor((index * 5) / 60)
    const minute = (index * 5) % 60
    return {
      id: index + 1,
      targetType,
      targetCode,
      label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      price: Number(price.toFixed(2)),
      volume: 620000 + index * 13200 + (index % 5) * 42000,
      createdAt: now.toISOString(),
    }
  })
}

export function stockBySymbol(symbol = '005930') {
  return mockStocks.find((item) => item.symbol === symbol) ?? mockStocks[0]
}

export function indexPrices(code = 'KOSPI') {
  const index = mockIndices.find((item) => item.code === code) ?? mockIndices[0]
  return generateSeries('INDEX', index.code, index.value - 78, 72, index.changeRate > 0 ? 1.08 : -0.18)
}

export function stockPrices(symbol = '005930') {
  const item = stockBySymbol(symbol)
  return generateSeries('STOCK', item.symbol, item.currentPrice - item.changePrice * 1.1, 74, item.changeRate * 10)
}

export function orderBook(symbol = '005930'): OrderBook {
  const item = stockBySymbol(symbol)
  return {
    symbol,
    currentPrice: item.currentPrice,
    asks: [5, 4, 3, 2, 1].map((step) => ({
      price: item.currentPrice + step * 100,
      quantity: 500000 + step * 143567,
      changeRate: 1.82 + step * 0.13,
    })),
    bids: [1, 2, 3, 4, 5].map((step) => ({
      price: item.currentPrice - step * 100,
      quantity: 800000 + step * 121456,
      changeRate: -1.04 - step * 0.13,
    })),
    executionStrength: 112.35,
  }
}

export const mockWatchlist: WatchlistItem[] = mockStocks.slice(0, 5).map((item, index) => ({
  id: index + 1,
  stock: item,
  reason: `${item.name}의 실적과 뉴스가 내 포트폴리오에 어떤 영향을 주는지 확인하기 위해 등록`,
  checkPoints: '실적 발표 일정, 최근 뉴스, 기존 보유 종목과의 연관성',
  priceMemo: '관심 가격대는 거래 기록 입력 전 직접 확인',
  updatedAt: now.toISOString(),
  createdAt: now.toISOString(),
}))

export const mockPortfolio: Portfolio = {
  id: 1,
  memberId: 1,
  totalAsset: 153780350,
  cash: 8450000,
  totalPurchaseAmount: 98765000,
  totalEvaluationAmount: 145330350,
  totalProfitLoss: 29465500,
  totalReturnRate: 29.83,
  dailyProfitLoss: 1845200,
  dailyReturnRate: 1.21,
}

export const mockHoldings: Holding[] = [
  [mockStocks[0], 200, 71250, 15720000, 1470000, 10.32, 10.22],
  [mockStocks[1], 100, 176000, 19650000, 2050000, 11.65, 12.77],
  [mockStocks[4], 80, 395000, 27760000, -3840000, -12.14, 18.03],
  [mockStocks[2], 50, 178000, 9915000, 1015000, 11.39, 6.44],
  [mockStocks[3], 120, 51000, 5418000, -702000, -11.46, 3.52],
  [mockStocks[5], 60, 242000, 14190000, -330000, -2.27, 9.21],
].map(([holdingStock, quantity, averagePrice, evaluationAmount, profitLoss, returnRate, weight], index) => ({
  id: index + 1,
  stock: holdingStock as Stock,
  quantity: quantity as number,
  averagePrice: averagePrice as number,
  currentPrice: (holdingStock as Stock).currentPrice,
  evaluationAmount: evaluationAmount as number,
  profitLoss: profitLoss as number,
  returnRate: returnRate as number,
  weight: weight as number,
}))

export const mockPerformance: PerformancePoint[] = [
  '2024.06',
  '2024.07',
  '2024.08',
  '2024.09',
  '2024.10',
  '2024.11',
  '2024.12',
  '2025.01',
  '2025.02',
  '2025.03',
  '2025.04',
  '2025.05',
].map((label, index) => ({
  label,
  portfolioValue: Math.round(96500000 + index * 4650000 + Math.sin(index) * 1800000),
  kospiValue: Math.round(94800000 + index * 2200000 + Math.cos(index) * 1200000),
}))

export const mockAllocation: Allocation[] = [
  { name: '반도체', value: 35370000, rate: 23.0 },
  { name: '2차전지', value: 27760000, rate: 18.0 },
  { name: '자동차', value: 14190000, rate: 9.2 },
  { name: '인터넷', value: 15333000, rate: 10.0 },
  { name: '현금', value: 8450000, rate: 5.5 },
]

export const mockTransactions: Transaction[] = [
  { id: 1, stockName: 'Samsung Electronics', symbol: '005930', transactionType: 'BUY', price: 78200, quantity: 50, amount: -3910000, realizedProfitLoss: 0, createdAt: now.toISOString() },
  { id: 2, stockName: 'TIGER US S&P500', symbol: '360750', transactionType: 'BUY', price: 12480, quantity: 30, amount: -374400, realizedProfitLoss: 0, createdAt: now.toISOString() },
  { id: 3, stockName: 'Kakao', symbol: '035720', transactionType: 'SELL', price: 44800, quantity: 40, amount: 1792000, realizedProfitLoss: 124000, createdAt: now.toISOString() },
  { id: 4, stockName: 'NAVER', symbol: '035420', transactionType: 'BUY', price: 197500, quantity: 10, amount: -1975000, realizedProfitLoss: 0, createdAt: now.toISOString() },
  { id: 5, stockName: 'SK hynix', symbol: '000660', transactionType: 'BUY', price: 196500, quantity: 1, amount: -196500, realizedProfitLoss: 0, createdAt: now.toISOString() },
]

export const mockInvestmentTransactions: InvestmentTransaction[] = [
  {
    id: 1,
    symbol: '005930',
    stockName: '삼성전자',
    transactionType: 'BUY',
    quantity: 10,
    price: 78600,
    fee: 590,
    tax: 0,
    totalAmount: 786000,
    realizedProfitLoss: 0,
    transactionDate: '2026-05-25',
    reason: 'HBM 수요 증가와 메모리 업황 회복 기대',
    memo: '단기보다는 6개월 이상 보유 예정',
    tags: ['반도체', '장기보유', '실적개선'],
    createdAt: now.toISOString(),
  },
  {
    id: 2,
    symbol: '035420',
    stockName: 'NAVER',
    transactionType: 'SELL',
    quantity: 5,
    price: 198300,
    fee: 149,
    tax: 1546,
    totalAmount: 991500,
    realizedProfitLoss: 42000,
    transactionDate: '2026-05-20',
    reason: '기존 정리 기준에 도달',
    memo: '광고 회복 속도는 계속 확인',
    tags: ['플랫폼', '리스크관리'],
    createdAt: now.toISOString(),
  },
  {
    id: 3,
    symbol: 'DEPOSIT',
    stockName: '입금',
    transactionType: 'DEPOSIT',
    quantity: 0,
    price: 1000000,
    fee: 0,
    tax: 0,
    totalAmount: 1000000,
    realizedProfitLoss: 0,
    transactionDate: '2026-05-15',
    reason: '월 투자금 입금',
    memo: '현금 비중 유지',
    tags: ['현금흐름'],
    createdAt: now.toISOString(),
  },
]

export const mockTransactionSummary: TransactionSummary = {
  monthlyTransactionCount: 12,
  totalBuyAmount: 4820000,
  totalSellAmount: 1950000,
  realizedProfitLoss: 324000,
  totalFee: 8400,
}

export const mockEarningsCalendar: EarningsCalendarItem[] = [
  earningsCalendar(1, '005930', '삼성전자', 5, 'HOLDING', false, 'demo-public-disclosure'),
  earningsCalendar(2, '000660', 'SK hynix', 9, 'HOLDING', false, 'demo-public-disclosure'),
  earningsCalendar(3, '373220', 'LG Energy Solution', 12, 'HOLDING', true, 'demo-estimate'),
  earningsCalendar(4, '035420', 'NAVER', 18, 'WATCHLIST', false, 'demo-public-disclosure'),
  earningsCalendar(5, '010120', 'LS ELECTRIC', 24, 'MARKET_REFERENCE', true, 'demo-estimate'),
]

function earningsCalendar(id: number, symbol: string, companyName: string, days: number, relationType: EarningsCalendarItem['relationType'], estimated: boolean, source: string): EarningsCalendarItem {
  const announcementDate = new Date(now)
  announcementDate.setDate(now.getDate() + days)
  return {
    id,
    symbol,
    companyName,
    announcementDate: announcementDate.toISOString().slice(0, 10),
    daysUntil: days,
    estimated,
    relationType,
    checklist: ['매출 성장률', '영업이익률 변화', '기존 투자 이유 유지 여부', '업황 관련 코멘트', '환율/원자재/수요 변화 영향'],
    reviewQuestion: '실적 발표 후 내 투자 이유가 유지되는지 한 문장으로 복기해보세요.',
    source,
    lastUpdatedAt: now.toISOString(),
  }
}

export const mockEarnings: Earnings[] = [
  earnings(1, '005930', '삼성전자', 2026, 1, 79140000000000, 6610000000000, 5120000000000, 8.35, 12.4, 931.8, 5, false, 'demo-public-disclosure'),
  earnings(2, '000660', 'SK hynix', 2026, 1, 12430000000000, 2880000000000, 1920000000000, 23.17, 144.8, 302.1, 9, false, 'demo-public-disclosure'),
  earnings(3, '035420', 'NAVER', 2026, 1, 2510000000000, 439000000000, 318000000000, 17.49, 10.2, 5.6, 18, false, 'demo-public-disclosure'),
  earnings(4, '373220', 'LG Energy Solution', 2026, 1, 6130000000000, 157000000000, 89000000000, 2.56, -18.4, -43.9, 12, true, 'demo-estimate'),
]

function earnings(id: number, symbol: string, companyName: string, year: number, quarter: number, revenue: number, operatingProfit: number, netIncome: number, operatingMargin: number, yoyRevenueGrowth: number, yoyOperatingProfitGrowth: number, days: number, estimated: boolean, source: string): Earnings {
  const announcementDate = new Date(now)
  announcementDate.setDate(now.getDate() + days)
  return {
    id,
    symbol,
    companyName,
    year,
    quarter,
    revenue,
    operatingProfit,
    netIncome,
    operatingMargin,
    yoyRevenueGrowth,
    yoyOperatingProfitGrowth,
    announcementDate: announcementDate.toISOString().slice(0, 10),
    estimated,
    source,
    lastUpdatedAt: now.toISOString(),
  }
}

export function mockEarningsBySymbol(symbol: string) {
  return mockEarnings.filter((item) => item.symbol === symbol)
}

export const mockHoldingSummaries: HoldingSummary[] = [
  { symbol: '005930', stockName: '삼성전자', quantity: 20, averagePrice: 72400, currentPrice: 78600, evaluationAmount: 1572000, profitLoss: 124000, returnRate: 8.56, realizedProfitLoss: 42000, weight: 18.4 },
  { symbol: '000660', stockName: 'SK하이닉스', quantity: 8, averagePrice: 176000, currentPrice: 196500, evaluationAmount: 1572000, profitLoss: 164000, returnRate: 11.65, realizedProfitLoss: 0, weight: 16.8 },
]

export const mockNews: News[] = [
  ['Samsung HBM3E supply outlook improves', 'High value memory supply expectations are improving semiconductor sentiment.', 'Company', 'Yonhap', 'POSITIVE', '005930', 95],
  ['SK hynix profit beats consensus', 'HBM revenue mix and server demand recovery support earnings momentum.', 'Company', 'Korea Economy', 'POSITIVE', '000660', 93],
  ['Fed officials keep rates uncertainty open', 'Uncertain rate path can pressure growth stock valuations.', 'Economy', 'Bloomberg', 'NEUTRAL', null, 82],
  ['KRW strengthens as foreign flow turns positive', 'FX relief and large-cap buying support the index rebound.', 'Market', 'Maeil', 'POSITIVE', null, 78],
  ['LG Energy Solution reviews 4680 schedule', 'Capex schedule risk may increase short-term volatility.', 'Company', 'ET News', 'NEGATIVE', '373220', 74],
  ['NAVER weak on ad recovery concern', 'Ad revenue recovery is slower than market expectations.', 'Company', 'Seoul Economy', 'NEGATIVE', '035420', 68],
  ['Hyundai Motor EV sales recovery expected', 'New models and FX effects support second-half earnings resilience.', 'Company', 'Edaily', 'POSITIVE', '005380', 77],
  ['WTI crude breaks above 80 dollars', 'Input cost concerns can pressure transport and chemical sectors.', 'Global', 'CNBC', 'NEGATIVE', null, 69],
].map(([title, summary, category, source, impactType, relatedStockSymbol, score], index) => ({
  id: index + 1,
  title: title as string,
  summary: summary as string,
  category: category as string,
  source: source as string,
  impactType: impactType as News['impactType'],
  relatedStockSymbol: relatedStockSymbol as string | null,
  publishedAt: new Date(Date.now() - index * 1000 * 60 * 19).toISOString(),
  aiImportanceScore: score as number,
}))

export const mockHeatmap: HeatmapSector[] = [
  { sectorName: 'Electronics', changeRate: 1.85, stocks: [mockStocks[0], mockStocks[8]].map(toHeatmapStock) },
  { sectorName: 'Semiconductor', changeRate: 2.48, stocks: [mockStocks[1], mockStocks[0]].map(toHeatmapStock) },
  { sectorName: 'Auto', changeRate: 1.56, stocks: [mockStocks[5]].map(toHeatmapStock) },
  { sectorName: 'Internet', changeRate: -0.74, stocks: [mockStocks[2], mockStocks[3]].map(toHeatmapStock) },
  { sectorName: 'Bio', changeRate: 0.64, stocks: [mockStocks[7]].map(toHeatmapStock) },
]

function toHeatmapStock(item: Stock) {
  return {
    symbol: item.symbol,
    name: item.name,
    changeRate: item.changeRate,
    marketCap: item.marketCap,
  }
}

export const mockSectors: SectorPerformance[] = [
  { sectorName: 'Steel', changeRate: 2.35, ranking: 1, type: 'TOP' },
  { sectorName: 'Semiconductor', changeRate: 2.48, ranking: 2, type: 'TOP' },
  { sectorName: 'IT hardware', changeRate: 1.97, ranking: 3, type: 'TOP' },
  { sectorName: 'Electronics', changeRate: 1.85, ranking: 4, type: 'TOP' },
  { sectorName: 'Auto', changeRate: 1.56, ranking: 5, type: 'TOP' },
  { sectorName: 'Insurance', changeRate: -0.12, ranking: 6, type: 'BOTTOM' },
  { sectorName: 'Telecom', changeRate: -0.24, ranking: 7, type: 'BOTTOM' },
  { sectorName: 'Retail', changeRate: -0.15, ranking: 8, type: 'BOTTOM' },
  { sectorName: 'Food', changeRate: -0.38, ranking: 9, type: 'BOTTOM' },
  { sectorName: 'Battery', changeRate: -0.78, ranking: 10, type: 'BOTTOM' },
]

export const mockBreadth: MarketBreadth = {
  rising: 609,
  falling: 245,
  unchanged: 70,
  risingRatio: 69,
  fallingRatio: 27,
  foreignNetBuy: 4215,
  institutionNetBuy: 1287,
  individualNetBuy: -5502,
}

export const mockBriefing: ResearchBriefing = {
  greeting: 'Good morning, Kim Investor.',
  summary: 'The market may stay mixed today. Watch semiconductors and AI infrastructure flows.',
  basedAt: now.toISOString(),
  snapshots: mockIndices.slice(0, 3),
  keyPoints: ['AI semiconductor demand remains strong', 'US CPI slowdown supports rate expectations', 'FX volatility requires large-cap flow checks'],
  insights: [
    { id: 1, type: 'RESEARCH', title: 'Semiconductor improvement signal', content: 'HBM supply expansion and cloud investment recovery are constructive.', sentiment: 'POSITIVE', score: 92, createdAt: now.toISOString() },
    { id: 2, type: 'RESEARCH', title: 'Battery short-term correction risk', content: 'European EV demand slowdown and raw material volatility remain concerns.', sentiment: 'NEGATIVE', score: 78, createdAt: now.toISOString() },
  ],
}

export const mockSentiment: SentimentSummary = {
  positive: 1243,
  negative: 621,
  neutral: 436,
  total: 2300,
  sentimentScore: 0.32,
}

export const mockRisks: Risk[] = [
  { title: 'US recession concern', description: 'Slower consumption and higher-for-longer rates may increase growth stock volatility.', riskScore: 65 },
  { title: 'Geopolitical risk', description: 'Oil and FX volatility can increase import cost pressure.', riskScore: 48 },
  { title: 'Raw material volatility', description: 'Copper and crude price swings can affect industrial and battery earnings.', riskScore: 46 },
]

export const mockStudyCandidates: StudyCandidate[] = [
  { symbol: '000660', name: 'SK hynix', category: 'Memory', relationType: 'RELATED_THEME', relevanceScore: 86, studyReason: 'HBM과 AI GPU 공급망 관련 뉴스가 반복되어 확인할 후보입니다.', checkPoints: ['HBM 매출 비중', '공급 계약 뉴스', '영업이익률 변화'], riskNote: '반도체 비중이 이미 높다면 포트폴리오 쏠림을 확인하세요.', dataSource: 'demo/news-check' },
  { symbol: '005930', name: 'Samsung Electronics', category: 'Semiconductor', relationType: 'SUPPLY_CHAIN', relevanceScore: 78, studyReason: '메모리와 파운드리 양쪽에서 AI 반도체 흐름을 확인할 후보입니다.', checkPoints: ['HBM 수율', '메모리 가격', '파운드리 가동률'], riskNote: '대형 복합 기업이라 특정 테마 영향이 희석될 수 있습니다.', dataSource: 'demo/news-check' },
  { symbol: '005380', name: 'Hyundai Motor', category: 'Auto', relationType: 'DIVERSIFICATION', relevanceScore: 62, studyReason: '반도체 외 업종 분산 관점에서 자동차 업황과 환율 영향을 확인할 후보입니다.', checkPoints: ['판매량', '환율 영향', '영업이익률'], riskNote: '업종 분산 후보일 뿐 매수 판단은 별도 검토가 필요합니다.', dataSource: 'demo/portfolio-check' },
  { symbol: '010120', name: 'LS ELECTRIC', category: 'Power equipment', relationType: 'SUPPLY_CHAIN', relevanceScore: 74, studyReason: 'AI 데이터센터 전력 인프라 확대와 연결해 공부할 후보입니다.', checkPoints: ['전력기기 수주', '북미 매출', '원자재 비용'], riskNote: '수주 기대가 가격에 먼저 반영됐는지 확인하세요.', dataSource: 'demo/news-check' },
]

export const mockPortfolioStudyCandidates: PortfolioStudyCandidate[] = [
  {
    candidateSymbol: '010120',
    candidateName: 'LS ELECTRIC',
    category: '전력기기',
    relationType: 'SUPPLY_CHAIN',
    studyReason: '반도체와 AI 데이터센터 이슈가 전력 인프라 수요로 이어지는지 확인해볼 후보입니다.',
    checkPoints: ['전력기기 수주', '북미 매출', '영업이익률', '데이터센터 투자 뉴스'],
    relatedHoldings: ['삼성전자', 'SK hynix'],
    relevanceScore: 82,
    riskNote: 'AI 인프라 기대가 가격에 먼저 반영됐는지 확인하세요.',
    dataSource: 'holdings/sector/demo',
    lastUpdatedAt: now.toISOString(),
  },
  {
    candidateSymbol: '207940',
    candidateName: 'Samsung Biologics',
    category: 'CDMO',
    relationType: 'DIVERSIFICATION',
    studyReason: '반도체 비중이 높은 포트폴리오에서 다른 업종 흐름을 비교해볼 분산 공부 후보입니다.',
    checkPoints: ['신규 수주', '가동률', '영업이익률', '환율 영향'],
    relatedHoldings: ['삼성전자', 'SK hynix'],
    relevanceScore: 68,
    riskNote: '분산 후보라도 사업 구조와 밸류에이션을 따로 확인해야 합니다.',
    dataSource: 'holdings/sector/demo',
    lastUpdatedAt: now.toISOString(),
  },
]

export const mockPortfolioImpact: PortfolioImpact[] = mockNews.slice(0, 5).map((item, index) => ({
  title: item.title,
  relatedStockSymbol: item.relatedStockSymbol ?? 'KOSPI',
  expectedImpact: [2.45, 1.78, 0.92, -0.56, -0.31][index],
  impactLabel: item.impactType === 'NEGATIVE' ? 'Risk check' : 'Positive impact',
}))

export const mockThemeDiscoveries: ThemeDiscovery[] = [
  {
    id: 'nvidia-ai-supply-chain',
    keyword: 'nvidia',
    title: '엔비디아 AI 반도체 공급망',
    sourceCompany: 'NVIDIA',
    summary: '엔비디아 호재는 GPU 자체보다 HBM, 파운드리, 패키징, AI 서버, 데이터센터 전력/냉각으로 영향이 퍼지는지 확인하는 흐름이 중요합니다.',
    catalyst: {
      title: 'AI GPU 수요와 데이터센터 투자 확대',
      description: 'AI 학습/추론 서버 투자가 늘면 고성능 GPU뿐 아니라 메모리, 기판, 장비, 전력 인프라 수요도 함께 점검 대상이 됩니다.',
      impactPaths: ['엔비디아', 'AI GPU', 'HBM/패키징', 'AI 서버/PCB', '데이터센터 전력/냉각'],
    },
    stages: [
      { id: 'gpu', name: '핵심 기업', description: '이슈의 출발점이 되는 AI GPU와 가속기 생태계입니다.', focus: 'GPU 출하, 데이터센터 매출, 고객사 투자 계획', stockSymbols: ['NVDA', 'AMD'] },
      { id: 'memory', name: 'HBM/메모리', description: 'AI GPU에 붙는 고대역폭 메모리 공급망입니다.', focus: 'HBM 공급 계약, 수율, 메모리 가격', stockSymbols: ['000660', '005930', 'MU'] },
      { id: 'foundry', name: '파운드리/패키징', description: '칩 생산과 고급 패키징을 담당하는 영역입니다.', focus: '첨단 공정 가동률, CoWoS/패키징 증설', stockSymbols: ['TSM', '042700'] },
      { id: 'server', name: 'AI 서버/기판', description: 'GPU를 실제 서버로 구성하는 하드웨어 영역입니다.', focus: '서버 수주, PCB 공급, 고객사 집중도', stockSymbols: ['SMCI', '007660'] },
      { id: 'power', name: '전력/냉각 인프라', description: '데이터센터 증가로 전력기기와 냉각 수요가 늘어나는 영역입니다.', focus: '데이터센터 CAPEX, 전력 장비 수주, 마진', stockSymbols: ['VRT', '010120'] },
    ],
    relatedStocks: [
      stockTheme('NVDA', 'NVIDIA', 'US', 'gpu', '핵심 기업', 1120, 'DIRECT', 'AI GPU 수요 증가 이슈의 출발점입니다.', ['데이터센터 매출', 'GPU 공급량', '주요 클라우드 고객 주문'], ['이미 높은 기대가 가격에 반영됐을 수 있음', '미중 규제와 공급 제약'], ['AI GPU', '대장주']),
      stockTheme('000660', 'SK hynix', 'KR', 'memory', 'HBM/메모리', 196500, 'DIRECT', 'HBM 공급 확대 이슈가 엔비디아 GPU 수요와 직접 연결되는지 확인할 종목입니다.', ['HBM 매출 비중', '영업이익률', '공급 계약 뉴스'], ['HBM 기대가 과열되면 변동성이 커질 수 있음', '메모리 업황 둔화'], ['HBM', '메모리']),
      stockTheme('005930', 'Samsung Electronics', 'KR', 'memory', 'HBM/메모리', 78600, 'INDIRECT', '메모리와 파운드리 양쪽 노출이 있어 AI 반도체 투자 사이클을 함께 볼 수 있습니다.', ['HBM 수율', '파운드리 가동률', '메모리 가격'], ['사업부가 커서 특정 테마 영향이 희석될 수 있음'], ['메모리', '파운드리']),
      stockTheme('042700', 'Hanmi Semiconductor', 'KR', 'foundry', '파운드리/패키징', 146000, 'DIRECT', 'HBM용 패키징 장비 수요와 연결되는 장비주로 분류됩니다.', ['장비 수주', '고객사 투자', '영업이익률'], ['장비주는 수주 공백 시 변동성이 큼', '단기 테마 과열'], ['패키징', '장비']),
      stockTheme('007660', 'IsuPetasys', 'KR', 'server', 'AI 서버/기판', 48200, 'INDIRECT', 'AI 서버용 고성능 PCB 수요 증가와 연결해 공부할 수 있습니다.', ['AI 서버 PCB 매출', '고객사 다변화', '마진'], ['특정 고객 의존도', '증설 비용'], ['PCB', 'AI서버']),
      stockTheme('TSM', 'TSMC', 'US', 'foundry', '파운드리/패키징', 164, 'DIRECT', '엔비디아 GPU 생산과 첨단 패키징 병목을 함께 확인하는 핵심 파운드리입니다.', ['첨단 공정 매출', 'CoWoS 증설', '가동률'], ['지정학 리스크', '대형주라 기대 선반영 가능'], ['파운드리', '패키징']),
      stockTheme('SMCI', 'Super Micro Computer', 'US', 'server', 'AI 서버/기판', 830, 'INDIRECT', 'GPU를 탑재한 AI 서버 수요와 연결되는 하드웨어 기업입니다.', ['서버 수주', '마진', '재고 회전'], ['회계/공시 이슈 확인 필요', '경쟁 심화'], ['AI서버', '하드웨어']),
      stockTheme('VRT', 'Vertiv', 'US', 'power', '전력/냉각 인프라', 96, 'INDIRECT', '데이터센터 확대로 전력 관리와 냉각 인프라 수요가 늘어나는지 확인할 종목입니다.', ['데이터센터 수주', '영업이익률', '전력 인프라 투자'], ['밸류에이션 부담', '수주 둔화'], ['전력', '냉각']),
      stockTheme('010120', 'LS ELECTRIC', 'KR', 'power', '전력/냉각 인프라', 130000, 'INDIRECT', '국내 전력기기와 데이터센터 전력 인프라 수요를 함께 확인할 수 있습니다.', ['전력기기 수주', '북미 매출', '마진'], ['원자재 가격', '수주 기대 선반영'], ['전력기기', '인프라']),
    ],
    beginnerSummary: [
      '대장주 호재가 항상 모든 관련주 수익으로 이어지는 것은 아닙니다.',
      '관련도가 높은지보다 실제 매출과 수주에 연결되는지 확인해야 합니다.',
      '예산이 작다면 가격이 낮은 종목보다 변동성과 사업 이해도를 먼저 봐야 합니다.',
    ],
    aiCheckpoints: [
      'HBM 공급 확대 뉴스가 반복되는지, 실제 분기 실적에서 매출로 확인되는지 보세요.',
      'AI 서버와 전력 인프라 기업은 데이터센터 투자 계획이 둔화될 때 같이 흔들릴 수 있습니다.',
      '반도체 보유 비중이 이미 높다면 관련주를 추가하기 전 포트폴리오 쏠림을 점검하세요.',
    ],
    riskNotes: ['단순 테마주는 뉴스가 약해지면 급격히 변동할 수 있습니다.', '미국 대형주 이슈가 국내 중소형주 실적으로 연결되는 데 시간이 걸릴 수 있습니다.', '낮은 주가가 낮은 위험을 의미하지는 않습니다.'],
    repeatedKeywords: ['HBM', 'AI GPU', 'CoWoS', '데이터센터', '전력기기', 'AI 서버'],
    liveNews: [
      { title: 'AI GPU와 HBM 공급망 뉴스가 반복적으로 등장하고 있습니다', source: 'Google News', url: 'https://news.google.com', publishedAt: now.toISOString() },
    ],
    updatedAt: now.toISOString(),
  },
]

function stockTheme(
  symbol: string,
  stockName: string,
  market: 'KR' | 'US',
  stageId: string,
  stageName: string,
  currentPrice: number,
  relationLevel: 'DIRECT' | 'INDIRECT' | 'THEME',
  relationReason: string,
  checkMetrics: string[],
  risks: string[],
  tags: string[],
) {
  return {
    symbol,
    stockName,
    market,
    stageId,
    stageName,
    currentPrice,
    relationLevel,
    relationReason,
    checkMetrics,
    risks,
    tags,
    relationScore: 0,
    evidenceCount: 0,
    scoreFactors: [],
    evidenceNews: [],
    aiExplanation: {
      summary: `${stockName}은 ${stageName} 관점에서 함께 확인할 후보입니다.`,
      evidence: ['seed 데이터 기준 공급망 관계가 있습니다.'],
      checkpoints: checkMetrics,
      risks,
      verdict: '실제 뉴스와 실적 연결 여부를 추가로 확인하세요.',
      generatedBy: 'local-fallback',
    },
  }
}

export const mockPortfolioReport: PortfolioReport = {
  generatedAt: now.toISOString(),
  summary: '현재 포트폴리오는 입력한 거래 기록과 보유 종목 기준으로 정리되었습니다. 반도체와 2차전지 비중을 함께 확인하세요.',
  performanceNotes: ['수익 종목과 손실 종목을 나누어 투자 이유가 유지되는지 복기하세요.', '최근 거래 기록의 수수료와 세금 반영 여부를 확인하세요.'],
  concentrationNotes: ['반도체 관련 종목 비중이 높다면 같은 업종 뉴스에 함께 흔들릴 수 있습니다.'],
  upcomingEarnings: ['삼성전자 실적 발표 D-5', 'SK hynix 실적 발표 D-9'],
  recentReviewQuestions: ['최근 매수 이유가 한 문장으로 남아 있나요?', '손실 종목의 리스크 기준이 깨졌나요?'],
  studyCandidates: ['LS ELECTRIC · AI 데이터센터 전력 인프라 수요를 확인할 후보', 'Samsung Biologics · 업종 분산 관점의 공부 후보'],
  disclaimer: '이 리포트는 사용자의 투자 기록과 공개 정보를 바탕으로 정리한 참고 자료이며, 매수·매도 추천이나 투자 자문이 아닙니다.',
}
