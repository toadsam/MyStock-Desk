import { useEffect, useSyncExternalStore } from 'react'
import { getMyWaveNotifications } from './myWaveApi'

/**
 * 읽지 않은 알림 수.
 *
 * 종 옆의 빨간 점은 "볼 것이 있다"는 약속이다. 그래서 서버가 센 숫자가 0보다 클 때만 켠다.
 * 종은 데스크톱 헤더와 모바일 헤더에 하나씩 있고 알림 화면도 같은 숫자를 바꾸므로, 숫자는 한 곳에 둔다.
 */
let unread = 0
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 알림 화면처럼 숫자를 이미 알고 있는 곳이 알려 준다. */
export function setUnreadNotifications(next: number) {
  const value = Math.max(0, Math.floor(next))
  if (value === unread) return
  unread = value
  listeners.forEach((listener) => listener())
}

/** 서버에 다시 묻는다. 동시에 여러 곳에서 불러도 요청은 하나다. */
export function refreshUnreadNotifications() {
  inFlight ??= getMyWaveNotifications()
    .then((summary) => setUnreadNotifications(summary.unreadCount))
    // 모르면 없는 것으로 둔다. 없는 알림을 있다고 하는 쪽이 더 나쁘다.
    .catch(() => setUnreadNotifications(0))
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** 화면이 바뀔 때마다(`refreshKey`) 다시 세고, 지금 숫자를 돌려준다. */
export function useUnreadNotifications(refreshKey: string) {
  useEffect(() => {
    void refreshUnreadNotifications()
  }, [refreshKey])
  return useSyncExternalStore(subscribe, () => unread)
}
