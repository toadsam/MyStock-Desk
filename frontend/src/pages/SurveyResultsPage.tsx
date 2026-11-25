import { ArrowLeft, Check, Copy, MessageCircle, RefreshCw } from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSurveySummary, type SurveySegment, type SurveySummary, type SurveyTally } from '../api/surveyApi'
import { BelugaArt, type BelugaMood } from '../mywave/BelugaArt'
import { useCountUp } from '../mywave/useCountUp'
import './survey-results.css'

/**
 * 설문 결과. 서버가 관리자 계정에만 내어 준다(STOCKFLOW_SURVEY_ADMIN_EMAILS).
 *
 * 이 화면은 숫자를 다시 계산하지 않는다. 평균, 분포, 순위는 모두 서버가 준 값이다.
 * 답한 사람이 누구인지는 서버에도 없어서 여기에도 나오지 않는다.
 */

/** 만족도 1~5점의 얼굴 색과 이름. 설문 화면의 다섯 단계와 같은 말을 쓴다. */
const LEVELS = [
  { label: '별로', color: '#f43f5e', curve: -5 },
  { label: '아쉬움', color: '#fb923c', curve: -2.5 },
  { label: '보통', color: '#94a3b8', curve: 0 },
  { label: '좋음', color: '#38bdf8', curve: 3 },
  { label: '최고', color: '#2563eb', curve: 5.5 },
]

type State = { status: 'loading' } | { status: 'ready'; data: SurveySummary } | { status: 'failed'; message: string }

export default function SurveyResultsPage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [round, setRound] = useState(0)

  const load = useCallback(() => {
    setRefreshing(true)
    getSurveySummary()
      .then((data) => { setState({ status: 'ready', data }); setRound((value) => value + 1) })
      .catch((error: unknown) => setState({ status: 'failed', message: error instanceof Error ? error.message : '결과를 불러오지 못했어요.' }))
      .finally(() => setRefreshing(false))
  }, [])
  useEffect(() => {
    let ignore = false
    getSurveySummary()
      .then((data) => { if (!ignore) setState({ status: 'ready', data }) })
      .catch((error: unknown) => { if (!ignore) setState({ status: 'failed', message: error instanceof Error ? error.message : '결과를 불러오지 못했어요.' }) })
    return () => { ignore = true }
  }, [])

  const data = state.status === 'ready' ? state.data : null
  const total = useCountUp(data?.total ?? 0, 900)
  const mood: BelugaMood = !data || data.total === 0 ? 'point'
    : data.satisfactionAverage === null ? 'hello'
    : data.satisfactionAverage >= 4 ? 'cheer' : data.satisfactionAverage >= 3 ? 'hello' : data.satisfactionAverage >= 2 ? 'think' : 'concern'

  return (
    <main className="res pb-14">
      <header className="res-hero px-5 pb-16 pt-5">
        {[12, 34, 58, 81].map((left, n) => <span key={left} className="res-ray" style={{ left: `${left}%`, animationDelay: `${n * -1.7}s` }} aria-hidden="true" />)}
        {[6, 19, 31, 47, 63, 76, 90].map((left, n) => (
          <span key={left} className="res-bubble" style={{ left: `${left}%`, width: 6 + (n % 3) * 4, height: 6 + (n % 3) * 4, '--dur': `${7 + (n % 4)}s`, '--delay': `${n * -1.3}s`, '--dx': `${(n % 2 ? 1 : -1) * 14}px` } as CSSProperties} aria-hidden="true" />
        ))}
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="pressable -ml-2 flex items-center gap-1 rounded-full px-2 py-2 text-[14px] font-semibold text-blue-100"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> 홈으로</Link>
          <button onClick={load} disabled={refreshing} className="pressable flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'res-spin' : ''}`} aria-hidden="true" /> 새로 고침
          </button>
        </div>
        <div className="mx-auto mt-4 flex max-w-3xl items-end gap-4">
          <div className="res-beluga h-28 w-28 shrink-0"><BelugaArt mood={mood} tired={mood === 'concern'} className="h-full w-full drop-shadow-[0_14px_20px_rgba(2,12,60,.45)]" /></div>
          <div className="min-w-0 pb-2">
            <p className="text-[13px] font-bold tracking-wide text-blue-100">MyWave 만족도 설문</p>
            <h1 className="mt-1 text-[15px] font-semibold text-blue-50">지금까지 모인 이야기</h1>
            <p className="res-total mt-1 text-[52px] font-bold leading-none tracking-[-0.03em]" aria-live="polite">
              {Math.round(total)}<span className="ml-1.5 text-[20px] font-bold text-blue-100">개</span>
            </p>
          </div>
        </div>
        {data && data.total > 0 && (
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-bold">써 본 사람 {data.used}</span>
            <span className="rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-bold">구경만 한 사람 {data.looked}</span>
          </div>
        )}
        <Wave />
      </header>

      <div className="mx-auto -mt-8 max-w-3xl px-5">
        {state.status === 'loading' && <Notice>불러오는 중이에요…</Notice>}
        {state.status === 'failed' && (
          <Notice>
            <p role="alert">{state.message}</p>
            <button onClick={load} className="pressable mt-4 rounded-full bg-blue-700 px-5 py-2.5 text-[14px] font-bold text-white">다시 시도</button>
          </Notice>
        )}
        {data && data.total === 0 && <Empty />}
        {data && data.total > 0 && (
          // 새로 고칠 때마다 막대가 다시 자라게 key 를 바꾼다.
          <div key={round} className="grid gap-4 md:grid-cols-2">
            <Satisfaction data={data} />
            <Recommend data={data} />
            <Ranking index={2} title="써 보고 달라진 것" who="써 본 사람" tallies={data.spendChange} color="#10b981" single />
            <Segments index={3} segments={data.bySituation} />
            <Ranking index={4} title="지금 상황" who="모두" tallies={data.situation} color="#6366f1" single />
            <Ranking index={5} title="투자 여부" who="모두" tallies={data.invest} color="#8b5cf6" single />
            <Ranking index={6} title="좋았던 점" who="써 본 사람" tallies={data.best} color="#2563eb" />
            <Ranking index={7} title="불편했던 점" who="써 본 사람" tallies={data.pain} color="#f43f5e" />
            <Ranking index={8} title="시작하지 않은 이유" who="구경만 한 사람" tallies={data.whyNot} color="#fb923c" />
            <Ranking index={9} title="있으면 써 볼 것" who="구경만 한 사람" tallies={data.wouldHelp} color="#0ea5e9" />
            {/* 수익화 질문(2026-11-25 부터). 질문이 생긴 뒤에 답한 사람만 세므로 "N명 답함"을 함께 보여 준다. */}
            <Ranking index={10} title="며칠 써 봤나요" who="써 본 사람" tallies={data.usagePeriod ?? []} color="#14b8a6" single />
            <Ranking index={11} title="돈을 내도 쓰고 싶은 기능" who="모두" tallies={data.payFeatures ?? []} color="#eab308" />
            <Ranking index={12} title="한 달에 낼 수 있는 금액" who="모두" tallies={data.payPrice ?? []} color="#f59e0b" single />
            <Comments data={data} />
          </div>
        )}
      </div>
    </main>
  )
}

function Wave() {
  const path = 'M0 15 C120 0 240 30 360 15 S600 0 720 15 S960 30 1080 15 S1320 0 1440 15 V30 H0 Z'
  return (
    <>
      <svg className="res-wave res-wave-back" viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden="true"><path fill="#c7dbff" d={path} /></svg>
      <svg className="res-wave" viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden="true"><path fill="#eef4ff" d={path} /></svg>
    </>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="res-card text-center text-[15px] font-semibold text-slate-600">{children}</div>
}

function Empty() {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/survey`
  const copy = () => {
    void navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="res-card text-center">
      <p className="text-[18px] font-bold">아직 도착한 답이 없어요</p>
      <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">설문 주소를 보내 보세요. 답이 들어오면 여기에 바로 보여요.</p>
      <p className="mx-auto mt-4 max-w-full truncate rounded-2xl bg-slate-100 px-4 py-3 text-[14px] font-semibold text-slate-700">{link}</p>
      <button onClick={copy} className="pressable mt-3 inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-[14px] font-bold text-white">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />} {copied ? '복사했어요' : '주소 복사'}
      </button>
    </div>
  )
}

function Title({ title, who, count }: { title: string; who: string; count?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
      <span className="shrink-0 text-[12px] font-semibold text-slate-400">{who}{count ? ` · ${count}` : ''}</span>
    </div>
  )
}

function Satisfaction({ data }: { data: SurveySummary }) {
  const average = useCountUp(data.satisfactionAverage ?? 0, 900)
  const answered = data.satisfactionCounts.reduce((sum, count) => sum + count, 0)
  const most = Math.max(1, ...data.satisfactionCounts)
  return (
    <section className="res-card" style={{ '--i': 0 } as CSSProperties}>
      <Title title="만족도" who="써 본 사람" count={`${answered}명`} />
      {data.satisfactionAverage === null ? <None /> : (
        <>
          <p className="text-[44px] font-bold leading-none tracking-[-0.03em] text-blue-700">
            {average.toFixed(1)}<span className="ml-1 text-[18px] font-bold text-slate-400">/ 5</span>
          </p>
          <div className="mt-5 flex h-32 items-end gap-2.5" role="img" aria-label={LEVELS.map((level, n) => `${level.label} ${data.satisfactionCounts[n]}명`).join(', ')}>
            {LEVELS.map((level, n) => (
              <div key={level.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[13px] font-bold tabular-nums" style={{ color: level.color }}>{data.satisfactionCounts[n]}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="res-column" style={{ '--h': `${Math.max(4, (data.satisfactionCounts[n] / most) * 100)}%`, '--i': n, background: level.color, opacity: data.satisfactionCounts[n] === 0 ? 0.25 : 1 } as CSSProperties} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2.5" aria-hidden="true">
            {LEVELS.map((level) => (
              <div key={level.label} className="flex flex-1 flex-col items-center gap-1">
                <Face color={level.color} curve={level.curve} />
                <span className="text-[11px] font-bold" style={{ color: level.color }}>{level.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/** 만족도 얼굴. 입꼬리(curve)와 색으로 좋고 나쁨을 가른다. */
function Face({ color, curve }: { color: string; curve: number }) {
  const sad = curve <= -4, joy = curve >= 5
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2.5" />
      {joy ? (
        <>
          <path d="M13 20 Q17 15 21 20" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M27 20 Q31 15 35 20" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="17" cy="20" r="2.6" fill={color} />
          <circle cx="31" cy="20" r="2.6" fill={color} />
        </>
      )}
      {sad && (
        <>
          <path d="M12 14 L20 16.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M36 14 L28 16.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {joy
        ? <path d="M14 28 Q24 41 34 28 Z" fill={color} />
        : <path d={`M15 ${31 - curve / 2} Q24 ${31 + curve * 1.3} 33 ${31 - curve / 2}`} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" />}
    </svg>
  )
}

/** 반원 눈금의 길이(반지름 80). */
const ARC = Math.PI * 80

function Recommend({ data }: { data: SurveySummary }) {
  const average = useCountUp(data.npsAverage ?? 0, 900)
  const score = data.npsScore
  const fill = score === null ? 0 : (score + 100) / 200
  const tone = score === null ? '#94a3b8' : score >= 30 ? '#2563eb' : score >= 0 ? '#38bdf8' : '#f43f5e'
  return (
    <section className="res-card" style={{ '--i': 1 } as CSSProperties}>
      <Title title="추천하고 싶은 정도" who="써 본 사람" />
      {score === null || data.npsAverage === null ? <None /> : (
        <>
          <div className="relative mx-auto w-full max-w-[260px]">
            <svg viewBox="0 0 200 112" className="w-full" role="img" aria-label={`추천 지수 ${score}`}>
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
              <path className="res-gauge" d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={tone} strokeWidth="16" strokeLinecap="round" style={{ '--len': ARC, '--off': ARC * (1 - fill) } as CSSProperties} />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center">
              <p className="text-[40px] font-bold leading-none tracking-[-0.03em]" style={{ color: tone }}>{score > 0 ? `+${score}` : score}</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-400">추천 지수 (−100 ~ +100)</p>
            </div>
          </div>
          <p className="mt-4 text-center text-[14px] font-semibold text-slate-600">평균 <b className="text-[18px] text-slate-900">{average.toFixed(1)}</b> / 10점</p>
          <p className="mt-2 text-center text-[12px] font-medium leading-5 text-slate-400">9~10점을 준 사람 비율에서 0~6점을 준 사람 비율을 뺀 값이에요.</p>
        </>
      )}
    </section>
  )
}

/**
 * 선택지 순위. single 이면 한 사람이 하나만 고른 질문이라 합계가 답한 사람 수이고, 비율도 함께 보여 준다.
 * 이 질문들은 11월 21일에 더해져서 그 전 답에는 없다. 그래서 전체 응답 수가 아니라 이 질문에 답한 수로 나눈다.
 */
function Ranking({ index, title, who, tallies, color, single = false }: { index: number; title: string; who: string; tallies: SurveyTally[]; color: string; single?: boolean }) {
  const [open, setOpen] = useState(false)
  const most = Math.max(1, ...tallies.map((tally) => tally.count))
  const answered = tallies.reduce((sum, tally) => sum + tally.count, 0)
  const shown = open ? tallies : tallies.slice(0, 6)
  return (
    <section className="res-card" style={{ '--i': index } as CSSProperties}>
      <Title title={title} who={who} count={single && answered > 0 ? `${answered}명 답함` : undefined} />
      {tallies.length === 0 ? <None /> : (
        <ol className="space-y-3">
          {shown.map((tally, n) => (
            <li key={tally.option}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={`min-w-0 break-words text-[14px] ${n === 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{tally.option}</span>
                <span className="shrink-0 text-[14px] font-bold tabular-nums" style={{ color }}>
                  {tally.count}{single && <span className="ml-1 text-[12px] font-semibold text-slate-400">{Math.round((tally.count / answered) * 100)}%</span>}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="res-bar" style={{ '--w': `${(tally.count / most) * 100}%`, '--i': n, background: color, opacity: n === 0 ? 1 : 0.55 } as CSSProperties} />
              </div>
            </li>
          ))}
        </ol>
      )}
      {tallies.length > 6 && (
        <button onClick={() => setOpen((value) => !value)} className="pressable mt-4 text-[13px] font-bold text-blue-700">{open ? '접기' : `${tallies.length - 6}개 더 보기`}</button>
      )}
    </section>
  )
}

/** 상황별 만족도. "대학생만 보면 어떤가"를 한눈에 본다. 구경만 한 사람만 있는 상황은 만족도가 비어 있다. */
function Segments({ index, segments }: { index: number; segments: SurveySegment[] }) {
  return (
    <section className="res-card" style={{ '--i': index } as CSSProperties}>
      <Title title="상황별 만족도" who="써 본 사람 기준" />
      {segments.length === 0 ? <None /> : (
        <ul className="space-y-3.5">
          {segments.map((segment, n) => {
            const average = segment.satisfactionAverage
            const tone = average === null ? '#cbd5e1' : LEVELS[Math.min(4, Math.max(0, Math.round(average) - 1))].color
            return (
              <li key={segment.option}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words text-[14px] font-bold text-slate-800">{segment.option}</span>
                  <span className="shrink-0 text-[12px] font-semibold text-slate-400">
                    {segment.responses}명{segment.used < segment.responses ? ` · 써 본 ${segment.used}명` : ''}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="res-bar" style={{ '--w': `${average === null ? 0 : (average / 5) * 100}%`, '--i': n, background: tone } as CSSProperties} />
                  </div>
                  <span className="w-[86px] shrink-0 text-right text-[13px] font-bold tabular-nums" style={{ color: average === null ? '#94a3b8' : tone }}>
                    {average === null ? '써 본 사람 없음' : `${average.toFixed(1)} / 5`}
                  </span>
                </div>
                {segment.npsScore !== null && (
                  <p className="mt-1 text-[12px] font-medium text-slate-400">추천 지수 {segment.npsScore > 0 ? `+${segment.npsScore}` : segment.npsScore}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Comments({ data }: { data: SurveySummary }) {
  return (
    <section className="res-card md:col-span-2" style={{ '--i': 10 } as CSSProperties}>
      <Title title="한마디" who="최근 순" count={`${data.comments.length}개`} />
      {data.comments.length === 0 ? <None /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.comments.map((comment, n) => (
            <li key={`${comment.createdAt}-${n}`} className="res-say" style={{ '--i': Math.min(n, 12) } as CSSProperties}>
              <p className="whitespace-pre-wrap break-words text-[14px] font-medium leading-6 text-slate-800">{comment.text}</p>
              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {comment.path === 'USED' ? '써 본 사람' : '구경만 한 사람'} · {when(comment.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function None() {
  return <p className="py-6 text-center text-[14px] font-medium text-slate-400">아직 답이 없어요.</p>
}

/** 서버 시각(한국 시간, 예: 2026-11-16T00:56:58)을 "11월 16일 00:56" 으로. */
function when(value: string) {
  const match = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  return match ? `${Number(match[1])}월 ${Number(match[2])}일 ${match[3]}:${match[4]}` : value
}
