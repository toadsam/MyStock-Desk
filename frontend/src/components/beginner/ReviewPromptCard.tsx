import { RotateCcw } from 'lucide-react'
import type { InvestmentTransaction } from '../../types/transaction'
import { Card } from '../ui/Card'

export function ReviewPromptCard({ transactions }: { transactions: InvestmentTransaction[] }) {
  const target = transactions[0]

  return (
    <Card title="투자 복기">
      <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          <RotateCcw className="h-4 w-4 text-sky-300" />
          {target ? `${target.stockName} 기록 복기` : '첫 기록을 남겨보세요'}
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-400">
          <p>1. 내가 이 종목을 기록한 이유는 아직 유효한가?</p>
          <p>2. 뉴스나 실적이 내 가정과 다르게 바뀐 점은 없는가?</p>
          <p>3. 다음에는 무엇을 더 확인하고 기록할 것인가?</p>
        </div>
      </div>
    </Card>
  )
}
