import { useLayoutEffect, useRef, type RefObject } from 'react'
import { playStoryAnimations } from './playStoryAnimations'
import { SURF_TRANSITION_MS, SURF_IMPACT_MS, SURF_IMPACT_DURATION_MS, type SurfClock } from './surf'

/** Fade and lighting effects stay on their own compositor layers, not inherited
 * custom properties that invalidate the whole page's styles on every frame. */
export function useSurfPresentation(rootRef: RefObject<HTMLElement | null>, chapter: number, started: number | undefined, clock: SurfClock | undefined, playing: boolean) {
  const playback = useRef(playing)
  useLayoutEffect(() => { playback.current = playing }, [playing])
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !clock || started === undefined) return
    const copy: Keyframe[] = [], wash: Keyframe[] = [], depth: Keyframe[] = [], phone: Keyframe[] = [], pulse: Keyframe[] = []
    for (let i = 0; i <= 96; i++) {
      const p = i / 96
      const ease = (a: number, b: number) => { const t = Math.max(0, Math.min(1, (p - a) / (b - a))); return t * t * (3 - 2 * t) }
      const impactPhase = Math.max(0, Math.min(1, (p * SURF_TRANSITION_MS - SURF_IMPACT_MS) / SURF_IMPACT_DURATION_MS))
      const impact = Math.sin(impactPhase * Math.PI)
      copy.push({ offset: p, opacity: 1 - ease(.02, .16) + ease(.88, 1) })
      wash.push({ offset: p, opacity: Math.sin(p * Math.PI) * .65 * .18, transform: `translate3d(${-125 + p * 250}%,0,0) rotate(-13deg)` })
      depth.push({ offset: p, opacity: ease(0, .14) * (1 - ease(.80, .98)) })
      phone.push({ offset: p, scale: 1 + impact * .018 })
      pulse.push({ offset: p, opacity: impact * .55, transform: `scale(${.92 + impactPhase * .45})` })
    }
    const animations: Animation[] = []
    const animate = (selector: string, frames: Keyframe[], pseudoElement?: string) => {
      root.querySelectorAll(selector).forEach(node => animations.push(node.animate(frames, {
        duration: SURF_TRANSITION_MS, fill: 'both', easing: 'linear', ...(pseudoElement ? { pseudoElement } : {}),
      })))
    }
    animate('.story-copy,.story-narrator', copy)
    animate('.story-water-wash', wash)
    animate('.story-product-window', phone)
    animate('.story-assembly-pulse', pulse)
    // Opacity belongs to individual faces; putting it on a plate would flatten 3D.
    animate('.story-relief-edge', depth)
    animate('.story-depth-plate,.story-product-heading,.story-phone-brand', depth, '::after')
    return playStoryAnimations(animations, clock, 0, () => playback.current)
  }, [rootRef, chapter, started, clock])
}
