import { CalendarDays, CheckCircle2, Clock, FileText, NotebookPen } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getEarningsCalendar } from '../api/earningsApi'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { mockEarningsCalendar } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { EarningsCalendarItem } from '../types/earnings'
import { formatDateTime } from '../utils/format'

const relationLabels: Record<EarningsCalendarItem['relationType'], string> = {
  HOLDING: '보유 종목',
  WATCHLIST: '관심종목',
  MARKET_REFERENCE: '시장 참고',
}

export default function EarningsCalendarPage() {
  const { data: calendar } = useAsyncData(getEarningsCalendar, mockEarningsCalendar)
  const [filter, setFilter] = useState<'ALL' | EarningsCalendarItem['relationType']>('ALL')
  const [reviews, setReviews] = useState<Record<string, string>>({})

  const visible = useMemo(() => (
    filter === 'ALL' ? calendar : calendar.filter((item) => item.relationType === filter)
  ), [calendar, filter])

  const nearest = calendar.filter((item) => item.daysUntil >= 0 && item.daysUntil <= 7)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-7 w-7 text-sky-300" />
              <h1 className="text-2xl font-black text-slate-50 md:text-3xl">실적 캘린더</h1>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              보유 종목과 관심종목의 실적 발표 전 확인할 항목을 정리합니다. 일정은 공개 자료와 데모 데이터를 함께 사용하며, 실제 발표 일정과 다를 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['ALL', '전체'],
              ['HOLDING', '보유'],
              ['WATCHLIST', '관심'],
              ['MARKET_REFERENCE', '시장 참고'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as typeof filter)}
                className={`min-h-10 rounded-xl border px-4 text-sm font-semibold transition ${filter === value ? 'border-blue-400 bg-blue-600/20 text-sky-200' : 'border-slate-700 bg-slate-950/30 text-slate-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-400">7일 이내 실적 발표</div>
          <div className="mt-3 text-3xl font-black text-slate-50">{nearest.length}건</div>
          <p className="mt-2 text-sm text-slate-500">D-7, D-3, D-1에는 기존 투자 이유와 리스크를 다시 확인하세요.</p>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">보유 종목 일정</div>
          <div className="mt-3 text-3xl font-black text-slate-50">{calendar.filter((item) => item.relationType === 'HOLDING').length}건</div>
          <p className="mt-2 text-sm text-slate-500">평균 매수가와 보유 비중 기준으로 변동성을 점검합니다.</p>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">데이터 출처</div>
          <div className="mt-3 text-lg font-bold text-slate-100">공개 자료 / 데모 일정</div>
          <p className="mt-2 text-sm text-slate-500">최근 갱신: {formatDateTime(calendar[0]?.lastUpdatedAt)}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          {visible.map((item) => (
            <Card key={`${item.symbol}-${item.announcementDate}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-50">{item.companyName} 실적 발표</h2>
                    <Badge tone={item.relationType === 'HOLDING' ? 'green' : item.relationType === 'WATCHLIST' ? 'blue' : 'slate'}>{relationLabels[item.relationType]}</Badge>
                    {item.estimated && <Badge tone="violet">예상 일정</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{item.symbol}</span>
                    <span>{item.announcementDate}</span>
                    <span>{item.source}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-center">
                  <Clock className="mx-auto mb-1 h-5 w-5 text-sky-300" />
                  <div className="text-2xl font-black text-sky-200">{item.daysUntil >= 0 ? `D-${item.daysUntil}` : '발표 후'}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    확인할 점
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {item.checklist.map((point) => <li key={point}>• {point}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
                    <NotebookPen className="h-4 w-4 text-yellow-300" />
                    발표 후 복기 메모
                  </div>
                  <p className="mb-3 text-sm text-slate-500">{item.reviewQuestion}</p>
                  <textarea
                    value={reviews[item.symbol] ?? ''}
                    onChange={(event) => setReviews((current) => ({ ...current, [item.symbol]: event.target.value }))}
                    placeholder="발표 후 투자 이유가 유지되는지 적어두세요"
                    className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/stock/${item.symbol}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">
                  종목 분석 보기
                </Link>
                <Link to={`/transactions?symbol=${item.symbol}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/30 px-4 text-sm font-semibold text-slate-200">
                  관련 거래 기록
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <Card title="초보자용 실적 읽기">
          <div className="space-y-3 text-sm leading-6 text-slate-400">
            <Guide icon={<FileText className="h-4 w-4" />} title="매출" text="회사가 얼마를 팔았는지 보여줍니다. 매출은 늘었는데 이익률이 떨어졌다면 비용 부담을 함께 봐야 합니다." />
            <Guide icon={<FileText className="h-4 w-4" />} title="영업이익률" text="많이 팔았는지보다 남는 돈이 얼마나 되는지를 확인하는 지표입니다." />
            <Guide icon={<FileText className="h-4 w-4" />} title="기존 투자 이유" text="처음 기록한 투자 이유가 실적 발표 후에도 유지되는지 확인하는 것이 핵심입니다." />
          </div>
          <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/8 p-3 text-xs leading-5 text-yellow-100">
            실적 발표 일정은 참고 자료입니다. 이 화면은 매수·매도 추천이 아니라 확인할 항목과 복기 질문을 정리합니다.
          </div>
        </Card>
      </div>
    </div>
  )
}

function Guide({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
      <div className="flex items-center gap-2 font-semibold text-slate-100">{icon}{title}</div>
      <p className="mt-2">{text}</p>
    </div>
  )
}
