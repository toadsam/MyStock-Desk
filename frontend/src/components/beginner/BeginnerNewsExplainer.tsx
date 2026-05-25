import { Newspaper } from 'lucide-react'
import type { News } from '../../types/news'
import { Card } from '../ui/Card'

export function BeginnerNewsExplainer({ news }: { news: News[] }) {
  return (
    <Card title="뉴스 쉽게 읽기">
      <div className="space-y-3">
        {news.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
            <div className="flex items-start gap-2">
              <Newspaper className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
              <div>
                <div className="font-semibold text-slate-100">{item.title}</div>
                <p className="mt-2 text-sm text-slate-400">쉬운 설명: {item.summary}</p>
                <p className="mt-1 text-sm text-sky-300">확인할 점: 이 내용이 실제 매출, 이익, 수급 변화로 이어지는지 다음 실적과 추가 뉴스에서 확인하세요.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
