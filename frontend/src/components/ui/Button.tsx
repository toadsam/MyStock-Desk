import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'buy' | 'sell' | 'ghost' | 'outline'
  children: ReactNode
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500',
    buy: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500',
    sell: 'bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-600',
    ghost: 'bg-slate-900/40 text-slate-200 hover:bg-slate-800/80',
    outline: 'border border-slate-600/80 bg-slate-950/30 text-slate-200 hover:border-blue-400/70',
  }

  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
