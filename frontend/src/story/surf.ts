// Release into a short spiral, then staggered docking of the actual app UI.
export const SURF_TRANSITION_MS = 2520
export const SURF_COVER_MS = 1000
export const SURF_DOCK_START_MS = 2100
export const SURF_IMPACT_MS = 2350
export const SURF_IMPACT_DURATION_MS = 140
export const SURF_ARRIVAL_SECONDS = .4
export type SurfClock = { elapsed: number }

// The guide starts the gesture before the UI releases into the same current.
export const SURF_RELEASE_MS = 180
export const smoothStep = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}
export const surfAngle = (elapsed: number) => {
  const q = Math.max(0, elapsed - SURF_RELEASE_MS) / (SURF_DOCK_START_MS - SURF_RELEASE_MS)
  return (q * 1.85 - .08 * Math.sin(q * Math.PI * 2)) * Math.PI * 2 - Math.PI * .4
}
