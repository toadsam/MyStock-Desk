import { useLayoutEffect, useRef, type RefObject } from 'react'
import { SURF_COVER_MS, SURF_TRANSITION_MS, SURF_DOCK_START_MS, SURF_RELEASE_MS, sampleTimes, smoothStep, surfAngle, type SurfClock } from './surf'
import { playStoryAnimations } from './playStoryAnimations'

type LayerSpec = { selector: string; order: number }
// Original app nodes orbit horizontally through depth, then dock in their real layout.
const layers: LayerSpec[] = [
  // The phone body (backplate, chassis, island, home bar, status) stays put. When
  // the frame itself flew apart, viewers read the in-between frames as a broken
  // render rather than "the screen is changing".
  { selector: '.story-product-nav', order: 0 },
  { selector: '.story-native-home>section,.story-main-goal,.story-allocation,.story-goal-result,.story-ui-portfolio-hero,.story-receipts,.story-finale-stats>.story-ui-card', order: 0 },
  // Keep labels with their surfaces: the viewer follows meaningful UI, not text confetti.
  { selector: '.story-product-heading,.story-phone-brand', order: 1 },
  { selector: '[data-beluga-target="glass"],.story-relief-chart', order: 5 },
  { selector: '.story-chart-piece', order: 6 },
  { selector: '.story-native-home button,.story-goal-actions button,.story-asset-choices button,.story-finale-celebrate', order: 7 },
  { selector: '.story-product-nav button', order: 8 },
]

type Dressing = { display: string; edges: HTMLElement[] }
/** Strip the 3D dressing (depth class, edge faces, inline-block) from nodes not in `keep`. */
function undress(dressed: Map<HTMLElement, Dressing>, keep?: Set<Element>) {
  for (const [node, { display, edges }] of dressed) {
    if (keep?.has(node)) continue
    edges.forEach(edge => edge.remove())
    node.classList.remove('story-flight-piece', 'story-depth-plate')
    node.style.display = display
    dressed.delete(node)
  }
}

export function useExplodedScreen(panelRef: RefObject<HTMLDivElement | null>, chapter: number, started: number | undefined, clock: SurfClock | undefined, playing: boolean, reduced: boolean) {
  const origin = useRef({ id: started, chapter })
  const playback = useRef(playing)
  // Dressing survives the cover -> entering rebuild at the screen swap. Removing
  // and re-adding it there toggled position:relative on every plate and forced a
  // full relayout in the busiest frame of the transition; it now comes off once.
  const dressed = useRef(new Map<HTMLElement, Dressing>())
  useLayoutEffect(() => { playback.current = playing }, [playing])
  useLayoutEffect(() => { const map = dressed.current; return () => undress(map) }, [])
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !clock || started === undefined || reduced) { undress(dressed.current); return }
    if (origin.current.id !== started) origin.current = { id: started, chapter }
    const entering = origin.current.chapter !== chapter || clock.elapsed >= SURF_COVER_MS
    const viewport = panel.closest('.wave-story')!.getBoundingClientRect()
    const compact = viewport.width < 761
    const bounds = panel.getBoundingClientRect()
    const scale = bounds.height / panel.offsetHeight || 1
    const seen = new Set<Element>()
    const styles = new Map<Element, CSSStyleDeclaration>()
    const styleOf = (node: Element) => {
      let style = styles.get(node)
      if (!style) { style = getComputedStyle(node); styles.set(node, style) }
      return style
    }
    // Batch the layout/style reads before creating animations. Never measure in RAF.
    const pieces = layers.flatMap(spec => [...panel.querySelectorAll<HTMLElement>(spec.selector)].filter(node => {
      if (seen.has(node) || !node.getClientRects().length) return false
      seen.add(node); return true
    }).map((node, index) => {
      const rect = node.getBoundingClientRect()
      let zoom = 1
      for (let ancestor: HTMLElement | null = node; ancestor && ancestor !== panel; ancestor = ancestor.parentElement) zoom *= Number(styleOf(ancestor).zoom) || 1
      return {
      node, spec, index,
      cx: (rect.left + rect.width / 2 - bounds.left - bounds.width / 2) / scale,
      cy: (rect.top + rect.height / 2 - bounds.top - bounds.height / 2) / scale,
      width: rect.width,
      hardware: node.matches('.story-phone-part,.story-phone-island'),
      zoom,
      base: styleOf(node).transform.replace(/^none$/, ''),
      inline: !dressed.current.has(node) && styleOf(node).display === 'inline',
      plate: node.matches('.story-ui-card,.story-native-home>section,.story-native-home button,.story-goal-actions button,.story-asset-choices button,.story-phone-backplate,.story-ui-portfolio-hero'),
    }}))
    // Orbit in viewport space, then project back into the phone's 3D coordinates.
    // Keep header/player clear; the rest of the screen belongs to the flying UI.
    const orbitTop = compact ? 106 : 120
    const orbitBottom = viewport.height - (compact ? 155 : 160)
    const orbitCenterX = viewport.left + viewport.width * .5
    const orbitCenterY = viewport.top + (orbitTop + orbitBottom) / 2
    const parents = pieces.map(piece => {
      for (let node = piece.node.parentElement; node && node !== panel; node = node.parentElement) {
        const index = pieces.findIndex(candidate => candidate.node === node)
        if (index !== -1) return index
      }
      return -1
    })
    const families = pieces.map((_, index) => {
      let root = index
      while (parents[root] >= 0) root = parents[root]
      return root
    })
    const roots = [...new Set(families)]
    const groups = families.map(family => roots.indexOf(family))
    const pose = (piece: typeof pieces[number], pieceIndex: number, elapsed: number) => {
      const { spec, index, cx, cy, hardware } = piece
      const family = pieces[families[pieceIndex]]
      const group = groups[pieceIndex]
      const dockAt = SURF_DOCK_START_MS + (hardware ? index * 6 : 30 + spec.order * 5 + index % 3 * 3)
      const capture = smoothStep(dockAt, dockAt + (hardware ? 160 : 170), elapsed)
      const release = SURF_RELEASE_MS + (hardware ? 60 : 0) + spec.order * 7
      const lift = smoothStep(release, release + 270, elapsed) * (1 - capture)
      const surface = spec.order === 0
      const flightScale = hardware ? .48 : surface ? .72 : compact ? .82 : 1
      const lane = .82 + group % 3 * .06
      // Orbit close to the phone instead of across the whole stage, so the pieces
      // still read as parts of one screen while they swirl.
      const radiusX = Math.max(25, Math.min(viewport.width / 2 - (compact ? 18 : 140) - piece.width * flightScale * .63, bounds.width * (compact ? .55 : .75))) * lane
      // Keep angular travel alive during the short inward sweep; never park before docking.
      const theta = surfAngle(elapsed) - .65 - group * .48 - spec.order * .025 - (family === piece ? 0 : index * .035) + capture * .62
      // The ellipse lies in X/Z, not X/Y: pieces pass behind and in front of the phone.
      const depth = 30 + Math.cos(theta) * (compact ? 110 : 190) + spec.order * 5
      const laneY = Math.max(-85, Math.min(85, family.cy * scale * .30)) + (cy - family.cy) * scale * .64
      const bankY = Math.cos(theta) * (compact ? 9 : 18)
      const projectedX = (orbitCenterX + Math.sin(theta) * radiusX + (cx - family.cx) * scale * .70 - bounds.left - bounds.width / 2) / scale
      const projectedY = (orbitCenterY + laneY + bankY - bounds.top - bounds.height / 2) / scale
      // Account for perspective so near pieces grow without flying past the edges.
      const perspective = 1 - depth / 1600
      return {
        x: (projectedX * perspective - cx) * lift,
        y: (projectedY * perspective - cy) * lift,
        z: depth * lift,
        yaw: Math.sin(theta) * (hardware ? 72 : 56) * lift,
        pitch: (Math.cos(theta) * (hardware ? 20 : surface ? 24 : 12) - 6) * lift,
        roll: Math.cos(theta) * (hardware ? 14 : 4) * lift,
        scale: 1 + (flightScale - 1) * lift,
        lift,
      }
    }
    const rotation = (pose: { yaw: number; pitch: number; roll: number }) => new DOMMatrix()
      .rotateAxisAngle(0, 1, 0, pose.yaw).rotateAxisAngle(1, 0, 0, pose.pitch).rotateAxisAngle(0, 0, 1, pose.roll)
    const duration = entering ? SURF_TRANSITION_MS - SURF_COVER_MS : SURF_COVER_MS
    // Each pose and its rotation are shared by every child of that piece. Compute
    // once per sample, before any DOM writes or animation attachment.
    const from = entering ? SURF_COVER_MS : 0
    // Docking is the fast part (each piece snaps in over ~170ms); keep it dense.
    const times = sampleTimes(from, from + duration, 32, entering ? [[SURF_DOCK_START_MS - 20, SURF_TRANSITION_MS, 16]] : [[SURF_RELEASE_MS, SURF_RELEASE_MS + 480, 12]])
    const samples = times.map(time => pieces.map((piece, index) => {
      const current = pose(piece, index, time)
      const orientation = rotation(current)
      return { ...current, orientation, inverse: orientation.inverse() }
    }))
    const identity = { x: 0, y: 0, z: 0, scale: 1, inverse: new DOMMatrix() }
    const prepared = pieces.map((piece, pieceIndex) => {
      const { base, zoom } = piece
      const rest = base || 'none'
      const frames: Keyframe[] = times.map((time, step) => {
        const t = (time - from) / duration
        // Both screens share the same orbit clock: no hold or speed reset at the swap.
        const current = samples[step][pieceIndex]
        const parentPiece = parents[pieceIndex] < 0 ? null : pieces[parents[pieceIndex]]
        const parent = parentPiece ? samples[step][parents[pieceIndex]] : identity
        // Undo the parent's rotation as well as its scale/translation. Large backing
        // cards can now bank in 3D without pulling their independently flying labels.
        const inverse = parent.inverse
        const dx = piece.cx - (parentPiece?.cx ?? piece.cx)
        const dy = piece.cy - (parentPiece?.cy ?? piece.cy)
        const local = inverse.transformPoint(new DOMPoint(dx + current.x - parent.x, dy + current.y - parent.y, current.z - parent.z))
        const x = (local.x / parent.scale - dx) / zoom
        const y = (local.y / parent.scale - dy) / zoom
        const z = local.z / parent.scale / zoom
        const size = current.scale / parent.scale
        const orientation = inverse.multiply(current.orientation).toString()
        return {
          offset: t,
          transform: Math.abs(x) + Math.abs(y) + Math.abs(z) < .0001 ? rest : `${base} translate3d(${x}px,${y}px,${z}px) ${orientation} scale(${size})`,
        }
      })
      return { node: piece.node, frames }
    })
    undress(dressed.current, new Set(pieces.map(piece => piece.node)))
    pieces.forEach(({ node, inline, plate }) => {
      if (dressed.current.has(node)) return
      const dressing: Dressing = { display: node.style.display, edges: [] }
      if (inline) node.style.display = 'inline-block'
      node.classList.add('story-flight-piece')
      if (plate) {
        node.classList.add('story-depth-plate')
        for (const side of ['left', 'right', 'top', 'bottom']) {
          const edge = document.createElement('span')
          edge.className = `story-relief-edge story-relief-edge-${side}`
          edge.setAttribute('aria-hidden', 'true')
          node.appendChild(edge)
          dressing.edges.push(edge)
        }
      }
      dressed.current.set(node, dressing)
    })
    const animations = prepared.map(({ node, frames }) => {
      // Transform only: animating opacity would flatten the extruded back faces.
      const animation = node.animate(frames, {
        duration,
        fill: 'both', easing: 'linear',
      })
      animation.pause()
      animation.currentTime = Math.max(0, clock.elapsed - (entering ? SURF_COVER_MS : 0))
      return animation
    })
    const stop = playStoryAnimations(animations, clock, entering ? SURF_COVER_MS : 0, () => playback.current)
    return () => {
      stop()
    }
  }, [panelRef, chapter, started, clock, reduced])
}
