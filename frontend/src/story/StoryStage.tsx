import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { isStoryActive } from './storyActivity'
import { CHAPTER_SECONDS } from './chapters'
import { SURF_TRANSITION_MS, SURF_ARRIVAL_SECONDS, type SurfClock } from './surf'
import { GOAL, money, portions, remaining, type DemoState, type StoryAction } from './interaction'
import belugaPoint from '../assets/mywave/beluga-point.webp'
import belugaSwim from '../assets/mywave/beluga-swim.webp'
import belugaHello from '../assets/mywave/beluga-jump.png'
import belugaTrophy from '../assets/mywave/beluga-trophy.webp'

type Props = { chapter: number; time: number; playing: boolean; reduced: boolean; demo: DemoState; onAction: (action: StoryAction) => void; onExplore: () => void; onViewChange: () => void; presenting: boolean; surfStarted?: number; surfClock?: SurfClock }
type Vec = [number, number, number]
const palette = { blue: '#397be1', deep: '#173e48', mint: '#65c4ad', gold: '#edbe54', peach: '#e89770', white: '#fffaf0' }

function material(color: string, roughness = 0.36) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04, envMapIntensity: 0.6 })
}

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, position: Vec = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, mat)
  object.position.set(...position)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

function sphere(parent: THREE.Object3D, mat: THREE.Material, position: Vec, scale: Vec) {
  const object = mesh(parent, new THREE.SphereGeometry(1, 24, 16), mat, position)
  object.scale.set(...scale)
  return object
}

function box(parent: THREE.Object3D, size: Vec, mat: THREE.Material, position: Vec, radius = 0.1) {
  return mesh(parent, new RoundedBoxGeometry(...size, 4, radius), mat, position)
}

function ring(parent: THREE.Object3D, radius: number, thickness: number, color: string, position: Vec) {
  const object = mesh(parent, new THREE.TorusGeometry(radius, thickness, 12, 80), material(color), position)
  object.rotation.x = Math.PI / 2
  return object
}

function label(parent: THREE.Object3D, text: string, position: Vec, width = 2.5, color = palette.deep, background = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = 768; canvas.height = 192
  const context = canvas.getContext('2d')!
  context.fillStyle = background
  context.beginPath(); context.roundRect(4, 4, 760, 184, 42); context.fill()
  context.textAlign = 'center'; context.textBaseline = 'middle'
  context.font = 'bold 64px "Malgun Gothic", sans-serif'
  context.fillStyle = color; context.fillText(text, 384, 100)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, toneMapped: false })
  const result = mesh(parent, new THREE.PlaneGeometry(width, width / 4), mat, position)
  result.castShadow = false
  result.receiveShadow = false
  result.userData.setText = (value: string) => {
    context.clearRect(0, 0, 768, 192)
    context.fillStyle = background
    context.beginPath(); context.roundRect(4, 4, 760, 184, 42); context.fill()
    context.fillStyle = color; context.fillText(value, 384, 100)
    texture.needsUpdate = true
  }
  return result
}

function coin(parent: THREE.Object3D, position: Vec, scale = 1) {
  const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); parent.add(group)
  mesh(group, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 48), material(palette.gold, 0.24)).rotation.x = Math.PI / 2
  const border = mesh(group, new THREE.TorusGeometry(0.29, 0.014, 8, 48), material('#ffeab5'), [0, 0, 0.06])
  border.castShadow = false
  label(group, '₩', [0, 0, 0.064], 0.54, '#a87823', palette.gold)
  return group
}

function beluga() {
  // Keep the app's original sculpted character, including its smile and proportions.
  // A camera-facing sprite lets that art inhabit the navigable ocean without distortion.
  const group = new THREE.Group()
  const loader = new THREE.TextureLoader()
  const textures = { point:loader.load(belugaPoint), swim:loader.load(belugaSwim), hello:loader.load(belugaHello), trophy:loader.load(belugaTrophy) }
  Object.values(textures).forEach(texture => { texture.colorSpace = THREE.SRGBColorSpace })
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:textures.hello,transparent:true,depthWrite:false,toneMapped:false}))
  sprite.scale.set(3.4,3.4,1)
  group.add(sprite)
  return {group,sprite,textures}
}

function glass(parent: THREE.Object3D) {
  const group = new THREE.Group(); parent.add(group)
  const points = [new THREE.Vector2(0.79, 0), new THREE.Vector2(0.82, 0.13), new THREE.Vector2(0.96, 2.16), new THREE.Vector2(0.92, 2.2), new THREE.Vector2(0.88, 0.16), new THREE.Vector2(0.79, 0)]
  const mat = new THREE.MeshPhysicalMaterial({ color: '#c3e6ff', transparent: true, opacity: 0.22, roughness: 0.14, metalness: 0.08, side: THREE.DoubleSide, depthWrite: false })
  const shell = mesh(group, new THREE.LatheGeometry(points, 64), mat)
  shell.castShadow = false; shell.renderOrder = 3
  ring(group, 0.94, 0.035, '#ecf8ff', [0, 2.19, 0])
  ring(group, 0.81, 0.035, '#bfd9ef', [0, 0.1, 0])
  const water = new THREE.Group(); group.add(water)
  const liquid = mesh(water, new THREE.CylinderGeometry(0.875, 0.8, 1, 64), new THREE.MeshStandardMaterial({ color: '#4397f7', roughness: 0.22, transparent: true, opacity: 0.82 }), [0, 0.5, 0])
  liquid.castShadow = false
  const surface = mesh(water, new THREE.CircleGeometry(0.88, 64), material('#8acbff'), [0, 1.002, 0]); surface.rotation.x = -Math.PI / 2
  for (let i = 0; i < 5; i++) {
    box(group, [0.14, 0.025, 0.02], material('#ffffff'), [0.64, 0.45 + i * 0.32, 0.68], 0.005)
  }
  const reflection = box(group, [0.07, 1.6, 0.015], material('#f6fdff'), [-0.48, 1.17, 0.72], 0.025); reflection.rotation.z = -0.055
  return { group, water }
}

function cup(parent: THREE.Object3D) {
  const group = new THREE.Group(); parent.add(group)
  mesh(group, new THREE.CylinderGeometry(0.68, 0.48, 1.34, 64), material('#fce4ca'), [0, 0.78, 0])
  mesh(group, new THREE.CylinderGeometry(0.62, 0.55, 0.5, 64), material(palette.peach), [0, 0.73, 0])
  mesh(group, new THREE.CylinderGeometry(0.74, 0.74, 0.15, 64), material('#fffaf2'), [0, 1.48, 0])
  mesh(group, new THREE.CylinderGeometry(0.63, 0.69, 0.14, 64), material('#fffaf2'), [0, 1.61, 0])
  box(group, [0.27, 0.025, 0.08], material('#9d775f'), [0, 1.69, 0.35], 0.02)
  label(group, 'MY', [0, 0.77, 0.63], 0.72, '#9d613f', '#f4ae8e')
  return group
}

function piggy(parent: THREE.Object3D) {
  const group = new THREE.Group(); parent.add(group)
  const mint = material('#93dfcb')
  sphere(group, mint, [0, 1.04, 0], [1.08, 0.88, 0.8])
  sphere(group, mint, [0, 1.12, 0.55], [0.69, 0.65, 0.54])
  sphere(group, material('#baf1de'), [0, 1.02, 1.01], [0.39, 0.26, 0.13])
  for (const x of [-1, 1]) {
    sphere(group, material('#3b8f7c'), [x * 0.14, 1.02, 1.13], [0.045, 0.067, 0.02])
    sphere(group, material(palette.deep), [x * 0.4, 1.31, 0.93], [0.047, 0.065, 0.03])
    const ear = mesh(group, new THREE.ConeGeometry(0.24, 0.49, 3), mint, [x * 0.5, 1.87, 0.28]); ear.rotation.z = x * -0.26
    for (const z of [-0.4, 0.4]) box(group, [0.31, 0.4, 0.31], mint, [x * 0.61, 0.3, z], 0.13)
  }
  box(group, [0.6, 0.03, 0.11], material('#3b8f7c'), [0, 1.925, -0.13], 0.025)
  return group
}

function portfolio(parent: THREE.Object3D) {
  const group = new THREE.Group(); parent.add(group)
  const values = [0.46, 0.32, 0.22]
  const colors = [palette.blue, '#a698d8', palette.mint]
  let angle = 0
  const sectors: THREE.Mesh[] = []
  values.forEach((value, index) => {
    const arc = value * Math.PI * 2 - 0.07
    const shape = new THREE.Shape()
    shape.absarc(0, 0, 1.31, angle, angle + arc, false)
    shape.absarc(0, 0, 0.76, angle + arc, angle, true)
    shape.closePath()
    const sector = mesh(group, new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 3, curveSegments: 40 }), material(colors[index]))
    sector.rotation.x = -Math.PI / 2; sector.position.y = 0.7
    sector.userData.midAngle = angle + arc / 2
    sector.userData.action = { type: 'select', index }
    sectors.push(sector)
    angle += value * Math.PI * 2
  })
  const bars = new THREE.Group(); bars.position.set(0, 0.4, -0.65); group.add(bars)
  for (let i = 0; i < 3; i++) box(bars, [0.4, 0.7 + i * 0.5, 0.4], material(colors[i]), [-0.55 + i * 0.55, 0.35 + i * 0.25, 0], 0.08)
  return { group, bars, sectors }
}

export default function StoryStage(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const meter = useRef<HTMLOutputElement>(null)
  const latest = useRef(props)
  useLayoutEffect(() => { latest.current = props }, [props])
  const [failed, setFailed] = useState(false)
  const orbit = useRef(0)
  const zoom = useRef(1)
  const elevation = useRef(0)

  useEffect(() => {
    const container = host.current!
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }) }
    catch {
      const failureFrame = requestAnimationFrame(() => setFailed(true))
      return () => cancelAnimationFrame(failureFrame)
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#061d4e')
    scene.fog = new THREE.Fog('#061d4e', 12, 48)
    const environment = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environmentTarget = pmrem.fromScene(environment, 0.04)
    scene.environment = environmentTarget.texture
    scene.environmentIntensity = 0.65
    environment.dispose()
    pmrem.dispose()
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 160)
    camera.position.set(4.1, 4.5, 10.5)
    camera.lookAt(0, 1.45, 0)
    scene.add(new THREE.HemisphereLight('#fff8e9', '#8bbbc7', 1.4))
    const sun = new THREE.DirectionalLight('#fff7ed', 3)
    sun.position.set(-3, 8, 5); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7
    sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.0001
    sun.shadow.radius = 5
    sun.shadow.blurSamples = 8
    scene.add(sun)
    const rim = new THREE.DirectionalLight('#c5eff9', 1.4); rim.position.set(4, 3, -4); scene.add(rim)
    const world = new THREE.Group(); scene.add(world)

    // An unbounded water surface replaces the old circular display pedestal.
    const oceanTime = { value: 0 }
    const oceanTouch = { value: new THREE.Vector2(1000, 1000) }
    const oceanTouchAge = { value: 100 }
    const oceanSwell = { value: 0 }
    const oceanSwellTravel = { value: 0 }
    const oceanMaterial = new THREE.MeshStandardMaterial({ color: '#0b3285', roughness: 0.19, metalness: 0.38, envMapIntensity: 0.22 })
    oceanMaterial.onBeforeCompile = shader => {
      shader.uniforms.uOceanTime = oceanTime
      shader.uniforms.uOceanTouch = oceanTouch
      shader.uniforms.uOceanTouchAge = oceanTouchAge
      shader.uniforms.uOceanSwell = oceanSwell
      shader.uniforms.uOceanSwellTravel = oceanSwellTravel
      const uniforms = 'uniform float uOceanTime; uniform vec2 uOceanTouch; uniform float uOceanTouchAge; uniform float uOceanSwell; uniform float uOceanSwellTravel; varying vec2 vOceanUv;\n'
      shader.vertexShader = uniforms + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        vOceanUv = position.xy;
        float d = distance(position.xy, uOceanTouch);
        float touch = sin(d * 5.0 - uOceanTouchAge * 5.0) * exp(-abs(d - uOceanTouchAge * 2.0) * 1.2) * max(0.0, 1.0 - uOceanTouchAge / 4.0);
        transformed.z += sin(position.x * 0.55 + uOceanTime * 0.7) * 0.12 + sin(position.y * 0.8 - uOceanTime * 0.5) * 0.09 + touch * 0.23;
        float crest = (position.y - uOceanSwellTravel + sin(position.x * 0.18) * 1.7) / 4.0;
        transformed.z += exp(-crest * crest) * uOceanSwell;
      `)
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        objectNormal = normalize(vec3(-cos(position.x * 0.55 + uOceanTime * 0.7) * 0.066, -cos(position.y * 0.8 - uOceanTime * 0.5) * 0.072, 1.0));
        float crestSlope = (position.y - uOceanSwellTravel + sin(position.x * 0.18) * 1.7) / 4.0;
        objectNormal.y += crestSlope * exp(-crestSlope * crestSlope) * uOceanSwell * 0.5;
        objectNormal = normalize(objectNormal);
      `)
      shader.fragmentShader = uniforms + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float flow = sin(vOceanUv.x * 1.7 + sin(vOceanUv.y * 1.4 + uOceanTime * 0.3)) + sin(vOceanUv.y * 1.5 - uOceanTime * 0.25 + cos(vOceanUv.x * 1.2));
        float foam = pow(abs(sin(flow * 0.8)), 22.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.46, 0.85), foam * 0.08);
      `)
    }
    const ocean = mesh(scene, new THREE.PlaneGeometry(180, 180, 72, 72), oceanMaterial, [0, -0.28, 0])
    ocean.rotation.x = -Math.PI / 2; ocean.castShadow = false
    const wakes = Array.from({length: 8}, () => {
      const mat = new THREE.MeshBasicMaterial({color:'#f3fff5', transparent:true, opacity:0, depthWrite:false})
      const item = mesh(scene, new THREE.RingGeometry(0.94, 1, 80), mat)
      item.rotation.x = -Math.PI / 2; item.castShadow = false; item.visible = false
      return {item, mat, born:-10000}
    })
    let wakeIndex = 0
    let exploreStart = -10000
    let rippleStart = -10000
    const exploreTarget = new THREE.Vector3()
    const horizon = new THREE.Group(); scene.add(horizon)
    const cloudMaterial = material('#e8f7ff', 1)
    const clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), cloudMaterial, 39)
    const instance = new THREE.Object3D()
    horizon.add(clouds)
    for (let i = 0; i < 13; i++) for (let j = 0; j < 3; j++) {
      const a = i / 13 * Math.PI * 2
      instance.position.set(Math.cos(a) * 31 + (j - 1) * 1.4, 3 + i % 3 * 1.8 + (j === 1 ? .5 : 0), Math.sin(a) * 31)
      instance.scale.set(1.6, j === 1 ? 1.1 : .7, .9); instance.updateMatrix(); clouds.setMatrixAt(i * 3 + j, instance.matrix)
    }
    const floatingCoins = Array.from({length: 6}, (_, i) => {
      const a = i * 2.399
      const item = coin(world, [Math.cos(a) * (4.8 + i % 4), 0.5 + i % 3 * 0.8, Math.sin(a) * (4.8 + i % 4)], 0.35 + i % 3 * 0.13)
      item.userData.action = {type:'hello'}
      return item
    })

    const whale = beluga(); world.add(whale.group)
    whale.group.userData.action = { type: 'hello' }
    const objects = Array.from({ length: 6 }, () => { const group = new THREE.Group(); world.add(group); return group })
    const introCoins = [coin(objects[0], [-2.9, 1.05, 0.4], 0.85), coin(objects[0], [2.8, 2.7, -1.9], 0.8), coin(objects[0], [2.2, 0.6, 3.7], 0.75)]
    introCoins.forEach(item => { item.userData.action = {type:'hello'} })
    const budget = glass(objects[1]); budget.group.position.set(-0.6, 0.15, 0)
    budget.group.userData.action = { type: 'spend', amount: 3000 }
    const budgetLabel = label(objects[1], '12,900원', [-0.6, 1, 1.13], 1.9)
    budgetLabel.userData.action = { type: 'spend', amount: 3000 }
    const coffee = cup(objects[2]); coffee.position.set(-0.65, 0.14, 0.35); coffee.rotation.z = -0.12
    coffee.userData.action = { type: 'spend', amount: 3000 }
    const receipt = new THREE.Group(); objects[2].add(receipt); receipt.position.set(0.8, 1.5, -0.7); receipt.rotation.y = -0.25; receipt.rotation.z = -0.1
    box(receipt, [1.4, 2.1, 0.06], material('#fffdf8'), [0, 0, 0], 0.06)
    label(receipt, 'COFFEE', [0, 0.57, 0.04], 1.08, '#a47b62', '#fffdf8')
    label(receipt, '3,000', [0, -0.28, 0.04], 1.1, palette.deep, '#fffdf8')
    for (let i = 0; i < 3; i++) box(receipt, [0.9 - i * 0.12, 0.025, 0.01], material('#dacfbf'), [0, 0.18 - i * 0.13, 0.04], 0.005)
    const recordCoin = coin(objects[2], [-1.9, 0.7, 0.4], 0.65)
    const recordLabel = label(objects[2], '내가 추가한 기록 0건', [-0.2, 0.45, 1.8], 2.5)
    receipt.userData.action = { type: 'spend', amount: 3000 }
    const pig = piggy(objects[3]); pig.position.set(-0.55, 0.1, 0.2); pig.rotation.y = -0.2
    pig.userData.action = { type: 'save', amount: 10000 }
    const saveCoin = coin(objects[3], [-0.55, 3, 0], 0.75)
    saveCoin.userData.action = { type: 'save', amount: 10000 }
    const goalLabel = label(objects[3], '37.3%', [-0.55, 0.6, 1.42], 1.5, '#208b75')
    goalLabel.userData.action = { type: 'save', amount: 10000 }
    const savingsStack = new THREE.Group(); objects[3].add(savingsStack)
    const savingsCoins = Array.from({length: 10}, (_, i) => {
      const item = coin(savingsStack, [-1.8, 0.2 + i * 0.11, 0.9], 0.65)
      item.rotation.x = -Math.PI / 2
      return item
    })
    const investment = portfolio(objects[4]); investment.group.position.set(-0.45, 0.1, 0)
    const investmentLabel = label(objects[4], '조각을 눌러보세요', [-0.35, 0.45, 1.75], 2.4)
    const endGlass = glass(objects[5]); endGlass.group.position.set(-1.6, 0.12, 0.6); endGlass.group.scale.setScalar(0.6); endGlass.water.scale.y = 1.4
    const endPig = piggy(objects[5]); endPig.position.set(1.65, 0.13, 0.6); endPig.scale.setScalar(0.57)
    const endLabel = label(objects[5], 'MY WAVE', [0, 0.5, 2], 2.2)
    endPig.userData.action = {type: 'celebrate'}
    endGlass.group.userData.action = {type: 'celebrate'}

    const particles = Array.from({length: 54}, (_, i) => {
      const object = mesh(world, new THREE.BoxGeometry(0.055, 0.1, 0.025), material([palette.blue,palette.mint,palette.gold,palette.peach,'#a698d8','#ffffff'][i % 6]))
      object.castShadow = false; object.visible = false
      return object
    })
    const spotlight = ring(world, 1.02, 0.025, '#fff1a6', [-0.6, 0.15, 0])
    const trail = Array.from({length: 12}, () => {
      const bubble = sphere(world, new THREE.MeshBasicMaterial({color:'#e7fffa', transparent:true, opacity:0.5}), [0,0,0], [0.03,0.03,0.03])
      bubble.castShadow = false; return bubble
    })

    const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), new THREE.MeshPhongMaterial({ color: '#a3ddff', shininess: 80, transparent: true, opacity: .4, depthWrite: false }), 26)
    world.add(bubbles)
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.fov = camera.aspect < 0.9 ? 58 : 44
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize); observer.observe(container); resize()
    const pointer = { id: -1, x: 0, y: 0, down: false, startX: 0, startY: 0, startOrbit: 0, startElevation: 0, moved: false }
    const raycaster = new THREE.Raycaster()
    const pointerVector = new THREE.Vector2()
    const hitAction = (event: PointerEvent): StoryAction | undefined => {
      if (latest.current.presenting) return
      const rect = container.getBoundingClientRect()
      pointerVector.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(pointerVector, camera)
      const targets = [whale.group, objects[latest.current.chapter], ...floatingCoins]
      const hits = raycaster.intersectObjects(targets, true)
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object
        while (object && object !== world) {
          if (object.userData.action) return object.userData.action as StoryAction
          object = object.parent
        }
      }
    }
    const move = (event: PointerEvent) => {
      if (pointer.down && event.pointerId !== pointer.id) return
      const rect = container.getBoundingClientRect()
      pointer.x = (event.clientX - rect.left) / rect.width - 0.5
      pointer.y = (event.clientY - rect.top) / rect.height - 0.5
      if (pointer.down) {
        if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 8) pointer.moved = true
        orbit.current = pointer.startOrbit - (event.clientX - pointer.startX) * 0.005
        elevation.current = THREE.MathUtils.clamp(pointer.startElevation + (event.clientY - pointer.startY) * 0.008, -1.5, 4)
        container.style.cursor = 'grabbing'
      } else container.style.cursor = hitAction(event) ? 'pointer' : 'grab'
    }
    const leave = () => { pointer.x = 0 }
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (pointer.down) return
      latest.current.onViewChange()
      pointer.id = event.pointerId; pointer.down = true; pointer.moved = false; pointer.startX = event.clientX; pointer.startY = event.clientY; pointer.startOrbit = orbit.current; pointer.startElevation = elevation.current
      container.setPointerCapture(event.pointerId)
    }
    const up = (event: PointerEvent) => {
      if (!pointer.down || event.pointerId !== pointer.id) return
      pointer.down = false; container.style.cursor = 'grab'
      if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId)
      if (!pointer.moved) {
        const action = hitAction(event)
        if (action) { exploreStart = -10000; latest.current.onAction(action) }
        else {
          const point = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), -0.8), new THREE.Vector3()) ?? raycaster.ray.at(12, new THREE.Vector3())
          if (point) {
            point.x = THREE.MathUtils.clamp(point.x, -9, 9); point.z = THREE.MathUtils.clamp(point.z, -9, 9)
            exploreTarget.copy(world.worldToLocal(point.clone())); exploreTarget.y = 1.1
            exploreStart = performance.now()
            rippleStart = exploreStart
            oceanTouch.value.set(point.x, -point.z)
            const wake = wakes[wakeIndex++ % wakes.length]
            wake.item.position.set(point.x, 0.02, point.z); wake.born = exploreStart
            latest.current.onExplore()
          }
        }
      }
    }
    const cancel = () => { pointer.down = false; container.style.cursor = 'grab' }
    container.addEventListener('pointermove', move); container.addEventListener('pointerleave', leave)
    container.addEventListener('pointerdown', down); container.addEventListener('pointerup', up); container.addEventListener('pointercancel', cancel)
    const wheel = (event: WheelEvent) => { event.preventDefault(); latest.current.onViewChange(); zoom.current = THREE.MathUtils.clamp(zoom.current + event.deltaY * 0.0006, 0.65, 1.5) }
    container.addEventListener('wheel', wheel, {passive:false})
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true) }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    let frame = 0
    let previousChapter = -1
    let transitionStart = 0
    let previousFrame = 0
    let ambientTime = latest.current.chapter * CHAPTER_SECONDS + latest.current.time
    let currentScale = 1.12
    let actionSequence = -1
    let reactionStart = -10000
    let waterHeight = 1.18
    const whalePosition = new THREE.Vector3(0, 1.85, -0.1)
    const whaleTarget = new THREE.Vector3()
    let cameraAzimuth = 0, cameraDistance = 11.8, cameraHeight = 5.2
    const oceanColors = ['#0b3285','#103b96','#0b3285','#123e9a','#142d7a','#103b96'].map(color => new THREE.Color(color))
    const skyColors = ['#061d4e','#072555','#061d4e','#08265b','#0a2053','#072555'].map(color => new THREE.Color(color))
    let measuredAt = performance.now(), measuredFrames = 0, slowWindows = 0
    let labelSequence = -1
    const recordFrame = (now: number) => {
      measuredFrames++
      if (now - measuredAt < 1000) return
      const fps = measuredFrames * 1000 / (now - measuredAt)
      if (meter.current) meter.current.textContent = `${Math.round(fps)} fps · ${renderer.info.render.calls} draws · DPR ${renderer.getPixelRatio().toFixed(2)}`
      // Browser throttling is not GPU overload. Do not blur a temporarily idle preview.
      slowWindows = fps >= 8 && fps < 38 ? slowWindows + 1 : 0
      if (slowWindows === 3 && renderer.getPixelRatio() > .76) renderer.setPixelRatio(.75)
      measuredAt = now; measuredFrames = 0
    }
    const render = (now: number) => {
      const { chapter, time, reduced, demo, playing, presenting, surfStarted, surfClock } = latest.current
      const surfProgress = Math.min(1, (surfClock?.elapsed ?? 0) / SURF_TRANSITION_MS)
      const arrivalProgress = Math.min(1,time/SURF_ARRIVAL_SECONDS)
      const surfPower = reduced ? 0 : surfStarted !== undefined ? Math.sin(surfProgress*Math.PI) : Math.sin(arrivalProgress*Math.PI)*.35
      oceanSwell.value = surfPower*.22
      oceanSwellTravel.value = surfStarted === undefined ? -9+arrivalProgress*18 : -14+surfProgress*28
      const delta = Math.min(0.05, Math.max(0, (now - previousFrame) / 1000)); previousFrame = now
      if (!isStoryActive()) { measuredAt = now; measuredFrames = 0; frame = requestAnimationFrame(render); return }
      if (playing && !reduced) ambientTime += delta
      const t = reduced ? 0 : ambientTime
      // During the product film, distant scenery does not need a second shadow pass.
      renderer.shadowMap.enabled = false
      if (previousChapter !== chapter) { previousChapter = chapter; transitionStart = now; reactionStart = -10000; exploreStart = -10000; orbit.current = 0; zoom.current = 1; elevation.current = 0; cameraAzimuth = Math.atan2(Math.sin(cameraAzimuth), Math.cos(cameraAzimuth)) }
      if (actionSequence !== demo.sequence) {
        actionSequence = demo.sequence
        if (demo.sequence > 0 && demo.chapter === chapter) {
          reactionStart = now
          if (!reduced && demo.action !== 'reset') {
            rippleStart = now
            oceanTouch.value.set(0,0)
            for (let i=0;i<3;i++) { const wake=wakes[wakeIndex++%wakes.length]; wake.item.position.set(0,.02,0); wake.born=now+i*180 }
          }
        }
      }
      // Canvas labels belong to exploration; don't repaint/upload hidden textures.
      if (!presenting && labelSequence !== demo.sequence) {
        labelSequence = demo.sequence
        budgetLabel.userData.setText(`${money(remaining(demo))}원`)
        goalLabel.userData.setText(`${(demo.saved / GOAL * 100).toFixed(1)}%`)
        recordLabel.userData.setText(`내가 추가한 기록 ${demo.records}건`)
        investmentLabel.userData.setText(demo.selected < 0 ? '조각을 눌러보세요' : `예시 ${'ABC'[demo.selected]} · ${portions[demo.selected]}%`)
      }
      const follow = reduced ? 1 : 1 - Math.exp(-delta * 5)
      const sceneAngles = [0.12, 0.2, -0.28, 0.35, 0.55, -0.15]
      const cameraAngle = sceneAngles[chapter] + orbit.current + (reduced ? 0 : pointer.x * 0.18 + Math.sin(t * 0.2) * 0.07)
      const distance = (camera.aspect < 0.9 ? 10.2 : 11.8) * zoom.current - surfPower*1.6
      const cameraFollow = reduced ? 1 : 1 - Math.exp(-delta * 4)
      cameraAzimuth = THREE.MathUtils.lerp(cameraAzimuth, cameraAngle, cameraFollow)
      cameraDistance = THREE.MathUtils.lerp(cameraDistance, distance, cameraFollow)
      cameraHeight = THREE.MathUtils.lerp(cameraHeight, (chapter === 4 ? 7.1 : 5.2) + elevation.current + pointer.y * 0.45 + surfPower*1.2, cameraFollow)
      camera.position.set(Math.sin(cameraAzimuth) * cameraDistance, cameraHeight, Math.cos(cameraAzimuth) * cameraDistance)
      camera.lookAt(camera.aspect < 0.9 ? 0 : -0.9, camera.aspect < 0.9 ? 1.2 : 1.0, 0)
      camera.rotateZ(-surfPower*.055)

      oceanMaterial.color.lerp(oceanColors[chapter], follow * 0.35)
      ;(scene.background as THREE.Color).lerp(skyColors[chapter], follow * 0.35)
      ;(scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color)
      oceanTime.value = t
      oceanTouchAge.value = reduced ? 100 : (now - rippleStart) / 1000
      wakes.forEach(({item,mat,born}) => {
        const age = (now - born) / 1000
        item.visible = age >= 0 && age < (reduced ? 1 : 3)
        item.scale.setScalar(reduced ? 0.7 : 0.25 + age * 1.5)
        mat.opacity = Math.max(0, 1 - age / 3) * 0.7
      })
      horizon.visible = !presenting
      if (presenting) {
        // Detach the invisible exploration world: Three.js otherwise still walks
        // its object hierarchy to update matrices, even when visible is false.
        if (world.parent) scene.remove(world)
        renderer.render(scene, camera); recordFrame(now)
        frame = requestAnimationFrame(render)
        return
      }
      if (!world.parent) scene.add(world)
      for (const plaque of [budgetLabel, goalLabel, recordLabel, investmentLabel, endLabel]) plaque.quaternion.copy(camera.quaternion)
      const reaction = Math.min(1, Math.max(0, (now - reactionStart) / 2300))
      const reacting = reaction < 1 && demo.chapter === chapter && demo.action !== 'reset'
      const pulse = reacting && !reduced ? Math.sin(reaction * Math.PI) : 0
      const phase = Math.min(2, Math.floor(time / (CHAPTER_SECONDS / 3)))
      const entrance = reduced ? 1 : Math.min(1, (now - transitionStart) / 700)
      const ease = 1 - Math.pow(1 - entrance, 3)
      objects.forEach((object, index) => { object.visible = index === chapter && !presenting; object.scale.setScalar(0.72 + 0.28 * ease); object.position.y = (1 - ease) * -0.4; object.rotation.y = (1 - ease) * -0.35 })
      whale.group.visible = !presenting
      horizon.visible = !presenting
      bubbles.visible = !presenting
      floatingCoins.forEach(item => { item.visible = !presenting })
      const hero = chapter === 0 || chapter === 5
      const swim = t
      if (hero) whaleTarget.set(Math.sin(swim * 0.65) * 0.8, 1.8 + Math.sin(swim * 1.1) * 0.35, -0.2 + Math.cos(swim * 0.6) * 0.6)
      else if (phase === 0) whaleTarget.set(1.9, 1.2 + Math.sin(swim * 1.6) * 0.18, 0.7)
      else if (phase === 1) whaleTarget.set(0.9, 2.3 + Math.sin(swim * 1.6) * 0.18, -0.65)
      else whaleTarget.set(-1.65, 1.5 + Math.sin(swim * 1.6) * 0.18, 1.25)
      if (reacting) whaleTarget.set(demo.action === 'hello' || demo.action === 'celebrate' ? 0 : 1.2, 1.5 + pulse * 1.05, 1.4 + pulse * 0.5)

      const exploring = !presenting && now - exploreStart < 4000
      if (exploring) whaleTarget.copy(exploreTarget)
      whalePosition.lerp(whaleTarget, follow)
      currentScale = THREE.MathUtils.lerp(currentScale, reacting && demo.action === 'hello' ? 1 : hero ? (chapter === 5 ? 0.85 : 1.07) : 0.57, follow)
      whale.group.position.copy(whalePosition)
      whale.group.position.y += Math.sin(t * 1.4) * 0.1
      whale.group.scale.setScalar(currentScale)
      const gesture = exploring && !reduced ? (now - exploreStart) / 1000 : reacting && !reduced ? (now - reactionStart) / 1000 : t
      whale.sprite.material.map = exploring ? whale.textures.swim : reacting && demo.action === 'celebrate' ? whale.textures.trophy : hero ? whale.textures.hello : whale.textures.point
      whale.sprite.material.rotation = reduced ? 0 : Math.sin(gesture * 1.6) * .06
      floatingCoins.forEach((item,i) => { item.rotation.y = t * 0.4 + i + pulse*.7; item.position.y = 0.5 + i % 3 * 0.8 + Math.sin(t * 0.7 + i) * 0.3 + pulse*.45 })
      horizon.rotation.y = t * 0.002
      waterHeight = THREE.MathUtils.lerp(waterHeight, Math.max(0.015, remaining(demo) / 19700 * 1.8), reduced ? 1 : 1 - Math.exp(-delta * 3))
      budget.water.scale.y = waterHeight
      budget.group.rotation.z = demo.action === 'spend' && reacting ? Math.sin(reaction * Math.PI * 6) * pulse * 0.045 : 0
      coffee.scale.setScalar(1 + (demo.action === 'spend' ? pulse * 0.15 : 0))
      coffee.position.y = 0.14 + (demo.action === 'spend' ? pulse * 0.6 : 0)
      receipt.position.y = 1.5 + (demo.action === 'spend' ? pulse * 0.65 : Math.sin(t * 1.6) * 0.1)
      receipt.rotation.x = demo.action === 'spend' ? pulse * -0.25 : 0
      introCoins.forEach((object, index) => { object.rotation.y = t * 0.5 + index; object.position.y = [1.05, 2.7, 0.6][index] + Math.sin(t * 1.8 + index) * 0.12 })
      recordCoin.rotation.y = t * 0.7
      receipt.rotation.z = -0.1 + Math.sin(t * 1.4) * 0.035
      const dropping = reacting && demo.action === 'save'
      saveCoin.position.y = dropping ? 3.6 - Math.min(1, reaction * 2) ** 2 * 1.6 : 2.85 + Math.sin(t * 2) * 0.18
      saveCoin.rotation.y = dropping ? reaction * 10 : t * 1.8
      saveCoin.scale.setScalar(dropping ? Math.max(0, 1 - Math.max(0, reaction - 0.43) * 8) * 0.75 : 0.75)
      pig.scale.set(1 + pulse * 0.07, 1 - pulse * 0.07, 1 + pulse * 0.07)
      savingsCoins.forEach((item,i) => { item.visible = i < Math.round(demo.saved / GOAL * 10) })
      investment.bars.scale.y = 0.7 + Math.min(time / 5, 1) * 0.3
      const selected = demo.selected >= 0 ? demo.selected : phase
      investment.sectors.forEach((sector, index) => {
        const lift = index === selected ? 1 : 0
        sector.position.y = THREE.MathUtils.lerp(sector.position.y, 0.7 + lift * 0.48, follow)
        sector.position.x = Math.cos(sector.userData.midAngle) * lift * 0.27
        sector.position.z = -Math.sin(sector.userData.midAngle) * lift * 0.27
      })
      spotlight.visible = chapter > 0 && chapter < 5 && !presenting
      spotlight.scale.setScalar(1 + Math.sin(t * 2) * 0.08 + pulse * 0.3)
      spotlight.position.y = 0.15
      const party = reacting && !reduced && (demo.action === 'celebrate' || demo.action === 'save' && demo.saved === GOAL)
      particles.forEach((item, i) => {
        item.visible = !presenting && !reduced && reacting && demo.action !== 'select' && demo.action !== 'hello' && (party || i < 20)
        if (!item.visible) return
        const angle = i * 2.399
        const radius = reaction * (party ? 3.5 : 1.7)
        item.position.set((party ? 0 : -0.55) + Math.cos(angle) * radius, (party ? 2 : 1) + Math.sin(reaction * Math.PI) * (party ? 2.2 : 1.1) + (i % 5) * 0.1, Math.sin(angle) * radius)
        item.rotation.set(reaction * 9 + i, reaction * 5, angle)
        item.scale.setScalar((1 - reaction) * (party ? 1.8 : 1))
      })
      trail.forEach((item, i) => {
        item.visible = !presenting
        const size = (12 - i) * 0.006
        item.position.set(whale.group.position.x + Math.sin(t * 2 - i * 0.3) * 0.1, whale.group.position.y - i * 0.015, whale.group.position.z - 1 - i * 0.13)
        item.scale.setScalar(size)
      })
      for (let i = 0; i < 26; i++) {
        const phase = t * 0.3 + i * 1.7
        instance.position.set(Math.cos(i * 2.4) * (3 + i % 6), 0.5 + ((phase * 0.6) % 4.8), Math.sin(i * 2.4) * (3 + i % 6))
        instance.scale.setScalar((0.055 + (i % 3) * 0.025)*(1+pulse*.5)); instance.updateMatrix(); bubbles.setMatrixAt(i, instance.matrix)
      }
      bubbles.instanceMatrix.needsUpdate = true
      renderer.render(scene, camera); recordFrame(now)
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect()
      container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave)
      container.removeEventListener('pointerdown', down); container.removeEventListener('pointerup', up); container.removeEventListener('pointercancel', cancel)
      container.removeEventListener('wheel', wheel)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      if (!world.parent) scene.add(world)
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          geometries.add(object.geometry)
          for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
            materials.add(mat)
            if ('map' in mat && mat.map instanceof THREE.Texture) textures.add(mat.map)
          }
        }
      })
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose())
      Object.values(whale.textures).forEach(texture=>texture.dispose())
      environmentTarget.dispose(); sun.shadow.map?.dispose(); sun.shadow.mapPass?.dispose()
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  return <>
    <div className="story-canvas story-interactive-canvas" ref={host} aria-hidden="true" />
    {new URLSearchParams(location.search).has('perf') && <output className="story-perf" ref={meter} aria-label="렌더링 성능" />}
    {failed ? <div className="story-fallback" role="status"><strong>3D 화면을 열 수 없어요.</strong><p>브라우저의 그래픽 가속을 켜고 새로고침해 주세요.<br />아래 장면 버튼으로 소개 글은 계속 볼 수 있어요.</p><button onClick={() => window.location.reload()}>새로고침</button></div>
      : <div className="story-view-controls" aria-label="바다 시점 조절" onClick={() => latest.current.onViewChange()}><button aria-label="왼쪽으로 둘러보기" onClick={() => { orbit.current -= 0.4 }}>↶</button><button aria-label="가까이 보기" onClick={() => { zoom.current = Math.max(0.65, zoom.current - 0.15) }}>＋</button><button onClick={() => { orbit.current = 0; zoom.current = 1; elevation.current = 0 }}>시점 초기화</button><button aria-label="멀리 보기" onClick={() => { zoom.current = Math.min(1.5, zoom.current + 0.15) }}>−</button><button aria-label="오른쪽으로 둘러보기" onClick={() => { orbit.current += 0.4 }}>↷</button></div>}
  </>
}
