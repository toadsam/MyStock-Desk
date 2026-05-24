import type { ReactNode } from 'react'
import { isUp } from '../../utils/format'
import { cn } from '../../utils/cn'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: ReactNode
  change?: number
  detail?: ReactNode
  className?: string
}

export function StatCard({ label, value, change, detail, className }: StatCardProps) {
  return (
    <Card className={cn('min-h-32', className)}>
      <div className="text-sm font-medium text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-bold text-slate-50 md:text-3xl">{value}</div>
      {change !== undefined && (
        <div className={cn('mt-2 text-sm font-semibold', isUp(change) ? 'text-emerald-400' : 'text-red-400')}>
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </div>
      )}
      {detail && <div className="mt-3 text-xs text-slate-500">{detail}</div>}
    </Card>
  )
}
