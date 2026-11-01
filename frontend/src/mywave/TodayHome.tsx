import { ChevronRight, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Beluga, BelugaTap, type BelugaMood } from './Beluga'
import { BelugaArt } from './BelugaArt'
import { HeroSwimmer } from './HeroSwimmer'
import { Bubbles, CheckDraw, Odometer } from './motion'
import { useLiveliness } from './liveliness'
import { useCursorTilt } from './useCursorTilt'
import { rememberHandoff } from './handoff'
import { callBeluga } from './roaming'
import { useMyWaveData } from './runtime'
import {
  deleteMyWaveExpense,
  getMyWaveExpenseTemplates,
  getMyWaveToday,
  logMyWaveExpenseTemplate,
  type MyWaveExpenseTemplateResponse,
  type MyWaveTodayResponse,
} from './myWaveApi'

/**
 * 홈 — "소다 한 잔".
 *
 * 하루 예산을 탄산음료 한 잔으로 보여준다. 쓴 만큼 잔이 줄고, 잔에 남은 양이
 * 오늘 더 써도 되는 돈이다. 화면의 모든 숫자는 /api/dashboard/today 한 번에서 온다.
 * 불러오지 못하면 그럴듯한 숫자로 채우지 않고 실패했다고 말한다.
 */

const fmt = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value))
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** 홈 한 장에 필요한 것을 한 번에 가져온다. 퀵버튼은 없어도 홈은 뜬다. */
async function fetchHome() {
  const [today, buttons] = await Promise.all([
    getMyWaveToday(),
    getMyWaveExpenseTemplates().catch(() => [] as MyWaveExpenseTemplateResponse[]),
  ])
  return { today, templates: [...buttons].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3) }
}

export function TodayHome() {
  const navigate = useNavigate()
  const [today, setToday] = useState<MyWaveTodayResponse | null>(null)
  const [templates, setTemplates] = useState<MyWaveExpenseTemplateResponse[]>([])
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  // 기록이 저장된 횟수. 바뀔 때마다 잔에서 물방울이 튀고 벨루가가 뛴다.
  const [splash, setSplash] = useState(0)
  // 하루 예산을 막 넘긴 순간에만 잔을 흔든다.
  const [shake, setShake] = useState(0)
  const [toast, setToast] = useState<{ id: number | null; text: string } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  function showToast(next: { id: number | null; text: string }) {
    setToast(next)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 5000)
  }

  function apply(home: Awaited<ReturnType<typeof fetchHome>>) {
    setToday(home.today)
    setTemplates(home.templates)
    setFailed(false)
  }

  async function load() {
    try {
      apply(await fetchHome())
    } catch {
      setFailed(true)
    }
  }

  useEffect(() => {
    let live = true
    fetchHome()
      .then((home) => {
        if (!live) return
        setToday(home.today)
        setTemplates(home.templates)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [])

  // 소비, 코치, 리포트 화면은 화면 틀이 한 번 불러 둔 공용 데이터를 쓴다. 여기서 기록하면 그것도 다시 불러야 한다.
  const { reload } = useMyWaveData()

  async function logQuick(template: MyWaveExpenseTemplateResponse) {
    setBusyId(template.id)
    const wasOver = (today?.overToday ?? 0) > 0
    try {
      const saved = await logMyWaveExpenseTemplate(template.id)
      setNotice('')
      setSplash((value) => value + 1)
      callBeluga({ kind: 'splash', element: document.querySelector<HTMLElement>('[data-beluga-target="glass"]'), line: '기록했어요!' })
      showToast({ id: saved.id, text: `${template.name} ${fmt(Number(template.amount))}원 기록했어요` })
      const home = await fetchHome()
      apply(home)
      reload()
      if (!wasOver && home.today.overToday > 0) setShake((value) => value + 1)
    } catch {
      setNotice('기록하지 못했어요. 잠시 후 다시 눌러 주세요.')
    } finally {
      setBusyId(null)
    }
  }

  /** 방금 누른 퀵버튼을 되돌린다. 잘못 누르는 일이 많은 버튼이라 바로 되돌릴 수 있어야 한다. */
  async function undo(id: number) {
    window.clearTimeout(toastTimer.current)
    setToast(null)
    try {
      await deleteMyWaveExpense(id)
      showToast({ id: null, text: '기록을 되돌렸어요' })
      await load()
      reload()
    } catch {
      showToast({ id: null, text: '되돌리지 못했어요. 소비 화면에서 지워 주세요.' })
    }
  }

  if (failed) {
    return (
      <section className="mx-auto max-w-[560px] rounded-[24px] bg-white p-8 text-center">
        <div className="flex justify-center"><Beluga mood="calm" size="md" framed /></div>
        <h2 className="wave-jua mt-4 text-[20px] text-slate-900">오늘 정보를 불러오지 못했어요</h2>
        <p className="mt-2 text-[14px] text-slate-500">서버에 연결되지 않았어요. 연결을 확인한 뒤 다시 불러와 주세요.</p>
        <button onClick={load} className="pressable mt-5 h-11 rounded-full bg-blue-700 px-5 text-[14px] font-bold text-white">다시 불러오기</button>
      </section>
    )
  }

  if (!today) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-[1120px] flex-col items-center justify-center gap-3" aria-busy="true">
        <BelugaArt mood="cheer" className="wave-bob h-32 w-32" />
        <p className="wave-jua text-[18px] text-slate-500">오늘의 잔을 채우는 중…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-5">
        <SodaHero today={today} templates={templates} busyId={busyId} notice={notice} splash={splash} shake={shake} onQuick={logQuick} onManual={() => navigate('/spending')} onSetBudget={() => navigate('/assets')} />
        <WeekCups today={today} />
      </div>
      <div className="space-y-5">
        <BelugaTip today={today} />
        <TodayRecords today={today} onMore={() => navigate('/spending')} />
        <GoalGlance today={today} onCreate={() => navigate('/goals/new')} onOpen={() => navigate('/goals')} />
        <InvestGlance today={today} onOpen={() => navigate('/portfolio')} />
      </div>
      {toast && (
        <div role="status" className="toast-in fixed bottom-24 left-1/2 z-50 flex items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-4 pr-2.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(25,31,40,.3)] lg:bottom-8">
          {toast.id !== null && (
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#4fcfb0] text-slate-900">
              <CheckDraw className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="whitespace-nowrap">{toast.text}</span>
          {toast.id !== null && (
            <button onClick={() => undo(toast.id as number)} className="flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-3 text-[13px] font-bold">
              <RotateCcw className="h-3.5 w-3.5" /> 되돌리기
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** 벨루가를 누르면 하는 말. 시간대에 따라 첫마디가 다르다. 금액은 말하지 않는다. */
function belugaLines(date: Date) {
  const hour = date.getHours()
  const greeting = hour < 11
    ? '좋은 아침이에요! 오늘도 한 잔 가득 시작해요.'
    : hour < 17
      ? '점심은 맛있게 먹었어요? 기록도 잊지 말아요.'
      : '오늘 하루도 수고했어요. 남은 잔은 내일로 흘려보내요.'
  return [
    greeting,
    '쓰자마자 기록하면 잔이 정확해져요.',
    '자주 가는 가게는 버튼이 돼요. 한 번에 기록!',
    '안 쓴 돈은 남은 날들에 조금씩 나눠 담겨요.',
    '간지러워요!',
  ]
}

/** 큰 숫자는 자릿수마다 굴러서 새 값에 맞춰진다. 잔이 줄어드는 것과 비슷한 박자다. */
function FlowingNumber({ value }: { value: number }) {
  return <Odometer value={fmt(value)} />
}

/** 잔에 남은 비율. 하루 예산이 0 이면(예산 미설정 포함) 잔은 비어 있다. */
function glassLevel(today: MyWaveTodayResponse) {
  const forced = devWaterLevel()
  if (forced !== null) return forced
  if (today.dailyBudget <= 0) return 0
  return Math.max(0, Math.min(1, today.remainingToday / today.dailyBudget))
}

/**
 * 개발 서버에서만: 주소 뒤에 ?water=0.3 처럼 붙이면 데이터와 상관없이 잔의 물 높이를 그 값(0~1)으로 보여 준다.
 * 벨루가의 단계(활발 / 느려짐 / 엎드림 / 없음)를 눈으로 맞출 때 쓴다. 배포 빌드에서는 이 분기가 통째로 빠진다.
 */
function devWaterLevel(): number | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('water')
  if (raw === null) return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null
}

function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY[date.getDay()]}요일`
}

function SodaHero({
  today,
  templates,
  busyId,
  notice,
  splash,
  shake,
  onQuick,
  onManual,
  onSetBudget,
}: {
  today: MyWaveTodayResponse
  templates: MyWaveExpenseTemplateResponse[]
  busyId: number | null
  notice: string
  splash: number
  shake: number
  onQuick: (template: MyWaveExpenseTemplateResponse) => void
  onManual: () => void
  onSetBudget: () => void
}) {
  const level = glassLevel(today)
  const over = today.overToday > 0
  // 나쁜 소식 앞에서는 신난 얼굴을 쓰지 않는다. 팔짱 낀 얼굴로 바꾸고 작게 물린다.
  const mood: BelugaMood = !today.budgetSet || over || level === 0 ? 'concern' : level >= 0.5 ? 'hello' : 'cheer'
  const faceAlt = mood === 'hello' ? '손을 흔드는 벨루가' : mood === 'cheer' ? '휴대폰을 보는 벨루가' : '팔짱 낀 벨루가'
  const [lines] = useState(() => belugaLines(new Date()))
  const { lively } = useLiveliness()
  const hero = useRef<HTMLElement>(null)
  const tilt = useCursorTilt(6, 8, lively, hero)
  const bumpLine = over
    ? '오늘은 여기까지만 해요. 내일 다시 채워져요.'
    : level < 0.25
      ? '기록했어요. 잔이 거의 비었어요!'
      : '기록했어요! 잔이 정확해졌어요.'

  return (
    <motion.section ref={hero} {...tilt.handlers} className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#194fe5_0%,#1d67f2_48%,#51b9ff_100%)] px-6 pb-6 pt-6 text-white lg:px-8 lg:pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_8%,rgba(255,255,255,.28),transparent_32%)]" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />
      <Bubbles rise={420} />
      <div aria-hidden="true" className="hero-sheen" />

      <div className={`relative flex flex-wrap items-center gap-2 ${today.budgetSet ? 'lg:pr-[92px]' : 'pr-[76px] sm:pr-[92px]'}`}>
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-[13px] font-semibold">{dateLabel(today.date)}</span>
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-[13px] font-semibold">이번 달 {today.daysLeftInMonth}일 남음</span>
      </div>

      {/* 벨루가는 날짜와 제목 줄 높이 안에서만 앉는다. 큰 숫자 줄은 가리지 않는다. 누르면 말을 건다. */}
      <motion.div style={tilt.style} className={`absolute right-3 top-2 z-20 sm:right-5 ${today.budgetSet ? 'hidden lg:block' : ''}`}>
        <div key={mood} className={`wave-pop ${mood === 'concern' ? '' : 'beluga-breathe'}`}>
          <BelugaTap
            mood={mood}
            alt={faceAlt}
            lines={lines}
            bump={splash}
            bumpLine={bumpLine}
            imgClassName={mood === 'concern' ? 'h-[80px] w-[72px] sm:h-[92px] sm:w-[84px]' : 'h-[92px] w-[86px] sm:h-[104px] sm:w-[96px]'}
          />
        </div>
      </motion.div>

      <div className="relative mt-6">
        <span className="wave-jua text-[20px]">오늘 더 써도 되는 돈</span>
        <div className="flex items-baseline gap-x-1.5 whitespace-nowrap">
          <span className="wave-num text-[56px] font-bold leading-[1.1] [text-shadow:0_5px_0_rgba(25,79,229,.35)] sm:text-[76px]">
            <FlowingNumber value={today.remainingToday} />
          </span>
          <span className="wave-jua text-[28px] sm:text-[30px]">원</span>
        </div>
      </div>

      {!today.budgetSet ? (
        <div className="relative mt-4 rounded-[24px] bg-white/95 p-5 text-slate-900">
          <p className="text-[15px] font-semibold">이번 달 생활비를 정하면 하루에 얼마까지 써도 되는지 계산해 드려요.</p>
          <p className="mt-1 text-[13px] text-slate-500">오늘 쓴 돈 {fmt(today.spentToday)}원</p>
          <button onClick={onSetBudget} className="pressable mt-4 h-11 rounded-full bg-blue-700 px-5 text-[14px] font-bold text-white">생활비 정하기</button>
        </div>
      ) : (
        <SodaGlass today={today} level={level} over={over} splash={splash} shake={shake} />
      )}

      <div className="relative mt-5">
        <span className="text-[13px] font-bold">눌러서 바로 기록</span>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onQuick(template)}
              disabled={busyId !== null}
              className="wave-chip flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-bold text-slate-900 shadow-[0_4px_0_rgba(25,79,229,.3)] disabled:opacity-60"
            >
              {template.name}
              <span className="wave-num font-semibold text-blue-700">−{fmt(Number(template.amount))}</span>
            </button>
          ))}
          <button onClick={onManual} className="flex h-11 items-center gap-1.5 rounded-full border-2 border-white/70 px-4 text-[14px] font-bold">
            <Plus className="h-4 w-4" /> 직접 입력
          </button>
        </div>
        <p className="mt-2 min-h-5 text-[13px] font-medium text-white/90" role="status">
          {notice || (templates.length === 0 ? '같은 가게를 몇 번 기록하면 여기에 버튼이 생겨요.' : '')}
        </p>
      </div>
    </motion.section>
  )
}

// 잔 속 탄산 기포. 신나게 단계에서는 두 배로 많다.
const FIZZ = [
  { left: 12, bottom: 6, size: 5, delay: 0 },
  { left: 28, bottom: 14, size: 7, delay: 1.2 },
  { left: 47, bottom: 22, size: 9, delay: 0.5 },
  { left: 63, bottom: 6, size: 5, delay: 2.1 },
  { left: 78, bottom: 14, size: 7, delay: 0.9 },
  { left: 88, bottom: 22, size: 9, delay: 1.7 },
]
const FIZZ_MORE = [
  ...FIZZ,
  { left: 6, bottom: 10, size: 4, delay: 2.6 },
  { left: 20, bottom: 26, size: 6, delay: 0.3 },
  { left: 38, bottom: 4, size: 5, delay: 1.9 },
  { left: 55, bottom: 18, size: 4, delay: 2.9 },
  { left: 70, bottom: 28, size: 6, delay: 1.4 },
  { left: 94, bottom: 8, size: 4, delay: 0.7 },
]

// 물방울이 흩어지는 방향. 매번 같은 모양으로 튀어야 "같은 동작"으로 읽힌다.
const DROPS = [
  { left: 22, dx: -34, dy: -58, size: 9 },
  { left: 34, dx: -14, dy: -78, size: 7 },
  { left: 46, dx: 4, dy: -92, size: 11 },
  { left: 55, dx: 18, dy: -70, size: 8 },
  { left: 66, dx: 36, dy: -84, size: 10 },
  { left: 76, dx: 44, dy: -52, size: 7 },
  { left: 40, dx: -26, dy: -40, size: 6 },
  { left: 60, dx: 28, dy: -36, size: 6 },
]

function SodaGlass({ today, level, over, splash, shake }: { today: MyWaveTodayResponse; level: number; over: boolean; splash: number; shake: number }) {
  const liquid = useRef<HTMLDivElement>(null)
  const { lively } = useLiveliness()
  const fizz = lively ? FIZZ_MORE : FIZZ
  // 잔 높이 220px 가운데 글자는 위에서 56px 안에 있다. 물이 그 위까지 올라오면 글자가 물 위에 놓인다.
  const onLiquid = level >= 0.74
  // 물이 줄면 벨루가 기운도 빠진다. 60% 아래면 느려지고 아끼자는 말을, 몸이 안 잠기면(36% 아래) 엎드려 힘없이 쉰다.
  // 혼내지 않는다. 남은 금액을 알려 주고 내일이면 다시 찬다고 말한다.
  const remaining = fmt(today.remainingToday)
  const energy = level >= 0.6 ? 'full' : 'low'
  const savingLines = level >= 0.6 ? undefined : ['슬슬 아껴 볼까요?', `남은 건 ${remaining}원이에요. 천천히!`, '오늘 남은 건 꼭 필요한 데만.', '간식은 한 번만 더 생각해요.']
  const shallowLines = ['오늘은 여기서 좀 아껴요…', `조금만 남았어요. ${remaining}원.`, '간식은 내일 물 차면 사요!', '내일이면 다시 차요. 조금만 참아요.']

  // 기록이 저장되면 액체가 한 번 출렁한다. 높이 전환(wave-liquid)과 겹쳐야 하므로 다시 그리지 않고 WAAPI 로 얹는다.
  useEffect(() => {
    if (splash === 0 || !liquid.current) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const animation = liquid.current.animate(
      [
        { transform: 'scaleY(1)' },
        { transform: 'scaleY(1.07)', offset: 0.3 },
        { transform: 'scaleY(0.97)', offset: 0.6 },
        { transform: 'scaleY(1)' },
      ],
      { duration: 720, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' },
    )
    return () => animation.cancel()
  }, [splash])

  return (
    <div
      key={`shake-${shake}`}
      role="img"
      data-beluga-target="glass"
      aria-label={`하루 예산 ${fmt(today.dailyBudget)}원 중 ${fmt(today.spentToday)}원 사용, ${fmt(today.remainingToday)}원 남음`}
      className={`relative mt-4 h-[220px] overflow-hidden rounded-[34px] border-4 border-white/95 bg-[#eef4ff] shadow-[inset_0_-6px_0_rgba(25,31,40,.06),0_14px_30px_rgba(25,79,229,.35)] ${shake > 0 ? 'wave-shake' : ''}`}
    >
      {splash > 0 && (
        <div key={`splash-${splash}`} className="pointer-events-none absolute inset-x-0 z-20" style={{ bottom: `${Math.max(level * 100, 6)}%` }} aria-hidden="true">
          {DROPS.map((drop, index) => (
            <span
              key={index}
              className="wave-drop absolute bottom-0 rounded-full bg-[#51b9ff]"
              style={{ left: `${drop.left}%`, width: drop.size, height: drop.size, animationDelay: `${index * 25}ms`, ['--dx' as string]: `${drop.dx}px`, ['--dy' as string]: `${drop.dy}px` }}
            />
          ))}
        </div>
      )}
      {/* 글자 자리(위쪽 56px)까지 물이 차면 흰 글씨, 아니면 파란 글씨. 검정은 물 위에서 탁해 보인다. */}
      <div className={`absolute left-5 top-4 z-10 transition-colors duration-500 ${onLiquid ? 'text-white [text-shadow:0_1px_3px_rgba(16,54,140,.45)]' : 'text-blue-800'}`}>
        <div className="wave-jua text-[15px]">하루 예산 한 잔</div>
        <div className={`text-[13px] font-medium ${onLiquid ? 'text-white/80' : 'text-blue-800/60'}`}>
          <span className={`wave-num font-semibold ${onLiquid ? 'text-white' : 'text-blue-800'}`}>{fmt(today.dailyBudget)}원</span> 중{' '}
          <span className={`wave-num font-semibold ${onLiquid ? 'text-white' : 'text-blue-800'}`}>{fmt(today.spentToday)}원</span> 썼어요
        </div>
      </div>
      <div className="absolute bottom-3.5 right-4 top-3.5 z-10 flex w-2.5 flex-col justify-between" aria-hidden="true">
        {[0, 1, 2, 3].map((tick) => <span key={tick} className="h-0.5 rounded bg-slate-900/15" />)}
      </div>

      <div ref={liquid} className="wave-liquid absolute inset-x-0 bottom-0 origin-bottom bg-[linear-gradient(180deg,#6cb4ff_0%,#51b9ff_40%,#1d67f2_100%)]" style={{ height: `${level * 100}%` }}>
        {level > 0 && (
          <div className="wave-surface absolute inset-x-0 -top-[15px] h-4 overflow-hidden" aria-hidden="true">
            <div className="wave-surface-layer wave-slosh-slow absolute left-0 top-0 h-4 w-[200%]">
              <svg width="100%" height="16" viewBox="0 0 800 16" preserveAspectRatio="none"><path d="M0 9 Q25 2 50 9 T100 9 T150 9 T200 9 T250 9 T300 9 T350 9 T400 9 T450 9 T500 9 T550 9 T600 9 T650 9 T700 9 T750 9 T800 9 V16 H0Z" fill="#a9d6ff" /></svg>
            </div>
            <div className="wave-surface-layer wave-slosh absolute left-0 top-0 h-4 w-[200%]">
              <svg width="100%" height="16" viewBox="0 0 800 16" preserveAspectRatio="none"><path d="M0 11 Q50 4 100 11 T200 11 T300 11 T400 11 T500 11 T600 11 T700 11 T800 11 V16 H0Z" fill="#6cb4ff" /></svg>
            </div>
          </div>
        )}
        {level > 0.08 && fizz.map((bubble) => (
          <span
            key={bubble.left}
            aria-hidden="true"
            className="wave-fizz absolute rounded-full bg-white/70"
            style={{ left: `${bubble.left}%`, bottom: bubble.bottom, width: bubble.size, height: bubble.size, animationDelay: `${bubble.delay}s` }}
          />
        ))}
      </div>

      {/* 좁은 화면에서는 벨루가가 잔 속 물에서 헤엄친다. 물 밖으로는 안 나간다: 안쪽 높이 212px 중 물 높이에서 띠 바닥(12px)을 뺀 만큼이 깊이.
          물이 몸보다 얕으면(약 36% 아래) 헤엄을 멈추고 바닥에 엎드린다. 물이 없으면 벨루가 대신 빨간 글씨. */}
      {level > 0 && (
        <HeroSwimmer
          className="inset-x-3 bottom-3 lg:hidden"
          size={60}
          rise={64}
          depth={level * 212 - 12}
          energy={energy}
          lines={savingLines}
          shallowLines={shallowLines}
          bump={splash}
          bumpLine={over ? '오늘은 여기까지만 해요.' : '기록했어요!'}
        />
      )}
      {level === 0 && (
        <div className="absolute inset-x-0 bottom-5 z-10 text-center">
          <span className="wave-jua text-[16px] text-[#d32f3d]">
            {over ? `오늘 예산보다 ${fmt(today.overToday)}원 더 썼어요` : '한 잔을 다 마셨어요'}
          </span>
        </div>
      )}
    </div>
  )
}

function WeekCups({ today }: { today: MyWaveTodayResponse }) {
  const baseline = today.baselineDailyBudget
  // 잔을 누르면 그날 얼마를 썼는지 보여준다. 처음에는 오늘이 골라져 있다.
  const [picked, setPicked] = useState<string | null>(null)
  const overDays = today.week.filter((day) => !day.future && !day.today && baseline > 0 && day.amount > baseline)
  const cups = today.week.map((day) => {
    const date = new Date(`${day.date}T00:00:00`)
    const label = day.today ? '오늘' : WEEKDAY[date.getDay()]
    const longLabel = `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY[date.getDay()]}요일`
    if (day.future) return { key: day.date, label, longLabel, amount: 0, fill: 0, spill: false, future: true, today: false }
    if (day.today) return { key: day.date, label, longLabel, amount: today.spentToday, fill: glassLevel(today), spill: today.overToday > 0, future: false, today: true }
    const fill = baseline > 0 ? Math.max(0, 1 - day.amount / baseline) : 0
    return { key: day.date, label, longLabel, amount: day.amount, fill, spill: baseline > 0 && day.amount > baseline, future: false, today: false }
  })
  const selected = cups.find((cup) => cup.key === picked) ?? cups.find((cup) => cup.today)

  return (
    <section className="rounded-[24px] bg-white p-5 lg:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="wave-jua text-[18px] text-slate-900">이번 주 일곱 잔</h2>
        {overDays.length > 0 && (
          <span className="text-[12px] font-bold text-[#d32f3d]">
            넘친 날 · {overDays.map((day) => WEEKDAY[new Date(`${day.date}T00:00:00`).getDay()]).join(' ')}
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-7 items-end gap-2">
        {cups.map((cup) => (
          <button
            key={cup.key}
            type="button"
            onClick={() => setPicked(cup.key)}
            aria-pressed={selected?.key === cup.key}
            aria-label={cup.future ? `${cup.longLabel}, 아직 오지 않은 날` : `${cup.longLabel}, ${fmt(cup.amount)}원 사용`}
            className="group flex flex-col items-center gap-1.5"
          >
            <div
              className={`relative h-[60px] w-full max-w-[38px] overflow-hidden rounded-b-[12px] rounded-t-[8px] border-[2.5px] transition-transform duration-200 group-hover:-translate-y-1 ${
                selected?.key === cup.key ? '-translate-y-1.5 shadow-[0_8px_14px_rgba(29,103,242,.25)]' : ''
              } ${
                cup.future ? 'border-dashed border-slate-300 bg-transparent' : cup.spill ? 'border-[#f04452] bg-[#feeced]' : cup.today ? 'border-blue-700 bg-[#eef4ff]' : 'border-[#c3d9ff] bg-[#eef4ff]'
              }`}
            >
              <div className={`wave-liquid absolute inset-x-0 bottom-0 ${cup.today ? 'bg-blue-700' : 'bg-[#6cb4ff]'}`} style={{ height: `${cup.fill * 100}%` }} />
            </div>
            <span className={`wave-jua text-[13px] ${cup.spill ? 'text-[#d32f3d]' : cup.today ? 'text-slate-900' : 'text-slate-500'}`}>{cup.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div key={selected.key} className="cup-tip mt-3 flex items-center justify-between rounded-[14px] bg-[#eef4ff] px-4 py-2.5 text-[13px] font-semibold text-slate-700">
          <span>{selected.longLabel}</span>
          <span className="wave-num text-[15px] text-slate-900">
            {selected.future ? '아직 오지 않은 날' : `${fmt(selected.amount)}원 썼어요`}
          </span>
        </div>
      )}
      <p className="mt-3 text-[12px] text-slate-500">
        {baseline > 0
          ? `잔에 남은 만큼이 평소 하루 예산(${fmt(baseline)}원)보다 덜 쓴 돈이에요.`
          : '생활비 예산을 정하면 날마다 얼마나 남겼는지 잔으로 보여 드려요.'}
      </p>
    </section>
  )
}

/** 벨루가는 안내만 한다. 금액은 말하지 않고, 화면의 숫자가 말하게 둔다. */
function belugaLine(today: MyWaveTodayResponse) {
  if (!today.budgetSet) return '생활비 예산을 정하면 하루에 얼마까지 써도 되는지 알려 드릴게요.'
  if (today.overToday > 0) return '오늘 예산을 넘었어요. 남은 날들의 하루 예산이 조금씩 줄어들어요.'
  const level = glassLevel(today)
  if (level < 0.25) return '잔이 거의 비었어요. 오늘은 여기서 멈추면 남은 날이 편해져요.'
  if (today.spentToday === 0) return '아직 오늘 쓴 돈이 없어요. 쓰면 바로 기록해 두세요.'
  return '오늘 안 쓴 돈은 남은 날들의 하루 예산에 나눠서 더해져요.'
}

function BelugaTip({ today }: { today: MyWaveTodayResponse }) {
  return (
    <section className="flex items-center gap-3 rounded-[24px] bg-white p-4">
      <Beluga mood="calm" size="md" framed />
      <p className="text-[15px] font-medium leading-6 text-slate-900">{belugaLine(today)}</p>
    </section>
  )
}

function TodayRecords({ today, onMore }: { today: MyWaveTodayResponse; onMore: () => void }) {
  return (
    <section className="rounded-[24px] bg-white px-5 pb-3 pt-5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 className="wave-jua text-[19px] text-slate-900">
          오늘 나간 돈 <span className="wave-num text-[16px] font-semibold text-slate-500">{fmt(today.spentToday)}</span>
        </h2>
        <button onClick={onMore} className="pressable text-[13px] font-bold text-slate-500">전체 기록 <ChevronRight className="inline h-4 w-4" /></button>
      </div>
      {today.todayExpenses.length === 0 ? (
        <p className="border-t border-dashed border-[#dce8ff] py-5 text-[14px] text-slate-500">오늘은 아직 기록이 없어요.</p>
      ) : (
        today.todayExpenses.map((expense) => (
          <div key={expense.id} className="flex min-h-[60px] items-center gap-3 border-t border-dashed border-[#dce8ff]">
            <span className={`wave-jua grid h-11 w-11 shrink-0 place-items-center rounded-[15px] text-[15px] text-slate-900 ${tileColor(expense.category)}`}>
              {expense.category.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold text-slate-900">{expense.merchant}</div>
              <div className="text-[12px] text-slate-500">{expense.category}{timeLabel(expense.createdAt)}</div>
            </div>
            <span className="wave-num text-[17px] font-semibold text-slate-900">−{fmt(Number(expense.amount))}</span>
          </div>
        ))
      )}
    </section>
  )
}

function tileColor(category: string) {
  const palette = ['bg-[#e3f8f2]', 'bg-[#e7eefb]', 'bg-[#feeced]', 'bg-[#eef4ff]']
  const code = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palette[code % palette.length]
}

function timeLabel(createdAt?: string | null) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return ` · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function GoalGlance({ today, onCreate, onOpen }: { today: MyWaveTodayResponse; onCreate: () => void; onOpen: () => void }) {
  const goal = today.mainGoal
  if (!goal) {
    return (
      <section className="rounded-[24px] bg-white p-5">
        <h2 className="wave-jua text-[18px] text-slate-900">모으고 싶은 돈이 있나요?</h2>
        <p className="mt-1 text-[14px] text-slate-500">목표를 하나 정하면 하루에 얼마씩 모으면 되는지 알려 드려요.</p>
        <button onClick={onCreate} className="pressable mt-4 h-11 rounded-full bg-blue-700 px-5 text-[14px] font-bold text-white">목표 만들기</button>
      </section>
    )
  }
  const rate = Math.max(0, Math.min(100, Number(goal.progressRate)))
  return (
    <button
      onClick={(event) => {
        // 이 카드가 있던 자리를 기억해 두면 목표 화면의 히어로가 여기서 출발한다.
        rememberHandoff('goal-hero', event.currentTarget)
        onOpen()
      }}
      className="pressable card-lift block w-full rounded-[24px] bg-white p-5 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="wave-jua truncate text-[18px] text-slate-900">{goal.title}</h2>
        <span className="wave-num shrink-0 rounded-xl bg-[#4fcfb0] px-2.5 py-1 text-[13px] font-semibold text-slate-900">D-{goal.remainingDays}</span>
      </div>
      <div className="relative mt-4 h-[22px]">
        <div className="absolute inset-x-0 top-0.5 h-[18px] rounded-full bg-[#dce8ff]" />
        <div className="absolute left-0 top-0.5 h-[18px] overflow-hidden rounded-full bg-[linear-gradient(90deg,#51b9ff,#1d67f2)]" style={{ width: `${rate}%` }}>
          <span aria-hidden="true" className="stripes" />
        </div>
        <div className="goal-dot absolute -top-0.5 h-[26px] w-[26px] rounded-full border-4 border-white bg-[#4fcfb0] shadow-[0_3px_8px_rgba(25,31,40,.25)]" style={{ left: `calc(${rate}% - 13px)` }} />
      </div>
      <div className="mt-3 flex justify-between text-[13px] font-medium text-slate-500">
        <span><b className="wave-num font-semibold text-slate-900">{fmt(Number(goal.currentAmount))}</b> / {fmt(Number(goal.targetAmount))}원</span>
        <span className="wave-num font-semibold text-blue-700">{rate}%</span>
      </div>
      {Number(goal.remainingAmount) > 0 && (
        <p className="mt-3 rounded-[14px] bg-[#eef4ff] px-3.5 py-2.5 text-[13px] font-semibold text-slate-900">
          하루 {fmt(Number(goal.dailyRequiredAmount))}원씩 모으면 목표일에 닿아요.
        </p>
      )}
    </button>
  )
}

function InvestGlance({ today, onOpen }: { today: MyWaveTodayResponse; onOpen: () => void }) {
  const investment = today.investment
  // 가입 직후의 빈 포트폴리오는 "0원 ▲0.00%"로 보여주지 않는다.
  if (!investment || (Number(investment.evaluationAmount) === 0 && Number(investment.plannedThisMonth) === 0)) return null
  const rate = Number(investment.returnRate)
  return (
    <button onClick={onOpen} className="pressable card-lift flex w-full items-center gap-3 rounded-[24px] bg-[#1d67f2] px-5 py-4 text-left text-white">
      <div className="min-w-0 flex-1">
        <div className="wave-jua text-[16px]">투자</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="wave-num text-[22px] font-bold">{fmt(Number(investment.evaluationAmount))}원</span>
          {/* 국내 시세 관행: 오르면 빨강, 내리면 파랑 */}
          <span className={`wave-num rounded-[10px] bg-white px-2 py-0.5 text-[13px] font-semibold ${rate >= 0 ? 'text-[#f04452]' : 'text-[#1d67f2]'}`}>
            {rate >= 0 ? '▲' : '▼'} {Math.abs(rate).toFixed(2)}%
          </span>
        </div>
        {investment.plannedThisMonth > 0 && (
          <div className="mt-1 text-[12px] font-medium">
            이번 달 투자 계획 중 남은 돈 <b className="wave-num font-semibold">{fmt(Number(investment.remainingThisMonth))}원</b>
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0" />
    </button>
  )
}
