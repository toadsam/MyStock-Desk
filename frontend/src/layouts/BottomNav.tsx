import { Bot, BriefcaseBusiness, CalendarDays, Home, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const tabs = [
  { label: '홈', to: '/', icon: Home },
  { label: '기록', to: '/transactions', icon: Plus },
  { label: '포트폴리오', to: '/portfolio', icon: BriefcaseBusiness },
  { label: '실적', to: '/earnings-calendar', icon: CalendarDays },
  { label: 'AI', to: '/ai-report', icon: Bot },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-800/80 bg-slate-950/92 px-2 pb-[calc(.55rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) =>
              cn('flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold text-slate-400', isActive && 'text-blue-400')
            }
          >
            <Icon className="h-6 w-6" />
            {tab.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
