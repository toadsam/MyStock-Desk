import { useId } from 'react'
import './surf.css'

/** A brief sheet of water follows the screen change; the product stays on screen. */
export default function WaveTransition({ label }: { label: string }) {
  const id = useId().replace(/:/g, '')
  return <div className="story-water-wash" aria-hidden="true" data-scene={label}>
    <svg viewBox="0 0 1600 600" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#adf4ff" stopOpacity=".8"/><stop offset=".3" stopColor="#42c8ff" stopOpacity=".55"/><stop offset="1" stopColor="#2175ee" stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-foam`}><stop stopColor="#fff" stopOpacity="0"/><stop offset=".35" stopColor="#d8ffff" stopOpacity=".95"/><stop offset=".75" stopColor="#b1f0ff" stopOpacity=".7"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
      </defs>
      <path d="M-150 370 C160 160 340 510 650 300 S1150 80 1750 210 L1750 650 L-150 650Z" fill={`url(#${id}-wash)`}/>
      <path d="M-150 370 C160 160 340 510 650 300 S1150 80 1750 210" fill="none" stroke={`url(#${id}-foam)`} strokeWidth="5"/>
      <path d="M-100 430 C210 210 385 570 700 350 S1210 130 1740 265" fill="none" stroke={`url(#${id}-foam)`} strokeWidth="2" opacity=".5"/>
      <path d="M-100 490 C240 290 440 620 760 420 S1270 220 1750 330" fill="none" stroke={`url(#${id}-foam)`} strokeWidth="1.5" opacity=".25"/>
    </svg>
  </div>
}
