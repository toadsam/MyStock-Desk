import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CreditCard,
  GitBranch,
  Home,
  LineChart,
  Settings,
  Star,
  WalletCards,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const items = [
  { label: '홈', to: '/', icon: Home },
  { label: '관심종목', to: '/stock/005930', icon: Star },
  { label: '포트폴리오', to: '/portfolio', icon: BriefcaseBusiness },
  { label: '거래기록', to: '/transactions', icon: Camera },
  { label: '테마탐색', to: '/themes', icon: GitBranch },
  { label: '계좌', to: '/portfolio', icon: CreditCard },
  { label: '리서치 허브', to: '/research', icon: LineChart },
  { label: 'AI 투자비서', to: '/research', icon: Bot },
  { label: '캘린더', to: '/market', icon: CalendarDays },
  { label: '설정', to: '/', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-24 border-r border-slate-800/80 bg-slate-950/70 p-2 backdrop-blur-xl lg:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100',
                  isActive && 'bg-blue-600/25 text-sky-300',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="absolute bottom-4 left-2 right-2 rounded-xl border border-slate-700 bg-slate-950/60 p-2 text-center text-xs text-slate-400">
        <WalletCards className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
        기록 기반 분석
        <div className="mt-1 rounded-full bg-emerald-500/15 py-1 text-emerald-300">ON</div>
      </div>
    </aside>
  )
}
