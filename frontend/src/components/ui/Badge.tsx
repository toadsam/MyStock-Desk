import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps {
  children: ReactNode
  tone?: 'blue' | 'green' | 'red' | 'violet' | 'slate'
  className?: string
}

export function Badge({ children, tone = 'blue', className }: BadgeProps) {
  const tones = {
    blue: 'border-blue-500/40 bg-blue-500/10 text-sky-300',
    green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    red: 'border-red-500/40 bg-red-500/10 text-red-300',
    violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    slate: 'border-slate-600/60 bg-slate-800/50 text-slate-300',
  }
  return (
    <span className={cn('inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}
