import { Bell, ChevronDown, LogOut, Mail, Search } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import type { Member } from '../types/member'
import { cn } from '../utils/cn'

const topNav = [
  { label: '홈', to: '/' },
  { label: '투자', to: '/stock/005930' },
  { label: '시장', to: '/market' },
  { label: '테마탐색', to: '/themes' },
  { label: '뉴스', to: '/research' },
  { label: '리서치', to: '/research' },
  { label: '커뮤니티', to: '/research' },
]

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-8 w-8">
        <div className="absolute left-1 top-0 h-4 w-7 -skew-y-12 rounded bg-blue-500" />
        <div className="absolute bottom-0 left-0 h-4 w-7 -skew-y-12 rounded bg-sky-400" />
      </div>
      <span className="text-xl font-black tracking-normal text-white">StockFlow</span>
    </div>
  )
}

export default function Header({ member, isAuthenticated, onLogout }: { member: Member; isAuthenticated: boolean; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 hidden h-16 items-center border-b border-slate-800/80 bg-slate-950/85 px-5 backdrop-blur-xl lg:flex">
      <div className="mr-8">
        <Logo />
      </div>
      <nav className="flex h-full items-center gap-1">
        {topNav.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex h-full items-center border-b-2 border-transparent px-4 text-sm font-semibold text-slate-400 transition hover:text-slate-100',
                isActive && 'border-blue-500 text-sky-300',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
        <button type="button" className="flex h-full items-center gap-1 px-4 text-sm font-semibold text-slate-400">
          더보기 <ChevronDown className="h-4 w-4" />
        </button>
      </nav>
      <div className="mx-auto max-w-md flex-1 px-6">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 text-slate-500">
          <Search className="h-4 w-4" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="종목명, 티커, 키워드를 검색하세요" />
          <span className="rounded border border-slate-700 px-1.5 text-xs">/</span>
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" className="relative text-slate-300">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">12</span>
        </button>
        <button type="button" className="text-slate-300"><Mail className="h-5 w-5" /></button>
        <div className="h-8 w-px bg-slate-800" />
        {isAuthenticated ? (
          <>
            <img src={member.profileImageUrl} alt="" className="h-8 w-8 rounded-full bg-slate-700 object-cover" />
            <span className="text-sm font-semibold text-slate-200">{member.name} 님</span>
            <span className="rounded-full border border-blue-500 px-3 py-1 text-sm font-bold text-blue-400">{member.membershipGrade}</span>
            <button type="button" className="text-slate-400 transition hover:text-slate-100" onClick={onLogout} title="로그아웃">
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <Link to="/login" className="rounded-full border border-blue-500/70 px-4 py-1.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/10">
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}
