import { ChevronLeft, ChevronRight, Coffee, LockKeyhole, Plus, Utensils } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { BelugaArt } from './BelugaArt'
import { markWelcomeSeen } from './welcome'

/**
 * 처음 온 사람에게 한 번 보여 주는 소개. 카드 네 장이고 20초면 넘긴다.
 *
 * 읽으라고 만든 설명서가 아니다. 홈에서 처음 보게 될 것(잔), 가장 자주 할 일(기록), 그다음 할 일(목표),
 * 그리고 안심해도 되는 이유(은행에 연결하지 않는다)를 한 장씩 보여 주고 바로 "처음 해 볼 세 가지"로 넘긴다.
 * 언제든 건너뛸 수 있고, 내 정보에서 다시 열 수 있다. 그림 속 숫자는 전부 예시다.
 */
type Slide = { title: string; body: string; art: ReactNode }

const SLIDES: Slide[] = [
  {
    title: '잔이 오늘의 예산이에요',
    body: '한 달 생활비를 남은 날짜로 나눠, 오늘 써도 되는 돈을 잔에 채워 드려요. 쓴 만큼 잔이 줄어요.',
    art: <GlassArt />,
  },
  {
    title: '쓴 돈은 금방 적어요',
    body: '얼마를 어디서 썼는지만 적으면 돼요. 자주 가는 곳은 버튼이 생겨서 한 번만 누르면 기록돼요.',
    art: <RecordArt />,
  },
  {
    title: '목표는 하루치로 나눠 드려요',
    body: '얼마를 언제까지 모을지 정하면, 하루에 얼마씩 모으면 되는지 계산해 드려요.',
    art: <GoalArt />,
  },
  {
    title: '은행에 연결하지 않아요',
    body: 'MyWave는 직접 적은 숫자로만 계산해요. 계좌 비밀번호나 카드 정보를 묻지 않고, 기록은 언제든 지울 수 있어요.',
    art: <SafeArt />,
  },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [index, setIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const last = index === SLIDES.length - 1
  const slide = SLIDES[index]

  function leave(to: string) {
    if (auth.member) markWelcomeSeen(auth.member.id)
    navigate(to, { replace: true })
  }

  function go(step: number) {
    setIndex((value) => Math.min(SLIDES.length - 1, Math.max(0, value + step)))
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(SLIDES.length - 1, value + 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-5 py-8 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-bold text-slate-400" aria-live="polite">{index + 1} / {SLIDES.length}</span>
          <button onClick={() => leave('/')} className="pressable rounded-full px-3 py-1.5 text-[14px] font-bold text-slate-500">건너뛰기</button>
        </div>
        <section
          aria-roledescription="소개 카드"
          aria-label={`${SLIDES.length}장 중 ${index + 1}번째`}
          className="overflow-hidden rounded-[28px] bg-white"
          onTouchStart={(event) => { touchStart.current = event.touches[0].clientX }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return
            const moved = event.changedTouches[0].clientX - touchStart.current
            touchStart.current = null
            if (Math.abs(moved) > 48) go(moved < 0 ? 1 : -1)
          }}
        >
          {/* 카드가 바뀔 때마다 그림과 글이 새로 떠오른다. */}
          <div key={index} className="rise-in">
            <div className="relative grid h-64 place-items-center overflow-hidden bg-gradient-to-b from-blue-500 to-blue-700" aria-hidden="true">
              {slide.art}
            </div>
            <div className="px-6 pb-2 pt-6">
              <h1 className="text-[24px] font-black tracking-[-0.03em]">{slide.title}</h1>
              <p className="mt-3 min-h-[72px] text-[15px] font-medium leading-6 text-slate-600">{slide.body}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 pb-5 pt-2" aria-hidden="true">
            {SLIDES.map((item, dot) => (
              <span key={item.title} className={`h-2 rounded-full transition-all ${dot === index ? 'w-7 bg-blue-700' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
        </section>
        <div className="mt-4 flex gap-3">
          {index > 0 && (
            <button onClick={() => go(-1)} aria-label="이전 카드" className="pressable grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-slate-600">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => (last ? leave('/onboarding') : go(1))}
            className="pressable flex h-14 flex-1 items-center justify-center gap-1 rounded-2xl bg-blue-700 text-[16px] font-black text-white"
          >
            {last ? '시작하기' : '다음'} <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  )
}

/** 홈의 잔. 물이 3분의 2쯤 차 있고 위에 오늘 써도 되는 돈이 적혀 있다. */
function GlassArt() {
  return (
    <div className="flex items-end gap-5">
      <div className="relative h-40 w-28 overflow-hidden rounded-b-[26px] rounded-t-[10px] border-[5px] border-white/90 bg-white/10">
        <div className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-b from-sky-300 to-cyan-200">
          <svg className="absolute -top-2 left-0 h-3 w-[200%] animate-wave" viewBox="0 0 200 12" preserveAspectRatio="none">
            <path fill="#7dd3fc" d="M0 6 C25 0 25 12 50 6 S75 0 100 6 S125 12 150 6 S175 0 200 6 V12 H0 Z" />
          </svg>
        </div>
      </div>
      <div className="pb-3 text-white">
        <div className="text-[13px] font-bold text-white/80">오늘 더 써도 되는 돈</div>
        <div className="tnum mt-1 text-[34px] font-black leading-none">12,000<span className="ml-1 text-[18px]">원</span></div>
        <div className="mt-2 text-[12px] font-semibold text-white/70">예시 화면이에요</div>
      </div>
    </div>
  )
}

/** 소비 기록 폼의 축소판. 금액, 카테고리 버튼, 기록 버튼. */
function RecordArt() {
  return (
    <div className="w-60 rounded-[22px] bg-white p-4 text-slate-900 shadow-[0_18px_40px_rgba(10,40,140,.28)]">
      <div className="text-[12px] font-black text-slate-500">얼마를 썼나요</div>
      <div className="tnum mt-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-[20px] font-black">5,600</div>
      <div className="mt-3 flex gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-blue-700 px-3 py-1.5 text-[12px] font-bold text-white"><Coffee className="h-3.5 w-3.5" />카페</span>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-600"><Utensils className="h-3.5 w-3.5" />식비</span>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-blue-700 py-2.5 text-[13px] font-black text-white"><Plus className="h-4 w-4" />기록하기</div>
    </div>
  )
}

/** 목표 고리. 얼마나 왔는지와 하루에 모을 돈. */
function GoalArt() {
  const rate = 37
  const circumference = 2 * Math.PI * 42
  return (
    <div className="flex items-center gap-5 text-white">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="11" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(circumference * rate) / 100} ${circumference}`} />
        </svg>
        <div className="tnum absolute inset-0 grid place-items-center text-[26px] font-black">{rate}%</div>
      </div>
      <div>
        <div className="text-[13px] font-bold text-white/80">여행 자금</div>
        <div className="tnum mt-1 text-[26px] font-black leading-none">하루 4,000원</div>
        <div className="mt-2 text-[12px] font-semibold text-white/70">예시 화면이에요</div>
      </div>
    </div>
  )
}

/** 자물쇠와 벨루가. 연결하지 않는다는 말을 그림으로. */
function SafeArt() {
  return (
    <div className="flex items-center gap-4">
      <BelugaArt mood="hello" className="h-36 w-36 drop-shadow-[0_12px_18px_rgba(10,40,140,.3)]" />
      <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-white/95 text-blue-700 shadow-[0_14px_30px_rgba(10,40,140,.28)]">
        <LockKeyhole className="h-9 w-9" />
      </div>
    </div>
  )
}
