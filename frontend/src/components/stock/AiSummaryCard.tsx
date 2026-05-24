import { Bot, Sparkles, TriangleAlert } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface AiSummaryCardProps {
  title?: string
  content: string
  score?: number
  tone?: 'positive' | 'risk' | 'neutral'
}

export function AiSummaryCard({ title = 'AI 투자 요약', content, score = 78, tone = 'positive' }: AiSummaryCardProps) {
  const risk = tone === 'risk'
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${risk ? 'bg-red-500/15 text-red-300' : 'bg-violet-500/15 text-violet-300'}`}>
          {risk ? <TriangleAlert className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-50">{title}</h2>
            <Badge tone={risk ? 'red' : 'blue'}>Beta</Badge>
          </div>
          <p className="text-sm leading-6 text-slate-300">{content}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={risk ? 'red' : 'green'}>AI 점수 {score}</Badge>
            <Badge tone="violet"><Sparkles className="mr-1 h-3 w-3" /> 모의 데이터 기반</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
