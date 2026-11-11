import { Plus, SendHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { won } from '../format'
import { Card, EmptyGuide } from '../uiKit'
import { Beluga, BelugaSays } from '../Beluga'
import { Typewriter } from '../motion'
import { Amount } from '../Amount'
import { chatWithMyWaveCoach, getMyWaveCoachStatus, type MyWaveCoachNews } from '../myWaveApi'
import { MiniStat, MobileTitle, RingProgress, SummaryLine } from '../components'
import { useMyWaveData, type RuntimeCoachMessage } from '../runtime'
import { RiskPanel } from './PortfolioScreens'

export function CoachPage() {
  const navigate = useNavigate()
  const { status, financeSummary, goals, holdings } = useMyWaveData()
  // 기록이 하나도 없으면 코치가 볼 숫자도 없다. 0 으로 채운 카드 대신 첫 기록으로 가는 길을 보여 준다.
  const nothingYet = status === 'ready' && goals.length === 0 && holdings.length === 0
    && financeSummary.totalSpending === 0 && financeSummary.totalAsset === 0 && financeSummary.livingBudget === 0

  if (nothingYet) {
    return (
      <div className="reveal-stack mx-auto max-w-3xl space-y-5">
        <MobileTitle title="AI코치" />
        <CoachBanner showStats={false} />
        <EmptyGuide
          title="기록이 쌓이면 여기서 정리해 드려요"
          body="생활비와 소비, 목표를 적어 두면 이번 달에 얼마나 썼는지, 목표까지 얼마나 남았는지 물어볼 수 있어요. 답은 적어 둔 숫자로만 만들어요."
          actionLabel="처음 해 볼 세 가지 보기"
          onAction={() => navigate('/onboarding')}
        />
      </div>
    )
  }

  return (
    // 칸마다 min-w-0 을 준다. 없으면 칸이 안에 든 것의 최소 폭(질문 입력칸)만큼 넓어져서 휴대폰에서 오른쪽이 잘린다.
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <div className="reveal-stack min-w-0 space-y-5">
        <MobileTitle title="AI코치" />
        <CoachBanner />
        <ChatPanel />
      </div>
      <div className="reveal-stack min-w-0 space-y-5">
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
function CoachBanner({ showStats = true }: { showStats?: boolean }) {
  // 숫자가 오기 전에는 0 을 그리지 않는다. 0 은 "기록이 없다"는 뜻이라 아직 모를 때 쓰면 안 된다.
  const { financeSummary, status } = useMyWaveData()
  const pending = status === 'loading'
  const opening = coachOpening(status, financeSummary.targetAmount > 0, financeSummary.goalRate)

  return (
    <Card>
      <div className="space-y-6">
        <BelugaSays mood={opening.mood} size="lg">
          <Typewriter text={opening.text} />
        </BelugaSays>

        {showStats && (
        <div className="grid gap-3 sm:grid-cols-3">
          <CoachStat label="목표 달성률" value={financeSummary.goalRate} suffix="%" highlight pending={pending} />
          <CoachStat label="남은 목표 금액" value={financeSummary.remainingAmount} currency pending={pending} />
          <CoachStat label="바로 투자 가능" value={financeSummary.investableAmount} currency pending={pending} />
        </div>
        )}
      </div>
    </Card>
  )
}

/**
 * 벨루가의 첫 마디. 아는 만큼만 말한다.
 *
 * 숫자가 오기 전의 0 과 목표가 없어서 0 인 것을 "목표가 느리다"로 읽으면 안 된다.
 * 느리다는 말은 목표가 실제로 있고 달성률이 절반에 못 미칠 때만 한다.
 */
function coachOpening(status: 'loading' | 'ready' | 'error', hasGoal: boolean, goalRate: number): { mood: 'hello' | 'calm' | 'concern'; text: string } {
  if (status === 'loading') return { mood: 'calm', text: '이번 달 숫자를 가져오고 있어요.' }
  if (status === 'error') return { mood: 'calm', text: '지금은 숫자를 불러오지 못했어요. 잠시 후 다시 열어 주세요.' }
  if (!hasGoal) return { mood: 'hello', text: '아직 목표가 없어요. 목표를 하나 정하면 어디까지 왔는지 같이 봐 드릴게요.' }
  if (goalRate < 50) return { mood: 'concern', text: '이번 달은 목표 페이스가 조금 느려요. 어디를 조정할 수 있을지 같이 볼까요?' }
  return { mood: 'calm', text: '이번 달 흐름을 정리해뒀어요. 아래 숫자부터 같이 볼까요?' }
}

/** 라벨은 작게, 숫자는 크게. 값이 바뀌면 새로 세어 올린다. */
function CoachStat({ label, value, suffix, currency, highlight, pending = false }: { label: string; value: number; suffix?: string; currency?: boolean; highlight?: boolean; pending?: boolean }) {
  return (
    <div className={`rounded-[14px] px-4 py-4 ${highlight ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className={`text-[12px] font-semibold ${highlight ? 'text-blue-100' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-1.5 text-[24px] font-bold leading-none tracking-[-0.02em]">
        {pending ? <span aria-label="불러오는 중" className="opacity-60">—</span> : <Amount value={value} currency={currency} suffix={suffix} />}
      </div>
    </div>
  )
}

function ChatPanel() {
  const { coachMessages } = useMyWaveData()
  // 저장된 대화 뒤에 이번에 주고받은 말을 이어 붙인다. 저장된 대화가 늦게 도착해도 순서가 맞다.
  const [sent, setSent] = useState<RuntimeCoachMessage[]>([])
  // 이번에 받은 답만 타자 치듯 찍힌다. 저장된 대화는 이미 읽은 말이다.
  const messages = [
    ...coachMessages.map((message) => ({ ...message, fresh: false })),
    ...sent.map((message) => ({ ...message, fresh: true })),
  ]
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  // 모델이 답을 쓰는지와 오늘 남은 횟수. 모르는 동안에는 아무 말도 하지 않는다.
  const [ai, setAi] = useState<{ enabled: boolean; remaining: number | null } | null>(null)

  useEffect(() => {
    let alive = true
    getMyWaveCoachStatus()
      .then((status) => { if (alive) setAi({ enabled: status.aiEnabled, remaining: status.remainingToday }) })
      .catch(() => { /* 상태를 못 읽어도 질문은 할 수 있다. 안내만 빠진다. */ })
    return () => { alive = false }
  }, [])

  const sendMessage = async (text = draft) => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setDraft('')
    setSent((items) => [...items, { from: 'user', text: message }])
    try {
      const response = await chatWithMyWaveCoach(message)
      setSent((items) => [...items, { from: 'bot', text: response.answer.content, news: response.news }])
      if (response.remainingToday !== undefined) {
        setAi({ enabled: response.remainingToday !== null, remaining: response.remainingToday })
      }
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
          <div className={`max-w-[720px] whitespace-pre-line px-5 py-3.5 text-[15px] font-medium leading-7 ${message.from === 'user' ? 'rounded-[18px] rounded-br-[6px] bg-blue-700 text-white' : 'rounded-[18px] rounded-bl-[6px] bg-wave-foam text-blue-950'}`}>
            {message.from === 'bot' && message.fresh ? <Typewriter text={message.text} /> : message.text}
            {message.stats && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-blue-50 p-4 sm:grid-cols-3">
                {message.stats.map((stat) => <MiniStat key={stat.label} label={stat.label} value={stat.value} />)}
              </div>
            )}
            {message.news && message.news.items.length > 0 && <CoachNewsCards news={message.news} />}
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
          <Beluga mood="think" size="sm" />
          <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-lg bg-wave-foam px-5 py-4">
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
            <span className="typing-dot h-2 w-2 rounded-full bg-blue-700" />
          </div>
        </div>
      )}
      <div className="pt-2">
        <div className="mb-3 flex flex-wrap gap-2">
          {/* 투자해도 되는지는 코치가 답하지 않기로 한 질문이라 추천하지 않는다. */}
          {['이번 달 소비 어땠어?', '오늘 얼마까지 써도 돼?', '목표까지 얼마나 남았어?', '어디를 줄이면 좋을까?'].map((item) => (
            <button key={item} onClick={() => sendMessage(item)} className="pressable rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50">{item}</button>
          ))}
        </div>
        <label className="flex h-16 items-center gap-4 rounded-[18px] bg-white px-5">
          <Plus className="h-6 w-6 text-slate-300" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            maxLength={500}
            // w-full: 입력칸은 글자 20자만큼의 기본 폭을 갖는다. 그 폭이 화면을 밀어내지 않게 남는 자리만 쓰게 한다.
            className="w-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
            placeholder="벨루가에게 물어보세요"
            aria-label="코치에게 물어볼 말"
          />
          <button type="button" onClick={() => sendMessage()} aria-label="질문 보내기" className="pressable grid h-11 w-11 place-items-center rounded-full bg-blue-700 text-white disabled:bg-slate-200" disabled={sending}>
            <SendHorizontal className="h-5 w-5" />
          </button>
        </label>
        {/* 무엇이 밖으로 나가는지와 코치가 하지 않는 일을 질문하는 자리에서 알린다. */}
        {ai?.enabled && (
          <p className="mt-2.5 px-1 text-[12px] font-medium leading-5 text-slate-400">
            질문과 이번 달 숫자 요약이 답을 만들려고 OpenAI로 전송돼요. 이름, 가게 이름, 메모는 보내지 않아요. 투자 조언은 하지 않아요.
            {ai.remaining !== null && <span className="font-semibold text-slate-500"> 오늘 {ai.remaining}번 더 물어볼 수 있어요.</span>}
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * 질문에 나온 종목의 최근 기사.
 *
 * 코치가 쓴 글이 아니다. 뉴스 검색 결과의 제목과 언론사를 그대로, 최신순으로 보여 준다.
 * 좋은 소식인지 나쁜 소식인지는 표시하지 않는다. 판단은 읽는 사람이 한다.
 */
function CoachNewsCards({ news }: { news: MyWaveCoachNews }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="text-[12px] font-semibold text-blue-900/70">{news.stockName} 최근 소식 · 최신순</div>
      {news.items.map((item) => {
        const meta = [item.source, newsDate(item.publishedAt)].filter(Boolean).join(' · ')
        const body = (
          <>
            <span className="block text-[14px] font-semibold leading-6 text-slate-900">{item.title}</span>
            {meta && <span className="mt-0.5 block text-[12px] font-medium text-slate-500">{meta}</span>}
          </>
        )
        return item.url ? (
          <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" className="pressable block rounded-[12px] bg-white px-3.5 py-3 whitespace-normal hover:bg-slate-50">
            {body}
          </a>
        ) : (
          <div key={item.title} className="rounded-[12px] bg-white px-3.5 py-3 whitespace-normal">{body}</div>
        )
      })}
      <p className="text-[12px] font-medium leading-5 text-blue-900/60">기사는 고르거나 풀어 쓰지 않았어요. 누르면 원문이 열려요.</p>
    </div>
  )
}

/** "11월 10일". 날짜를 읽지 못하면 비워 둔다. */
function newsDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : `${date.getMonth() + 1}월 ${date.getDate()}일`
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
      {/* 휴대폰에서는 고리 옆에 큰 금액이 들어갈 자리가 없다. 고리를 위에, 금액을 아래에 둔다. */}
      <div className="grid items-center justify-items-center gap-5 sm:grid-cols-[120px_1fr] sm:justify-items-stretch">
        <RingProgress value={financeSummary.goalRate} />
        {goals[0] ? (
          <div className="w-full min-w-0">
            <div className="text-sm font-bold text-slate-500">{goals[0].title}</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{won(financeSummary.remainingAmount)}</div>
            <div className="mt-1 text-sm font-bold text-slate-500">남은 금액 · D-{financeSummary.daysLeft}</div>
            <div className="mt-4 rounded-2xl bg-blue-50 p-3 font-black text-blue-700">하루에 모을 금액<br />{won(financeSummary.dailyTarget)}</div>
          </div>
        ) : (
          <div className="w-full min-w-0 text-sm font-bold text-slate-500">아직 목표가 없어요. 목표를 만들면 하루에 얼마씩 모으면 되는지 알려 드려요.</div>
        )}
      </div>
    </Card>
  )
}
