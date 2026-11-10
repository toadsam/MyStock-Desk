import { useEffect, useSyncExternalStore } from 'react'
import { getMyWaveNotifications } from './myWaveApi'

/**
 * 알림이 몇 개 있고 그중 몇 개를 안 읽었는지.
 *
 * 종 옆의 빨간 점은 "볼 것이 있다"는 약속이다. 그래서 서버가 센 안 읽은 알림이 0보다 클 때만 켠다.
 * 알림이 하나도 없는 계정에는 종 자체를 그리지 않는다. 눌러도 빈 화면뿐인 버튼을 헤더에 두지 않는다.
 * 종은 데스크톱 헤더와 모바일 헤더에 하나씩 있고 알림 화면도 같은 숫자를 바꾸므로, 숫자는 한 곳에 둔다.
 */
export type NotificationCounts = { unread: number; total: number }

let counts: NotificationCounts = { unread: 0, total: 0 }
let inFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function publish(next: NotificationCounts) {
  const unread = Math.max(0, Math.floor(next.unread))
  const total = Math.max(unread, Math.floor(next.total))
  if (unread === counts.unread && total === counts.total) return
  counts = { unread, total }
  listeners.forEach((listener) => listener())
}

/** 알림 화면처럼 안 읽은 수를 이미 알고 있는 곳이 알려 준다. */
export function setUnreadNotifications(unread: number) {
  publish({ unread, total: counts.total })
}

/** 서버에 다시 묻는다. 동시에 여러 곳에서 불러도 요청은 하나다. */
export function refreshUnreadNotifications() {
  inFlight ??= getMyWaveNotifications()
    .then((summary) => publish({ unread: summary.unreadCount, total: summary.notifications.length }))
    // 모르면 없는 것으로 둔다. 없는 알림을 있다고 하는 쪽이 더 나쁘다.
    .catch(() => publish({ unread: 0, total: 0 }))
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** 화면이 바뀔 때마다(`refreshKey`) 다시 세고, 지금 숫자를 돌려준다. */
export function useNotificationCounts(refreshKey: string) {
  useEffect(() => {
    void refreshUnreadNotifications()
  }, [refreshKey])
  return useSyncExternalStore(subscribe, () => counts)
}
