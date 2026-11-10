import { Bell, ChevronRight, Search, UserRound } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useOutlet, useParams } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Ocean } from './motion'
import { LivelinessContext, useLivelinessState } from './liveliness'
import { RoamingBeluga } from './RoamingBeluga'
import { useRoamingEnabled } from './roaming'
import { TodayHome } from './TodayHome'
import { mobileNavItems, navItems } from './myWaveData'
import { BelugaTap } from './Beluga'
import { BelugaArt } from './BelugaArt'
import AuthPage from '../pages/AuthPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/useAuth'
import { MyWaveDataContext, useMyWaveData, useMyWaveRuntimeData } from './runtime'
import { useUnreadNotifications } from './unreadNotifications'
import { AssetDetailPage, NotificationsPage, OnboardingPage, ProfilePage, SearchResultsPage } from './screens/AccountScreens'
import { CoachPage } from './screens/CoachScreen'
import { CompanyDetailPage } from './screens/CompanyScreen'
import { GoalEditorPage, GoalsPage } from './screens/GoalsScreens'
import { PortfolioAllocationDetailPage, PortfolioDetailPage, PortfolioPage, RiskDetailPage } from './screens/PortfolioScreens'
import { ReportsPage } from './screens/ReportsScreen'
import { SimulationDetailPage, SpendingDetailPage, SpendingPage } from './screens/SpendingScreens'

const activeClass = 'text-blue-700'
const StoryPage = lazy(() => import('../story/StoryPage'))

const inactiveClass = 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'

export default function MyWaveApp() {
  return (
    <Routes>
      <Route path="story" element={<Suspense fallback={<div role="status" className="p-8 text-slate-600">MyWave 소개를 불러오고 있어요…</div>}><StoryPage /></Suspense>} />
      <Route path="login" element={<AuthPage />} />
      <Route path="register" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="spending" element={<SpendingPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="coach" element={<CoachPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="goals/new" element={<GoalEditorPage />} />
          <Route path="spending/detail" element={<SpendingDetailPage />} />
          <Route path="spending/simulation" element={<SimulationDetailPage />} />
          <Route path="portfolio/detail" element={<PortfolioDetailPage />} />
          <Route path="portfolio/allocation" element={<PortfolioAllocationDetailPage />} />
          <Route path="portfolio/risk" element={<RiskDetailPage />} />
          <Route path="assets" element={<AssetDetailPage />} />
          <Route path="company/:symbol" element={<CompanyDetailPage />} />
          <Route path="transactions" element={<Navigate to="/spending" replace />} />
          <Route path="ai-report" element={<Navigate to="/coach" replace />} />
          <Route path="financial-analysis" element={<Navigate to="/reports" replace />} />
          <Route path="watchlist" element={<Navigate to="/portfolio" replace />} />
          <Route path="earnings-calendar" element={<Navigate to="/reports" replace />} />
          <Route path="market" element={<Navigate to="/portfolio" replace />} />
          <Route path="research" element={<Navigate to="/reports" replace />} />
          <Route path="themes" element={<Navigate to="/portfolio" replace />} />
          <Route path="stock/:symbol" element={<StockRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

/** 옛 주소 /stock/:symbol 은 같은 종목의 기업 상세로 보낸다. */
function StockRedirect() {
  const { symbol = '' } = useParams()
  return <Navigate to={symbol ? `/company/${symbol}` : '/portfolio'} replace />
}

function Shell() {
  const runtimeData = useMyWaveRuntimeData()
  const location = useLocation()
  // 나가는 화면을 잠깐 붙들어 두기 위해 Outlet 대신 요소를 직접 받는다.
  const outlet = useOutlet()
  const liveliness = useLivelinessState()

  return (
    <MyWaveDataContext.Provider value={runtimeData}>
      <LivelinessContext.Provider value={liveliness}>
      <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--bg)] p-0 text-slate-900 lg:p-8">
        <div className="relative isolate mx-auto min-h-screen w-full max-w-[1760px] overflow-hidden bg-[var(--bg)] lg:min-h-[calc(100vh-4rem)] lg:rounded-[20px]">
          {/* 신나게 단계에서만 보이는 배경 바다. 카드 뒤, 회색 배경 위. */}
          <Ocean />
          {/* 풀어둔 벨루가. 본문(main)이 positioned 라 그 뒤에서 헤엄치고, 틈에서만 보인다. 부르면 앞으로 나온다. */}
          <Roamer />
          <WindowBar />
          <div className="flex min-h-screen lg:min-h-[calc(100vh-7rem)]">
            <Sidebar />
            <main className="relative min-w-0 flex-1 pb-24 lg:pb-0">
              <MobileTop />
              <div className="relative mx-auto w-full max-w-[1460px] px-5 py-5 sm:px-7 lg:px-10 lg:py-8">
                <DesktopHeader />
                <DataStatusBanner />
                {/* 이전 화면은 아래로 가라앉고, 다음 화면이 떠오른다. 홈의 목표 카드는 목표 히어로로 자라난다 (layoutId). */}
                {/* popLayout: 나가는 화면을 흐름에서 빼 두고 그 자리에 다음 화면을 바로 세운다. 두 화면이 잠깐 같이 있어야 layoutId 가 이어진다. */}
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.9, 0.2, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
                  >
                    {outlet}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </div>
      </MotionConfig>
      </LivelinessContext.Provider>
    </MyWaveDataContext.Provider>
  )
}

/** 공통 숫자를 불러오지 못했을 때만 뜬다. 화면의 0 이 "기록이 없어서"인지 "못 불러와서"인지 구분하게 한다. */
function DataStatusBanner() {
  const { status, reload } = useMyWaveData()
  if (status !== 'error') return null
  return (
    <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
      <span>서버에서 숫자를 불러오지 못했어요. 화면의 금액은 실제 기록이 아닐 수 있어요.</span>
      <button onClick={reload} className="pressable rounded-full bg-white px-4 py-2 text-red-700">다시 불러오기</button>
    </div>
  )
}

function WindowBar() {
  return (
    <div className="hidden h-14 items-center gap-2 border-b border-slate-200 px-6 lg:flex">
      <span className="h-3.5 w-3.5 rounded-full bg-[#ff5f57]" />
      <span className="h-3.5 w-3.5 rounded-full bg-[#ffbd2e]" />
      <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
    </div>
  )
}

function Logo() {
  return (
    <div>
      <div className="text-[24px] font-black leading-none tracking-[-0.02em] text-blue-700 lg:text-3xl">MyWave</div>
      {/* 이름 아래 물결 한 줄. 신나게 단계에서는 흐른다. */}
      <div aria-hidden="true" className="logo-wave mt-1.5 h-[6px] w-[78px] overflow-hidden lg:w-[96px]">
        <svg className="h-full w-[200%]" viewBox="0 0 200 6" preserveAspectRatio="none">
          <path d="M0 3 Q12.5 0 25 3 T50 3 T75 3 T100 3 T125 3 T150 3 T175 3 T200 3" fill="none" stroke="#51b9ff" strokeWidth="2" />
        </svg>
      </div>
      <div className="mt-1.5 text-xs font-medium text-slate-500 lg:mt-2 lg:text-sm">나만의 투자 흐름을 만든다.</div>
    </div>
  )
}

function Sidebar() {
  const auth = useAuth()

  // 사이드바는 화면 높이에 붙어 따라온다. 동반 벨루가와 프로필이 늘 보이게.
  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 px-7 py-8 lg:sticky lg:top-8 lg:flex lg:h-[calc(100vh-7rem)] lg:flex-col lg:self-start lg:overflow-y-auto">
      <Logo />
      <SearchBox />
      <nav className="mt-7 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex h-14 items-center gap-4 rounded-2xl px-4 text-[15px] font-bold transition-colors ${isActive ? activeClass : inactiveClass}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="side-pill"
                      className="absolute inset-0 bg-blue-50 shadow-[inset_0_0_0_1px_rgba(37,99,235,.04)]"
                      style={{ borderRadius: 16 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  {/* 아이콘은 둥근 타일 안에. 활성이면 파랗게 찬다. 가는 선 하나보다 말랑한 벨루가와 어울린다. */}
                  <span key={String(isActive)} className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-[12px] transition-colors ${isActive ? 'tab-pop bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
      <StarterCard />
      <Companion />
      <div className="border-t border-slate-200 pt-8">
        <div className="flex items-center gap-4">
          <Avatar />
          <div className="min-w-0 flex-1">
            <div className="font-black">{auth.member?.name ?? ''} 님</div>
            <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{auth.member?.membershipGrade || 'Wave 사용자'}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </aside>
  )
}

/**
 * 처음 온 사람에게만 보이는 안내 카드.
 *
 * 전에는 로그인한 뒤 모든 화면에 "3분 만에 투자 흐름을 설계해보세요"가 떠 있었다.
 * 목표든 거래든 하나라도 적은 사람에게는 더 할 말이 없으므로 그때부터는 숨긴다.
 */
function StarterCard() {
  const navigate = useNavigate()
  const { status, goals, holdings } = useMyWaveData()
  if (status !== 'ready' || goals.length > 0 || holdings.length > 0) return null
  return (
    <div className="mt-10 rounded-[20px] bg-white p-5">
      <div className="font-black text-blue-700">처음이세요?</div>
      <p className="mt-3 text-sm leading-6 text-slate-500">생활비를 정하고 소비를 기록하면 홈의 잔이 차요. 어떻게 쓰는지 짧게 알려 드려요.</p>
      <button onClick={() => navigate('/onboarding')} className="pressable mt-4 rounded-full border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700">둘러보기 <ChevronRight className="inline h-4 w-4" /></button>
      <div className="beluga-breathe ml-auto mt-2 h-24 w-24"><BelugaArt mood="hello" className="h-full w-full" /></div>
    </div>
  )
}

/** 신나게 단계의 데스크톱에서만 벨루가를 풀어둔다. 집은 Companion 이 비워 둔 자리다. */
function Roamer() {
  const enabled = useRoamingEnabled()
  const location = useLocation()
  if (!enabled) return null
  return <RoamingBeluga pageLine={companionLine(location.pathname)} />
}

/**
 * 모든 화면에 같이 있는 벨루가.
 * 화면이 바뀌면 그 화면이 무엇을 하는 곳인지 한마디 하고, 누르면 대답하고,
 * 신나게 단계에서는 혼자 뛰고 혼잣말하고 기포를 뱉는다. 금액은 말하지 않는다.
 * 풀어둔 상태(RoamingBeluga)에서는 자리만 비워 둔다. 벨루가는 한 마리뿐이다.
 */
function Companion() {
  const location = useLocation()
  const roaming = useRoamingEnabled()
  const line = companionLine(location.pathname)
  if (roaming) {
    return (
      <div className="mt-auto flex justify-end pb-5 pr-1">
        <div data-beluga-home className="h-28 w-28" />
      </div>
    )
  }
  return (
    <div className="mt-auto flex justify-end pb-5 pr-1">
      <BelugaTap
        mood="hello"
        lines={[line, '저는 늘 여기 있어요.', '궁금한 건 코치한테 물어봐요.', '간지러워요!']}
        bump={location.pathname}
        bumpLine={line}
        bubbleSide="top"
        imgClassName="h-28 w-28"
      />
    </div>
  )
}

function companionLine(pathname: string) {
  if (pathname.startsWith('/goals')) return '하루치만 모아도 충분해요.'
  if (pathname.startsWith('/spending')) return '쓰자마자 적으면 제일 정확해요.'
  if (pathname.startsWith('/portfolio')) return '평균단가는 거래 기록이 만들어요.'
  if (pathname.startsWith('/reports')) return '한 달을 한 장에 담았어요.'
  if (pathname.startsWith('/coach')) return '궁금한 건 뭐든 물어봐요.'
  if (pathname.startsWith('/assets')) return '생활비를 정하면 잔이 생겨요.'
  if (pathname.startsWith('/notifications')) return '놓친 소식이 있나 봐요.'
  if (pathname.startsWith('/profile')) return '화면 활기도 여기서 바꿔요.'
  if (pathname.startsWith('/search')) return '목표, 소비, 종목을 한 번에 찾아요.'
  if (pathname.startsWith('/company')) return '참고 자료예요. 판단은 천천히.'
  if (pathname.startsWith('/onboarding')) return '처음이면 여기부터!'
  return '오늘 잔부터 볼까요?'
}

function MobileTop() {
  return (
    <header className="flex items-start justify-between px-5 pb-1 pt-8 lg:hidden">
      <Logo />
      <div className="flex items-center gap-3 pt-1">
        <BellButton />
        <Avatar />
      </div>
    </header>
  )
}

/** 검색은 사이드바 로고 아래에 산다. 헤더는 제목과 설명만 남겨 화면이 "관리자 화면"처럼 보이지 않게 한다. */
function SearchBox() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const meta = pageMeta(location.pathname)
  const submitSearch = () => {
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }
  return (
    <label className="mt-7 flex h-11 items-center gap-2.5 rounded-full bg-white px-4 text-slate-400">
      <Search className="h-4.5 w-4.5 shrink-0" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
        className="w-full min-w-0 bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={meta.search}
      />
    </label>
  )
}

function DesktopHeader() {
  const location = useLocation()
  const meta = pageMeta(location.pathname)
  return (
    <header className="mb-7 hidden items-end justify-between gap-6 lg:flex">
      {/* 화면이 바뀌면 제목이 새로 떠오른다. 제목은 홈과 같은 Jua. 화면마다 다른 앱처럼 보이지 않게. */}
      <div key={location.pathname} className="rise-in">
        <h1 className="wave-jua text-[34px] leading-none text-slate-900">{meta.title}</h1>
        <p className="mt-2.5 text-[15px] font-medium text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-4 pb-1">
        <BellButton />
        <Avatar />
      </div>
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid max-w-[1760px] grid-cols-5 border-t border-slate-200 bg-white px-3 pb-[calc(.55rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-tab relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition-colors ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-x-1 inset-y-1 bg-blue-50"
                    style={{ borderRadius: 16 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative z-10 h-6 w-6" />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

/** 빨간 점과 종의 흔들림은 읽지 않은 알림이 실제로 있을 때만 나온다. */
function BellButton() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const unread = useUnreadNotifications(pathname)

  return (
    <button
      onClick={() => navigate('/notifications')}
      aria-label={unread > 0 ? `알림, 읽지 않은 알림 ${unread}개` : '알림'}
      className="pressable relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 lg:h-10 lg:w-10"
    >
      <Bell aria-hidden="true" className={`${unread > 0 ? 'bell-swing ' : ''}h-5 w-5 lg:h-6 lg:w-6`} />
      {unread > 0 && <span aria-hidden="true" className="notification-dot absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
    </button>
  )
}

function Avatar() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/profile')} aria-label="내 정보" className="pressable grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-50 lg:h-12 lg:w-12">
      <UserRound className="h-6 w-6 fill-blue-500 text-blue-500 lg:h-7 lg:w-7" />
    </button>
  )
}

/** 홈은 모바일과 데스크톱이 같은 화면 하나다. 넓어지면 두 열로 펼쳐질 뿐이다. */
function HomePage() {
  return <TodayHome />
}

/**
 * 제목 아래 한 줄은 이 화면이 실제로 보여 주는 것을 적는다.
 * "더 나은 결정을 내리세요" 같은 광고 문장은 화면이 하는 일과 어긋나는 순간 거짓말이 된다.
 * 특히 코치는 언어 모델이 아니라 규칙으로 답하므로 그렇다고 적는다.
 */
function pageMeta(pathname: string) {
  if (pathname.startsWith('/goals')) return { title: '목표', subtitle: '모으고 싶은 금액과 날짜, 그리고 하루에 모을 돈.', search: '검색 (예: 노트북)' }
  if (pathname.startsWith('/spending')) return { title: '소비', subtitle: '이번 달 쓴 돈을 지난달 같은 날짜까지와 비교해요.', search: '검색 (예: 배달비)' }
  if (pathname.startsWith('/portfolio')) return { title: '투자', subtitle: '직접 적은 매매 기록으로 계산한 평균단가와 수익률.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/reports')) return { title: '리포트', subtitle: '월별 소비와 생활비 예산, 보유 종목의 공시와 재무.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/coach')) return { title: 'AI코치', subtitle: '총자산, 소비, 목표, 쏠림을 한 화면에. 답은 규칙으로 만들어요.', search: '검색 (예: 목표)' }
  if (pathname.startsWith('/assets')) return { title: '자산', subtitle: '계좌 잔액과 이번 달 생활비를 직접 적어요.', search: '검색 (예: 생활비 통장)' }
  if (pathname.startsWith('/notifications')) return { title: '알림', subtitle: '목표, 소비, 투자에서 챙겨 볼 소식.', search: '검색 (예: 카페)' }
  if (pathname.startsWith('/profile')) return { title: '내 정보', subtitle: '프로필, 멤버십, 비밀번호.', search: '검색 (예: 카페)' }
  if (pathname.startsWith('/search')) return { title: '검색', subtitle: '목표, 소비, 보유 종목을 한 번에 찾아요.', search: '검색 (예: 카페)' }
  if (pathname.startsWith('/company')) return { title: '기업 상세', subtitle: '시세와 재무 지표. 투자 판단이 아니라 참고 자료예요.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/onboarding')) return { title: '시작하기', subtitle: 'MyWave를 어떻게 쓰면 되는지 알려 드릴게요.', search: '검색 (예: 카페)' }
  return { title: '홈', subtitle: '오늘 더 써도 되는 돈, 목표, 투자.', search: '검색 (예: 카페)' }
}
