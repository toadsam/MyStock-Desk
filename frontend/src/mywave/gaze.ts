/**
 * 벨루가의 시선.
 *
 * 화면의 모든 벨루가 눈동자는 같은 곳을 본다. 평소에는 커서, 무슨 일이 생기면(lookAt) 그 자리.
 * 그림마다 따로 듣지 않고 여기서 한 번만 포인터를 듣고, 움직임이 있을 때만 프레임을 돈다.
 * 눈동자가 다 멈추면 루프도 멈춘다. 가만히 있는 화면은 CPU 도 가만히 있어야 한다.
 */
export type GazePoint = { x: number; y: number }

/** 눈동자 하나. target 을 받아 움직이고, 아직 가는 중이면 true 를 돌려준다. */
type Watcher = (target: GazePoint | null) => boolean

const watchers = new Set<Watcher>()
let pointer: GazePoint | null = null
let attention: { point: GazePoint; until: number } | null = null
let frame = 0
let listening = false

function loop() {
  frame = 0
  if (attention && attention.until < performance.now()) attention = null
  const target = attention?.point ?? pointer
  let busy = false
  watchers.forEach((watcher) => {
    if (watcher(target)) busy = true
  })
  if ((busy || attention) && watchers.size > 0) frame = requestAnimationFrame(loop)
}

function kick() {
  if (frame === 0 && watchers.size > 0) frame = requestAnimationFrame(loop)
}

function onPointerMove(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY }
  kick()
}

/** 모든 벨루가가 잠시 이곳을 본다. 기록이 저장된 잔, 방금 적힌 거래 같은 자리. */
export function lookAt(point: GazePoint, ms = 2600) {
  attention = { point, until: performance.now() + ms }
  kick()
}

export function watchGaze(watcher: Watcher) {
  watchers.add(watcher)
  if (!listening) {
    listening = true
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }
  kick()
  return () => {
    watchers.delete(watcher)
    if (watchers.size === 0 && listening) {
      listening = false
      window.removeEventListener('pointermove', onPointerMove)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
  }
}
