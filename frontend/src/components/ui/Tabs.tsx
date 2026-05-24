import { cn } from '../../utils/cn'

interface TabsProps<T extends string> {
  items: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('inline-flex rounded-xl border border-slate-700/70 bg-slate-950/35 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-400 transition',
            value === item.value && 'bg-blue-600/30 text-sky-200 shadow-inner shadow-blue-600/10',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
