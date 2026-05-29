import { Clock3, ExternalLink } from 'lucide-react'
import type { News } from '../../types/news'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badge'

export function NewsBriefing({ news }: { news: News[] }) {
  if (news.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-400">
        뉴스를 불러오지 못했습니다. mock fallback은 현재 비활성화되어 있습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <article key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/20 p-3">
          <div className="hidden h-12 w-16 rounded-lg bg-gradient-to-br from-blue-600/40 to-slate-950 md:block" />
          <div className="min-w-0">
            {item.sourceUrl ? (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-slate-100 hover:text-sky-300">
                <span className="truncate">{item.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <h3 className="truncate text-sm font-semibold text-slate-100">{item.title}</h3>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>{item.source}</span>
              <span>{item.dataProvider}</span>
              <span>발행 {formatDateTime(item.publishedAt)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                수집 {formatDateTime(item.fetchedAt)}
              </span>
              <Badge tone={item.officialSource ? 'green' : item.reliability === 'DEMO' ? 'red' : 'slate'}>
                {item.officialSource ? '공식' : item.reliability}
              </Badge>
            </div>
          </div>
          <Badge tone={item.impactType === 'POSITIVE' ? 'green' : item.impactType === 'NEGATIVE' ? 'red' : 'slate'}>
            {item.impactType === 'POSITIVE' ? '호재' : item.impactType === 'NEGATIVE' ? '악재' : '중립'}
          </Badge>
        </article>
      ))}
    </div>
  )
}
