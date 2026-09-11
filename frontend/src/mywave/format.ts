/** 금액 표기. 화면마다 다르게 찍히면 안 되므로 한 곳에서만 만든다. */
export function won(value: number) {
  return `₩${new Intl.NumberFormat('ko-KR').format(Math.round(value))}`
}
