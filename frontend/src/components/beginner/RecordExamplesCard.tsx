import { Card } from '../ui/Card'

export function RecordExamplesCard() {
  return (
    <Card title="좋은 거래 기록 예시">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
          <div className="text-sm font-bold text-emerald-200">나중에 도움이 되는 기록</div>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            매수 이유, 확인할 지표, 예상 보유 기간, 손절 또는 비중 축소 기준이 함께 남아 있습니다.
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-3">
          <div className="text-sm font-bold text-red-200">복기하기 어려운 기록</div>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            가격과 수량만 있고 왜 샀는지, 어떤 뉴스나 재무지표를 확인했는지 적혀 있지 않습니다.
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-xs leading-5 text-slate-400">
        초보자는 수익률보다 기록의 일관성이 먼저입니다. 같은 기준으로 남겨야 나중에 내 실수를 찾기 쉽습니다.
      </div>
    </Card>
  )
}
