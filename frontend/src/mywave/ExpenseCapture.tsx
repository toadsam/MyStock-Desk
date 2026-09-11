import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  ImageUp,
  Loader2,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createMyWaveExpenseTemplate,
  createMyWaveExpensesBulk,
  deleteMyWaveExpenseTemplate,
  getMyWaveCashFlow,
  getMyWaveExpenseTemplates,
  getMyWaveImportStatus,
  getMyWaveTemplateSuggestions,
  logMyWaveExpenseTemplate,
  parseMyWaveExpenseImage,
  parseMyWaveExpenseSms,
  suggestMyWaveMerchants,
} from './myWaveApi'
import type {
  MyWaveCashFlowResponse,
  MyWaveExpenseTemplateResponse,
  MyWaveImportStatusResponse,
  MyWaveMerchantSuggestionResponse,
  MyWaveParseResultResponse,
  MyWaveTemplateSuggestionResponse,
} from './myWaveApi'
import { won } from './format'
import { Amount } from './Amount'
import { Beluga, BelugaEmpty, BelugaSays } from './Beluga'
import { Card, ListRow, PrimaryButton } from './uiKit'

const EXPENSE_CATEGORIES = ['배달비', '쇼핑', '식비', '카페', '교통', '구독', '기타']

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response
    if (response?.data?.error?.message) return response.data.error.message
  }
  return error instanceof Error ? error.message : fallback
}

/** 확인 화면에서 한 줄이 가지는 상태. 후보 자체를 고칠 수 있어야 한다. */
type ReviewRow = {
  key: string
  checked: boolean
  category: string
  merchant: string
  amount: number
  spentDate: string
  source: string
  rawText?: string | null
  duplicate: boolean
  warning?: string | null
}

// ---------------------------------------------------------------------------
// 1·2단계 — 문자 붙여넣기 / 캡처 올리기 + 공용 확인 화면
// ---------------------------------------------------------------------------

export function ExpenseImportCard({ onSaved }: { onSaved: () => void }) {
  const [mode, setMode] = useState<'sms' | 'image'>('sms')
  const [text, setText] = useState('')
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [result, setResult] = useState<MyWaveParseResultResponse | null>(null)
  const [status, setStatus] = useState<MyWaveImportStatusResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  // 좋은 소식과 나쁜 소식에 같은 얼굴을 쓰지 않는다.
  const [messageTone, setMessageTone] = useState<'good' | 'bad'>('good')
  const fileRef = useRef<HTMLInputElement>(null)

  function say(text: string, tone: 'good' | 'bad' = 'good') {
    setMessage(text)
    setMessageTone(tone)
  }

  useEffect(() => {
    getMyWaveImportStatus().then(setStatus).catch(() => setStatus(null))
  }, [])

  /** 문자와 캡처가 같은 결과 모양으로 돌아오므로 확인 화면 준비도 한 곳에서 한다. */
  function receive(parsed: MyWaveParseResultResponse) {
    setResult(parsed)
    setRows(parsed.items.map((item, index) => ({
      key: `${index}-${item.merchant}-${item.amount}`,
      // 이미 등록된 것으로 보이면 기본으로 꺼 둔다. 중복 등록이 가장 많이 터지는 문제다.
      checked: !item.duplicate,
      category: item.category,
      merchant: item.merchant,
      amount: Number(item.amount),
      spentDate: item.spentDate,
      source: item.source,
      rawText: item.rawText,
      duplicate: item.duplicate,
      warning: item.warning,
    })))
  }

  async function runSms() {
    if (!text.trim()) {
      say('붙여넣은 내용이 없어요. 카드 승인 문자를 그대로 붙여넣어 주세요.', 'bad')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      receive(await parseMyWaveExpenseSms(text))
    } catch (error) {
      say(errorMessage(error, '문자를 읽지 못했어요.'), 'bad')
    } finally {
      setBusy(false)
    }
  }

  async function runImage(file: File) {
    setBusy(true)
    setMessage('')
    try {
      receive(await parseMyWaveExpenseImage(file))
      setStatus(await getMyWaveImportStatus())
    } catch (error) {
      say(errorMessage(error, '캡처를 읽지 못했어요.'), 'bad')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const checked = rows.filter((row) => row.checked)
  const checkedTotal = checked.reduce((sum, row) => sum + row.amount, 0)

  async function save() {
    if (checked.length === 0) {
      say('저장할 항목을 하나도 고르지 않으셨어요.', 'bad')
      return
    }
    if (checked.some((row) => !row.merchant.trim() || row.amount <= 0)) {
      say('가게 이름과 금액이 비어 있는 항목이 있어요.', 'bad')
      return
    }
    setBusy(true)
    try {
      await createMyWaveExpensesBulk(checked.map((row) => ({
        category: row.category,
        merchant: row.merchant.trim(),
        amount: row.amount,
        spentDate: row.spentDate,
        memo: row.source === 'IMAGE' ? '캡처로 등록' : '문자로 등록',
      })))
      say(`${checked.length}건 기록했어요. 돈 흐름에 바로 반영했어요.`)
      setRows([])
      setResult(null)
      setText('')
      onSaved()
    } catch (error) {
      say(errorMessage(error, '저장하지 못했어요.'), 'bad')
    } finally {
      setBusy(false)
    }
  }

  function patch(key: string, change: Partial<ReviewRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))
  }

  const imageDisabled = !status?.imageParsingAvailable || (status?.remainingImageQuota ?? 0) <= 0

  return (
    <Card title="간편 입력">
      <div className="space-y-4">
        <div className="flex gap-1 rounded-[14px] bg-slate-100 p-1">
          {([['sms', ClipboardPaste, '카드 문자'], ['image', ImageUp, '내역 캡처']] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`pressable flex flex-1 items-center justify-center gap-1.5 rounded-[11px] py-2.5 text-[14px] font-bold ${mode === key ? 'bg-white text-slate-900' : 'text-slate-400'}`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {mode === 'sms' ? (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={5}
              placeholder={'카드 승인 문자를 붙여넣으세요. 여러 건을 한 번에 붙여넣어도 됩니다.\n\n[Web발신] 신한카드 5,600원 승인 09/11 08:32 메가커피'}
              className="form-input"
            />
            <PrimaryButton onClick={runSms} disabled={busy}>
              {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : '문자 읽기'}
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void runImage(file)
              }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy || imageDisabled}
              className="pressable grid h-36 w-full place-items-center rounded-[14px] bg-slate-100 text-blue-700 disabled:text-slate-400"
            >
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <span className="text-center">
                  <ImageUp className="mx-auto mb-2 h-7 w-7" />
                  <span className="block text-[15px] font-bold">결제 내역 화면 캡처 올리기</span>
                  <span className="mt-1 block text-[13px] font-medium text-slate-400">하루치가 한 번에 등록돼요</span>
                </span>
              )}
            </button>
            {status && (
              <BelugaSays mood={status.imageParsingAvailable ? 'hello' : 'concern'} size="xs" tone="quiet">
                {status.imageParsingAvailable
                  ? `카드사 앱의 이용내역 화면을 그대로 캡처해 주세요. 오늘 ${status.remainingImageQuota}장 남았고, 이미지는 읽고 나서 바로 지워요.`
                  : '캡처 읽기는 아직 준비되지 않았어요. 지금은 카드 문자 붙여넣기를 이용해 주세요.'}
              </BelugaSays>
            )}
          </div>
        )}

        {message && (
          <BelugaSays mood={messageTone === 'good' ? 'cheer' : 'concern'} size="sm">
            {message}
          </BelugaSays>
        )}

        {result && (
          <ReviewList
            result={result}
            rows={rows}
            checkedCount={checked.length}
            checkedTotal={checkedTotal}
            busy={busy}
            onPatch={patch}
            onSave={save}
          />
        )}
      </div>
    </Card>
  )
}

/** 어느 경로로 들어왔든 저장 직전에 거치는 한 화면. */
function ReviewList({
  result,
  rows,
  checkedCount,
  checkedTotal,
  busy,
  onPatch,
  onSave,
}: {
  result: MyWaveParseResultResponse
  rows: ReviewRow[]
  checkedCount: number
  checkedTotal: number
  busy: boolean
  onPatch: (key: string, change: Partial<ReviewRow>) => void
  onSave: () => void
}) {
  return (
    <div className="space-y-3 rounded-[16px] bg-slate-50 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[15px] font-bold text-slate-900">읽어낸 내역 {result.parsedCount}건</span>
        <span className="text-[13px] font-semibold text-slate-400">선택 {checkedCount}건 · {won(checkedTotal)}</span>
      </div>

      {!result.totalMatched && (
        <div className="flex gap-2 rounded-[12px] bg-red-50 px-3.5 py-3 text-[13px] font-semibold text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>화면 합계와 항목의 합이 달라요. 금액 자릿수를 확인해 주세요.</span>
        </div>
      )}

      {result.warnings.map((warning) => (
        <p key={warning} className="text-[12px] font-medium leading-5 text-slate-400">{warning}</p>
      ))}

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`rounded-[14px] bg-white p-3 ${row.duplicate ? 'ring-1 ring-red-200' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onPatch(row.key, { checked: !row.checked })}
                aria-label={row.checked ? '선택 해제' : '선택'}
                className={`pressable mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-[7px] ${row.checked ? 'bg-blue-700 text-white' : 'bg-slate-200'}`}
              >
                {row.checked && <Check className="h-4 w-4" />}
              </button>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_7rem]">
                <input
                  value={row.merchant}
                  onChange={(event) => onPatch(row.key, { merchant: event.target.value })}
                  className="form-input !h-10 !rounded-xl"
                />
                <input
                  type="number"
                  value={row.amount}
                  onChange={(event) => onPatch(row.key, { amount: Number(event.target.value) })}
                  className="form-input !h-10 !rounded-xl text-right"
                />
                <select
                  value={row.category}
                  onChange={(event) => onPatch(row.key, { category: event.target.value })}
                  className="form-input !h-10 !rounded-xl"
                >
                  {EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input
                  type="date"
                  value={row.spentDate}
                  onChange={(event) => onPatch(row.key, { spentDate: event.target.value })}
                  className="form-input !h-10 !rounded-xl"
                />
              </div>
            </div>
            {(row.duplicate || row.warning) && (
              <p className="mt-2 pl-9 text-[12px] font-semibold text-red-500">{row.warning ?? '이미 등록된 것 같아요.'}</p>
            )}
            {row.rawText && (
              <p className="mt-1 truncate pl-9 text-[12px] font-medium text-slate-300">{row.rawText}</p>
            )}
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onSave} disabled={busy || checkedCount === 0}>
        {checkedCount}건 저장
      </PrimaryButton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3단계 — 가게 이름 자동완성
// ---------------------------------------------------------------------------

export function MerchantAutocomplete({
  value,
  onChange,
  onPick,
}: {
  value: string
  onChange: (value: string) => void
  onPick: (suggestion: MyWaveMerchantSuggestionResponse) => void
}) {
  const [suggestions, setSuggestions] = useState<MyWaveMerchantSuggestionResponse[]>([])
  const [open, setOpen] = useState(false)

  // 타이핑마다 서버를 부르지 않도록 잠깐 기다렸다 한 번만 조회한다.
  useEffect(() => {
    let live = true
    const timer = window.setTimeout(() => {
      if (!value.trim()) {
        setSuggestions([])
        return
      }
      suggestMyWaveMerchants(value)
        .then((items) => { if (live) setSuggestions(items) })
        .catch(() => { if (live) setSuggestions([]) })
    }, 200)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [value])

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="가게 이름"
        className="form-input"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-[14px] bg-white shadow-[0_8px_28px_rgba(25,31,40,.12)]">
          {suggestions.map((suggestion) => (
            <li key={suggestion.merchant}>
              <button
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onPick(suggestion); setOpen(false) }}
                className="pressable flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="min-w-0 truncate text-[15px] font-semibold text-slate-900">{suggestion.merchant}</span>
                <span className="shrink-0 text-[13px] font-medium text-slate-400">
                  {suggestion.category} · {won(Number(suggestion.suggestedAmount))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4단계 — 퀵버튼
// ---------------------------------------------------------------------------

export function QuickExpenseButtons({ onLogged }: { onLogged: () => void }) {
  const [templates, setTemplates] = useState<MyWaveExpenseTemplateResponse[]>([])
  const [suggestions, setSuggestions] = useState<MyWaveTemplateSuggestionResponse[]>([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let live = true
    Promise.all([getMyWaveExpenseTemplates(), getMyWaveTemplateSuggestions()])
      .then(([items, hints]) => {
        if (!live) return
        setTemplates(items)
        setSuggestions(hints)
      })
      .catch(() => {
        if (!live) return
        setTemplates([])
        setSuggestions([])
      })
    return () => { live = false }
  }, [reloadKey])

  async function log(template: MyWaveExpenseTemplateResponse) {
    setBusyId(template.id)
    try {
      await logMyWaveExpenseTemplate(template.id)
      setMessage(`${template.name} 기록했어요.`)
      reload()
      onLogged()
    } catch (error) {
      setMessage(errorMessage(error, '기록에 실패했습니다.'))
    } finally {
      setBusyId(null)
    }
  }

  async function accept(suggestion: MyWaveTemplateSuggestionResponse) {
    try {
      await createMyWaveExpenseTemplate({
        name: suggestion.merchant,
        category: suggestion.category,
        merchant: suggestion.merchant,
        amount: Number(suggestion.amount),
      })
      setMessage(`${suggestion.merchant} 버튼을 만들었어요. 이제 한 번만 누르면 돼요.`)
      reload()
    } catch (error) {
      setMessage(errorMessage(error, '버튼을 만들지 못했습니다.'))
    }
  }

  async function remove(id: number) {
    try {
      await deleteMyWaveExpenseTemplate(id)
      reload()
    } catch (error) {
      setMessage(errorMessage(error, '버튼을 지우지 못했습니다.'))
    }
  }

  if (templates.length === 0 && suggestions.length === 0) {
    return null
  }

  return (
    <Card
      title="퀵버튼"
      action={templates.length > 0 ? (
        <button onClick={() => setEditing((value) => !value)} className="pressable rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-500">
          {editing ? '완료' : '편집'}
        </button>
      ) : undefined}
    >
      <div className="space-y-3">
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <div key={template.id} className="relative">
                <button
                  onClick={() => log(template)}
                  disabled={busyId === template.id}
                  className="pressable flex items-center gap-2.5 rounded-[14px] bg-slate-100 px-4 py-3 text-left disabled:opacity-60"
                >
                  {busyId === template.id
                    ? <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                    : <Zap className="h-4 w-4 text-blue-700" />}
                  <span>
                    <span className="block text-[14px] font-bold text-slate-900">{template.name}</span>
                    <span className="block text-[12px] font-medium text-slate-400">{won(Number(template.amount))}</span>
                  </span>
                </button>
                {editing && (
                  <button
                    onClick={() => remove(template.id)}
                    aria-label={`${template.name} 버튼 삭제`}
                    className="pressable absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 버튼을 사용자에게 만들라고 시키지 않는다. 반복이 쌓이면 앱이 먼저 묻는다. */}
        {suggestions.map((suggestion) => (
          <div key={suggestion.merchant} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-emerald-50 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <Beluga mood="hello" size="xs" />
              <span className="text-[14px] font-semibold text-emerald-900">{suggestion.message}</span>
            </span>
            <button onClick={() => accept(suggestion)} className="pressable shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white">
              <Plus className="mr-1 inline h-3.5 w-3.5" />만들기
            </button>
          </div>
        ))}

        {message && (
          <p className="flex items-center gap-2 text-[14px] font-semibold text-blue-700">
            <Beluga mood="cheer" size="xs" float={false} />
            {message}
          </p>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 5단계 — 돈 흐름
// ---------------------------------------------------------------------------

export function CashFlowCard({ month, refreshKey }: { month?: string; refreshKey: number }) {
  const [data, setData] = useState<MyWaveCashFlowResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyWaveCashFlow(month)
      .then((value) => { setData(value); setError('') })
      .catch((cause) => setError(errorMessage(cause, '돈 흐름을 불러오지 못했습니다.')))
  }, [month, refreshKey])

  const scale = useMemo(() => {
    if (!data) return 1
    const largest = Math.max(data.spentTotal, data.investedTotal, data.savedTotal, 1)
    return largest
  }, [data])

  if (error) {
    return (
      <Card title="이번 달 돈 흐름">
        <BelugaSays mood="concern" size="sm">{error}</BelugaSays>
      </Card>
    )
  }
  if (!data) {
    return (
      <Card title="이번 달 돈 흐름">
        <div className="flex items-center gap-3">
          <Beluga mood="calm" size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
          </div>
        </div>
      </Card>
    )
  }

  const rows = [
    { label: '소비', amount: data.spentTotal, kept: false },
    { label: '저축', amount: data.savedTotal, kept: true },
    { label: '투자', amount: data.investedTotal, kept: true },
  ]

  return (
    <Card title="이번 달 돈 흐름">
      <div className="space-y-5">
        {/*
          채운 막대는 사라진 돈, 빈 막대는 형태만 바뀐 내 돈.
          합계를 하나로 더하지 않는 이유가 이 그림에 그대로 담긴다.
        */}
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[3.5rem_1fr_6.5rem] items-center gap-3">
              <span className="text-[14px] font-semibold text-slate-500">{row.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${row.kept ? 'border border-dashed border-emerald-500 bg-emerald-50' : 'bg-blue-700'}`}
                  style={{ width: `${Math.min(100, (row.amount / scale) * 100)}%` }}
                />
              </div>
              <span className="tnum text-right text-[14px] font-bold text-slate-900">₩<Amount value={row.amount} /></span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="쓴 돈" value={data.spentTotal} tone="spend" note="사라진 돈" />
          <SummaryTile label="모은 돈" value={data.keptTotal} tone="keep" note="아직 내 돈" />
          <SummaryTile label="남은 돈" value={data.remainingAmount} tone="rest" note={`수입 ${won(data.incomeAmount)}`} />
        </div>

        <p className="text-[12px] font-medium leading-5 text-slate-400">
          투자는 사라진 돈이 아니라 형태만 바뀐 내 돈이라 소비 합계에 더하지 않아요.
        </p>

        <div className="space-y-2">
          {data.items.slice(0, 12).map((item, index) => (
            <div
              key={`${item.kind}-${item.refId}`}
              className="rise-in"
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            >
              <ListRow
                leading={
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-bold ${item.moneyKept ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {item.category.slice(0, 2)}
                  </span>
                }
                title={item.title}
                detail={item.date}
                value={won(item.amount)}
                valueTone={item.moneyKept ? 'up' : 'default'}
                valueDetail={item.moneyKept ? '옮긴 돈' : undefined}
              />
            </div>
          ))}
          {data.items.length === 0 && (
            <BelugaEmpty
              title="이번 달 기록이 아직 없어요"
              hint="카드 문자를 붙여넣거나 결제 내역을 캡처하면 여기에 쌓여요."
            />
          )}
        </div>
      </div>
    </Card>
  )
}

function SummaryTile({ label, value, note, tone }: { label: string; value: number; note: string; tone: 'spend' | 'keep' | 'rest' }) {
  const toneClass = tone === 'spend'
    ? 'bg-blue-50 text-blue-800'
    : tone === 'keep'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-slate-100 text-slate-600'
  return (
    <div className={`rounded-[14px] px-4 py-3.5 ${toneClass}`}>
      <div className="text-[12px] font-semibold opacity-70">{label}</div>
      <div className="mt-1 text-[20px] font-bold tracking-[-0.02em]">₩<Amount value={value} /></div>
      <div className="mt-0.5 text-[12px] font-medium opacity-60">{note}</div>
    </div>
  )
}
