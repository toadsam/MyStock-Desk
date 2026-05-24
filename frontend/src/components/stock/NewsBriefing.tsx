import type { News } from '../../types/news'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badge'

export function NewsBriefing({ news }: { news: News[] }) {
  return (
    <div className="space-y-3">
      {news.map((item) => (
        <article key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/20 p-3">
          <div className="hidden h-12 w-16 rounded-lg bg-gradient-to-br from-blue-600/40 to-slate-950 md:block" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-100">{item.title}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {item.source} · {formatDateTime(item.publishedAt)}
            </p>
          </div>
          <Badge tone={item.impactType === 'POSITIVE' ? 'green' : item.impactType === 'NEGATIVE' ? 'red' : 'slate'}>
            {item.impactType === 'POSITIVE' ? '호재' : item.impactType === 'NEGATIVE' ? '악재' : '중립'}
          </Badge>
        </article>
      ))}
    </div>
  )
}
