import { memo, useEffect, useRef } from 'react'
import './ocean.css'

/** Compositor-only pointer light and local ripples; no per-frame React updates. */
function OceanResponse({ sequence, reduced }: { sequence: number; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const light = useRef<HTMLDivElement>(null)
  const touch = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const surface = root.current?.parentElement
    if (!surface || reduced) return
    let frame = 0
    let ripple: Animation | undefined
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      cancelAnimationFrame(frame)
      const bounds = surface.getBoundingClientRect()
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top
      frame = requestAnimationFrame(() => {
        if (!light.current) return
        light.current.style.translate = `${x}px ${y}px`
        light.current.style.opacity = '1'
      })
    }
    const leave = () => { cancelAnimationFrame(frame); if (light.current) light.current.style.opacity = '0' }
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || !touch.current) return
      const bounds = surface.getBoundingClientRect()
      touch.current.style.left = `${event.clientX-bounds.left}px`
      touch.current.style.top = `${event.clientY-bounds.top}px`
      ripple?.cancel()
      ripple = touch.current.animate([{transform:'translate(-50%,-50%) scale(.08)',opacity:.9},{transform:'translate(-50%,-50%) scale(1)',opacity:0}],{duration:1150,easing:'cubic-bezier(.15,.65,.25,1)'})
    }
    surface.addEventListener('pointermove',move,{passive:true})
    surface.addEventListener('pointerleave',leave)
    surface.addEventListener('pointerdown',press,{passive:true})
    return () => { cancelAnimationFrame(frame); ripple?.cancel(); surface.removeEventListener('pointermove',move); surface.removeEventListener('pointerleave',leave); surface.removeEventListener('pointerdown',press) }
  },[reduced])
  return <div ref={root} className="story-ocean-response" aria-hidden="true">
    <div className="story-current-field"><i/><i/><i/></div>
    <div className="story-ocean-halo"/>
    <div className="story-ocean-beam story-ocean-beam-one"/><div className="story-ocean-beam story-ocean-beam-two"/>
    <div className="story-pointer-light" ref={light}/><div className="story-pointer-ripple" ref={touch}/>
    {sequence>0&&!reduced&&<div className="story-ocean-reaction" key={sequence}><div className="story-ocean-rings"><i/><i/><i/></div>{Array.from({length:7},(_,i)=><span key={i} style={{'--bubble-x':`${(i-3)*54}px`,'--bubble-y':`${-80-(i%3)*54}px`,'--bubble-delay':`${i*45}ms`} as React.CSSProperties}/>)}</div>}
  </div>
}

export default memo(OceanResponse)
