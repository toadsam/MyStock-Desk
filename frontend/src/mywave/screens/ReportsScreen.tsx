import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { won } from '../format'
import { LiveDot } from '../motion'
import { Card, EmptyGuide } from '../uiKit'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BlueCard, BlueMetric, HeroAmount, MobileTitle } from '../components'
import { signed, useMyWaveData } from '../runtime'

/**
 * 리포트. 예전에는 삼성전자 요약문과 다섯 개 판정이 코드에 박혀 있었고, "매출 추이" 차트는
 * 실제로는 내 소비 추이를 그리고 있었다. 이제 내 기록으로 만든 이번 달 돈 리포트와,
 * 보유 종목의 실제 공시·재무 화면(기업 상세)으로 가는 길만 둔다.
 */
export function ReportsPage() {
  const { financeSummary, spendingTrend, spendingCategories, holdings, status } = useMyWaveData()
  const navigate = useNavigate()
  const topCategory = [...spendingCategories].sort((a, b) => b.amount - a.amount)[0]

  // 정리할 기록이 하나도 없으면 0원짜리 리포트 대신 무엇을 하면 되는지 말한다.
  const nothingYet = status === 'ready' && financeSummary.totalSpending === 0 && financeSummary.previousSpending === 0
    && holdings.length === 0 && spendingTrend.every((point) => !point.amount)
  if (nothingYet) {
    return (
      <div className="reveal-stack space-y-5">
        <MobileTitle title="리포트" />
        <EmptyGuide
          title="아직 리포트로 정리할 기록이 없어요"
          body="소비를 적어 두면 이번 달에 얼마를 썼는지, 어디에 가장 많이 썼는지, 지난달보다 늘었는지 정리해 드려요."
          actionLabel="소비 기록하기"
          onAction={() => navigate('/spending/detail', { state: { focusExpenseForm: true } })}
        />
      </div>
    )
  }

  return (
    <div className="reveal-stack space-y-5">
      <MobileTitle title="리포트" />
      <BlueCard className="min-h-[230px]" art="point" tone="cyan">
        <div className="text-sm font-black text-white/85">{financeSummary.month || '이번 달'} 돈 리포트</div>
        <div className="mt-4 text-5xl lg:text-6xl"><HeroAmount value={financeSummary.totalSpending} prefix="₩" /></div>
        <div className="mt-2 text-lg font-black">이번 달에 쓴 돈</div>
        <div className="mt-8 flex flex-wrap gap-x-9 gap-y-5">
          <BlueMetric
            label="지난 달 같은 기간과 비교"
            value={financeSummary.previousSpending > 0 ? `${signed(financeSummary.spendingChangeRate)} (${won(financeSummary.previousSpending)})` : '지난 달 기록 없음'}
          />
          <BlueMetric
            label="생활비 예산 대비"
            value={financeSummary.budgetRate === null ? '예산 없음' : `${financeSummary.budgetRate}% (예산 ${won(financeSummary.livingBudget)})`}
          />
          <BlueMetric
            label="가장 많이 쓴 곳"
            value={topCategory ? `${topCategory.name} ${won(topCategory.amount)} · ${topCategory.count}건` : '-'}
          />
        </div>
      </BlueCard>
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
                <Line dataKey="budget" name="생활비 예산" stroke="#aeb9c9" strokeDasharray="4 4" strokeWidth={2} dot={false} animationDuration={1100} animationEasing="ease-out" />
                <Area dataKey="amount" name="소비" stroke="#2563eb" strokeWidth={3} fill="url(#reportLine)" dot={(props) => <LiveDot {...props} />} activeDot={{ r: 7, strokeWidth: 3 }} animationDuration={1100} animationEasing="ease-out" />
                <Area dataKey="amount" className="chart-pulse" fill="none" stroke="#bfe0ff" strokeWidth={4} strokeLinecap="round" dot={false} activeDot={false} isAnimationActive={false} tooltipType="none" legendType="none" />
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
