import { CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string | null
  onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null
  return (
    <div className="fixed right-4 top-20 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-emerald-500/10 backdrop-blur">
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      <span>{message}</span>
      <button type="button" aria-label="닫기" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-800">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
