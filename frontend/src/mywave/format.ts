/** 화면 여러 곳이 같이 쓰는 표기 도구. 화면마다 다르게 찍히면 안 되므로 한 곳에서만 만든다. */

/** 금액 표기. */
export function won(value: number) {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(value))}`
}

/** 오늘 날짜를 yyyy-MM-dd 로. 입력 폼의 기본 날짜에 쓴다. */
export function todayDateString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

/** 알림·지표 톤 이름을 배경과 글자색 클래스로. */
export function toneBg(tone: string) {
  if (tone === 'green') return 'bg-emerald-50 text-emerald-600'
  if (tone === 'orange') return 'bg-orange-50 text-orange-600'
  if (tone === 'violet') return 'bg-violet-50 text-violet-600'
  if (tone === 'yellow') return 'bg-amber-50 text-amber-600'
  return 'bg-blue-50 text-blue-700'
}
