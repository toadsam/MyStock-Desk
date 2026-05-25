import { useMemo, useState } from 'react'
import { AlertTriangle, Edit2, FileDown, ImagePlus, Trash2, Upload } from 'lucide-react'
import {
  createInvestmentMemo,
  createTransaction,
  deleteInvestmentMemo,
  deleteTransaction,
  getHoldingSummaries,
  getInvestmentMemos,
  getRiskAlerts,
  getTransactionSummary,
  getTransactionScreenshots,
  getTransactions,
  importTransactionsCsv,
  updateTransaction,
  uploadTransactionScreenshot,
} from '../api/transactionApi'
import { Badge } from '../components/ui/Badge'
import { InvestmentChecklist } from '../components/beginner/InvestmentChecklist'
import { RecordExamplesCard } from '../components/beginner/RecordExamplesCard'
import { ReviewPromptCard } from '../components/beginner/ReviewPromptCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Tabs } from '../components/ui/Tabs'
import { Toast } from '../components/ui/Toast'
import { mockHoldingSummaries, mockInvestmentTransactions, mockTransactionSummary } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { HoldingSummary, InvestmentMemoRequest, InvestmentTransaction, TransactionRequest, TransactionType } from '../types/transaction'
import { cn } from '../utils/cn'
import { formatNumber, formatPercent, formatWon, isUp } from '../utils/format'

const transactionTypes: Array<{ label: string; value: TransactionType }> = [
  { label: '매수', value: 'BUY' },
  { label: '매도', value: 'SELL' },
  { label: '배당', value: 'DIVIDEND' },
  { label: '입금', value: 'DEPOSIT' },
  { label: '출금', value: 'WITHDRAWAL' },
]

const wizardSteps = ['유형', '종목', '금액', '이유', '확인']

const reasonTemplates = [
  {
    label: '장기 보유',
    reason: '사업 경쟁력과 실적 개선 가능성을 보고 6개월 이상 보유하며 확인할 계획입니다.',
    memo: '분기 실적과 주요 뉴스가 처음 생각과 달라지는지 확인',
    tags: ['장기보유', '실적확인'],
  },
  {
    label: '분할 매수',
    reason: '한 번에 크게 사지 않고 가격 변동을 보며 여러 번 나누어 기록하려고 합니다.',
    memo: '추가 기록 전 포트폴리오 비중과 현금 여유 확인',
    tags: ['분할매수', '비중관리'],
  },
  {
    label: '뉴스 확인',
    reason: '최근 뉴스가 실제 실적 변화로 이어지는지 확인하기 위해 관심 기록으로 남깁니다.',
    memo: '뉴스 제목보다 매출, 이익, 수주, 비용 변화 확인',
    tags: ['뉴스확인', '체크포인트'],
  },
  {
    label: '매도 복기',
    reason: '처음 세운 기준에 도달했거나 리스크가 커져 일부 또는 전체를 정리했습니다.',
    memo: '매도 후 다시 오르더라도 당시 기준이 합리적이었는지 복기',
    tags: ['매도복기', '리스크관리'],
  },
]

type ValidationWarning = {
  title: string
  description: string
  severity: 'ERROR' | 'WARN'
}

const emptyForm: TransactionRequest = {
  symbol: '005930',
  stockName: '삼성전자',
  transactionType: 'BUY',
  quantity: 10,
  price: 78600,
  fee: 590,
  tax: 0,
  transactionDate: '2026-05-25',
  reason: 'HBM 수요 증가와 메모리 업황 회복 기대',
  memo: '단기보다는 6개월 이상 보유 예정',
  tags: ['반도체', '장기보유', '실적개선'],
}

const emptyMemo: InvestmentMemoRequest = {
  symbol: '005930',
  memoType: 'CHECKPOINT',
  title: '삼성전자 확인 항목',
  content: 'HBM 공급 뉴스와 다음 분기 영업이익 개선 여부를 확인합니다.',
  checklist: ['HBM 공급 뉴스 확인', '분기 실적 발표 확인', '외국인 수급 확인'],
}

export default function TransactionsPage() {
  const { data: summary, setData: setSummary } = useAsyncData(getTransactionSummary, mockTransactionSummary)
  const { data: transactions, setData: setTransactions } = useAsyncData(getTransactions, mockInvestmentTransactions)
  const { data: holdings, setData: setHoldings } = useAsyncData(getHoldingSummaries, mockHoldingSummaries)
  const { data: riskAlerts, setData: setRiskAlerts } = useAsyncData(getRiskAlerts, [])
  const { data: memos, setData: setMemos } = useAsyncData(getInvestmentMemos, [])
  const { data: screenshots, setData: setScreenshots } = useAsyncData(getTransactionScreenshots, [])
  const [form, setForm] = useState<TransactionRequest>(emptyForm)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvestmentTransaction | null>(null)
  const [memoForm, setMemoForm] = useState<InvestmentMemoRequest>(emptyMemo)
  const [filter, setFilter] = useState<TransactionType | 'ALL'>('ALL')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [profitFilter, setProfitFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [csvMap, setCsvMap] = useState<Record<string, string>>({
    date: 'date',
    type: 'type',
    symbol: 'symbol',
    stockName: 'stockName',
    quantity: 'quantity',
    price: 'price',
    fee: 'fee',
    tax: 'tax',
    memo: 'memo',
    reason: 'reason',
    tags: 'tags',
  })
  const [screenshotName, setScreenshotName] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    if (filter !== 'ALL' && transaction.transactionType !== filter) return false
    if (symbolFilter && !`${transaction.symbol} ${transaction.stockName}`.toLowerCase().includes(symbolFilter.toLowerCase())) return false
    if (fromDate && transaction.transactionDate < fromDate) return false
    if (toDate && transaction.transactionDate > toDate) return false
    if (profitFilter === 'PROFIT' && transaction.realizedProfitLoss <= 0) return false
    if (profitFilter === 'LOSS' && transaction.realizedProfitLoss >= 0) return false
    return true
  }), [filter, fromDate, profitFilter, symbolFilter, toDate, transactions])

  const selectedHolding = holdings.find((holding) => holding.symbol === form.symbol) ?? holdings[0]

  const validationWarnings = useMemo(() => buildValidationWarnings(form, holdings), [form, holdings])
  const hasBlockingError = validationWarnings.some((warning) => warning.severity === 'ERROR')

  const refreshAnalysis = async () => {
    setTransactions(await getTransactions())
    setSummary(await getTransactionSummary())
    setHoldings(await getHoldingSummaries())
    setRiskAlerts(await getRiskAlerts())
  }

  const submit = async () => {
    if (hasBlockingError) {
      setToast('필수 입력값을 먼저 확인해 주세요.')
      return
    }
    try {
      if (editingId) {
        await updateTransaction(editingId, form)
        setToast('거래 기록이 수정되었습니다.')
      } else {
        await createTransaction(form)
        setToast('거래 기록이 저장되었습니다.')
      }
      setEditingId(null)
      setForm(emptyForm)
      setWizardStep(0)
      await refreshAnalysis()
    } catch (exception) {
      setToast(exception instanceof Error ? exception.message : '투자 기록 저장에 실패했습니다.')
    }
  }

  const startEdit = (transaction: InvestmentTransaction) => {
    setEditingId(transaction.id)
    setWizardStep(0)
    setForm({
      symbol: transaction.symbol,
      stockName: transaction.stockName,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      price: transaction.price,
      fee: transaction.fee,
      tax: transaction.tax,
      transactionDate: transaction.transactionDate,
      memo: transaction.memo,
      reason: transaction.reason,
      tags: transaction.tags,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction(deleteTarget.id)
      setDeleteTarget(null)
      setToast('거래 기록이 삭제되었습니다.')
      await refreshAnalysis()
    } catch (exception) {
      setToast(exception instanceof Error ? exception.message : '거래 기록 삭제에 실패했습니다.')
    }
  }

  const handleCsv = async (file: File) => {
    const text = await file.text()
    const rows = text.split(/\r?\n/).filter(Boolean).map((line) => line.split(','))
    const headers = rows[0] ?? []
    setCsvHeaders(headers)
    setCsvRows(rows.slice(1))
    setCsvPreview(rows.slice(0, 6))
    setCsvFileName(file.name)
    setToast('CSV 미리보기를 불러왔습니다. 컬럼 매핑을 확인한 뒤 등록하세요.')
  }

  const downloadSampleCsv = () => {
    const sample = [
      'date,type,symbol,stockName,quantity,price,fee,tax,memo,reason,tags',
      '2026-05-25,BUY,005930,삼성전자,10,78600,590,0,6개월 이상 보유 예정,HBM 수요 증가 기대,반도체|장기보유',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'stockflow-transactions-sample.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importMappedCsv = async () => {
    if (csvRows.length === 0) {
      setToast('먼저 CSV 파일을 선택하세요.')
      return
    }
    try {
      const mappedCsv = buildMappedCsv(csvHeaders, csvRows, csvMap)
      const mappedFile = new File([mappedCsv], csvFileName || 'transactions.csv', { type: 'text/csv' })
      const result = await importTransactionsCsv(mappedFile)
      setToast(result.errors.length ? `${result.importedCount}건 등록, ${result.errors.length}건 확인 필요` : `${result.importedCount}건의 거래 기록을 등록했습니다.`)
      await refreshAnalysis()
    } catch (exception) {
      setToast(exception instanceof Error ? exception.message : 'CSV 등록에 실패했습니다.')
    }
  }

  const handleScreenshot = async (file: File) => {
    setScreenshotName(file.name)
    setScreenshotPreview(URL.createObjectURL(file))
    try {
      await uploadTransactionScreenshot(file)
      setScreenshots(await getTransactionScreenshots())
      setToast('거래내역 스크린샷이 저장되었습니다.')
    } catch {
      setToast('이미지 미리보기를 준비했습니다. OCR 자동 인식은 추후 지원 예정입니다.')
    }
  }

  const submitMemo = async () => {
    try {
      const saved = await createInvestmentMemo(memoForm)
      setMemos((previous) => [saved, ...previous])
      setMemoForm(emptyMemo)
      setToast('투자 메모가 저장되었습니다.')
    } catch (exception) {
      setToast(exception instanceof Error ? exception.message : '투자 메모 저장에 실패했습니다.')
    }
  }

  const removeMemo = async (id: number) => {
    try {
      await deleteInvestmentMemo(id)
      setMemos((previous) => previous.filter((memo) => memo.id !== id))
      setToast('투자 메모가 삭제되었습니다.')
    } catch {
      setToast('투자 메모 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-4">
      <Toast message={toast} onClose={() => setToast(null)} />

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-sky-300">투자 기록 관리</div>
            <h1 className="mt-2 text-3xl font-black text-slate-50">거래 기록 입력/관리</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              실제 주문 실행 없이 사용자가 입력한 거래 기록, 투자 이유, 수수료, 세금을 바탕으로 보유 종목과 포트폴리오 판단 자료를 정리합니다.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
            실제 주문·체결 기능은 제공하지 않습니다.
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="이번 달 거래" value={`${summary.monthlyTransactionCount}건`} detail="직접 입력 기준" />
        <StatCard label="총 매수" value={formatWon(summary.totalBuyAmount)} />
        <StatCard label="총 매도" value={formatWon(summary.totalSellAmount)} />
        <StatCard label="실현 손익" value={formatWon(summary.realizedProfitLoss)} change={summary.realizedProfitLoss > 0 ? 2.4 : -1.2} />
        <StatCard label="수수료 합계" value={formatWon(summary.totalFee)} />
      </div>

      {riskAlerts.length > 0 && (
        <Card title="리스크/쏠림 알림">
          <div className="grid gap-3 md:grid-cols-3">
            {riskAlerts.map((alert) => (
              <div key={`${alert.title}-${alert.description}`} className="rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-4">
                <div className="flex items-center gap-2 font-bold text-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  {alert.title}
                </div>
                <p className="mt-2 text-sm text-slate-400">{alert.description}</p>
                <Badge tone={alert.severity === 'HIGH' ? 'red' : alert.severity === 'MEDIUM' ? 'blue' : 'slate'} className="mt-3">
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card title={editingId ? '거래 기록 수정' : '거래 기록 추가'}>
          <OnboardingStrip />
          <StepIndicator step={wizardStep} />
          <div className="mt-5">
            <WizardStep
              step={wizardStep}
              form={form}
              holdings={holdings}
              warnings={validationWarnings}
              onChange={setForm}
            />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="w-full" disabled={wizardStep === 0} onClick={() => setWizardStep((step) => Math.max(step - 1, 0))}>
              이전
            </Button>
            {wizardStep < wizardSteps.length - 1 ? (
              <Button className="w-full sm:col-span-2" onClick={() => setWizardStep((step) => Math.min(step + 1, wizardSteps.length - 1))}>
                다음 단계
              </Button>
            ) : (
              <Button className="w-full sm:col-span-2" onClick={submit} disabled={hasBlockingError}>
                {editingId ? '수정 내용 저장' : '투자 기록 저장'}
              </Button>
            )}
            {editingId && (
              <Button variant="ghost" className="w-full sm:col-span-3" onClick={() => { setEditingId(null); setForm(emptyForm); setWizardStep(0) }}>
                수정 취소
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="증권사 거래내역 CSV 업로드">
            <p className="text-sm text-slate-400">CSV 파일을 업로드하면 거래 기록을 한 번에 등록할 수 있습니다.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                <Upload className="h-4 w-4" />
                CSV 업로드
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => event.target.files?.[0] && handleCsv(event.target.files[0])} />
              </label>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200" onClick={downloadSampleCsv}>
                <FileDown className="h-4 w-4" />
                샘플 양식 다운로드
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">date,type,symbol,stockName,quantity,price,fee,tax,memo,reason,tags</p>
            {csvPreview.length > 0 && (
              <>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {['date', 'type', 'symbol', 'stockName', 'quantity', 'price', 'fee', 'tax', 'memo', 'reason', 'tags'].map((field) => (
                    <label key={field} className="text-xs text-slate-400">
                      {field}
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none"
                        value={csvMap[field] ?? ''}
                        onChange={(event) => setCsvMap((previous) => ({ ...previous, [field]: event.target.value }))}
                      >
                        <option value="">선택 안 함</option>
                        {csvHeaders.map((header) => <option key={header} value={header}>{header}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                  {csvPreview.map((row, index) => (
                    <div key={`${row.join('-')}-${index}`} className="grid grid-cols-3 gap-2 border-b border-slate-800 px-3 py-2 text-xs text-slate-400 last:border-0">
                      <span>{row[0]}</span>
                      <span>{row[2] ?? row[1]}</span>
                      <span className="truncate">{row[3] ?? row[8]}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full" onClick={importMappedCsv}>매핑 확인 후 등록</Button>
              </>
            )}
          </Card>

          <Card title="거래내역 스크린샷 보관">
            <p className="text-sm text-slate-400">증권사 앱 캡처 이미지를 저장하고, 필요한 내용은 직접 입력할 수 있습니다. OCR 자동 인식은 추후 지원 예정입니다.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-950">
                <ImagePlus className="h-4 w-4" />
                이미지 업로드
                <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && handleScreenshot(event.target.files[0])} />
              </label>
              <button type="button" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">수동 입력하기</button>
            </div>
            {screenshotName && <div className="mt-3 text-sm text-slate-300">{screenshotName}</div>}
            {screenshotPreview && <img src={screenshotPreview} alt="거래내역 스크린샷 미리보기" className="mt-3 max-h-40 rounded-xl border border-slate-800 object-contain" />}
            {screenshots.length > 0 && (
              <div className="mt-4 space-y-2">
                {screenshots.slice(0, 5).map((item) => (
                  <div key={item.storedFileName} className="rounded-xl border border-slate-800 bg-slate-950/25 px-3 py-2 text-sm">
                    <div className="font-semibold text-slate-200">{item.originalFileName}</div>
                    <div className="text-xs text-slate-500">{new Date(item.uploadedAt).toLocaleString('ko-KR')}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="투자 메모">
            <div className="grid gap-3">
              <Field label="종목코드" value={memoForm.symbol} onChange={(value) => setMemoForm({ ...memoForm, symbol: value })} />
              <label>
                <span className="text-sm text-slate-400">메모 유형</span>
                <select className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none" value={memoForm.memoType} onChange={(event) => setMemoForm({ ...memoForm, memoType: event.target.value as InvestmentMemoRequest['memoType'] })}>
                  <option value="BUY_REASON">매수 이유</option>
                  <option value="SELL_REASON">매도 이유</option>
                  <option value="CHECKPOINT">체크포인트</option>
                  <option value="RISK">리스크</option>
                  <option value="GENERAL">일반</option>
                </select>
              </label>
              <Field label="제목" value={memoForm.title} onChange={(value) => setMemoForm({ ...memoForm, title: value })} />
              <TextArea label="내용" value={memoForm.content} onChange={(value) => setMemoForm({ ...memoForm, content: value })} />
              <TextArea label="체크리스트" value={memoForm.checklist.join('\n')} onChange={(value) => setMemoForm({ ...memoForm, checklist: value.split('\n').filter(Boolean) })} />
              <Button onClick={submitMemo}>투자 메모 저장</Button>
            </div>
            {memos.length === 0 && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm text-slate-400">
                아직 저장한 메모가 없습니다. 매수 이유, 매도 이유, 확인할 리스크를 짧게 남기면 나중에 복기하기 쉽습니다.
              </div>
            )}
            {memos.length > 0 && (
              <div className="mt-4 space-y-2">
                {memos.slice(0, 4).map((memo) => (
                  <div key={memo.id} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-100">{memo.title}</div>
                        <div className="text-xs text-slate-500">{memo.symbol} · {memo.memoType}</div>
                      </div>
                      <button type="button" className="text-slate-500 hover:text-red-300" onClick={() => removeMemo(memo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{memo.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="기록 입력 가이드">
            <div className="space-y-3 text-sm text-slate-400">
              <p>투자 이유는 나중에 판단을 복기하기 위한 메모입니다. 짧아도 한 문장으로 남기는 것이 좋습니다.</p>
              <p>수수료와 세금은 실제 수익률과 차이를 만들 수 있으니 가능하면 거래내역에서 확인해 입력하세요.</p>
              <p>매도 기록을 남기면 실현손익을 계산할 수 있습니다. 손익보다 처음 세운 기준이 맞았는지도 함께 보세요.</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <InvestmentChecklist />
        <ReviewPromptCard transactions={transactions} />
        <RecordExamplesCard />
      </div>

      <Card title="거래내역 필터">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <Tabs items={[{ label: '전체', value: 'ALL' }, ...transactionTypes]} value={filter} onChange={(value) => setFilter(value as TransactionType | 'ALL')} className="flex-wrap" />
          <input className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none" placeholder="종목명/코드 검색" value={symbolFilter} onChange={(event) => setSymbolFilter(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <Tabs items={[{ label: '전체', value: 'ALL' }, { label: '수익', value: 'PROFIT' }, { label: '손실', value: 'LOSS' }]} value={profitFilter} onChange={(value) => setProfitFilter(value as 'ALL' | 'PROFIT' | 'LOSS')} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <TransactionTimeline transactions={filteredTransactions} onEdit={startEdit} onDelete={setDeleteTarget} />
        {selectedHolding ? <HoldingSummaryCard holding={selectedHolding} /> : <EmptyHoldingCard />}
      </div>

      {deleteTarget && (
        <Card title="거래 기록 삭제 확인">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-400">
              {deleteTarget.stockName} {labelFor(deleteTarget.transactionType)} 기록을 삭제합니다. 삭제 후 포트폴리오는 전체 거래 기록 기준으로 다시 계산됩니다.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
              <Button variant="sell" onClick={confirmDelete}>기록 삭제</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        본 서비스는 투자 기록 관리 및 참고용 정보 제공을 목적으로 하며, 투자 판단의 최종 책임은 본인에게 있습니다. 실제 주문·체결 기능은 제공하지 않습니다.
      </div>
    </div>
  )
}

function OnboardingStrip() {
  return (
    <div className="grid gap-2 rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-xs text-slate-300 md:grid-cols-3">
      <div><span className="font-bold text-blue-200">1. 기록 선택</span><br />매수, 매도, 배당, 입출금 중 하나를 고릅니다.</div>
      <div><span className="font-bold text-blue-200">2. 근거 남기기</span><br />왜 기록하는지 한 문장으로 적습니다.</div>
      <div><span className="font-bold text-blue-200">3. 분석 확인</span><br />저장 후 보유 수량과 포트폴리오 변화를 봅니다.</div>
    </div>
  )
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mt-4 grid grid-cols-5 gap-2">
      {wizardSteps.map((label, index) => (
        <div
          key={label}
          className={cn(
            'rounded-xl border px-2 py-2 text-center text-xs font-semibold',
            index <= step ? 'border-blue-400/40 bg-blue-500/15 text-blue-100' : 'border-slate-800 bg-slate-950/30 text-slate-500',
          )}
        >
          {index + 1}. {label}
        </div>
      ))}
    </div>
  )
}

function WizardStep({
  step,
  form,
  holdings,
  warnings,
  onChange,
}: {
  step: number
  form: TransactionRequest
  holdings: HoldingSummary[]
  warnings: ValidationWarning[]
  onChange: (form: TransactionRequest) => void
}) {
  const holding = holdings.find((item) => item.symbol === form.symbol)

  if (step === 0) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">거래 유형</label>
          <Tabs items={transactionTypes} value={form.transactionType} onChange={(value) => onChange({ ...form, transactionType: value as TransactionType })} className="mt-2 flex-wrap" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm text-slate-400">
          실제 주문을 넣는 화면이 아니라 이미 발생한 거래, 배당, 현금 흐름을 기록하는 화면입니다.
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="종목명" value={form.stockName} onChange={(value) => onChange({ ...form, stockName: value })} />
        <Field label="종목코드" value={form.symbol} onChange={(value) => onChange({ ...form, symbol: value })} />
        <Field label="거래 날짜" type="date" value={form.transactionDate} onChange={(value) => onChange({ ...form, transactionDate: value })} className="md:col-span-2" />
        {holding && (
          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm text-slate-400">
            현재 기록상 {holding.stockName} 보유 수량은 <span className="font-bold text-slate-100">{formatNumber(holding.quantity)}주</span>입니다.
          </div>
        )}
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="수량" type="number" value={String(form.quantity)} suffix="주" onChange={(value) => onChange({ ...form, quantity: Number(value) })} />
        <Field label="가격" type="number" value={String(form.price)} suffix="원" onChange={(value) => onChange({ ...form, price: Number(value) })} />
        <Field label="수수료" type="number" value={String(form.fee)} suffix="원" onChange={(value) => onChange({ ...form, fee: Number(value) })} />
        <Field label="세금" type="number" value={String(form.tax)} suffix="원" onChange={(value) => onChange({ ...form, tax: Number(value) })} />
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm text-slate-400">
          총 거래금액 예상: <span className="font-bold text-slate-100">{formatWon((form.quantity || 0) * (form.price || 0))}</span>
          <span className="ml-2 text-xs text-slate-500">수수료와 세금은 별도로 손익 계산에 반영됩니다.</span>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
          {reasonTemplates.map((template) => (
            <button
              key={template.label}
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-left hover:border-blue-400/60"
              onClick={() => onChange({ ...form, reason: template.reason, memo: template.memo, tags: template.tags })}
            >
              <div className="text-sm font-bold text-slate-100">{template.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">{template.reason}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea label="투자 이유" value={form.reason} onChange={(value) => onChange({ ...form, reason: value })} />
          <TextArea label="메모" value={form.memo} onChange={(value) => onChange({ ...form, memo: value })} />
          <Field label="태그" value={form.tags.join(', ')} onChange={(value) => onChange({ ...form, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className="md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewLine label="유형" value={labelFor(form.transactionType)} />
        <ReviewLine label="종목" value={`${form.stockName} (${form.symbol})`} />
        <ReviewLine label="날짜" value={form.transactionDate} />
        <ReviewLine label="수량과 가격" value={`${formatNumber(form.quantity)}주 · ${formatWon(form.price)}`} />
        <ReviewLine label="수수료와 세금" value={`${formatWon(form.fee)} · ${formatWon(form.tax)}`} />
        <ReviewLine label="태그" value={form.tags.length ? form.tags.map((tag) => `#${tag}`).join(' ') : '없음'} />
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
        <div className="text-sm font-bold text-slate-100">투자 이유</div>
        <p className="mt-2 text-sm text-slate-400">{form.reason || '아직 입력하지 않았습니다.'}</p>
      </div>
      <ValidationPanel warnings={warnings} />
    </div>
  )
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function ValidationPanel({ warnings }: { warnings: ValidationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-sm text-emerald-100">
        필수 입력값이 확인되었습니다. 저장 후 포트폴리오 계산이 갱신됩니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={`${warning.title}-${warning.description}`}
          className={cn(
            'rounded-xl border p-3 text-sm',
            warning.severity === 'ERROR' ? 'border-red-500/25 bg-red-500/8 text-red-100' : 'border-yellow-500/25 bg-yellow-500/8 text-yellow-100',
          )}
        >
          <div className="font-bold">{warning.title}</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">{warning.description}</p>
        </div>
      ))}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', suffix, className }: { label: string; value: string; onChange: (value: string) => void; type?: string; suffix?: string; className?: string }) {
  return (
    <label className={className}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="mt-2 flex items-center rounded-xl border border-slate-700 bg-slate-950/40 px-3">
        <input className="min-h-11 w-full bg-transparent text-sm text-slate-100 outline-none" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
        {suffix && <span className="ml-2 text-xs text-slate-500">{suffix}</span>}
      </span>
    </label>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-sm text-slate-400">{label}</span>
      <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TransactionTimeline({ transactions, onEdit, onDelete }: { transactions: InvestmentTransaction[]; onEdit: (transaction: InvestmentTransaction) => void; onDelete: (transaction: InvestmentTransaction) => void }) {
  return (
    <Card title="거래내역 타임라인">
      <div className="space-y-3">
        {transactions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/25 p-6 text-center">
            <div className="text-base font-bold text-slate-100">아직 표시할 거래 기록이 없습니다</div>
            <p className="mt-2 text-sm text-slate-400">첫 매수, 매도, 배당, 입출금 기록을 저장하면 보유 종목과 수익률이 자동으로 계산됩니다.</p>
          </div>
        )}
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">{transaction.transactionDate.replaceAll('-', '.')}</div>
                <div className="mt-1 text-lg font-bold text-slate-100">
                  {transaction.stockName} {labelFor(transaction.transactionType)} {formatNumber(transaction.quantity)}주 · {formatWon(transaction.price)}
                </div>
                <div className="mt-2 text-sm text-slate-400">투자 이유: {transaction.reason || '기록 없음'}</div>
                {transaction.memo && <div className="mt-1 text-sm text-slate-500">메모: {transaction.memo}</div>}
              </div>
              <div className="text-right">
                <Badge tone={transaction.transactionType === 'BUY' ? 'red' : transaction.transactionType === 'SELL' ? 'blue' : 'green'}>
                  {labelFor(transaction.transactionType)}
                </Badge>
                <div className="mt-3 text-sm text-slate-300">{formatWon(transaction.totalAmount)}</div>
                <div className={cn('text-sm font-semibold', isUp(transaction.realizedProfitLoss) ? 'text-emerald-400' : 'text-red-400')}>
                  실현손익 {formatWon(transaction.realizedProfitLoss)}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-blue-400 hover:text-blue-300" onClick={() => onEdit(transaction)} title="기록 수정">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-red-400 hover:text-red-300" onClick={() => onDelete(transaction)} title="기록 삭제">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {transaction.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">#{tag}</span>)}
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">수수료 {formatWon(transaction.fee)}</span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">세금 {formatWon(transaction.tax)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function EmptyHoldingCard() {
  return (
    <Card title="종목별 거래 요약">
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/25 p-6 text-sm text-slate-400">
        거래 기록이 쌓이면 현재 보유 수량, 평균 매수가, 평가손익, 실현손익을 종목별로 보여줍니다.
      </div>
    </Card>
  )
}

function HoldingSummaryCard({ holding }: { holding: HoldingSummary }) {
  return (
    <Card title={`${holding.stockName} 거래 요약`}>
      <div className="space-y-3 text-sm">
        <Line label="현재 보유 수량" value={`${formatNumber(holding.quantity)}주`} />
        <Line label="평균 매수가" value={formatWon(holding.averagePrice)} />
        <Line label="현재가" value={formatWon(holding.currentPrice)} />
        <Line label="평가금액" value={formatWon(holding.evaluationAmount)} />
        <Line label="평가손익" value={formatWon(holding.profitLoss)} tone={holding.profitLoss >= 0 ? 'up' : 'down'} />
        <Line label="수익률" value={formatPercent(holding.returnRate)} tone={holding.returnRate >= 0 ? 'up' : 'down'} />
        <Line label="실현손익" value={formatWon(holding.realizedProfitLoss)} tone={holding.realizedProfitLoss >= 0 ? 'up' : 'down'} />
        <Line label="포트폴리오 비중" value={formatPercent(holding.weight, false)} />
      </div>
    </Card>
  )
}

function Line({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className={cn('font-semibold text-slate-100', tone === 'up' && 'text-emerald-400', tone === 'down' && 'text-red-400')}>{value}</span>
    </div>
  )
}

function labelFor(type: TransactionType) {
  return transactionTypes.find((item) => item.value === type)?.label ?? type
}

function buildValidationWarnings(form: TransactionRequest, holdings: HoldingSummary[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const isStockTransaction = form.transactionType === 'BUY' || form.transactionType === 'SELL' || form.transactionType === 'DIVIDEND'
  const holding = holdings.find((item) => item.symbol === form.symbol)
  const transactionDate = new Date(form.transactionDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (isStockTransaction && !form.stockName.trim()) {
    warnings.push({ severity: 'ERROR', title: '종목명이 필요합니다', description: '종목명은 나중에 타임라인과 보유 종목 분석에서 사용됩니다.' })
  }

  if (isStockTransaction && !form.symbol.trim()) {
    warnings.push({ severity: 'ERROR', title: '종목코드가 필요합니다', description: '같은 이름의 종목을 구분하려면 종목코드를 입력해야 합니다.' })
  }

  if ((form.transactionType === 'BUY' || form.transactionType === 'SELL') && form.quantity <= 0) {
    warnings.push({ severity: 'ERROR', title: '수량을 확인해 주세요', description: '매수와 매도 기록은 1주 이상이어야 계산할 수 있습니다.' })
  }

  if ((form.transactionType === 'BUY' || form.transactionType === 'SELL' || form.transactionType === 'DIVIDEND') && form.price <= 0) {
    warnings.push({ severity: 'ERROR', title: '가격을 확인해 주세요', description: '가격이 0원이면 거래금액과 수익률 계산이 어렵습니다.' })
  }

  if (!form.transactionDate || Number.isNaN(transactionDate.getTime())) {
    warnings.push({ severity: 'ERROR', title: '거래 날짜가 필요합니다', description: '거래 날짜를 기준으로 타임라인과 기간 필터가 동작합니다.' })
  } else if (transactionDate > today) {
    warnings.push({ severity: 'WARN', title: '미래 날짜입니다', description: '아직 발생하지 않은 거래라면 실제 거래 후 기록으로 남기는 편이 좋습니다.' })
  }

  if (form.transactionType === 'SELL' && holding && form.quantity > holding.quantity) {
    warnings.push({ severity: 'WARN', title: '보유 수량보다 큰 매도 기록입니다', description: `현재 기록상 보유 수량은 ${formatNumber(holding.quantity)}주입니다. 이전 매수 기록이 빠졌는지 확인해 주세요.` })
  }

  if ((form.transactionType === 'BUY' || form.transactionType === 'SELL') && form.reason.trim().length < 8) {
    warnings.push({ severity: 'WARN', title: '투자 이유가 짧습니다', description: '초보자일수록 왜 샀는지 또는 왜 팔았는지를 한 문장 이상 남기는 것이 좋습니다.' })
  }

  if ((form.transactionType === 'BUY' || form.transactionType === 'SELL') && form.fee === 0) {
    warnings.push({ severity: 'WARN', title: '수수료가 0원입니다', description: '증권사 거래내역에서 수수료를 확인해 입력하면 실제 손익과 더 가까워집니다.' })
  }

  if (holding && form.price > 0 && Math.abs(form.price - holding.currentPrice) / holding.currentPrice > 0.35) {
    warnings.push({ severity: 'WARN', title: '현재가와 차이가 큽니다', description: '기록 가격이 현재가와 많이 다릅니다. 과거 거래라면 정상일 수 있고, 오타라면 수정해 주세요.' })
  }

  return warnings
}

function buildMappedCsv(headers: string[], rows: string[][], csvMap: Record<string, string>) {
  const canonical = ['date', 'type', 'symbol', 'stockName', 'quantity', 'price', 'fee', 'tax', 'memo', 'reason', 'tags']
  const headerIndexes = Object.fromEntries(headers.map((header, index) => [header, index]))
  const outputRows = rows.map((row) => canonical.map((field) => {
    const mappedHeader = csvMap[field]
    const value = mappedHeader ? row[headerIndexes[mappedHeader]] : ''
    return value?.includes(',') ? `"${value.replaceAll('"', '""')}"` : (value ?? '')
  }))
  return [canonical.join(','), ...outputRows.map((row) => row.join(','))].join('\n')
}
