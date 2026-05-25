import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'

export function BeginnerGuideCard() {
  const steps = [
    ['첫 거래 기록 추가', '종목, 날짜, 수량, 가격, 투자 이유를 남깁니다.', '/transactions'],
    ['보유 비중 확인', '한 종목이나 섹터에 너무 몰렸는지 봅니다.', '/portfolio'],
    ['뉴스 쉽게 읽기', '좋은 뉴스인지보다 내 투자 이유에 영향이 있는지 확인합니다.', '/research'],
  ]

  return (
    <Card title="처음 쓰는 순서">
      <div className="space-y-3">
        {steps.map(([title, text, to], index) => (
          <Link key={title} to={to} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/25 p-3 transition hover:border-blue-400/60">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-sm font-bold text-sky-300">{index + 1}</span>
            <span>
              <span className="block font-semibold text-slate-100">{title}</span>
              <span className="mt-1 block text-sm text-slate-400">{text}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <BookOpen className="h-4 w-4 text-emerald-400" />
        빈 화면이 막막하면 샘플 데이터로 흐름을 먼저 확인하세요.
      </div>
    </Card>
  )
}
