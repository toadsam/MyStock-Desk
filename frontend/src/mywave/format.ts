/** 화면 여러 곳이 같이 쓰는 표기 도구. 화면마다 다르게 찍히면 안 되므로 한 곳에서만 만든다. */

/** 금액 표기. */
export function won(value: number) {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(value))}`
}

/**
 * 금액을 읽는 법으로. 5000000 은 "500만원", 123456789 는 "1억 2,345만 6,789원".
 * 입력 칸 아래에 보여 줘서 자릿수를 잘못 넣은 것을 눈으로 잡게 한다.
 */
export function wonInWords(value: number) {
  const format = (n: number) => new Intl.NumberFormat('ko-KR').format(n)
  const amount = Math.round(Math.abs(value))
  const eok = Math.floor(amount / 100000000)
  const man = Math.floor((amount % 100000000) / 10000)
  const rest = amount % 10000
  const parts = [eok > 0 ? `${format(eok)}억` : '', man > 0 ? `${format(man)}만` : '', rest > 0 || amount === 0 ? format(rest) : ''].filter(Boolean)
  return `${value < 0 ? '-' : ''}${parts.join(' ')}원`
}

/** 오늘 날짜를 yyyy-MM-dd 로. 입력 폼의 기본 날짜에 쓴다. */
export function todayDateString() {
  return dateStringAfterDays(0)
}

/** 오늘부터 days 일 뒤를 yyyy-MM-dd 로. 목표 날짜처럼 "앞으로"가 기본인 입력에 쓴다. 고정 날짜를 두면 언젠가 과거가 된다. */
export function dateStringAfterDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 알림·지표 톤 이름을 배경과 글자색 클래스로. */
export function toneBg(tone: string) {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-600'
  if (tone === 'orange') return 'bg-orange-50 text-orange-600'
  if (tone === 'violet') return 'bg-violet-50 text-violet-600'
  if (tone === 'yellow') return 'bg-amber-50 text-amber-600'
  return 'bg-blue-50 text-blue-700'
}
