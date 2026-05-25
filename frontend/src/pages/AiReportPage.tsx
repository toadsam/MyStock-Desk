import { AlertTriangle, Bot, BrainCircuit, CalendarClock, CheckCircle2, FileText, RefreshCw, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { generatePortfolioReport, getLatestPortfolioReport } from '../api/aiApi'
import { getPortfolioStudyCandidates } from '../api/portfolioApi'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { mockPortfolioReport, mockPortfolioStudyCandidates } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDateTime } from '../utils/format'

export default function AiReportPage() {
  const { data: report, setData: setReport } = useAsyncData(getLatestPortfolioReport, mockPortfolioReport)
  const { data: candidates } = useAsyncData(getPortfolioStudyCandidates, mockPortfolioStudyCandidates)

  const refreshReport = async () => {
    const next = await generatePortfolioReport()
    setReport(next)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-sky-300" />
              <h1 className="text-2xl font-black text-slate-50 md:text-3xl">AI 포트폴리오 리포트</h1>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              사용자가 입력한 거래 기록, 보유 종목, 실적 일정, 관심종목, 공부 후보를 바탕으로 확인할 항목을 정리합니다. 매수·매도 추천이나 투자 자문은 제공하지 않습니다.
            </p>
          </div>
          <Button type="button" onClick={refreshReport}>
            <RefreshCw className="h-4 w-4" />
            리포트 새로 정리
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
        <Card title="이번 주 요약" action={<span className="text-xs text-slate-500">생성: {formatDateTime(report.generatedAt)}</span>}>
          <p className="text-base leading-7 text-slate-200">{report.summary}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {report.performanceNotes.map((note) => (
              <ReportItem key={note} icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} title="성과 복기" text={note} />
            ))}
          </div>
        </Card>

        <Card title="반드시 읽을 고지">
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/8 p-4 text-sm leading-6 text-yellow-100">
            <AlertTriangle className="mb-3 h-5 w-5 text-yellow-300" />
            {report.disclaimer}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="쏠림과 리스크">
          <div className="space-y-3">
            {report.concentrationNotes.length === 0 ? (
              <p className="text-sm text-slate-500">현재 기준으로 큰 쏠림 경고가 없습니다. 그래도 업종별 비중은 정기적으로 확인하세요.</p>
            ) : (
              report.concentrationNotes.map((note) => (
                <ReportItem key={note} icon={<ShieldAlert className="h-4 w-4 text-red-300" />} title="리스크 점검" text={note} />
              ))
            )}
          </div>
        </Card>

        <Card title="실적 일정 체크">
          <div className="space-y-3">
            {report.upcomingEarnings.map((item) => (
              <ReportItem key={item} icon={<CalendarClock className="h-4 w-4 text-sky-300" />} title="다가오는 일정" text={item} />
            ))}
          </div>
        </Card>

        <Card title="최근 거래 복기 질문">
          <div className="space-y-3">
            {report.recentReviewQuestions.map((question) => (
              <ReportItem key={question} icon={<BrainCircuit className="h-4 w-4 text-violet-300" />} title="복기 질문" text={question} />
            ))}
          </div>
        </Card>
      </div>

      <Card title="다음 공부 후보" action={<Badge tone="blue">기록 기반</Badge>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {candidates.map((candidate) => (
            <div key={candidate.candidateSymbol} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-50">{candidate.candidateName}</div>
                  <div className="mt-1 text-xs text-slate-500">{candidate.candidateSymbol} · {candidate.category}</div>
                </div>
                <Badge tone="violet">{candidate.relationType}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{candidate.studyReason}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {candidate.checkPoints.map((point) => <div key={point}>확인 포인트 · {point}</div>)}
              </div>
              <p className="mt-3 text-xs leading-5 text-yellow-100">{candidate.riskNote}</p>
              <div className="mt-3 text-xs text-slate-500">출처: {candidate.dataSource}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="리포트에 사용한 데이터">
        <div className="grid gap-3 md:grid-cols-4">
          {['보유 종목', '거래 기록', '실적 일정', '공부 후보'].map((item) => (
            <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
              <FileText className="mb-3 h-5 w-5 text-sky-300" />
              <div className="font-semibold text-slate-100">{item}</div>
              <p className="mt-2 text-xs leading-5 text-slate-500">앱에 저장된 기록과 공개/데모 데이터를 함께 사용합니다.</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ReportItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">{icon}{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  )
}
