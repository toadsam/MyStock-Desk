import { CalendarDays, ChevronRight, Edit3, Info, Save, SlidersHorizontal, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { won } from '../format'
import { Card, Field } from '../uiKit'
import { BelugaSays } from '../Beluga'
import belugaJumpArt from '../../assets/mywave/beluga-jump.png'
import { Celebration } from '../Celebration'
import {
  createMyWaveGoal,
  deleteMyWaveGoal,
  getMyWaveGoals,
  updateMyWaveGoal,
  type MyWaveGoalResponse,
} from '../myWaveApi'
import {
  BlueCard,
  BlueMetric,
  FlagIcon,
  MiniStat,
  MobileCard,
  MobileGoalLine,
  MobileRing,
  MobileTitle,
  Progress,
  SegmentedTabs,
  SummaryLine,
  TargetDot,
} from '../components'
import { GOAL_STATUS_LABEL, useMyWaveData } from '../runtime'

export function GoalsPage() {
  return (
    <>
      <div className="lg:hidden">
        <MobileGoalsPage />
      </div>
      <div className="hidden gap-6 lg:grid xl:grid-cols-[1fr_440px]">
        <div className="space-y-5">
          <MainGoalCard />
          <ActionPanel />
          <GoalsList />
          <GoalManagementPanel />
        </div>
        <div className="space-y-5">
          <GoalPrediction />
          <GoalSummary />
        </div>
      </div>
    </>
  )
}

function MobileGoalsPage() {
  const navigate = useNavigate()

  return (
    <div className="mobile-page reveal-stack space-y-5">
      <div className="flex items-center justify-between">
        <MobileTitle title="목표 관리" />
        <button onClick={() => navigate('/goals/new')} className="pressable pb-2 text-sm font-black text-blue-700">+ 목표 추가</button>
      </div>
      <SegmentedTabs items={['전체', '진행 중', '완료']} active="전체" />
      <MobileGoalMainCard />
      <MobileActionCards />
      <MobileOtherGoals />
    </div>
  )
}

function MobileGoalMainCard() {
  const { financeSummary, goals } = useMyWaveData()
  const navigate = useNavigate()
  const mainGoal = goals[0]

  if (!mainGoal) return <EmptyGoalCard />

  return (
    <MobileCard>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-400">메인 목표</div>
          <h2 className="mt-1.5 text-[22px] font-bold tracking-[-0.02em] text-slate-900">{mainGoal.title}</h2>
        </div>
        <button onClick={() => navigate('/goals/new')} aria-label="목표 수정" className="pressable -mr-1 grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-slate-50">
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-[132px_1fr] items-center gap-4">
        <MobileRing value={financeSummary.goalRate} />
        <div className="min-w-0">
          <MobileGoalLine label="현재 금액" value={won(financeSummary.savedAmount)} icon={<WalletCards className="h-4 w-4" />} />
          <MobileGoalLine label="남은 금액" value={won(financeSummary.remainingAmount)} icon={<FlagIcon />} />
          <MobileGoalLine label="남은 기간" value={`${financeSummary.daysLeft}일`} icon={<CalendarDays className="h-4 w-4" />} />
          <MobileGoalLine label="1일 목표 금액" value={won(financeSummary.dailyTarget)} icon={<TargetDot />} />
        </div>
      </div>
      <div className="mt-4">
        <BelugaSays mood={financeSummary.goalRate >= 50 ? 'cheer' : 'concern'} size="sm">
          {financeSummary.goalRate >= 50
            ? '이 흐름이면 이번 달 목표까지 갈 수 있어요.'
            : '지금 페이스로는 조금 빠듯해요. 어디를 조정할 수 있을지 같이 볼까요?'}
        </BelugaSays>
      </div>
    </MobileCard>
  )
}

function MobileActionCards() {
  const { recommendedActions } = useMyWaveData()
  const navigate = useNavigate()

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">목표 달성을 위한 추천</h2>
        <button onClick={() => navigate('/spending/simulation')} className="pressable text-[13px] font-semibold text-slate-400">더보기 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {recommendedActions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.title} onClick={() => navigate('/spending/simulation')} className="motion-card pressable rounded-[20px] bg-white p-4 text-left">
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-slate-100 text-slate-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[14px] font-bold leading-5 text-slate-900">{action.title}</div>
              <div className="mt-1 text-[12px] font-medium text-slate-400">월 {won(action.saving)} 절약</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MobileOtherGoals() {
  const { goals } = useMyWaveData()

  return (
    <section>
      <h2 className="mb-3 text-[17px] font-bold tracking-[-0.02em] text-slate-900">다른 목표</h2>
      <div className="space-y-3">
        {goals.slice(1, 3).map((goal) => {
          const Icon = goal.icon
          return (
            <MobileCard key={goal.title} className="p-4">
              <div className="grid grid-cols-[56px_1fr_34px] items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[15px] font-bold text-slate-900">{goal.title}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{goal.status}</span>
                  </div>
                  <Progress value={goal.rate} className="mt-2.5 h-1.5" />
                  <div className="mt-2 text-[12px] font-medium text-slate-400">목표 {Math.round(goal.target / 10000)}만원 · 현재 {Math.round(goal.saved / 10000)}만원</div>
                </div>
                <div className="tnum text-right text-[15px] font-bold text-slate-900">{goal.rate}%</div>
              </div>
            </MobileCard>
          )
        })}
      </div>
    </section>
  )
}

/** 목표가 하나도 없을 때. 남의 목표를 대신 보여주지 않고 만들기로 안내한다. */
function EmptyGoalCard() {
  const navigate = useNavigate()
  return (
    <Card>
      <div className="flex flex-col items-start gap-3">
        <h2 className="text-[20px] font-bold text-slate-900">아직 목표가 없어요</h2>
        <p className="text-sm font-medium text-slate-500">모으고 싶은 금액과 날짜를 정하면 하루에 얼마씩 모으면 되는지 계산해 드려요.</p>
        <button onClick={() => navigate('/goals/new')} className="pressable rounded-full bg-blue-700 px-5 py-2.5 text-sm font-black text-white">목표 만들기</button>
      </div>
    </Card>
  )
}

function MainGoalCard() {
  const { financeSummary, goals } = useMyWaveData()
  const mainGoal = goals[0]

  if (!mainGoal) return <EmptyGoalCard />

  return (
    <BlueCard className="min-h-[300px]">
      <div className="relative z-10">
        <span className="rounded-xl bg-[#67d8aa] px-3 py-1.5 text-sm font-black text-blue-950">{mainGoal.status}</span>
        <div className="mt-5 flex items-center gap-3 text-3xl font-black lg:text-4xl">
          {mainGoal.title} <Edit3 className="h-6 w-6" />
        </div>
        <div className="mt-7 text-7xl font-black leading-none">{financeSummary.goalRate}%</div>
        <Progress value={financeSummary.goalRate} className="mt-5 bg-white/25" barClassName="bg-[#62d8bd]" />
        <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <BlueMetric label="현재 모은 금액" value={won(financeSummary.savedAmount)} />
          <BlueMetric label="남은 금액" value={won(financeSummary.remainingAmount)} />
          <BlueMetric label="남은 기간" value={`${financeSummary.daysLeft}일`} />
          <BlueMetric label="하루 목표 금액" value={won(financeSummary.dailyTarget)} />
        </div>
      </div>
      <img src={belugaJumpArt} alt="" className="wave-bob absolute bottom-4 right-6 hidden h-40 w-40 object-contain drop-shadow-[0_14px_20px_rgba(10,40,140,.35)] md:block lg:h-52 lg:w-52" />
    </BlueCard>
  )
}

export function ActionPanel() {
  const { recommendedActions } = useMyWaveData()

  return (
    <Card title={<span>목표 달성을 위한 추천 행동 <Info className="inline h-4 w-4 text-slate-400" /></span>}>
      {recommendedActions.length === 0 && <p className="text-sm font-bold text-slate-500">이번 달 소비 기록이 쌓이면 줄일 만한 곳을 골라 드려요.</p>}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
        {recommendedActions.map((action) => {
          const Icon = action.icon
          return (
            <div key={action.title} className={`flex items-center gap-4 rounded-2xl border p-4 ${action.tone === 'orange' ? 'border-orange-100 bg-orange-50' : action.tone === 'green' ? 'border-emerald-100 bg-emerald-50/50' : 'border-violet-100 bg-violet-50/50'}`}>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${action.tone === 'orange' ? 'bg-orange-100 text-orange-600' : action.tone === 'green' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black">{action.title}</div>
                <div className="mt-1 text-sm font-medium text-slate-500">{action.detail}</div>
                <div className="mt-1 font-black text-blue-700">+{won(action.saving)} 절약</div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function GoalsList() {
  const { goals } = useMyWaveData()

  return (
    <Card title="나의 다른 목표">
      <div className="divide-y divide-slate-100">
        {goals.slice(1).map((goal) => {
          const Icon = goal.icon
          return (
            <div key={goal.title} className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="flex min-w-0 items-center gap-5">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `${goal.accent}18`, color: goal.accent }}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-black">{goal.title}</div>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{goal.status}</span>
                  </div>
                  <Progress value={goal.rate} className="mt-4" barClassName="bg-[#58cfb2]" />
                </div>
              </div>
              <div className="text-right text-sm font-bold text-slate-500">
                <div>{won(goal.saved)} / {won(goal.target)}</div>
                <div className="mt-1">D-{goal.daysLeft}일</div>
              </div>
              <div className="text-right text-lg font-black text-slate-500">{goal.rate}%</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function GoalManagementPanel() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<MyWaveGoalResponse[]>([])
  const [message, setMessage] = useState('')
  const [celebrating, setCelebrating] = useState<string | null>(null)

  async function loadGoals() {
    try {
      const result = await getMyWaveGoals()
      setGoals(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 목록을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    let live = true
    getMyWaveGoals()
      .then((result) => { if (live) setGoals(result) })
      .catch((error) => { if (live) setMessage(error instanceof Error ? error.message : '목표 목록을 불러오지 못했습니다.') })
    return () => { live = false }
  }, [])

  async function changeGoalStatus(goal: MyWaveGoalResponse, status: string) {
    try {
      await updateMyWaveGoal(goal.id, {
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
        currentAmount: status === 'COMPLETED' ? Number(goal.targetAmount) : Number(goal.currentAmount),
        targetDate: goal.targetDate,
        status,
        priority: goal.priority,
      })
      setMessage(status === 'COMPLETED' ? '목표를 완료 처리했습니다.' : '목표 상태가 변경되었습니다.')
      if (status === 'COMPLETED' && goal.status !== 'COMPLETED') setCelebrating(goal.title)
      await loadGoals()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 상태 변경에 실패했습니다.')
    }
  }

  async function removeGoal(id: number) {
    try {
      await deleteMyWaveGoal(id)
      setMessage('목표가 삭제되었습니다.')
      await loadGoals()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 삭제에 실패했습니다.')
    }
  }

  return (
    <Card
      title="목표 관리"
      action={<button onClick={() => navigate('/goals/new')} className="pressable rounded-full bg-blue-700 px-4 py-2 text-sm font-black text-white">+ 목표 추가</button>}
    >
      {celebrating && (
        <Celebration
          title="목표를 이뤘어요!"
          message={`"${celebrating}" 목표를 끝까지 해냈어요. 다음 목표도 같이 채워 봐요.`}
          onClose={() => setCelebrating(null)}
        />
      )}
      {message && <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{message}</div>}
      <div className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black">{goal.title}</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500">{GOAL_STATUS_LABEL[goal.status] ?? goal.status}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-500">{won(Number(goal.currentAmount))} / {won(Number(goal.targetAmount))} · D-{goal.remainingDays}일</div>
              </div>
              <div className="text-right text-lg font-black text-blue-700">{Math.round(Number(goal.progressRate))}%</div>
            </div>
            <Progress value={Number(goal.progressRate)} className="mt-4" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => navigate(`/goals/new?id=${goal.id}`)} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600">수정</button>
              <button onClick={() => changeGoalStatus(goal, 'ACTIVE')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-blue-700">진행</button>
              <button onClick={() => changeGoalStatus(goal, 'PAUSED')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-slate-600">일시정지</button>
              <button onClick={() => changeGoalStatus(goal, 'COMPLETED')} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-emerald-700">완료</button>
              <button onClick={() => removeGoal(goal.id)} className="pressable rounded-full bg-white px-3 py-2 text-sm font-black text-red-500">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * 메인 목표까지 남은 길.
 *
 * 저축 이력이 없어서 "달성 확률"이나 "예상 완료일"은 계산할 수 없다. 지어내지 않고,
 * 목표일과 남은 금액으로 셈할 수 있는 것만 보여준다.
 */
function GoalPrediction() {
  const { financeSummary, goals } = useMyWaveData()
  if (!goals[0]) return null

  return (
    <Card title="목표까지 남은 길">
      <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
        <MiniStat label="목표일" value={financeSummary.mainGoalTargetDate} change={`D-${financeSummary.daysLeft}`} />
        <MiniStat label="남은 금액" value={won(financeSummary.remainingAmount)} />
      </div>
      <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
        {financeSummary.remainingAmount > 0
          ? `목표일까지 하루 ${won(financeSummary.dailyTarget)}씩 모으면 닿아요.`
          : '목표 금액을 다 모았어요.'}
      </p>
    </Card>
  )
}

function GoalSummary() {
  const { financeSummary, goals } = useMyWaveData()

  return (
    <Card title="목표 요약">
      <div className="space-y-4">
        <SummaryLine label="진행 중인 목표" value={`${goals.filter((goal) => goal.status === '진행 중').length}개`} />
        <SummaryLine label="평균 달성률" value={`${financeSummary.averageGoalRate}%`} />
        <SummaryLine label="이번 달 저축 계획" value={financeSummary.plannedSaving > 0 ? won(financeSummary.plannedSaving) : '예산에서 정해 주세요'} muted />
        <Progress value={financeSummary.averageGoalRate} className="mt-3" />
      </div>
    </Card>
  )
}

export function GoalEditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editingId = Number(searchParams.get('id') ?? 0)
  const [title, setTitle] = useState('새 저축 목표')
  const [targetAmount, setTargetAmount] = useState(0)
  const [currentAmount, setCurrentAmount] = useState(0)
  const [targetDate, setTargetDate] = useState('2026-07-21')
  const [goalStatus, setGoalStatus] = useState('ACTIVE')
  const [priority, setPriority] = useState(1)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!editingId) return
    let ignore = false
    getMyWaveGoals().then((items) => {
      if (ignore) return
      const goal = items.find((item) => item.id === editingId)
      if (!goal) {
        setMessage('수정할 목표를 찾지 못했습니다.')
        return
      }
      setTitle(goal.title)
      setTargetAmount(Number(goal.targetAmount))
      setCurrentAmount(Number(goal.currentAmount))
      setTargetDate(goal.targetDate)
      setGoalStatus(goal.status)
      setPriority(goal.priority)
    }).catch((error) => {
      if (!ignore) setMessage(error instanceof Error ? error.message : '목표를 불러오지 못했습니다.')
    })
    return () => {
      ignore = true
    }
  }, [editingId])

  async function submit() {
    setStatus('saving')
    setMessage('')
    try {
      const request = { title, targetAmount, currentAmount, targetDate, status: goalStatus, priority }
      if (editingId) {
        await updateMyWaveGoal(editingId, request)
      } else {
        await createMyWaveGoal(request)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표 저장에 실패했습니다.')
      setStatus('idle')
      return
    }
    setStatus('saved')
    window.setTimeout(() => navigate('/goals'), 500)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <MobileTitle title={editingId ? '목표 수정' : '새 목표 만들기'} />
      {message && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-500">{message}</div>}
      <Card title="목표 정보">
        <div className="space-y-4">
          <Field label="목표 이름">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="목표 금액">
              <input type="number" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))} className="form-input" />
            </Field>
            <Field label="현재 모은 금액">
              <input type="number" value={currentAmount} onChange={(event) => setCurrentAmount(Number(event.target.value))} className="form-input" />
            </Field>
          </div>
          <Field label="목표 날짜">
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="form-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="상태">
              <select value={goalStatus} onChange={(event) => setGoalStatus(event.target.value)} className="form-input">
                <option value="ACTIVE">진행 중</option>
                <option value="PAUSED">일시정지</option>
                <option value="COMPLETED">완료</option>
              </select>
            </Field>
            <Field label="우선순위">
              <input type="number" min="1" value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="form-input" />
            </Field>
          </div>
        </div>
      </Card>
      <Card title="예상 결과">
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="달성률" value={`${Math.round((currentAmount / Math.max(targetAmount, 1)) * 100)}%`} />
          <MiniStat label="남은 금액" value={won(Math.max(targetAmount - currentAmount, 0))} />
          <MiniStat label="하루 목표" value={won(Math.max(targetAmount - currentAmount, 0) / 30)} />
        </div>
      </Card>
      <div className="flex gap-3">
        <button onClick={() => navigate('/goals')} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>
        <button onClick={submit} disabled={status === 'saving'} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue disabled:opacity-60">
          <Save className="inline h-5 w-5" /> {status === 'saving' ? '저장 중' : status === 'saved' ? '저장 완료' : editingId ? '수정 저장' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
