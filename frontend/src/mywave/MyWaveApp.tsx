import { Bell, ChevronRight, Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { TodayHome } from './TodayHome'
import { mobileNavItems, navItems } from './myWaveData'
import belugaJumpArt from '../assets/mywave/beluga-jump.png'
import AuthPage from '../pages/AuthPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/useAuth'
import { MyWaveDataContext, useMyWaveData, useMyWaveRuntimeData } from './runtime'
import { AssetDetailPage, NotificationsPage, OnboardingPage, ProfilePage, SearchResultsPage } from './screens/AccountScreens'
import { CoachPage } from './screens/CoachScreen'
import { CompanyDetailPage } from './screens/CompanyScreen'
import { GoalEditorPage, GoalsPage } from './screens/GoalsScreens'
import { PortfolioAllocationDetailPage, PortfolioDetailPage, PortfolioPage, RiskDetailPage } from './screens/PortfolioScreens'
import { ReportsPage } from './screens/ReportsScreen'
import { SimulationDetailPage, SpendingDetailPage, SpendingPage } from './screens/SpendingScreens'

const activeClass = 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,.04)]'

const inactiveClass = 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'

export default function MyWaveApp() {
  return (
    <Routes>
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

  return (
    <MyWaveDataContext.Provider value={runtimeData}>
      <div className="min-h-screen bg-[var(--bg)] p-0 text-slate-900 lg:p-8">
        <div className="mx-auto min-h-screen w-full max-w-[1760px] overflow-hidden bg-[var(--bg)] lg:min-h-[calc(100vh-4rem)] lg:rounded-[20px]">
          <WindowBar />
          <div className="flex min-h-screen lg:min-h-[calc(100vh-7rem)]">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-24 lg:pb-0">
              <MobileTop />
              <div className="mx-auto w-full max-w-[1460px] px-5 py-5 sm:px-7 lg:px-10 lg:py-8">
                <DesktopHeader />
                <DataStatusBanner />
                {/* 화면이 바뀔 때마다 살짝 떠오르며 들어온다. */}
                <div key={location.pathname} className="page-enter">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
          <MobileBottomNav />
        </div>
      </div>
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
      <div className="mt-1.5 text-xs font-medium text-slate-500 lg:mt-2 lg:text-sm">나만의 투자 흐름을 만든다.</div>
    </div>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const auth = useAuth()

  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 px-7 py-8 lg:flex lg:flex-col">
      <Logo />
      <nav className="mt-16 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex h-14 items-center gap-4 rounded-2xl px-4 text-[15px] font-bold transition ${isActive ? activeClass : inactiveClass}`}
            >
              <Icon className="h-6 w-6" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-auto rounded-[20px] bg-white p-5 shadow-card">
        <div className="font-black text-blue-700">MyWave 시작하기</div>
        <p className="mt-3 text-sm leading-6 text-slate-500">3분 만에 나에게 맞는 투자 흐름을 설계해보세요.</p>
        <button onClick={() => navigate('/onboarding')} className="mt-4 rounded-full border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700">시작하기 <ChevronRight className="inline h-4 w-4" /></button>
        <img src={belugaJumpArt} alt="" className="wave-bob ml-auto mt-2 h-24 w-24 object-contain" />
      </div>
      <div className="mt-10 border-t border-slate-200 pt-8">
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

function DesktopHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const meta = pageMeta(location.pathname)
  const submitSearch = () => {
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }
  return (
    <header className="mb-7 hidden items-start justify-between gap-6 lg:flex">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.02em]">{meta.title}</h1>
        <p className="mt-2 text-base font-medium text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-5">
        <label className="flex h-12 w-80 items-center gap-3 rounded-full bg-white px-5 text-slate-400">
          <Search className="h-5 w-5" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            placeholder={meta.search}
          />
        </label>
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
              `mobile-tab flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
          >
            <Icon className="h-6 w-6" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function BellButton() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/notifications')} className="pressable relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 lg:h-10 lg:w-10">
      <Bell className="h-5 w-5 lg:h-6 lg:w-6" />
      <span className="notification-dot absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
    </button>
  )
}

function Avatar() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/profile')} className="pressable grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-50 lg:h-12 lg:w-12">
      <UserRound className="h-6 w-6 fill-blue-500 text-blue-500 lg:h-7 lg:w-7" />
    </button>
  )
}

/** 홈은 모바일과 데스크톱이 같은 화면 하나다. 넓어지면 두 열로 펼쳐질 뿐이다. */
function HomePage() {
  return <TodayHome />
}

function pageMeta(pathname: string) {
  if (pathname.startsWith('/goals')) return { title: '목표 관리', subtitle: '구체적인 목표로 더 좋은 금융 습관을 만들어보세요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/spending')) return { title: '소비 분석', subtitle: '소비 흐름을 분석하고, 목표 달성에 최적화된 소비 습관을 만들어보세요.', search: '검색 (예: 배달비 리포트)' }
  if (pathname.startsWith('/portfolio')) return { title: '투자 포트폴리오', subtitle: '내 자산의 흐름을 한눈에 분석하고, 더 나은 결정을 내려세요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/reports')) return { title: '리포트', subtitle: '기업 재무제표와 포트폴리오 리포트를 쉽게 이해하세요.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/coach')) return { title: 'AI코치', subtitle: '데이터 기반 AI가 당신의 투자 여정을 함께 설계합니다.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/assets')) return { title: '자산', subtitle: '계좌 잔액과 이번 달 예산을 직접 적어 관리하세요.', search: '검색 (예: 생활비 통장)' }
  if (pathname.startsWith('/notifications')) return { title: '알림', subtitle: '목표, 소비, 투자에서 챙겨 볼 소식을 모았어요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/profile')) return { title: '내 정보', subtitle: '프로필, 멤버십, 비밀번호를 관리하세요.', search: '검색 (예: 투자 리포트)' }
  if (pathname.startsWith('/search')) return { title: '검색', subtitle: '목표, 소비, 보유 종목을 한 번에 찾아요.', search: '검색 (예: 카페)' }
  if (pathname.startsWith('/company')) return { title: '기업 상세', subtitle: '시세와 재무 지표를 한 화면에서 확인하세요.', search: '검색 (예: 삼성전자)' }
  if (pathname.startsWith('/onboarding')) return { title: '시작하기', subtitle: 'MyWave를 어떻게 쓰면 되는지 알려 드릴게요.', search: '검색 (예: 투자 리포트)' }
  return { title: '홈', subtitle: '목표, 소비, 투자 흐름을 한눈에 확인하세요.', search: '검색 (예: 투자 리포트)' }
}
