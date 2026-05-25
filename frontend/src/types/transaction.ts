export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'

export interface InvestmentTransaction {
  id: number
  symbol: string
  stockName: string
  transactionType: TransactionType
  quantity: number
  price: number
  fee: number
  tax: number
  totalAmount: number
  realizedProfitLoss: number
  transactionDate: string
  memo: string
  reason: string
  tags: string[]
  createdAt: string
}

export interface TransactionRequest {
  symbol: string
  stockName: string
  transactionType: TransactionType
  quantity: number
  price: number
  fee: number
  tax: number
  transactionDate: string
  memo: string
  reason: string
  tags: string[]
}

export interface TransactionSummary {
  monthlyTransactionCount: number
  totalBuyAmount: number
  totalSellAmount: number
  realizedProfitLoss: number
  totalFee: number
}

export interface HoldingSummary {
  symbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  evaluationAmount: number
  profitLoss: number
  returnRate: number
  realizedProfitLoss: number
  weight: number
}

export interface CsvImportResult {
  importedCount: number
  errors: string[]
}

export interface ScreenshotUpload {
  originalFileName: string
  storedFileName: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

export interface RiskAlert {
  title: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

export type MemoType = 'BUY_REASON' | 'SELL_REASON' | 'EARNINGS_CHECK' | 'RISK_CHECK' | 'NEWS_MEMO' | 'REVIEW' | 'CHECKPOINT' | 'RISK' | 'GENERAL'

export interface InvestmentMemo {
  id: number
  symbol: string
  memoType: MemoType
  title: string
  content: string
  checklist: string[]
  createdAt: string
}

export interface InvestmentMemoRequest {
  symbol: string
  memoType: MemoType
  title: string
  content: string
  checklist: string[]
}
