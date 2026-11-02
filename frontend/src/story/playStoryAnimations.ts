import { isStoryActive } from './storyActivity'
import type { SurfClock } from './surf'

/** Compositor playback, synchronized to the director clock only on pause or drift. */
export function playStoryAnimations(animations: Animation[], clock: SurfClock, offset: number, isPlaying: () => boolean) {
  const ends = animations.map(animation => Number(animation.effect!.getComputedTiming().endTime))
  const reference = animations[ends.indexOf(Math.max(...ends))]
  let frame = 0, running = false
  const draw = () => {
    const elapsed = Math.max(0, clock.elapsed - offset)
    const active = isPlaying() && isStoryActive()
    const drift = Math.abs(Number(reference?.currentTime ?? elapsed) - elapsed)
    if (active !== running || drift > 65) {
      animations.forEach((animation, index) => {
        animation.currentTime = elapsed
        if (active && elapsed < ends[index]) animation.play(); else animation.pause()
      })
      running = active
    }
    frame = requestAnimationFrame(draw)
  }
  animations.forEach(animation => { animation.pause(); animation.currentTime = Math.max(0, clock.elapsed - offset) })
  draw()
  return () => { cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel()) }
}
