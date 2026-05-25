import { BookmarkPlus, CalendarClock, Link2, NotebookPen, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addWatchlist, deleteWatchlist, getWatchlist, updateWatchlistMemo } from '../api/watchlistApi'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { mockWatchlist } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { WatchlistItem } from '../types/market'
import { formatDateTime, formatPercent, formatWon, isUp } from '../utils/format'

export default function WatchlistPage() {
  const { data: watchlist, setData } = useAsyncData(getWatchlist, mockWatchlist)
  const [symbol, setSymbol] = useState('')
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null)
  const [memoDraft, setMemoDraft] = useState({ reason: '', checkPoints: '', priceMemo: '' })
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return watchlist
    return watchlist.filter((item) =>
      `${item.stock.name} ${item.stock.symbol} ${item.reason} ${item.checkPoints}`.toLowerCase().includes(normalized),
    )
  }, [query, watchlist])

  const startEdit = (item: WatchlistItem) => {
    setEditingSymbol(item.stock.symbol)
    setMemoDraft({ reason: item.reason, checkPoints: item.checkPoints, priceMemo: item.priceMemo })
  }

  const saveMemo = async () => {
    if (!editingSymbol) return
    const previous = watchlist
    const optimistic = previous.map((item) =>
      item.stock.symbol === editingSymbol ? { ...item, ...memoDraft, updatedAt: new Date().toISOString() } : item,
    )
    setData(optimistic)
    setEditingSymbol(null)
    try {
      const saved = await updateWatchlistMemo(editingSymbol, memoDraft)
      setData((current) => current.map((item) => (item.stock.symbol === saved.stock.symbol ? saved : item)))
    } catch {
      setData(optimistic)
    }
  }

  const addItem = async () => {
    const normalized = symbol.trim()
    if (!normalized) return
    const created = await addWatchlist(normalized)
    setData((current) => [created, ...current.filter((item) => item.stock.symbol !== created.stock.symbol)])
    setSymbol('')
  }

  const removeItem = async (item: WatchlistItem) => {
    setData((current) => current.filter((target) => target.stock.symbol !== item.stock.symbol))
    await deleteWatchlist(item.stock.symbol)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-50 md:text-3xl">관심종목 관리</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              관심 등록 이유, 확인 포인트, 실적 일정, 내 보유 종목과의 연관성을 함께 관리합니다. 이 화면은 매수 판단을 대신하지 않고 공부 후보를 정리하는 용도입니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 text-sm text-slate-400">
              <BookmarkPlus className="h-4 w-4 text-sky-300" />
              <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="종목코드 입력" className="w-32 bg-transparent outline-none placeholder:text-slate-600" />
            </label>
            <Button type="button" onClick={addItem}>관심종목 추가</Button>
          </div>
        </div>
      </Card>

      <Card>
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 text-slate-400">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="종목명, 코드, 확인 포인트 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </label>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.stock.symbol} className="min-h-[22rem]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-50">{item.stock.name}</h2>
                  <Badge tone="blue">{item.stock.symbol}</Badge>
                  <Badge tone={item.stock.changeRate >= 0 ? 'green' : 'red'}>{formatPercent(item.stock.changeRate)}</Badge>
                </div>
                <div className="mt-2 text-sm text-slate-500">{item.stock.sector} · {item.stock.industry}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-100">{formatWon(item.stock.currentPrice)}</div>
                <div className={isUp(item.stock.changePrice) ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
                  {formatWon(item.stock.changePrice)}
                </div>
              </div>
            </div>

            {editingSymbol === item.stock.symbol ? (
              <div className="mt-5 space-y-3">
                <textarea value={memoDraft.reason} onChange={(event) => setMemoDraft((draft) => ({ ...draft, reason: event.target.value }))} className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200 outline-none" />
                <textarea value={memoDraft.checkPoints} onChange={(event) => setMemoDraft((draft) => ({ ...draft, checkPoints: event.target.value }))} className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200 outline-none" />
                <input value={memoDraft.priceMemo} onChange={(event) => setMemoDraft((draft) => ({ ...draft, priceMemo: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 text-sm text-slate-200 outline-none" />
                <div className="flex gap-2">
                  <Button type="button" onClick={saveMemo}>메모 저장</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingSymbol(null)}>취소</Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm leading-6">
                <InfoBlock title="관심 등록 이유" value={item.reason} />
                <InfoBlock title="확인 포인트" value={item.checkPoints} />
                <InfoBlock title="관심 가격대 메모" value={item.priceMemo} />
              </div>
            )}

            <div className="mt-5 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <CalendarClock className="mb-2 h-4 w-4 text-sky-300" />
                실적 일정은 실적 캘린더에서 함께 확인
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
                <Link2 className="mb-2 h-4 w-4 text-emerald-300" />
                최근 갱신: {formatDateTime(item.updatedAt || item.createdAt)}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/stock/${item.stock.symbol}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/30 px-4 text-sm font-semibold text-slate-200">
                종목 분석
              </Link>
              <Link to={`/transactions?symbol=${item.stock.symbol}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">
                거래 기록 입력
              </Link>
              <Button type="button" variant="outline" onClick={() => startEdit(item)}><NotebookPen className="h-4 w-4" /> 메모 수정</Button>
              <Button type="button" variant="ghost" onClick={() => removeItem(item)}><Trash2 className="h-4 w-4" /> 삭제</Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        본 서비스는 투자 기록 관리 및 참고용 정보 제공을 목적으로 하며, 투자 판단의 최종 책임은 본인에게 있습니다. 실제 주문·체결 기능은 제공하지 않습니다.
      </div>
    </div>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <p className="mt-1 text-slate-300">{value}</p>
    </div>
  )
}
