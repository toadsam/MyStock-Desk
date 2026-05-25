import { useState } from 'react'
import type { Stock } from '../../types/stock'
import { Card } from '../ui/Card'
import { Tabs } from '../ui/Tabs'

type LearningStatus = 'STUDYING' | 'UNDERSTOOD' | 'WATCH'

const statusItems = [
  { label: '공부 중', value: 'STUDYING' },
  { label: '이해 완료', value: 'UNDERSTOOD' },
  { label: '지켜보기', value: 'WATCH' },
]

export function LearningModeCard({ stock }: { stock: Stock }) {
  const [status, setStatus] = useState<LearningStatus>('STUDYING')
  const [note, setNote] = useState('')

  return (
    <Card title="관심종목 학습 모드">
      <Tabs items={statusItems} value={status} onChange={(value) => setStatus(value as LearningStatus)} className="flex-wrap" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ['무엇으로 돈을 버나요?', `${stock.industry} 업종에서 매출과 이익이 어디서 나오는지 한 문장으로 정리해 보세요.`],
          ['좋아지는 신호는?', '매출, 영업이익, 뉴스, 업황 중 어떤 변화가 확인되면 좋아진다고 볼지 적어보세요.'],
          ['피해야 할 신호는?', '손실 확대, 부채 증가, 업황 둔화처럼 내가 놓치면 안 되는 위험을 정리해 보세요.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
            <div className="text-sm font-bold text-slate-100">{title}</div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{body}</p>
          </div>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="text-sm text-slate-400">내가 이해한 내용</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none"
          placeholder={`${stock.name}을 아직 사거나 팔지 않고, 먼저 이해한 내용을 정리해 보세요.`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-xs text-blue-100">
        학습 모드는 추천 기능이 아닙니다. 실제 거래 전 내가 이해한 근거와 확인할 리스크를 남기는 용도입니다.
      </div>
    </Card>
  )
}
