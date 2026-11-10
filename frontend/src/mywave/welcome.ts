/**
 * 처음 온 사람에게 한 번 보여 주는 소개(카드 네 장)를 이미 봤는지.
 *
 * 이 브라우저에 회원별로 적어 둔다. 서버에 두지 않는 이유는, 소개를 다시 본다고 해서 잃는 것이 없고
 * 이것 하나를 위해 회원 표에 칸을 늘릴 일은 아니기 때문이다. 저장이 막힌 브라우저에서는 봤다고 치고 넘어간다.
 * 소개가 매번 뜨는 것보다 한 번도 안 뜨는 쪽이 덜 거슬린다.
 */
const key = (memberId: number) => `mywave:welcome-seen:${memberId}`

export function hasSeenWelcome(memberId: number) {
  try {
    return window.localStorage.getItem(key(memberId)) === '1'
  } catch {
    return true
  }
}

export function markWelcomeSeen(memberId: number) {
  try {
    window.localStorage.setItem(key(memberId), '1')
  } catch {
    // 저장이 막힌 브라우저. 할 수 있는 일이 없다.
  }
}
