import { useEffect, useState } from 'react'

/** 보통 걸리는 시간(초). 막대는 이 시간에 맞춰 차고, 문구도 이 시간을 말한다. */
const USUAL_SECONDS = 10
const SLOW_SECONDS = 20

/**
 * 캡처를 읽는 동안의 화면.
 *
 * 읽는 데 10초쯤 걸린다. 돌아가는 표시 하나로는 멈춘 것처럼 보여서, 세 가지를 보여 준다.
 * 방금 올린 사진(내 것을 읽고 있다는 것), 지금 무엇을 하는지, 그리고 얼마나 걸리는지.
 * 막대는 실제 진행률이 아니라 보통 걸리는 시간에 맞춘 것이라 끝까지 차지 않고 92% 에서 기다린다.
 */
export function CaptureProgress({ previewUrl }: { previewUrl: string | null }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => setSeconds((Date.now() - startedAt) / 1000), 250)
    return () => window.clearInterval(timer)
  }, [])

  const stage = seconds < 1.5 ? '사진을 올리는 중이에요' : seconds < 6 ? '글자를 읽는 중이에요' : '가게와 금액을 정리하는 중이에요'
  const percent = Math.min(92, Math.round((seconds / USUAL_SECONDS) * 90))

  return (
    <div className="flex items-center gap-4 rounded-[14px] bg-slate-100 p-4" role="status" aria-live="polite">
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
        {previewUrl && <img src={previewUrl} alt="" className="h-full w-full object-cover object-top opacity-80" />}
        {/* 사진 위를 오르내리는 선. 읽고 있다는 표시다. */}
        <span className="capture-scan absolute inset-x-0 top-0 h-8" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-slate-900">{stage}</div>
        <div className="mt-1 text-[13px] font-medium text-slate-500">
          {seconds < SLOW_SECONDS ? `보통 ${USUAL_SECONDS}초쯤 걸려요.` : '평소보다 오래 걸려요. 조금만 더 기다려 주세요.'}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" aria-hidden="true">
          <div className="h-full rounded-full bg-blue-700 transition-[width] duration-300 ease-linear" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  )
}
