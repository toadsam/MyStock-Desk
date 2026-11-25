import { ArrowLeft, ArrowRight, Check, Pencil, X } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { submitSurvey } from '../api/surveyApi'
import { BelugaArt, type BelugaMood } from '../mywave/BelugaArt'
import './survey.css'

/**
 * 만족도 설문. 로그인 없이 열리고, 이름이나 이메일을 묻지 않는다.
 *
 * 화면은 살아 있는 바다다. 아무것도 누르지 않아도 빛줄기가 흔들리고, 방울이 오르고, 물고기 떼가 지나가고,
 * 벨루가가 혼자 헤엄친다. 손가락을 대면 물결이 퍼지고 물고기는 달아나고 벨루가는 따라온다.
 * 답은 방울로 한다: 꾹 눌러 불고, 떠다니는 방울을 터뜨린다.
 *
 * 첫 질문에서 써 본 사람과 구경만 한 사람을 가른다. 써 보지 않은 사람에게 만족도를 물을 수는 없어서다.
 * 그다음 두 질문(지금 상황, 투자 여부)은 모두에게 묻는다. 답한 사람이 대상 사용자인지 알아야 결과를 읽을 수 있다.
 * 끝 무렵 두 질문(돈을 내도 쓸 기능, 한 달에 낼 금액)도 모두에게 묻는다. 수익화 방향을 정할 근거다.
 * 써 본 사람에게는 며칠 써 봤는지도 묻는다. 하루 써 본 사람과 2주 써 본 사람의 만족도는 무게가 다르다.
 *
 * 움직임은 전부 한 개의 requestAnimationFrame 안에서 계산한다. 배경은 캔버스에 그리고,
 * 벨루가와 선택지 방울은 DOM 을 직접 옮긴다(프레임마다 React 를 다시 그리지 않는다).
 */

type Path = 'used' | 'looked'
type StepId = 'path' | 'situation' | 'invest' | 'period' | 'satisfaction' | 'best' | 'pain' | 'change' | 'payFor' | 'price' | 'nps' | 'whyNot' | 'wouldHelp' | 'comment'
/** 하나만 고르는 방울 질문. 터뜨리면 잠깐 뒤에 다음 질문으로 넘어간다. */
type SingleStep = 'situation' | 'invest' | 'change' | 'period' | 'price'
/** 여러 개 고르는 방울 질문. 직접 적기 방울이 있다. */
type MultiStep = 'best' | 'pain' | 'whyNot' | 'wouldHelp' | 'payFor'
type PopStep = 'path' | SingleStep | MultiStep

type Answers = {
  path: Path | null
  situation: string | null
  invest: string | null
  /** 써 보고 돈 쓰는 게 달라졌는지. 써 본 사람만. */
  change: string | null
  /** 며칠 써 봤는지. 써 본 사람만. */
  period: string | null
  /** 한 달에 얼마까지 낼 수 있는지. 모두. */
  price: string | null
  /** 방울을 분 정도(0~100). 0 은 아직 답하지 않은 것. 보낼 때 1~5 로 바꾼다. */
  satisfaction: number
  best: string[]
  pain: string[]
  nps: number | null
  whyNot: string[]
  wouldHelp: string[]
  /** 돈을 내고라도 쓰고 싶은 기능. 모두. */
  payFor: string[]
  comment: string
}

const EMPTY: Answers = { path: null, situation: null, invest: null, change: null, period: null, price: null, satisfaction: 0, best: [], pain: [], nps: null, whyNot: [], wouldHelp: [], payFor: [], comment: '' }

const FLOW: Record<Path, StepId[]> = {
  used: ['path', 'situation', 'invest', 'period', 'satisfaction', 'best', 'pain', 'change', 'payFor', 'price', 'nps', 'comment'],
  looked: ['path', 'situation', 'invest', 'whyNot', 'wouldHelp', 'payFor', 'price', 'comment'],
}

const PATHS: { value: Path; label: string }[] = [
  { value: 'used', label: '네,\n써 봤어요' },
  { value: 'looked', label: '아직요,\n구경만 했어요' },
]
const NONE = '딱히 없어요'
/** 보기에 없는 답을 직접 적는 방울. 터뜨리면 그 자리에서 입력 칸이 열린다. */
const WRITE = '직접 적기'
/** 서버가 고르는 답 하나에 허용하는 길이와 개수(SurveySubmitRequest). */
const WRITE_MAX = 40
const CHOICE_MAX = 10
const WRITE_EXAMPLES: Record<MultiStep, string> = {
  best: '예: 알림이 마음에 들어요',
  pain: '예: 글씨가 작아요',
  whyNot: '예: 시간이 없었어요',
  wouldHelp: '예: 아이폰 앱',
  payFor: '예: 카드 내역 자동 연동',
}
/** 방울 안에 들어가야 해서 짧게 쓴다. */
const POOLS: Record<MultiStep, string[]> = {
  best: ['오늘 써도 되는 돈', '버튼 한 번 기록', '목표 모으기', 'AI 코치', '귀여운 벨루가', '깔끔한 화면', NONE],
  pain: ['직접 적기 귀찮아요', '뭘 누를지 헷갈려요', '숫자가 안 믿겨요', '화면이 느려요', '기능이 부족해요', NONE],
  whyNot: ['구글 로그인이 부담', '뭔지 잘 모르겠어요', '쓰는 가계부가 있어요', '적는 게 귀찮아요', '그냥 구경만'],
  wouldHelp: ['로그인 없이 써 보기', '카드 내역 자동 연동', '더 쉬운 설명', '친구가 추천하면', '잘 모르겠어요'],
  payFor: ['캡처 분석 무제한', '월간 소비 리포트', '목표 여러 개', 'AI 코치 상담', '광고 없이', NONE],
}
/** 하나만 고르는 질문의 보기. 이 글자가 그대로 서버에 저장되니 줄바꿈과 '|' 는 쓰지 않는다. */
const SINGLES: Record<SingleStep, string[]> = {
  situation: ['대학생 (용돈)', '대학생 (알바)', '사회초년생', '취업 준비 중', '그 외'],
  invest: ['하고 있어요', '관심만 있어요', '안 해요'],
  change: ['덜 쓰게 됐어요', '한 번 더 생각해요', '그대로예요', '아직 모르겠어요'],
  period: ['하루', '2~3일', '일주일쯤', '2주 넘게'],
  price: ['무료만 쓸래요', '월 1,000원', '월 3,000원', '월 5,000원', '그 이상도 OK'],
}
const TITLES: Record<StepId, { title: string; hint: string }> = {
  path: { title: 'MyWave, 써 보셨나요?', hint: '방울을 눌러 주세요. 1분이면 끝나요.' },
  situation: { title: '지금 어떤 상황이에요?', hint: '하나만 터뜨려 주세요.' },
  invest: { title: '투자도 하고 계세요?', hint: '주식이나 적립식 투자요. 하나만 터뜨려 주세요.' },
  satisfaction: { title: '얼마나 마음에 들었나요?', hint: '방울을 꾹 눌러서 마음만큼 불어 주세요.' },
  best: { title: '좋았던 걸 터뜨려 주세요', hint: '여러 개 터뜨려도 되고, 직접 적어도 돼요.' },
  pain: { title: '불편했던 걸 터뜨려 주세요', hint: '솔직할수록 도움이 돼요. 직접 적어도 돼요.' },
  change: { title: '써 보고 나서\n돈 쓰는 게 달라졌나요?', hint: '하나만 터뜨려 주세요.' },
  nps: { title: '친구에게 추천하고 싶나요?', hint: '0은 전혀, 10은 꼭.' },
  whyNot: { title: '시작하지 않은 이유는요?', hint: '여러 개 터뜨려도 되고, 직접 적어도 돼요.' },
  wouldHelp: { title: '무엇이 있으면 써 볼까요?', hint: '여러 개 터뜨려도 되고, 직접 적어도 돼요.' },
  period: { title: '며칠 정도 써 보셨어요?', hint: '대충이면 돼요. 하나만 터뜨려 주세요.' },
  payFor: { title: '돈을 내도 쓰고 싶은\n기능이 있나요?', hint: '여러 개 터뜨려도 되고, 직접 적어도 돼요.' },
  price: { title: '그런 기능이 있다면\n한 달에 얼마까지 낼까요?', hint: '솔직하게 하나만 터뜨려 주세요.' },
  comment: { title: '마지막으로 한마디!', hint: '안 적어도 괜찮아요. 연락처는 적지 말아 주세요.' },
}

const LEVELS: { label: string; mood: BelugaMood; tired: boolean }[] = [
  { label: '별로였어요', mood: 'concern', tired: true },
  { label: '아쉬워요', mood: 'think', tired: true },
  { label: '보통이에요', mood: 'point', tired: false },
  { label: '좋았어요', mood: 'hello', tired: false },
  { label: '최고예요', mood: 'cheer', tired: false },
]
const levelIndex = (percent: number) => Math.min(4, Math.floor(Math.max(0, percent - 0.01) / 20))

const BELUGA_SIZE = 124
const isSingle = (step: StepId | null): step is SingleStep => step === 'situation' || step === 'invest' || step === 'change' || step === 'period' || step === 'price'
const isMulti = (step: StepId | null): step is MultiStep => step === 'best' || step === 'pain' || step === 'whyNot' || step === 'wouldHelp' || step === 'payFor'
const isPop = (step: StepId): step is PopStep => step === 'path' || isSingle(step) || isMulti(step)
const optionsOf = (step: PopStep) => (step === 'path' ? PATHS.map((item) => item.label) : isSingle(step) ? SINGLES[step] : [...POOLS[step], WRITE])
const sizeOf = (step: PopStep) => (step === 'path' ? 138 : 106)

/** 화면에서 모은 답을 서버가 받는 모양으로 바꿔 보낸다. 갈림길 반대쪽 질문의 답은 넣지 않는다. */
function saveSurvey(answers: Answers): Promise<void> {
  const comment = answers.comment.trim() || undefined
  const about = { situation: answers.situation ?? undefined, invest: answers.invest ?? undefined }
  // 지불 의향은 써 본 사람과 구경만 한 사람 모두에게 묻는다.
  const pay = { payFeatures: answers.payFor, payPrice: answers.price ?? undefined }
  if (answers.path === 'looked') {
    return submitSurvey({ path: 'LOOKED', ...about, ...pay, whyNot: answers.whyNot, wouldHelp: answers.wouldHelp, comment })
  }
  return submitSurvey({
    path: 'USED',
    ...about,
    ...pay,
    spendChange: answers.change ?? undefined,
    usagePeriod: answers.period ?? undefined,
    satisfaction: answers.satisfaction > 0 ? levelIndex(answers.satisfaction) + 1 : undefined,
    nps: answers.nps ?? undefined,
    best: answers.best,
    pain: answers.pain,
    comment,
  })
}

type Hint = { mood: BelugaMood; tired: boolean }
type Look = Hint & { asleep: boolean; swimming: boolean }
/** React 와 프레임 루프가 같이 보는 값. 루프는 매 프레임 여기서 읽는다. */
type Shared = {
  floating: boolean
  radius: number
  caught: boolean[]
  hint: Hint
  finished: boolean
  /** at: 마지막으로 손이 닿은 시각. touched: 한 번이라도 닿았는지(처음에는 따라갈 손가락이 없다). */
  pointer: { x: number; y: number; at: number; touched: boolean }
  /** 남은 시간(초). 시각이 아니라 남은 양으로 들고 있다가 프레임마다 줄인다. */
  cheer: number
  dart: { x: number; y: number; left: number } | null
  pops: { x: number; y: number }[]
  ripples: { x: number; y: number }[]
  /** 글자를 칠 때마다 입력 칸에서 올라오는 작은 방울의 자리. */
  puffs: { x: number; y: number }[]
  /** 직접 적는 동안 벨루가가 옆에 와서 지켜볼 자리. */
  watch: { x: number; y: number } | null
  /** 입력 칸이 열려 있을 때 그 가운데 높이. 떠다니는 방울이 칸을 가리지 않게 위아래로 비켜 간다. */
  band: number | null
  bodies: { x: number; y: number; vx: number; vy: number }[]
}

export default function SurveyPage() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const beluga = useRef<HTMLDivElement>(null)
  const optionNodes = useRef<(HTMLButtonElement | null)[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const shared = useRef<Shared>({ floating: false, radius: 53, caught: [], hint: { mood: 'hello', tired: false }, finished: false, pointer: { x: 0, y: 0, at: 0, touched: false }, cheer: 0, dart: null, pops: [], ripples: [], puffs: [], watch: null, band: null, bodies: [] })
  const pump = useRef<number | undefined>(undefined)
  const timer = useRef<number | undefined>(undefined)

  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [holding, setHolding] = useState(false)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [look, setLook] = useState<Look>({ mood: 'hello', tired: false, asleep: false, swimming: false })
  /** 직접 적는 칸이 열려 있으면 그 자리. x 는 방울이 있던 가로 위치(펼쳐지는 중심), top 은 칸의 세로 위치. */
  const [writing, setWriting] = useState<{ origin: number; top: number } | null>(null)
  const [draft, setDraft] = useState('')
  const writer = useRef<HTMLInputElement>(null)

  const steps = FLOW[answers.path ?? 'used']
  const step = steps[index]
  const last = index === steps.length - 1
  const pop = isPop(step) ? step : null
  const options = pop ? optionsOf(pop) : []
  const picked = pop === 'path' ? PATHS.filter((item) => item.value === answers.path).map((item) => item.label)
    : isSingle(pop) ? (answers[pop] ? [answers[pop]] : [])
    : isMulti(pop) ? answers[pop] : []
  const size = pop ? sizeOf(pop) : 106
  const hint: Hint = done ? { mood: 'trophy', tired: false }
    : writing ? { mood: draft.trim() ? 'think' : 'point', tired: false }
    : hintFor(step, answers)
  /** 방울이 화면에서 사라져 있어야 하는가: 고른 답이거나, 직접 적기 방울이 입력 칸으로 펼쳐져 있을 때. */
  const hidden = (option: string) => (option === WRITE ? writing !== null : picked.includes(option))

  useEffect(() => () => { window.clearInterval(pump.current); window.clearTimeout(timer.current) }, [])
  // 질문이 바뀌면 읽기 프로그램과 키보드가 새 질문에서 시작하게 한다.
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [index, done])
  // 입력 칸이 열리면 바로 칠 수 있게 커서를 둔다.
  useEffect(() => { if (writing) writer.current?.focus({ preventScroll: true }) }, [writing])

  // 프레임 루프가 읽을 값들을 맞춰 둔다.
  useEffect(() => {
    const s = shared.current
    s.floating = pop !== null && !done
    s.radius = size / 2
    s.caught = options.map(hidden)
    s.hint = hint
    s.finished = done
  })
  // 방울 질문에 들어설 때 방울을 화면에 고르게 흩어 놓는다. 그 뒤로는 루프가 떠다니게 한다.
  useEffect(() => {
    const node = canvas.current
    if (!node || !pop) return
    const count = optionsOf(pop).length
    const columns = count <= 2 ? 2 : 3
    const rows = Math.ceil(count / columns)
    const top = 170, bottom = node.clientHeight - 230
    shared.current.bodies = Array.from({ length: count }, (_, n) => {
      const row = Math.floor(n / columns), inRow = Math.min(columns, count - row * columns)
      return {
        x: node.clientWidth * ((n % columns) + 0.5) / inRow + (row % 2 ? 10 : -10),
        y: top + ((row + 0.5) * (bottom - top)) / rows,
        vx: (n % 2 ? 1 : -1) * 8,
        vy: (n % 3 ? -1 : 1) * 8,
      }
    })
  }, [pop])

  /* ---------------------------------------------------------------- 바다 */
  useEffect(() => {
    const node = canvas.current, actor = beluga.current
    if (!node || !actor) return
    const context = node.getContext('2d')
    if (!context) return
    const s = shared.current
    // 들어오자마자 조는 일이 없게, 가만히 있었던 시간은 지금부터 잰다.
    s.pointer.at = performance.now()
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = (min: number, max: number) => min + Math.random() * (max - min)
    let width = 0, height = 0
    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      width = node.clientWidth; height = node.clientHeight
      node.width = Math.round(width * ratio); node.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()

    const bubbles = Array.from({ length: 26 }, () => ({ x: random(0, width), y: random(0, height), r: random(2, 9), speed: random(18, 52), phase: random(0, 6.28) }))
    const motes = Array.from({ length: 46 }, () => ({ x: random(0, width), y: random(0, height), r: random(0.6, 1.8), phase: random(0, 6.28), drift: random(4, 12) }))
    const weeds = Array.from({ length: 7 }, (_, n) => ({ x: (n + 0.5) / 7, tall: random(46, 104), phase: random(0, 6.28), lean: random(10, 26) }))
    type Fish = { x: number; y: number; vx: number; vy: number; base: number; size: number; phase: number; alpha: number }
    let fish: Fish[] = []
    let nextSchool = 1.2
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    const rings: { x: number; y: number; age: number }[] = []
    const me = { x: width / 2, y: height * 0.3, vx: 0, vy: 0, face: 1, key: '', antic: 5, spin: 0 }

    const spawnSchool = () => {
      const direction = Math.random() < 0.5 ? 1 : -1
      const depth = random(0.35, 1)
      const y = random(height * 0.15, height * 0.8)
      const count = Math.round(random(5, 9))
      for (let n = 0; n < count; n++) {
        const vx = direction * random(46, 70) * depth
        fish.push({ x: direction > 0 ? -30 - n * random(14, 26) : width + 30 + n * random(14, 26), y: y + random(-28, 28), vx, vy: 0, base: vx, size: 7 + depth * 8, phase: random(0, 6.28), alpha: 0.18 + depth * 0.4 })
      }
    }

    let time = 0, last = performance.now(), frameId = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now; time += dt
      const idle = now - s.pointer.at
      const near = s.pointer.touched && idle < 2600

      /* ---- 벨루가 ---- */
      const asleep = idle > 24000 && !s.finished && !s.dart
      let tx = width * 0.5 + Math.sin(time * 0.31) * width * 0.32
      let ty = (s.floating ? height * 0.48 : height * 0.25) + Math.sin(time * 0.47 + 1) * height * (s.floating ? 0.22 : 0.07)
      if (asleep) { tx = me.x; ty = Math.min(height - 210, me.y + 6) }
      if (s.dart) { s.dart.left -= dt; if (s.dart.left <= 0) s.dart = null }
      if (s.dart) { tx = s.dart.x; ty = s.dart.y }
      // 직접 적는 동안에는 손가락을 쫓지 않고 입력 칸 옆에 와서 지켜본다.
      else if (s.watch) { tx = s.watch.x + Math.sin(time * 1.1) * 10; ty = s.watch.y + Math.sin(time * 1.7) * 6 }
      else if (near) { tx = s.pointer.x; ty = s.pointer.y - 86 }
      const pull = s.dart ? 16 : s.watch ? 7 : near ? 9 : 2.2
      const drag = s.dart ? 7 : 3.4
      me.vx += ((tx - me.x) * pull - me.vx * drag) * dt
      me.vy += ((ty - me.y) * pull - me.vy * drag) * dt
      me.x += me.vx * dt; me.y += me.vy * dt
      const speed = Math.hypot(me.vx, me.vy)
      if (me.vx > 14) me.face = 1; else if (me.vx < -14) me.face = -1
      s.cheer = Math.max(0, s.cheer - dt)
      const cheering = s.cheer > 0
      if (me.spin > 0) me.spin = Math.max(0, me.spin - dt / 0.8)
      // 한참 가만히 두면 혼자 논다: 방울을 불거나 한 바퀴 돈다.
      me.antic -= dt
      if (me.antic <= 0 && !asleep) {
        me.antic = random(5, 9)
        if (idle > 5000) {
          if (Math.random() < 0.5) me.spin = 1
          else for (let n = 0; n < 6; n++) bubbles.push({ x: me.x + me.face * 34 + random(-6, 6), y: me.y - 6, r: random(3, 7), speed: random(40, 80), phase: random(0, 6.28) })
        }
      }
      const tilt = Math.max(-20, Math.min(20, me.vy * 0.14)) * me.face
      const turn = me.spin > 0 ? (1 - me.spin) * 360 : 0
      actor.style.transform = `translate3d(${me.x - BELUGA_SIZE / 2}px,${me.y - BELUGA_SIZE / 2 + Math.sin(time * 2.1) * 5}px,0) scaleX(${me.face}) rotate(${tilt + turn}deg) scale(${1 + Math.sin(time * 1.3) * 0.015})`
      const swimming = speed > 80 && !cheering
      const mood: BelugaMood = cheering || me.spin > 0 ? 'cheer' : swimming ? 'swim' : s.hint.mood
      const tired = s.hint.tired && !swimming && !cheering && me.spin === 0
      const key = `${mood}|${asleep}|${swimming}|${tired}`
      if (key !== me.key) { me.key = key; setLook({ mood, asleep, swimming, tired }) }

      /* ---- 선택지 방울: 서로 밀고, 벨루가가 지나가면 밀려난다 ---- */
      if (s.floating) {
        const top = 150, bottom = height - 215, radius = s.radius
        s.bodies.forEach((body, n) => {
          if (s.caught[n]) return
          body.vx += Math.sin(time * 0.6 + n * 1.7) * 6 * dt
          body.vy += Math.cos(time * 0.5 + n * 2.3) * 6 * dt
          s.bodies.forEach((other, m) => {
            if (m === n || s.caught[m]) return
            const dx = body.x - other.x, dy = body.y - other.y, gap = Math.hypot(dx, dy) || 1
            if (gap < radius * 2 + 6) { const push = (radius * 2 + 6 - gap) * 3; body.vx += (dx / gap) * push * dt; body.vy += (dy / gap) * push * dt }
          })
          const bx = body.x - me.x, by = body.y - me.y, reach = Math.hypot(bx, by) || 1
          if (reach < radius + 50) { body.vx += (bx / reach) * 90 * dt; body.vy += (by / reach) * 90 * dt }
          if (s.band !== null) {
            const away = body.y - s.band
            if (Math.abs(away) < radius + 48) body.vy += (away < 0 ? -1 : 1) * 170 * dt
          }
          if (body.x < radius + 8) body.vx += 60 * dt
          if (body.x > width - radius - 8) body.vx -= 60 * dt
          if (body.y < top) body.vy += 60 * dt
          if (body.y > bottom) body.vy -= 60 * dt
          body.vx *= 1 - 0.9 * dt; body.vy *= 1 - 0.9 * dt
          body.x += body.vx * dt; body.y += body.vy * dt
          const element = optionNodes.current[n]
          if (element) element.style.transform = `translate3d(${body.x - radius}px,${body.y - radius + Math.sin(time * 1.4 + n) * 4}px,0) rotate(${Math.sin(time * 0.9 + n) * 4}deg)`
        })
      }

      /* ---- 터진 자리, 물결 ---- */
      s.pops.splice(0).forEach((point) => {
        for (let n = 0; n < 16; n++) { const angle = (n / 16) * 6.283, power = random(60, 170); sparks.push({ x: point.x, y: point.y, vx: Math.cos(angle) * power, vy: Math.sin(angle) * power, life: 1 }) }
        rings.push({ x: point.x, y: point.y, age: 0 })
      })
      s.ripples.splice(0).forEach((point) => rings.push({ x: point.x, y: point.y, age: 0 }))
      s.puffs.splice(0).forEach((point) => {
        for (let n = 0; n < 2; n++) bubbles.push({ x: point.x + random(-5, 5), y: point.y, r: random(2, 5), speed: random(55, 95), phase: random(0, 6.28) })
      })

      /* ---- 그리기 ---- */
      context.clearRect(0, 0, width, height)
      // 빛줄기: 위에서 내려와 천천히 흔들린다. 손가락 쪽으로 조금 기운다.
      const lean = near ? (s.pointer.x / width - 0.5) * 60 : 0
      context.globalCompositeOperation = 'lighter'
      for (let n = 0; n < 5; n++) {
        const x = width * (0.1 + n * 0.2) + Math.sin(time * 0.22 + n * 1.9) * 46
        const spread = 38 + Math.sin(time * 0.3 + n) * 14
        const gradient = context.createLinearGradient(0, 0, 0, height * 0.9)
        gradient.addColorStop(0, `rgba(190,225,255,${0.13 + Math.sin(time * 0.5 + n * 2) * 0.04})`)
        gradient.addColorStop(1, 'rgba(190,225,255,0)')
        context.fillStyle = gradient
        context.beginPath(); context.moveTo(x - 12, 0); context.lineTo(x + 12, 0); context.lineTo(x + spread + 90 + lean, height * 0.9); context.lineTo(x - spread + 40 + lean, height * 0.9); context.closePath(); context.fill()
      }
      context.globalCompositeOperation = 'source-over'

      // 물고기 떼: 가끔 지나가고, 손가락이나 벨루가가 가까우면 흩어진다.
      nextSchool -= dt
      if (nextSchool <= 0) { spawnSchool(); nextSchool = random(3.5, 7) }
      fish = fish.filter((item) => item.x > -260 && item.x < width + 260)
      fish.forEach((item) => {
        const dx = item.x - s.pointer.x, dy = item.y - s.pointer.y, gap = Math.hypot(dx, dy) || 1
        if (near && gap < 110) { item.vx += (dx / gap) * 520 * dt; item.vy += (dy / gap) * 520 * dt }
        const bx = item.x - me.x, by = item.y - me.y, reach = Math.hypot(bx, by) || 1
        if (reach < 80) { item.vx += (bx / reach) * 260 * dt; item.vy += (by / reach) * 260 * dt }
        item.vx += (item.base - item.vx) * 1.4 * dt; item.vy += (0 - item.vy) * 1.8 * dt
        item.x += item.vx * dt; item.y += item.vy * dt + Math.sin(time * 3 + item.phase) * 0.25
        const headingAngle = Math.atan2(item.vy, item.vx), wag = Math.sin(time * 14 + item.phase) * 0.5
        context.save(); context.translate(item.x, item.y); context.rotate(headingAngle)
        context.fillStyle = `rgba(200,228,255,${item.alpha})`
        context.beginPath(); context.ellipse(0, 0, item.size, item.size * 0.42, 0, 0, 6.283); context.fill()
        context.beginPath(); context.moveTo(-item.size * 0.8, 0); context.lineTo(-item.size * 1.7, -item.size * 0.5 + wag * item.size * 0.5); context.lineTo(-item.size * 1.7, item.size * 0.5 + wag * item.size * 0.5); context.closePath(); context.fill()
        context.restore()
      })

      // 떠다니는 알갱이
      context.fillStyle = 'rgba(220,240,255,.5)'
      motes.forEach((mote) => {
        mote.y -= mote.drift * dt * 0.4; mote.x += Math.sin(time * 0.6 + mote.phase) * 6 * dt
        if (mote.y < -4) { mote.y = height + 4; mote.x = random(0, width) }
        context.globalAlpha = 0.25 + Math.sin(time * 1.2 + mote.phase) * 0.2
        context.beginPath(); context.arc(mote.x, mote.y, mote.r, 0, 6.283); context.fill()
      })
      context.globalAlpha = 1

      // 해초: 바닥에서 흔들린다.
      weeds.forEach((weed, n) => {
        const baseX = weed.x * width, sway = Math.sin(time * 0.9 + weed.phase) * weed.lean + (near ? (s.pointer.x - baseX) * 0.03 : 0)
        context.strokeStyle = n % 2 ? 'rgba(52,211,153,.34)' : 'rgba(45,170,160,.3)'
        context.lineWidth = 7; context.lineCap = 'round'
        context.beginPath(); context.moveTo(baseX, height + 4)
        context.bezierCurveTo(baseX + sway * 0.2, height - weed.tall * 0.4, baseX + sway * 0.9, height - weed.tall * 0.7, baseX + sway, height - weed.tall); context.stroke()
      })

      // 방울: 올라가면서 좌우로 흔들리고, 손가락이 가까우면 비켜 간다.
      if (bubbles.length > 60) bubbles.splice(0, bubbles.length - 60)
      bubbles.forEach((bubble) => {
        bubble.y -= bubble.speed * dt
        bubble.x += Math.sin(time * 1.6 + bubble.phase) * 14 * dt
        const dx = bubble.x - s.pointer.x, dy = bubble.y - s.pointer.y, gap = Math.hypot(dx, dy) || 1
        if (near && gap < 70) { bubble.x += (dx / gap) * 140 * dt; bubble.y += (dy / gap) * 140 * dt }
        if (bubble.y < -12) { bubble.y = height + 12; bubble.x = random(0, width) }
        context.strokeStyle = 'rgba(255,255,255,.55)'; context.lineWidth = 1.2
        context.fillStyle = 'rgba(255,255,255,.1)'
        context.beginPath(); context.arc(bubble.x, bubble.y, bubble.r, 0, 6.283); context.fill(); context.stroke()
        context.fillStyle = 'rgba(255,255,255,.7)'
        context.beginPath(); context.arc(bubble.x - bubble.r * 0.35, bubble.y - bubble.r * 0.35, bubble.r * 0.22, 0, 6.283); context.fill()
      })

      for (let n = rings.length - 1; n >= 0; n--) {
        const ring = rings[n]; ring.age += dt
        if (ring.age > 0.9) { rings.splice(n, 1); continue }
        context.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ring.age / 0.9)})`; context.lineWidth = 2
        context.beginPath(); context.arc(ring.x, ring.y, 10 + ring.age * 90, 0, 6.283); context.stroke()
      }
      for (let n = sparks.length - 1; n >= 0; n--) {
        const spark = sparks[n]; spark.life -= dt * 1.6
        if (spark.life <= 0) { sparks.splice(n, 1); continue }
        spark.vy -= 60 * dt; spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vx *= 1 - 2 * dt; spark.vy *= 1 - 2 * dt
        context.fillStyle = `rgba(255,255,255,${spark.life})`
        context.beginPath(); context.arc(spark.x, spark.y, 2 + spark.life * 2.5, 0, 6.283); context.fill()
      }

      // 움직임을 줄여 달라고 한 사람에게는 한 장만 그려 준다.
      if (!still) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)

    let lastRipple = 0
    const moved = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      s.pointer = { ...point, at: performance.now(), touched: true }
      if (event.type === 'pointerdown' || performance.now() - lastRipple > 160) { lastRipple = performance.now(); s.ripples.push(point) }
    }
    window.addEventListener('pointermove', moved)
    window.addEventListener('pointerdown', moved)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frameId); window.removeEventListener('pointermove', moved); window.removeEventListener('pointerdown', moved); window.removeEventListener('resize', resize) }
  }, [])

  /* ---------------------------------------------------------------- 조작 */
  const set = (patch: Partial<Answers>) => setAnswers((current) => ({ ...current, ...patch }))
  /** 그 자리에서 물방울이 터지고 벨루가가 달려와 기뻐한다. 자리를 안 주면 화면 가운데. */
  const celebrate = (at?: { x: number; y: number }) => {
    const s = shared.current, node = canvas.current
    const point = at ?? (node ? { x: node.clientWidth / 2, y: node.clientHeight * 0.45 } : null)
    if (!point) return
    s.pops.push(point)
    s.dart = { ...point, left: 0.7 }
    s.cheer = 1.5
  }
  const stopPump = () => { window.clearInterval(pump.current); setHolding(false) }
  const startPump = () => {
    window.clearInterval(pump.current)
    setHolding(true)
    pump.current = window.setInterval(() => setAnswers((current) => ({ ...current, satisfaction: Math.min(100, current.satisfaction + 1.6) })), 30)
  }
  const closeWriter = () => { shared.current.watch = null; shared.current.band = null; setWriting(null); setDraft('') }
  const go = (next: number) => { window.clearTimeout(timer.current); stopPump(); closeWriter(); setIndex(next) }
  /** 서버가 받았을 때만 고맙다고 한다. 못 보냈으면 그 자리에 남아 다시 누를 수 있게 한다. */
  const finish = () => {
    if (sending) return
    window.clearTimeout(timer.current)
    setSending(true)
    setFailure(null)
    saveSurvey(answers)
      .then(() => { setDone(true); celebrate() })
      .catch((error: unknown) => setFailure(error instanceof Error ? error.message : '설문을 보내지 못했어요. 다시 눌러 주세요.'))
      .finally(() => setSending(false))
  }
  const next = () => { if (last) finish(); else { celebrate(); go(index + 1) } }

  const burst = (option: string, n: number) => {
    const body = shared.current.bodies[n]
    if (option === WRITE) {
      // 방울이 터진 자리에서 입력 칸이 펼쳐지고, 벨루가가 그 위로 와서 지켜본다.
      const node = canvas.current
      if (!node || picked.length >= CHOICE_MAX) return
      const x = body?.x ?? node.clientWidth / 2
      const top = Math.max(150, Math.min(node.clientHeight - 330, (body?.y ?? node.clientHeight * 0.45) - 36))
      shared.current.pops.push({ x, y: top + 36 })
      shared.current.watch = { x: Math.max(80, Math.min(node.clientWidth - 80, x)), y: top - 58 }
      shared.current.band = top + 36
      setDraft('')
      setWriting({ origin: Math.round((x / node.clientWidth) * 100), top })
      return
    }
    celebrate(body ? { x: body.x, y: body.y } : undefined)
    if (pop === 'path') {
      // 하나만 고르는 질문: 터지는 걸 잠깐 보여 주고 넘어간다.
      set({ path: PATHS[n].value })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setIndex(1), 750)
    } else if (isSingle(pop)) {
      // 하나만 고르는 질문: 고른 답을 바꿔 끼우고, 터지는 걸 잠깐 보여 준 뒤 넘어간다.
      const from = index
      set({ [pop]: option })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => go(from + 1), 750)
    } else if (isMulti(pop)) {
      setAnswers((current) => ({ ...current, [pop]: [...current[pop].filter((item) => item !== option), option] }))
    }
  }
  /** 적은 글을 답 하나로 넣는다. 서버가 받지 않는 글자('|', 줄바꿈)는 빼고, 이미 있는 답이면 한 번만 둔다. */
  const commitDraft = () => {
    const text = draft.replace(/[|\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, WRITE_MAX)
    const node = canvas.current
    if (!text || text === WRITE || !isMulti(pop)) { closeWriter(); return }
    setAnswers((current) => ({ ...current, [pop]: [...current[pop].filter((item) => item !== text), text] }))
    if (node && writing) celebrate({ x: node.clientWidth / 2, y: writing.top + 36 })
    closeWriter()
  }
  /** 글자를 칠 때마다 입력 칸에서 방울이 올라온다. */
  const type = (input: HTMLInputElement) => {
    setDraft(input.value)
    const box = canvas.current?.getBoundingClientRect()
    if (!box) return
    const rect = input.getBoundingClientRect()
    shared.current.puffs.push({ x: rect.left - box.left + Math.min(rect.width - 8, 10 + input.value.length * 9), y: rect.top - box.top })
  }
  const release = (option: string) => {
    if (isSingle(pop)) { window.clearTimeout(timer.current); set({ [pop]: null }) }
    else if (isMulti(pop)) setAnswers((current) => ({ ...current, [pop]: current[pop].filter((item) => item !== option) }))
  }

  const level = LEVELS[levelIndex(answers.satisfaction)]
  const puff = 104 + answers.satisfaction * 1.5
  const text = TITLES[step]
  return (
    <main className="sea flex flex-col px-5 pb-8 pt-4">
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 -z-[1] h-full w-full" aria-hidden="true" />
      <div ref={beluga} className="pointer-events-none absolute left-0 top-0 z-[5]" style={{ width: BELUGA_SIZE, height: BELUGA_SIZE, willChange: 'transform' }} aria-hidden="true">
        <BelugaArt mood={look.mood} asleep={look.asleep} swimming={look.swimming} tired={look.tired} className="h-full w-full drop-shadow-[0_14px_20px_rgba(2,12,60,.45)]" />
      </div>

      {!done && (
        <header className="relative z-[6] mx-auto flex w-full max-w-md items-center justify-between">
          {index > 0 ? (
            <button onClick={() => go(index - 1)} className="pressable -ml-2 flex items-center gap-1 rounded-full px-2 py-2 text-[14px] font-semibold text-blue-100">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> 이전
            </button>
          ) : (
            <Link to="/login" className="pressable -ml-2 rounded-full px-2 py-2 text-[14px] font-semibold text-blue-100">닫기</Link>
          )}
          <div className="flex items-center gap-2" role="img" aria-label={`질문 ${steps.length}개 중 ${index + 1}번째`}>
            {steps.map((id, dot) => (
              <span key={id} className={`h-2 rounded-full transition-all duration-500 ${dot === index ? 'w-6 bg-white' : dot < index ? 'w-2 bg-white/70' : 'w-2 bg-white/25'}`} />
            ))}
          </div>
        </header>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {done ? (
          <section className="sea-in flex flex-1 flex-col items-center justify-end pb-2 text-center">
            <h1 ref={heading} tabIndex={-1} className="sea-float text-[30px] font-bold tracking-[-0.02em] outline-none">고마워요!</h1>
            <p className="mt-2 text-[15px] font-medium leading-6 text-blue-100">들려주신 이야기로 MyWave를 더 좋게 만들게요.</p>
            <div className="relative z-[6] mt-7 w-full space-y-3">
              <Link to="/login" className="pressable flex h-14 items-center justify-center gap-2 rounded-[16px] bg-white text-[16px] font-bold text-blue-700 shadow-[0_10px_24px_rgba(2,12,60,.4)]">
                MyWave 시작하기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/story" className="pressable flex h-12 items-center justify-center rounded-[16px] bg-white/15 text-[15px] font-semibold text-white">소개 다시 보기</Link>
            </div>
          </section>
        ) : (
          <section key={step} className="flex flex-1 flex-col">
            <div className="sea-in text-center">
              <h1 ref={heading} tabIndex={-1} className="sea-float mt-4 whitespace-pre-line text-[23px] font-bold tracking-[-0.02em] outline-none">{text.title}</h1>
              <p className="mt-1.5 text-[14px] font-medium text-blue-100">{text.hint}</p>
            </div>

            {/* 떠다니는 방울. 위치는 프레임 루프가 정한다. */}
            {pop && options.map((option, n) => hidden(option) ? null : (
              <button
                key={option}
                ref={(element) => { optionNodes.current[n] = element }}
                onClick={() => burst(option, n)}
                className={`sea-option whitespace-pre-line ${pop === 'path' ? 'text-[16px]' : 'text-[13.5px]'} ${option === WRITE ? 'sea-option-write' : ''}`}
                style={{ width: size, height: size }}
              >{option === WRITE ? <span className="flex flex-col items-center gap-1"><Pencil className="sea-pen h-5 w-5" aria-hidden="true" />{option}</span> : option}</button>
            ))}

            {/* 직접 적기 방울이 터진 자리에서 펼쳐지는 입력 칸. */}
            {writing && isMulti(pop) && (
              <form
                className="sea-writer"
                style={{ top: writing.top, '--origin': `${writing.origin}%` } as CSSProperties}
                onSubmit={(event) => { event.preventDefault(); commitDraft() }}
              >
                <Pencil className="sea-pen h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <input
                  ref={writer}
                  value={draft}
                  onChange={(event) => type(event.currentTarget)}
                  onKeyDown={(event) => { if (event.key === 'Escape') closeWriter() }}
                  maxLength={WRITE_MAX}
                  placeholder={WRITE_EXAMPLES[pop]}
                  aria-label="직접 적기"
                  enterKeyHint="done"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                />
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400" aria-hidden="true">{draft.length}/{WRITE_MAX}</span>
                <button type="button" onClick={closeWriter} aria-label="적지 않고 닫기" className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><X className="h-4 w-4" aria-hidden="true" /></button>
                <button type="submit" disabled={!draft.trim()} aria-label="적은 답 넣기" className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></button>
              </form>
            )}

            {step === 'satisfaction' && (
              <>
                <div className="grid flex-1 place-items-center">
                  <button
                    className="sea-puff grid place-items-center"
                    data-holding={holding}
                    style={{ width: puff, height: puff }}
                    aria-label="꾹 눌러서 방울 불기"
                    onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startPump() }}
                    onPointerUp={stopPump}
                    onPointerCancel={stopPump}
                    onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); set({ satisfaction: Math.min(100, answers.satisfaction + 5) }) } }}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <span className="text-[15px] font-bold text-white/90">{answers.satisfaction === 0 ? '꾹' : ''}</span>
                  </button>
                </div>
                <p className="h-8 text-center text-[22px] font-bold" aria-live="polite">{answers.satisfaction === 0 ? '꾹 눌러 보세요' : level.label}</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-[width] duration-100" style={{ width: `${answers.satisfaction}%` }} /></div>
                <div className="relative z-[6] mt-5 flex w-full gap-3">
                  <button onClick={() => { stopPump(); set({ satisfaction: 0 }) }} disabled={answers.satisfaction === 0} className="pressable h-14 w-24 rounded-[16px] bg-white/15 text-[15px] font-bold text-white disabled:opacity-40">다시</button>
                  <Next onClick={next} disabled={answers.satisfaction === 0} label="이만큼이에요" />
                </div>
              </>
            )}

            {(isSingle(pop) || isMulti(pop)) && (
              <>
                <div className="mt-auto min-h-[40px]">
                  <div className="flex flex-wrap justify-center gap-2" aria-live="polite">
                    {picked.map((option) => (
                      <button key={option} onClick={() => release(option)} aria-label={`${option} 빼기`} className="sea-chip pressable relative z-[6] flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-blue-700">
                        {option} <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative z-[6] mt-3 flex"><Next onClick={next} disabled={picked.length === 0} label={picked.length === 0 ? '방울을 터뜨려 주세요' : isSingle(pop) ? '다음' : `${picked.length}개 골랐어요`} /></div>
              </>
            )}

            {step === 'nps' && (
              <>
                <div className="grid flex-1 place-items-center">
                  <div role="radiogroup" aria-label="추천하고 싶은 정도" className="relative z-[6] flex max-w-[330px] flex-wrap justify-center gap-x-2.5 gap-y-5">
                    {Array.from({ length: 11 }, (_, value) => (
                      <button key={value} role="radio" aria-checked={answers.nps === value} aria-label={`${value}점`} onClick={() => { set({ nps: value }); celebrate() }} className="sea-num" style={{ '--i': value } as CSSProperties}>{value}</button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-[12px] font-semibold text-blue-100"><span>0 전혀요</span><span>꼭 추천할래요 10</span></div>
                <div className="relative z-[6] mt-4 flex"><Next onClick={next} disabled={answers.nps === null} label="다음" /></div>
              </>
            )}

            {step === 'comment' && (
              <>
                <div className="flex-1" />
                <textarea
                  value={answers.comment}
                  onChange={(event) => set({ comment: event.target.value })}
                  maxLength={300}
                  rows={4}
                  placeholder="이런 게 있으면 좋겠어요…"
                  aria-label="하고 싶은 말"
                  className="sea-in relative z-[6] w-full resize-none rounded-[18px] border-[1.5px] border-white/35 bg-white/12 p-4 text-[15px] font-medium leading-6 text-white outline-none backdrop-blur placeholder:text-blue-100/70 focus:border-white"
                />
                <div className="mt-1 text-right text-[12px] font-medium text-blue-100">{answers.comment.length} / 300</div>
                {failure && <p role="alert" className="relative z-[6] mt-2 rounded-[14px] bg-rose-500/90 px-4 py-3 text-[13px] font-semibold text-white">{failure}</p>}
                <div className="relative z-[6] mt-3 flex"><Next onClick={next} disabled={sending} label={sending ? '보내는 중이에요…' : failure ? '다시 보내기' : answers.comment.trim() ? '보내기' : '건너뛰고 보내기'} /></div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

/** 지금 질문과 고른 답에 맞는 벨루가 표정. 아쉽다는 답에는 기운이 빠진다(웃으며 받으면 놀리는 것 같다). */
function hintFor(step: StepId, answers: Answers): Hint {
  const some = (list: string[]) => list.length > 0 && !list.includes(NONE)
  if (step === 'satisfaction') return answers.satisfaction === 0 ? { mood: 'think', tired: false } : LEVELS[levelIndex(answers.satisfaction)]
  if (step === 'best') return { mood: some(answers.best) ? 'cheer' : 'hello', tired: false }
  if (step === 'pain') return some(answers.pain) ? { mood: 'concern', tired: true } : { mood: 'think', tired: false }
  if (step === 'situation' || step === 'invest') return { mood: answers[step] ? 'hello' : 'think', tired: false }
  // "그대로예요" 에 기운 빠진 얼굴을 하면 탓하는 것처럼 보인다. 손짓하는 얼굴로 받는다.
  if (step === 'change') return { mood: answers.change === '덜 쓰게 됐어요' || answers.change === '한 번 더 생각해요' ? 'cheer' : answers.change ? 'point' : 'think', tired: false }
  if (step === 'period') return { mood: answers.period ? 'hello' : 'think', tired: false }
  if (step === 'payFor') return { mood: some(answers.payFor) ? 'surprise' : 'think', tired: false }
  // 무료만 쓰겠다는 답도 소중한 답이다. 실망한 얼굴로 받지 않는다.
  if (step === 'price') return { mood: answers.price ? 'cheer' : 'think', tired: false }
  if (step === 'nps') return answers.nps === null ? { mood: 'think', tired: false } : answers.nps >= 9 ? { mood: 'cheer', tired: false } : answers.nps >= 7 ? { mood: 'hello', tired: false } : answers.nps >= 4 ? { mood: 'point', tired: false } : { mood: 'concern', tired: true }
  if (step === 'whyNot') return answers.whyNot.length > 0 ? { mood: 'concern', tired: true } : { mood: 'think', tired: false }
  if (step === 'wouldHelp') return { mood: answers.wouldHelp.length > 0 ? 'surprise' : 'think', tired: false }
  if (step === 'comment') return { mood: answers.comment.trim() ? 'cheer' : 'point', tired: false }
  return { mood: 'hello', tired: false }
}

function Next({ onClick, disabled = false, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="pressable flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] bg-white text-[16px] font-bold text-blue-700 shadow-[0_10px_24px_rgba(2,12,60,.35)] disabled:opacity-40 disabled:shadow-none">
      {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
