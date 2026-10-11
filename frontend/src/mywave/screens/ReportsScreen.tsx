import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { won } from '../format'
import { Card } from '../uiKit'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MiniStat, MobileTitle } from '../components'
import { signed, useMyWaveData } from '../runtime'

/**
 * 리포트. 예전에는 삼성전자 요약문과 다섯 개 판정이 코드에 박혀 있었고, "매출 추이" 차트는
 * 실제로는 내 소비 추이를 그리고 있었다. 이제 내 기록으로 만든 이번 달 돈 리포트와,
 * 보유 종목의 실제 공시·재무 화면(기업 상세)으로 가는 길만 둔다.
 */
export function ReportsPage() {
  const { financeSummary, spendingTrend, spendingCategories, holdings } = useMyWaveData()
  const navigate = useNavigate()
  const topCategory = [...spendingCategories].sort((a, b) => b.amount - a.amount)[0]

  return (
    <div className="space-y-5">
      <MobileTitle title="리포트" />
      <Card>
        <div className="text-sm font-black text-blue-700">{financeSummary.month || '이번 달'} 돈 리포트</div>
        <h2 className="mt-3 text-3xl font-black">이번 달 {won(financeSummary.totalSpending)}을 썼어요</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <MiniStat
            label="지난 달과 비교"
            value={financeSummary.previousSpending > 0 ? signed(financeSummary.spendingChangeRate) : '-'}
            change={financeSummary.previousSpending > 0 ? `지난 달 같은 기간 ${won(financeSummary.previousSpending)}` : '지난 달 기록 없음'}
          />
          <MiniStat
            label="생활비 예산 대비"
            value={financeSummary.budgetRate === null ? '예산 없음' : `${financeSummary.budgetRate}%`}
            change={financeSummary.livingBudget > 0 ? `예산 ${won(financeSummary.livingBudget)}` : undefined}
          />
          <MiniStat
            label="가장 많이 쓴 곳"
            value={topCategory ? topCategory.name : '-'}
            change={topCategory ? `${won(topCategory.amount)} · ${topCategory.count}건` : undefined}
          />
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card title="월별 소비와 생활비 예산">
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={spendingTrend}>
                <defs>
                  <linearGradient id="reportLine" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8eef7" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 10000}만`} />
                <Tooltip formatter={(value) => won(Number(value))} />
                <Line dataKey="budget" name="생활비 예산" stroke="#aeb9c9" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                <Area dataKey="amount" name="소비" stroke="#2563eb" strokeWidth={3} fill="url(#reportLine)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="보유 종목 기업 분석">
          {holdings.length === 0 ? (
            <p className="text-sm font-bold text-slate-500">보유 종목이 생기면 그 기업의 공시와 재무를 여기서 바로 열어 볼 수 있어요.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {holdings.map((item) => (
                <button key={item.symbol} onClick={() => navigate(`/company/${item.symbol}`)} className="pressable flex w-full items-center justify-between gap-3 py-3 text-left">
                  <span>
                    <span className="block font-black">{item.name}</span>
                    <span className="text-sm font-bold text-slate-400">{item.symbol} · 공시·재무 보기</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 rounded-[20px] bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
            투자 판단이 아니라, 기업 상태를 이해하기 위한 참고 자료예요.
          </div>
        </Card>
      </div>
    </div>
  )
}
