import { AlertTriangle, Clock3, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
import type { Disclosure } from '../../types/disclosure'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badge'

interface DisclosureBriefingProps {
  disclosures: Disclosure[]
  loading?: boolean
  error?: string | null
}

export function DisclosureBriefing({ disclosures, loading = false, error = null }: DisclosureBriefingProps) {
  if (loading && disclosures.length === 0) {
    return <DataMessage tone="slate" spinning message="공식 공시 데이터를 불러오는 중입니다." />
  }

  if (error) {
    return <DataMessage tone="red" message={`공식 공시 데이터를 불러오지 못했습니다. ${error}`} />
  }

  if (disclosures.length === 0) {
    return <DataMessage tone="slate" message="표시할 공식 공시가 없습니다. SEC Provider 설정과 조회 심볼을 확인하세요." />
  }

  return (
    <div className="space-y-3">
      {disclosures.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-800/80 bg-slate-950/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  공식공시
                </Badge>
                <Badge tone="slate">{item.formType}</Badge>
                <span className="text-xs font-semibold text-slate-500">{item.symbol}</span>
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-start gap-2 text-sm font-bold leading-6 text-slate-100 hover:text-sky-300"
              >
                <span>{item.companyName} · {item.formType}</span>
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
              </a>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.summary}</p>
            </div>
            <Badge tone="blue">{item.reliability}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{item.source}</span>
            <span>제출일 {item.filingDate}</span>
            {item.reportDate && <span>보고기간 {item.reportDate}</span>}
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              수집 {formatDateTime(item.fetchedAt)}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function DataMessage({ tone, message, spinning = false }: { tone: 'red' | 'slate'; message: string; spinning?: boolean }) {
  const Icon = tone === 'red' ? AlertTriangle : Loader2
  return (
    <div className={`rounded-xl border p-4 text-sm ${tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-slate-800 bg-slate-950/25 text-slate-400'}`}>
      <Icon className={`mr-2 inline h-4 w-4 ${spinning ? 'animate-spin' : ''}`} />
      {message}
    </div>
  )
}
