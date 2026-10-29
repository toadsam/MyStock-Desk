import { useState, useSyncExternalStore } from 'react'
import { useLiveliness } from './liveliness'

/**
 * 오래 아무것도 안 하면 벨루가가 존다.
 *
 * 마우스·키보드·스크롤·터치가 1분 동안 없으면 asleep 이 된다. 무엇이든 하면 바로 깬다.
 * 탭이 보이지 않을 때는 재우지 않는다. 돌아왔을 때 자고 있으면 "내가 없는 동안 뭐 했지" 가 아니라
 * 그냥 멈춰 있던 것처럼 보이기 때문이다. 조용히 단계에서는 잠도 없다. 표정 하나도 움직임이다.
 */
const IDLE_MS = 60_000
const EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

let asleep = false
let timer: number | undefined
let listening = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function schedule() {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    if (document.visibilityState !== 'visible') {
      schedule()
      return
    }
    asleep = true
    emit()
  }, IDLE_MS)
}

function activity() {
  if (asleep) {
    asleep = false
    emit()
  }
  schedule()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!listening) {
    listening = true
    EVENTS.forEach((name) => window.addEventListener(name, activity, { passive: true }))
    document.addEventListener('visibilitychange', activity)
    schedule()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && listening) {
      listening = false
      EVENTS.forEach((name) => window.removeEventListener(name, activity))
      document.removeEventListener('visibilitychange', activity)
      window.clearTimeout(timer)
    }
  }
}

const read = () => asleep

/** 지금 졸고 있는지. */
export function useDrowsy() {
  const { quiet } = useLiveliness()
  const sleeping = useSyncExternalStore(subscribe, read, () => false)
  return sleeping && !quiet
}

/** 깨어나는 순간마다 하나씩 커지는 숫자. 화들짝 놀라는 동작의 key 로 쓴다. */
export function useWakeToken(sleeping: boolean) {
  const [token, setToken] = useState(0)
  const [seen, setSeen] = useState(sleeping)
  // 렌더 중에 값이 바뀐 것을 보고 바로 고친다. 효과에서 하면 한 프레임 늦고, ref 는 렌더 중에 못 쓴다.
  if (seen !== sleeping) {
    setSeen(sleeping)
    if (seen && !sleeping) setToken((value) => value + 1)
  }
  return token
}
