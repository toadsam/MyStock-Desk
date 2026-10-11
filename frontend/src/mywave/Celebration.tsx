import belugaJump from '../assets/mywave/beluga-jump.png'

/**
 * 목표를 이룬 순간. 앱 전체에서 꽃가루가 터지는 곳은 여기 하나뿐이다.
 * 자주 터지면 아무 의미가 없어지므로, 목표 완료처럼 드문 순간에만 연다.
 */

const COLORS = ['#4fcfb0', '#51b9ff', '#1d67f2', '#ffd166', '#ff8fab']

// 렌더할 때마다 흩어지는 모양이 바뀌지 않도록 한 번만 만든다.
const PIECES = Array.from({ length: 28 }, (_, index) => ({
  left: (index * 37) % 100,
  dx: ((index * 53) % 160) - 80,
  rot: 360 + ((index * 97) % 540),
  delay: (index % 7) * 70,
  color: COLORS[index % COLORS.length],
  round: index % 3 === 0,
}))

export function Celebration({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-6" onClick={onClose}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0" aria-hidden="true">
        {PIECES.map((piece, index) => (
          <span
            key={index}
            className={`confetti-piece absolute top-0 block h-3 w-2 ${piece.round ? 'rounded-full' : 'rounded-[2px]'}`}
            style={{
              left: `${piece.left}%`,
              background: piece.color,
              animationDelay: `${piece.delay}ms`,
              ['--dx' as string]: `${piece.dx}px`,
              ['--rot' as string]: `${piece.rot}deg`,
            }}
          />
        ))}
      </div>
      <div className="bubble-pop relative w-full max-w-[360px] rounded-[28px] bg-white px-6 pb-6 pt-4 text-center" onClick={(event) => event.stopPropagation()}>
        <img src={belugaJump} alt="" className="beluga-hop mx-auto -mt-20 h-40 w-40 object-contain drop-shadow-[0_14px_20px_rgba(10,40,140,.3)]" />
        <h2 className="wave-jua mt-1 text-[24px] text-slate-900">{title}</h2>
        <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600">{message}</p>
        <button autoFocus onClick={onClose} className="pressable mt-5 h-12 w-full rounded-full bg-blue-700 text-[15px] font-bold text-white">
          고마워, 벨루가
        </button>
      </div>
    </div>
  )
}
