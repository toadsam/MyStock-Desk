import { useCountUp } from './useCountUp'

/**
 * 금액과 비율이 화면에 서는 방식.
 *
 * 값이 바뀌면 0 이 아니라 이전 값에서부터 올라간다. 새로고침마다 0 에서 출발하면
 * 금액이 방금 생긴 것처럼 보여서, 잔액을 보러 온 사람에게는 오히려 불안하다.
 * 자릿수가 흔들리지 않도록 tabular-nums 를 쓴다.
 */
export function Amount({
  value,
  currency = false,
  suffix,
  compact = false,
}: {
  value: number
  currency?: boolean
  suffix?: string
  compact?: boolean
}) {
  const animated = useCountUp(value)
  const rounded = Math.round(animated)
  const body = compact
    ? `${new Intl.NumberFormat('ko-KR').format(Math.round(rounded / 10000))}만`
    : new Intl.NumberFormat('ko-KR').format(rounded)

  return (
    <span className="tnum">
      {currency && '₩'}
      {body}
      {suffix && <span className="ml-0.5 text-[0.7em]">{suffix}</span>}
    </span>
  )
}
