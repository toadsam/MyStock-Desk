import { Clock3, ExternalLink, ShieldCheck } from 'lucide-react'
import type { Disclosure } from '../../types/disclosure'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badge'

export function DisclosureBriefing({ disclosures }: { disclosures: Disclosure[] }) {
  if (disclosures.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-400">
        공식 공시를 불러오지 못했습니다. 연결 상태와 SEC Provider 설정을 확인하세요.
      </div>
    )
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
