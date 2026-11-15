import { useLayoutEffect, useRef, type RefObject } from 'react'
import { ArrowRight } from 'lucide-react'
import { BelugaArt } from '../mywave/BelugaArt'
import { playStoryAnimations } from './playStoryAnimations'
import { OPENING_SECONDS, OPENING_TURN_SECONDS, openingBeat } from './playback'
import { smoothStep, surfAngle, SURF_COVER_MS, type SurfClock } from './surf'
import './opening.css'

export default function StoryOpening({ elapsed, clock, playing, reduced, onSkip }: {
  elapsed: number; clock: RefObject<SurfClock>; playing: boolean; reduced: boolean; onSkip: () => void
}) {
  const root = useRef<HTMLElement>(null)
  const playback = useRef(playing)
  useLayoutEffect(() => { playback.current = playing }, [playing])
  useLayoutEffect(() => {
    if (!root.current || reduced) return
    let stop = () => {}
    const direct = () => {
      stop()
      const node = root.current!
      const actor = node.querySelector<HTMLElement>('.story-opening-actor')!
      const size = node.querySelector<HTMLElement>('.story-opening-measure')!.offsetWidth
      const width = node.clientWidth, height = node.clientHeight, compact = width < 761
      const baseX = actor.offsetLeft, baseY = actor.offsetTop, baseSize = actor.offsetWidth
      const frames: Keyframe[] = [], front: Keyframe[] = [], swim: Keyframe[] = [], copy: Keyframe[] = []
      const duration = OPENING_SECONDS * 1000 + SURF_COVER_MS
      const turnAt = OPENING_TURN_SECONDS * 1000
      for (let i = 0; i <= 128; i++) {
        // Spend more samples on departure, where the guide joins the UI's orbit.
        const t = i <= 64 ? i / 64 * turnAt : turnAt + (i - 64) / 64 * (duration - turnAt)
        const offset = t / duration
        const enter = smoothStep(0, 1700, t)
        const depart = smoothStep(OPENING_SECONDS * 1000, duration - 200, t)
        const turn = smoothStep(turnAt, turnAt + 600, t)
        const angle = surfAngle(Math.max(0, t - OPENING_SECONDS * 1000))
        const orbitX = width * .5 + Math.sin(angle) * width * (compact ? .25 : .30) - size / 2
        const centerY = ((compact ? 106 : 120) + height - (compact ? 155 : 160)) / 2
        const orbitY = centerY - size * .30 + Math.cos(angle) * (compact ? 12 : 24)
        const scale = (.78 + enter * .22) * (1 - depart) + size / baseSize * (.90 + Math.cos(angle) * .14) * depart
        const x = (orbitX - baseX) * depart
        const y = ((1 - enter) * 55 + Math.sin(t / 950) * 8) * (1 - depart) + (orbitY - baseY) * depart
        frames.push({ offset, opacity: enter, transform: `translate3d(${x}px,${y}px,0) rotateY(${Math.sin(angle) * 16 * depart}deg) rotateZ(${(1 - enter) * -12 + Math.cos(angle) * 11 * depart}deg) scale(${scale})` })
        front.push({ offset, opacity: 1 - turn })
        swim.push({ offset, opacity: turn })
        // Clear the words before the guide's departure orbit crosses them.
        const leave = smoothStep(turnAt, OPENING_SECONDS * 1000 + 150, t)
        copy.push({ offset, opacity: 1 - leave, transform: `translate3d(0,${-leave * 14}px,0)` })
      }
      const animations: Animation[] = []
      const animate = (selector: string, keyframes: Keyframe[]) => {
        const node = root.current?.querySelector(selector)
        if (node) animations.push(node.animate(keyframes, { duration, fill: 'both', easing: 'linear' }))
      }
      animate('.story-opening-actor', frames)
      animate('.story-opening-hello', front)
      animate('.story-opening-swim', swim)
      animate('.story-opening-copy', copy)
      stop = playStoryAnimations(animations, clock.current, 0, () => playback.current)
    }
    direct()
    window.addEventListener('resize', direct)
    return () => { stop(); window.removeEventListener('resize', direct) }
  }, [clock, reduced])
  const beat = openingBeat(elapsed)
  return <section className="story-opening" ref={root} aria-label="벨루가와 여행 시작">
    <div className="story-opening-glow" aria-hidden="true" />
    <div className="story-guide story-opening-measure" aria-hidden="true" />
    <div className="story-opening-actor" aria-hidden="true">
      <BelugaArt mood="hello" gaze={false} className="story-opening-hello" />
      <BelugaArt mood="swim" gaze={false} className="story-opening-swim" />
    </div>
    <div className="story-opening-copy">
      <span className="story-opening-label">MYWAVE · 벨루가와 함께</span>
      <div key={beat} className="story-opening-words">
        <h1>{beat === 0 ? <>내 돈은 어디로<br />흘러가고 있을까?</> : <>안녕, 나는 벨루가야!<br />같이 탐험해볼까?</>}</h1>
        <p>{beat === 0 ? '작은 물결에서 시작하는 나의 돈 이야기.' : '소비부터 저축, 투자까지. 나를 따라와, 하나씩 보여줄게.'}</p>
      </div>
      <button onClick={onSkip}>바로 둘러보기 <ArrowRight size={14} /></button>
    </div>
  </section>
}
