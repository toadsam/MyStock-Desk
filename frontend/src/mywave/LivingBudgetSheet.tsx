import { useEffect, useRef, useState } from 'react'
import { getMyWaveAssetSummary, saveMyWaveMonthlyBudget } from './myWaveApi'
import { NumberField, PrimaryButton, SubtleButton } from './uiKit'

/**
 * 이번 달 생활비를 정하는 작은 창. 홈에서 바로 뜬다.
 *
 * 처음 온 사람이 홈의 숫자를 보려면 생활비 하나만 정하면 된다. 전에는 "생활비 정하기"가 계좌 폼과 다섯 칸짜리
 * 예산 폼이 있는 긴 화면으로 보냈고, 어느 칸이 그 칸인지 찾아야 했다. 여기서는 한 칸만 묻는다.
 * 수입이나 고정 지출 같은 나머지 칸은 건드리지 않는다. 이미 적어 둔 값이 있으면 그대로 둔 채 생활비만 바꾼다.
 */
export function LivingBudgetSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (amount: number) => void }) {
  const [amount, setAmount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save() {
    if (amount <= 0) {
      setMessage('생활비를 0원보다 크게 적어 주세요.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      // 이번 달에 이미 적어 둔 수입, 고정 지출, 저축 계획은 그대로 두고 생활비만 바꾼다.
      const { budget } = await getMyWaveAssetSummary()
      await saveMyWaveMonthlyBudget({
        budgetMonth: budget.budgetMonth,
        incomeAmount: Number(budget.incomeAmount),
        livingBudgetAmount: amount,
        fixedExpenseAmount: Number(budget.fixedExpenseAmount),
        plannedSavingAmount: Number(budget.plannedSavingAmount),
        plannedInvestmentAmount: Number(budget.plannedInvestmentAmount),
      })
      onSaved(amount)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 잠시 후 다시 눌러 주세요.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-5" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="living-budget-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-t-[24px] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:rounded-[24px] sm:pb-6"
      >
        <h2 id="living-budget-title" className="text-[20px] font-bold tracking-[-0.02em] text-slate-900">이번 달 생활비</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-slate-500">
          식비, 교통비, 카페처럼 그때그때 쓰는 돈을 한 달에 얼마로 잡을지 적어 주세요. 월세나 통신비처럼 정해진 돈은 빼고요.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <NumberField ref={inputRef} money quick={[100000, 500000]} value={amount} onChange={setAmount} aria-label="이번 달 생활비" />
          {message && <p role="alert" className="rounded-[12px] bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">{message}</p>}
          <p className="text-[13px] font-medium text-slate-400">남은 날짜로 나눠서 하루에 써도 되는 돈을 알려 드려요. 나중에 언제든 바꿀 수 있어요.</p>
          <div className="grid grid-cols-[1fr_1.5fr] gap-3">
            <SubtleButton onClick={onClose} disabled={busy}>취소</SubtleButton>
            <PrimaryButton type="submit" disabled={busy}>{busy ? '저장 중' : '이 금액으로 정하기'}</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
