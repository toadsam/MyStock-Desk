import { useEffect, useState } from 'react'

let active = true
export const isStoryActive = () => active && !document.hidden

/** Keep a collection of preview tabs from running eleven WebGL films at once. */
export function useStoryActivity() {
  const [enabled, setEnabled] = useState(true)
  useEffect(() => {
    const id = performance.timeOrigin
    let owner = id
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('mywave-story-render-owner')
    const publish = () => { active = owner === id && !document.hidden; setEnabled(active) }
    const claim = (force = false) => {
      if (document.hidden) { publish(); return }
      owner = id; publish(); channel?.postMessage({ id, force })
    }
    if (channel) channel.onmessage = event => {
      const incoming = event.data as { id: number; force: boolean }
      if (typeof incoming.id !== 'number') return
      if (incoming.force || incoming.id >= owner) { owner = incoming.id; publish() }
      else if (owner === id) channel.postMessage({ id, force: false })
    }
    const focus = () => claim(true)
    const visibility = () => document.hidden ? publish() : claim(true)
    window.addEventListener('focus', focus)
    window.addEventListener('pointerdown', focus, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    claim()
    return () => {
      channel?.close(); active = true
      window.removeEventListener('focus', focus); window.removeEventListener('pointerdown', focus)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return enabled
}
