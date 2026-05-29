import { AlertTriangle, Bell, Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { getCurrentMember } from '../api/memberApi'
import { useAuth } from '../auth/useAuth'
import { mockMember } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import BottomNav from './BottomNav'
import Header, { Logo } from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const auth = useAuth()
  const { data: apiMember } = useAsyncData(getCurrentMember, mockMember)
  const member = auth.member ?? apiMember
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    const handleDataError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      setDataError(detail?.message ?? '데이터를 불러오지 못했습니다.')
    }
    window.addEventListener('stockflow:data-error', handleDataError)
    return () => window.removeEventListener('stockflow:data-error', handleDataError)
  }, [])

  return (
    <div className="min-h-screen text-slate-100">
      <Header member={member} isAuthenticated={auth.isAuthenticated} onLogout={auth.logout} />
      <div className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-800/70 bg-slate-950/85 px-5 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <Menu className="h-6 w-6 text-slate-200" />
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <Search className="h-6 w-6 text-slate-200" />
          <button type="button" className="relative">
            <Bell className="h-6 w-6 text-slate-200" />
            <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">12</span>
          </button>
          {auth.isAuthenticated ? (
            <>
              <img src={member.profileImageUrl} alt="" className="h-9 w-9 rounded-full bg-slate-700 object-cover" />
              <span className="rounded-full border border-blue-500 px-2 py-1 text-sm font-bold text-blue-400">{member.membershipGrade}</span>
            </>
          ) : (
            <Link to="/login" className="rounded-full border border-blue-500 px-3 py-1 text-sm font-bold text-blue-400">로그인</Link>
          )}
        </div>
      </div>
      <Sidebar />
      <main className="mobile-safe-bottom min-w-0 px-4 py-4 md:px-6 lg:ml-24 lg:px-5 lg:py-4">
        {dataError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">실사용 데이터 로드 실패</div>
              <div className="mt-1 text-red-100/80">{dataError}</div>
            </div>
            <button type="button" aria-label="닫기" onClick={() => setDataError(null)} className="rounded-lg p-1 text-red-100/70 hover:bg-red-500/15 hover:text-red-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Outlet />
      </main>
      <footer className="hidden border-t border-slate-800 px-6 py-3 text-xs text-slate-500 lg:ml-24 lg:block">
        본 서비스는 투자 참고용 정보 제공을 목적으로 하며, 투자 판단의 최종 책임은 본인에게 있습니다.
      </footer>
      <BottomNav />
    </div>
  )
}
