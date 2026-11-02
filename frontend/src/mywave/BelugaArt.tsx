import { useEffect, useId, useRef } from 'react'
import belugaArms from '../assets/mywave/beluga-arms.png'
import belugaAvatar from '../assets/mywave/beluga-avatar.png'
import belugaJump from '../assets/mywave/beluga-jump.png'
import belugaPhone from '../assets/mywave/beluga-phone.png'
import belugaPoint from '../assets/mywave/beluga-point.webp'
import belugaSleep from '../assets/mywave/beluga-sleep.webp'
import belugaSurprise from '../assets/mywave/beluga-surprise.webp'
import belugaSwim from '../assets/mywave/beluga-swim.webp'
import belugaThink from '../assets/mywave/beluga-think.webp'
import belugaTrophy from '../assets/mywave/beluga-trophy.webp'
import { watchGaze } from './gaze'

/**
 * 벨루가 원화 + 살아 있는 부분들.
 *
 * 그림은 원화 그대로다. 직접 그린 SVG 벨루가는 원화의 입체감을 따라가지 못했다.
 * 대신 원화를 SVG 안에 <image> 로 올리고, 그 위와 사이에 움직이는 조각을 끼운다.
 *  - 눈동자: 원래 눈 위에 살색 원을 덮고 새 눈동자를 그려, 커서(또는 관심 가는 곳)를 따라가게 한다.
 *  - 눈꺼풀: 뜬 눈 위에 살색 타원 하나. 가끔 감는다.
 *  - 꼬리: 같은 원화를 한 장 더 올리고 꼬리만 오려내어 뿌리를 축으로 살랑인다.
 *    몸 쪽 그림은 꼬리 자리를 조금 작게 파 두어, 흔들릴 때 이음새 밑에 같은 그림이 깔려 있다.
 * 좌표가 원화 픽셀 기준이라 어떤 크기로 보여도 자리가 어긋나지 않는다.
 * 모든 그림은 오른쪽을 본다. 왼쪽으로 갈 때는 쓰는 쪽에서 뒤집는다.
 *
 * 표정은 열 가지다. Beluga.tsx 의 규칙(숫자 말 안 하기, 나쁜 소식에 귀엽지 않기)은 그대로다.
 *  - hello    손을 흔들며 뛰어오르는 벨루가 — 인사, 기록 완료
 *  - cheer    휴대폰을 들고 물보라를 일으키는 벨루가 — 좋은 소식
 *  - calm     동그란 프로필 — 대화, 안내 (꼬리가 안 보인다)
 *  - concern  팔짱 끼고 윙크하는 벨루가 — 예산 초과 같은 소식
 *  - point    지느러미로 옆을 가리키는 벨루가 — 숫자를 소개하는 히어로
 *  - think    턱에 지느러미를 대고 생각하는 벨루가 — 코치가 답을 만드는 동안
 *  - surprise 눈이 동그래진 벨루가 — 잠에서 깰 때, 예산을 넘긴 순간
 *  - trophy   트로피를 든 벨루가 — 목표 달성
 *  - swim     옆으로 헤엄치는 벨루가 — 카드 뒤를 다닐 때
 *  - sleep    눈을 감고 웅크린 벨루가 — 1분 넘게 가만히 있을 때
 */
export type BelugaMood = 'hello' | 'calm' | 'cheer' | 'concern' | 'point' | 'think' | 'surprise' | 'trophy' | 'swim' | 'sleep'

type Eye = {
  x: number
  y: number
  r: number
  /** 눈 둘레 피부색. 그림에서 재 두어 덮개 원이 티 나지 않는다. */
  skin: string
}

type Tail = {
  /** 꼬리 그림을 오려내는 다각형. 몸 안쪽까지 조금 들어간다. */
  clip: string
  /** 몸 그림에서 파내는 다각형. 꼬리보다 조금 작아서 이음새 밑에 그림이 남는다. */
  hole: string
  /** 흔들리는 축. 꼬리 뿌리가 몸에 닿는 곳. */
  pivot: { x: number; y: number }
}

type Art = {
  src: string
  width: number
  height: number
  /** 뜬 눈들. 감은 그림(sleep)은 비어 있다. */
  eyes: Eye[]
  tail?: Tail
  /** z 가 떠오르는 자리. 없으면 첫 눈에서 잡는다. */
  zz?: { x: number; y: number }
}

const ART: Record<BelugaMood, Art> = {
  hello: {
    src: belugaJump,
    width: 494,
    height: 520,
    eyes: [{ x: 209, y: 99, r: 13, skin: '#eae7e7' }],
    tail: {
      clip: '0,290 135,335 182,395 182,445 130,520 0,520',
      hole: '0,290 135,335 170,395 170,445 130,520 0,520',
      pivot: { x: 176, y: 420 },
    },
  },
  cheer: {
    src: belugaPhone,
    width: 520,
    height: 520,
    eyes: [{ x: 244, y: 109, r: 12, skin: '#eae6e8' }],
    tail: {
      clip: '0,265 140,295 172,345 172,385 110,435 0,435',
      hole: '0,265 140,295 160,345 160,385 110,435 0,435',
      pivot: { x: 166, y: 365 },
    },
  },
  calm: { src: belugaAvatar, width: 520, height: 520, eyes: [{ x: 207, y: 222, r: 15, skin: '#f4edeb' }] },
  concern: {
    src: belugaArms,
    width: 432,
    height: 520,
    eyes: [{ x: 108, y: 107, r: 12, skin: '#ede9e8' }],
    tail: {
      clip: '285,335 432,335 432,520 330,520 268,450 268,400',
      hole: '285,335 432,335 432,520 330,520 282,450 282,400',
      pivot: { x: 284, y: 425 },
    },
  },
  point: {
    src: belugaPoint,
    width: 1254,
    height: 1254,
    eyes: [{ x: 575, y: 263, r: 30, skin: '#edeaec' }, { x: 927, y: 365, r: 29, skin: '#eceaec' }],
    tail: {
      clip: '20,840 330,860 372,900 372,1100 320,1254 20,1254',
      hole: '20,840 330,860 352,900 352,1100 320,1254 20,1254',
      pivot: { x: 362, y: 998 },
    },
  },
  think: {
    src: belugaThink,
    width: 1254,
    height: 1254,
    eyes: [{ x: 510, y: 234, r: 30, skin: '#e9e7e9' }, { x: 835, y: 351, r: 34, skin: '#e9e8ea' }],
    tail: {
      clip: '140,800 360,880 412,920 412,1090 360,1254 140,1254',
      hole: '140,800 360,880 392,920 392,1090 360,1254 140,1254',
      pivot: { x: 402, y: 1006 },
    },
  },
  surprise: {
    src: belugaSurprise,
    width: 1254,
    height: 1254,
    eyes: [{ x: 542, y: 261, r: 32, skin: '#e8e6e7' }, { x: 930, y: 367, r: 31, skin: '#e8e6e8' }],
    tail: {
      clip: '60,775 320,845 372,930 372,1120 330,1254 60,1254',
      hole: '60,775 320,845 352,930 352,1120 330,1254 60,1254',
      pivot: { x: 362, y: 1026 },
    },
  },
  trophy: {
    src: belugaTrophy,
    width: 1254,
    height: 1254,
    eyes: [{ x: 592, y: 434, r: 26, skin: '#ede8e8' }, { x: 864, y: 524, r: 26, skin: '#ebe7e6' }],
    tail: {
      clip: '180,850 400,920 452,960 452,1120 400,1254 180,1254',
      hole: '180,850 400,920 432,960 432,1120 400,1254 180,1254',
      pivot: { x: 442, y: 1043 },
    },
  },
  swim: {
    src: belugaSwim,
    width: 1254,
    height: 1254,
    eyes: [{ x: 948, y: 494, r: 28, skin: '#e5e2e4' }],
    tail: {
      clip: '0,420 230,440 292,640 292,820 230,930 0,930',
      hole: '0,420 230,440 272,640 272,820 230,930 0,930',
      pivot: { x: 282, y: 726 },
    },
  },
  sleep: {
    src: belugaSleep,
    width: 1254,
    height: 1254,
    eyes: [],
    zz: { x: 930, y: 230 },
    tail: {
      clip: '100,735 400,825 452,890 452,1060 400,1254 100,1254',
      hole: '100,735 400,825 432,890 432,1060 400,1254 100,1254',
      pivot: { x: 442, y: 977 },
    },
  },
}

const PUPIL = '#1f2733'

/** "x,y x,y ..." 를 path 의 "M x y L x y ... Z" 로. */
function polygonPath(points: string) {
  return `M${points.split(' ').map((pair) => pair.replace(',', ' ')).join('L')}Z`
}

export function BelugaArt({
  mood = 'hello',
  className = 'h-24 w-24',
  blink = true,
  gaze = true,
  asleep = false,
  swimming = false,
  tired = false,
}: {
  mood?: BelugaMood
  className?: string
  /** 눈을 깜빡인다. 아주 작은 자리에서는 끈다. */
  blink?: boolean
  /** 눈동자가 커서를 따라간다. */
  gaze?: boolean
  /** 자는 그림으로 바꾸고 z 를 띄운다. */
  asleep?: boolean
  /** 헤엄치는 중. 꼬리를 크고 빠르게 흔든다. */
  swimming?: boolean
  /** 기운이 없다. 눈을 반쯤 감고 꼬리를 느리게 조금만 흔든다. */
  tired?: boolean
}) {
  const shown: BelugaMood = asleep ? 'sleep' : mood
  const art = ART[shown]
  const svg = useRef<SVGSVGElement>(null)
  const pupil = useRef<SVGGElement>(null)
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { eyes } = art
  const shift = eyes.length > 0 ? eyes[0].r * 0.42 : 0

  // 눈동자: 두 눈 가운데(화면 좌표)에서 보는 곳까지의 방향을 그림 좌표로 되돌려 눈동자를 민다.
  // getScreenCTM 이 뒤집힘·기울기·크기를 다 안고 있어서 풀어둔 벨루가가 거꾸로 서 있어도 맞다.
  useEffect(() => {
    if (!gaze || !blink || eyes.length === 0) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const element = svg.current
    const dot = pupil.current
    if (!element || !dot) return
    const center = {
      x: eyes.reduce((sum, eye) => sum + eye.x, 0) / eyes.length,
      y: eyes.reduce((sum, eye) => sum + eye.y, 0) / eyes.length,
    }
    const current = { x: 0, y: 0 }
    return watchGaze((target) => {
      const goal = { x: 0, y: 0 }
      const quiet = document.documentElement.dataset.liveliness === 'quiet'
      const matrix = target && !quiet ? element.getScreenCTM() : null
      if (target && matrix) {
        const at = new DOMPoint(center.x, center.y).matrixTransform(matrix)
        const dx = target.x - at.x
        const dy = target.y - at.y
        const distance = Math.hypot(dx, dy)
        if (distance > 2) {
          const strength = Math.min(1, distance / 240)
          const local = new DOMPoint(dx, dy, 0, 0).matrixTransform(matrix.inverse())
          const length = Math.hypot(local.x, local.y) || 1
          goal.x = (local.x / length) * shift * strength
          goal.y = (local.y / length) * shift * strength
        }
      }
      current.x += (goal.x - current.x) * 0.16
      current.y += (goal.y - current.y) * 0.16
      dot.setAttribute('transform', `translate(${current.x.toFixed(2)} ${current.y.toFixed(2)})`)
      return Math.abs(goal.x - current.x) + Math.abs(goal.y - current.y) > 0.05
    })
  }, [blink, eyes, gaze, shift])

  const tail = art.tail
  const zz = art.zz ?? (eyes[0] ? { x: eyes[0].x + art.width * 0.14, y: eyes[0].y - art.width * 0.06 } : null)
  const state = `${asleep ? 'art-asleep' : ''} ${swimming ? 'art-swimming' : ''} ${tired ? 'art-tired' : ''}`
  return (
    <svg ref={svg} viewBox={`0 0 ${art.width} ${art.height}`} className={`overflow-visible ${state} ${className}`} aria-hidden="true" focusable="false">
      <defs>
        {eyes.map((eye, index) => (
          <radialGradient key={index} id={`${id}-skin-${index}`}>
            <stop offset="70%" stopColor={eye.skin} />
            <stop offset="100%" stopColor={eye.skin} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {tail && (
        <defs>
          <clipPath id={`${id}-body`}>
            <path d={`M0 0H${art.width}V${art.height}H0Z ${polygonPath(tail.hole)}`} clipRule="evenodd" />
          </clipPath>
          <clipPath id={`${id}-tail`}>
            <polygon points={tail.clip} />
          </clipPath>
        </defs>
      )}
      <image href={art.src} width={art.width} height={art.height} clipPath={tail ? `url(#${id}-body)` : undefined} />
      {tail && (
        <g className="art-tail" style={{ transformOrigin: `${tail.pivot.x}px ${tail.pivot.y}px` }}>
          <image href={art.src} width={art.width} height={art.height} clipPath={`url(#${id}-tail)`} />
        </g>
      )}
      {blink && eyes.length > 0 && (
        <>
          {gaze && (
            <g className="art-eye">
              {/* 원래 눈을 덮는 원. 가장자리를 흐려 피부에 녹인다. 눈동자가 0.42r 까지 움직여도 원래 눈이 비치지 않는 크기. */}
              {eyes.map((eye, index) => <circle key={index} cx={eye.x} cy={eye.y} r={eye.r * 1.75} fill={`url(#${id}-skin-${index})`} />)}
              <g ref={pupil}>
                {eyes.map((eye, index) => (
                  <g key={index}>
                    <circle cx={eye.x} cy={eye.y} r={eye.r} fill={PUPIL} />
                    <circle cx={eye.x - eye.r * 0.32} cy={eye.y - eye.r * 0.36} r={eye.r * 0.3} fill="#ffffff" />
                  </g>
                ))}
              </g>
            </g>
          )}
          {eyes.map((eye, index) => (
            <ellipse key={index} className="art-lid" cx={eye.x} cy={eye.y - eye.r * 0.15} rx={eye.r * 1.7} ry={eye.r * 1.45} fill={eye.skin} />
          ))}
        </>
      )}
      {asleep && zz && (
        <g className="art-zz" fontFamily="Jua, sans-serif" fontWeight="700" fill="#5b7fb8">
          {[0, 1, 2].map((index) => (
            <text
              key={index}
              x={zz.x + art.width * index * 0.05}
              y={zz.y - art.width * index * 0.04}
              fontSize={art.width * (0.07 + index * 0.02)}
              style={{ animationDelay: `${index * 0.8}s` }}
            >
              z
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}
