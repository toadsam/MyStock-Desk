export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('ko-KR').format(Number(value ?? 0))
}

export function formatWon(value?: number | null) {
  return `${formatNumber(Math.round(Number(value ?? 0)))}원`
}

export function formatCompactWon(value?: number | null) {
  const number = Number(value ?? 0)
  if (Math.abs(number) >= 1_0000_0000_0000) {
    return `${(number / 1_0000_0000_0000).toFixed(1)}조원`
  }
  if (Math.abs(number) >= 1_0000_0000) {
    return `${(number / 1_0000_0000).toFixed(1)}억원`
  }
  return formatWon(number)
}

export function formatPercent(value?: number | null, signed = true) {
  const number = Number(value ?? 0)
  const prefix = signed && number > 0 ? '+' : ''
  return `${prefix}${number.toFixed(2)}%`
}

export function formatDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function isUp(value?: number | null) {
  return Number(value ?? 0) >= 0
}
