import { api, requestData, requestStrictData } from './axios'
import { mockHoldingSummaries, mockInvestmentTransactions, mockTransactionSummary } from '../data/mockData'
import type {
  CsvImportResult,
  HoldingSummary,
  InvestmentMemo,
  InvestmentMemoRequest,
  InvestmentTransaction,
  RiskAlert,
  ScreenshotUpload,
  TransactionRequest,
  TransactionSummary,
} from '../types/transaction'

export function getTransactions() {
  return requestData<InvestmentTransaction[]>(api.get('/api/transactions'), mockInvestmentTransactions)
}

export function getTransactionSummary() {
  return requestData<TransactionSummary>(api.get('/api/transactions/summary'), mockTransactionSummary)
}

export function createTransaction(request: TransactionRequest) {
  return requestStrictData<InvestmentTransaction>(api.post('/api/transactions', request))
}

export function updateTransaction(id: number, request: TransactionRequest) {
  return requestStrictData<InvestmentTransaction>(api.patch(`/api/transactions/${id}`, request))
}

export function deleteTransaction(id: number) {
  return requestStrictData<void>(api.delete(`/api/transactions/${id}`))
}

export function getHoldingSummaries() {
  return requestData<HoldingSummary[]>(api.get('/api/holdings'), mockHoldingSummaries)
}

export function importTransactionsCsv(file: File) {
  const form = new FormData()
  form.append('file', file)
  return requestStrictData<CsvImportResult>(api.post('/api/transactions/import/csv', form))
}

export function uploadTransactionScreenshot(file: File) {
  const form = new FormData()
  form.append('file', file)
  return requestStrictData<ScreenshotUpload>(api.post('/api/uploads/screenshots', form))
}

export function getTransactionScreenshots() {
  return requestData<ScreenshotUpload[]>(api.get('/api/uploads/screenshots'), [])
}

export function getRiskAlerts() {
  return requestData<RiskAlert[]>(api.get('/api/portfolio/risk-alerts'), [])
}

export function getInvestmentMemos() {
  return requestData<InvestmentMemo[]>(api.get('/api/investment-memos'), [])
}

export function createInvestmentMemo(request: InvestmentMemoRequest) {
  return requestStrictData<InvestmentMemo>(api.post('/api/investment-memos', request))
}

export function updateInvestmentMemo(id: number, request: InvestmentMemoRequest) {
  return requestStrictData<InvestmentMemo>(api.patch(`/api/investment-memos/${id}`, request))
}

export function deleteInvestmentMemo(id: number) {
  return requestStrictData<void>(api.delete(`/api/investment-memos/${id}`))
}
