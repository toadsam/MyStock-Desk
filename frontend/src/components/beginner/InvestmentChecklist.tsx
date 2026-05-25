import { useState } from 'react'
import { CheckSquare } from 'lucide-react'
import { Card } from '../ui/Card'

const defaultItems = [
  '이 회사가 무엇으로 돈을 버는지 설명할 수 있다',
  '투자 이유를 한 문장으로 적었다',
  '손실이 났을 때 다시 확인할 기준을 정했다',
  '내 포트폴리오에서 비중이 과도하지 않은지 봤다',
  '최근 뉴스가 일시적 이슈인지 구조적 변화인지 확인했다',
]

export function InvestmentChecklist({ compact = false }: { compact?: boolean }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const completed = defaultItems.filter((item) => checked[item]).length

  return (
    <Card title="투자 전 체크리스트" action={<span className="text-sm text-slate-400">{completed}/{defaultItems.length}</span>}>
      <div className="space-y-2">
        {defaultItems.slice(0, compact ? 4 : defaultItems.length).map((item) => (
          <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-blue-500"
              checked={Boolean(checked[item])}
              onChange={(event) => setChecked((previous) => ({ ...previous, [item]: event.target.checked }))}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CheckSquare className="h-4 w-4 text-emerald-400" />
        체크리스트는 추천이 아니라 판단 누락을 줄이기 위한 도구입니다.
      </div>
    </Card>
  )
}
