import { Plus, SendHorizontal } from 'lucide-react'
import { useState } from 'react'
import { won } from '../format'
import { Card } from '../uiKit'
import { Beluga, BelugaSays } from '../Beluga'
import { Amount } from '../Amount'
import { chatWithMyWaveCoach } from '../myWaveApi'
import { MiniStat, MobileTitle, RingProgress, SummaryLine } from '../components'
import { useMyWaveData, type RuntimeCoachMessage } from '../runtime'
import { RiskPanel } from './PortfolioScreens'

export function CoachPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <div className="space-y-5">
        <MobileTitle title="AI코치" />
        <CoachBanner />
        <ChatPanel />
      </div>
      <div className="space-y-5">
        <FinanceState />
        <GoalOutlook />
        <RiskPanel />
      </div>
    </div>
  )
}

/**
 * 코치 화면의 첫 인상.
 *
 * 벨루가가 상황을 한 줄로 말하고, 숫자는 그 아래에서 숫자대로 선다.
 * 둘을 한 문장에 섞지 않는 것이 이 화면의 규칙이다.
 */
function CoachBanner() {
  const { financeSummary } = useMyWaveData()
  const behind = financeSummary.goalRate < 50

  return (
    <Card>
      <div className="space-y-6">
        <BelugaSays mood={behind ? 'concern' : 'calm'} size="lg">
          {behind
            ? '이번 달은 목표 페이스가 조금 느려요. 어디를 조정할 수 있을지 같이 볼까요?'
            : '이번 달 흐름을 정리해뒀어요. 아래 숫자부터 같이 볼까요?'}
        </BelugaSays>

        <div className="grid gap-3 sm:grid-cols-3">
          <CoachStat label="목표 달성률" value={financeSummary.goalRate} suffix="%" highlight />
          <CoachStat label="남은 목표 금액" value={financeSummary.remainingAmount} currency />
          <CoachStat label="바로 투자 가능" value={financeSummary.investableAmount} currency />
        </div>
      </div>
    </Card>
  )
}

/** 라벨은 작게, 숫자는 크게. 값이 바뀌면 새로 세어 올린다. */
function CoachStat({ label, value, suffix, currency, highlight }: { label: string; value: number; suffix?: string; currency?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-[14px] px-4 py-4 ${highlight ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className={`text-[12px] font-semibold ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.02em]">
        <Amount value={value} currency={currency} suffix={suffix} />
      </div>
    </div>
  )
}

function ChatPanel() {
  const { coachMessages } = useMyWaveData()
  // 저장된 대화 뒤에 이번에 주고받은 말을 이어 붙인다. 저장된 대화가 늦게 도착해도 순서가 맞다.
  const [sent, setSent] = useState<RuntimeCoachMessage[]>([])
  const messages = [...coachMessages, ...sent]
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const sendMessage = async (text = draft) => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setSent((items) => [...items, { from: 'user', text: message }])
    try {
      const response = await chatWithMyWaveCoach(message)
      setSent((items) => [...items, { from: 'bot', text: response.answer.content }])
    } catch {
      setSent((items) => [...items, { from: 'bot', text: '지금은 답변을 받아오지 못했어요. 잠시 후 다시 물어봐 주세요.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-5">
      {messages.length === 0 && (
        <div className="flex gap-4">
          <Beluga mood="hello" size="sm" float={false} className="mt-1" />
          <div className="max-w-[720px] rounded-[18px] rounded-bl-[6px] bg-wave-foam px-5 py-3.5 text-[15px] font-medium leading-7 text-blue-950">
            이번 달 소비, 목표, 투자에 대해 궁금한 걸 물어보세요. 기록된 숫자를 바탕으로 정리해 드려요.
          </div>
        </div>
      )}
      {messages.map((message, index) => (
        <div key={`${message.from}-${index}`} className={`chat-row flex ${message.from === 'user' ? 'justify-end' : 'justify-start'} gap-4`} style={{ animationDelay: `${index * 120}ms` }}>
          {message.from === 'bot' && <Beluga mood="calm" size="sm" float={false} className="mt-1" />}
          <div className={`max-w-[720px] px-5 py-3.5 text-[15px] font-medium leading-7 ${message.from === 'user' ? 'rounded-[18px] rounded-br-[6px] bg-blue-700 text-white' : 'rounded-[18px] rounded-bl-[6px] bg-wave-foam text-blue-950'}`}>
            {message.text}
            {message.stats && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-blue-50 p-4 sm:grid-cols-3">
                {message.stats.map((stat) => <MiniStat key={stat.label} label={stat.label} value={stat.value} />)}
              </div>
            )}
            {message.suggestions && (
              <div className="mt-4 rounded-2xl p-4 text-sm leading-7">
                <div className="font-black">이렇게 해보는 건 어때요?</div>
                {message.suggestions.map((item) => <div key={item} className="mt-1 text-slate-600">· {item}</div>)}
              </div>
            )}
          </div>
        </div>
      ))}
      {sending && (
        <div className="flex items-center gap-3">
          <Beluga mood="calm" size="sm" />
          <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-lg bg-wave-foam px-5 py-4">
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
          </div>
        </div>
      )}
      <div className="pt-2">
        <div className="mb-3 flex flex-wrap gap-2">
          {['이번 달 소비 어땠어?', '지금 투자해도 괜찮을까?', '목표까지 얼마나 남았어?', '어디를 줄이면 좋을까?'].map((item) => (
            <button key={item} onClick={() => sendMessage(item)} className="pressable rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50">{item}</button>
          ))}
        </div>
        <label className="flex h-16 items-center gap-4 rounded-[18px] bg-white px-5">
          <Plus className="h-6 w-6 text-slate-300" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
            placeholder="벨루가에게 물어보세요"
          />
          <button type="button" onClick={() => sendMessage()} className="pressable grid h-11 w-11 place-items-center rounded-full bg-blue-700 text-white disabled:bg-slate-200" disabled={sending}>
            <SendHorizontal className="h-5 w-5" />
          </button>
        </label>
      </div>
    </section>
  )
}

function FinanceState() {
  const { financeSummary } = useMyWaveData()

  return (
    <Card title="이번 달 재무 상태" action="자세히 보기" actionTo="/assets">
      <div className="space-y-5">
        <SummaryLine label="총 자산" value={won(financeSummary.totalAsset)} />
        <SummaryLine label="총 지출" value={won(financeSummary.totalSpending)} />
        <SummaryLine label="저축률" value={`${financeSummary.savingRate}%`} />
      </div>
    </Card>
  )
}

function GoalOutlook() {
  const { financeSummary, goals } = useMyWaveData()

  return (
    <Card title="목표 달성 전망" action="자세히 보기" actionTo="/goals">
      <div className="grid grid-cols-[120px_1fr] items-center gap-5">
        <RingProgress value={financeSummary.goalRate} />
        {goals[0] ? (
          <div>
            <div className="text-sm font-bold text-slate-500">{goals[0].title}</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{won(financeSummary.remainingAmount)}</div>
            <div className="mt-1 text-sm font-bold text-slate-500">남은 금액 · D-{financeSummary.daysLeft}</div>
            <div className="mt-4 rounded-2xl bg-blue-50 p-3 font-black text-blue-700">하루에 모을 금액<br />{won(financeSummary.dailyTarget)}</div>
          </div>
        ) : (
          <div className="text-sm font-bold text-slate-500">아직 목표가 없어요. 목표를 만들면 하루에 얼마씩 모으면 되는지 알려 드려요.</div>
        )}
      </div>
    </Card>
  )
}
