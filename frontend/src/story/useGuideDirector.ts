import { useLayoutEffect, useRef, type RefObject } from 'react'
import { playStoryAnimations } from './playStoryAnimations'
import { smoothStep, surfAngle, SURF_DOCK_START_MS, SURF_TRANSITION_MS, type SurfClock } from './surf'

/** Original Beluga artwork, directed on the same spatial path and clock as the UI. */
export function useGuideDirector(stageRef: RefObject<HTMLDivElement | null>, guideRef: RefObject<HTMLDivElement | null>, panelRef: RefObject<HTMLDivElement | null>, started: number | undefined, clock: SurfClock | undefined, playing: boolean, reduced: boolean) {
  const playback = useRef(playing)
  useLayoutEffect(() => { playback.current = playing }, [playing])
  useLayoutEffect(() => {
    const stage = stageRef.current, guide = guideRef.current, panel = panelRef.current
    if (!stage || !guide || !panel || started === undefined || !clock || reduced) return
    const stageBounds = stage.getBoundingClientRect(), from = guide.getBoundingClientRect(), phone = panel.getBoundingClientRect()
    const compact = stageBounds.width < 761
    const size = guide.offsetWidth
    const startScale = from.width / size
    const start = { x: from.left - stageBounds.left, y: from.top - stageBounds.top }
    const end = {
      x: Math.max(6, phone.left - stageBounds.left - size * .80),
      y: phone.bottom - stageBounds.top - size * .82,
    }
    const centerY = ((compact ? 106 : 120) + stageBounds.height - (compact ? 155 : 160)) / 2
    const frames: Keyframe[] = [], swimFrames: Keyframe[] = [], frontFrames: Keyframe[] = [], wakeFrames: Keyframe[] = []
    for (let i = 0; i <= 96; i++) {
      const offset = i / 96, elapsed = offset * SURF_TRANSITION_MS
      const depart = smoothStep(80, 470, elapsed)
      // Beluga reaches the phone first, then gives the docking cue to the following UI.
      const dock = smoothStep(SURF_DOCK_START_MS - 370, SURF_DOCK_START_MS + 30, elapsed)
      const angle = surfAngle(elapsed)
      const currentX = stageBounds.width * .5 + Math.sin(angle) * stageBounds.width * (compact ? .25 : .30) - size / 2
      const currentY = centerY - size * .30 + Math.cos(angle) * (compact ? 12 : 24)
      const x = (start.x + (currentX - start.x) * depart) * (1 - dock) + end.x * dock
      const y = (start.y + (currentY - start.y) * depart) * (1 - dock) + end.y * dock
      const flight = depart * (1 - dock)
      const scale = (startScale + (.90 + Math.cos(angle) * .14 - startScale) * depart) * (1 - dock) + dock
      const sweep = Math.sin(Math.min(1, elapsed / 310) * Math.PI) * -10
      const swim = smoothStep(240, 320, elapsed) * (1 - smoothStep(1880, 1960, elapsed))
      const cue = smoothStep(15, 110, elapsed) * (1 - smoothStep(230, 420, elapsed))
      const catchCue = smoothStep(2080, 2200, elapsed) * (1 - smoothStep(2370, 2500, elapsed))
      frames.push({ offset, zIndex: flight > .5 && Math.cos(angle) < -.15 ? 2 : 8, transform: `translate3d(${x}px,${y}px,0) rotateY(${Math.sin(angle) * 16 * flight}deg) rotateZ(${Math.cos(angle) * 11 * flight + sweep}deg) scale(${scale})` })
      swimFrames.push({ offset, opacity: swim })
      frontFrames.push({ offset, opacity: 1 - swim })
      wakeFrames.push({ offset, opacity: Math.max(cue, catchCue, swim * .48), transform: `scale(${.75 + .35 * Math.max(cue, catchCue, swim)}) rotate(${-18 + Math.sin(angle) * 14}deg)` })
    }
    const animate = (node: Element, keyframes: Keyframe[]) => node.animate(keyframes, { duration: SURF_TRANSITION_MS, fill: 'both', easing: 'linear' })
    const animations = [animate(guide, frames)]
    const swim = guide.querySelector('.story-guide-swim'), front = guide.querySelector('.story-guide-presenter'), wake = guide.querySelector('.story-guide-wake')
    if (swim) animations.push(animate(swim, swimFrames))
    if (front) animations.push(animate(front, frontFrames))
    if (wake) animations.push(animate(wake, wakeFrames))
    const stop = playStoryAnimations(animations, clock, 0, () => playback.current)
    return () => {
      // Keep the completed pose as the CSS starting point, avoiding a one-frame snapback.
      guide.style.transform = `translate3d(${end.x}px,${end.y}px,0)`
      stop()
    }
  }, [stageRef, guideRef, panelRef, started, clock, reduced])
}
