import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <section className={cn('glass-card min-w-0 rounded-2xl p-4 md:p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="min-w-0 text-base font-semibold tracking-normal text-slate-50 md:text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
