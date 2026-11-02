import { useId } from 'react'

type Slice = { value: number; color: string; label: string }
const point = (angle: number, radius: number) => [90 + Math.cos(angle) * radius, 75 + Math.sin(angle) * radius * .66]

function sector(start: number, end: number) {
  const outerStart = point(start, 73), outerEnd = point(end, 73)
  const innerEnd = point(end, 43), innerStart = point(start, 43)
  const large = end - start > Math.PI ? 1 : 0
  return `M${outerStart} A73,48.18 0 ${large} 1 ${outerEnd} L${innerEnd} A43,28.38 0 ${large} 0 ${innerStart} Z`
}

/** Extruded vector geometry: stacked side walls, elliptical top faces and a recessed centre. */
export default function ReliefChart({ slices, value, label, selected = -1 }: { slices: Slice[]; value: string; label: string; selected?: number }) {
  const id = useId().replace(/:/g, '')
  // 조각마다 앞 조각의 끝 각도에서 시작한다. 렌더 중에 바깥 변수를 고치지 않으려고 누적으로 만든다.
  const sections = slices.filter(slice => slice.value > 0).reduce<{ list: (Slice & { start: number; end: number; middle: number })[]; angle: number }>((acc, slice) => {
    const start = acc.angle
    const end = start + Math.min(slice.value, 99.9999) / 100 * Math.PI * 2
    return { list: [...acc.list, { ...slice, start, end, middle: (start + end) / 2 }], angle: end }
  }, { list: [], angle: -Math.PI / 2 }).list
  return <div className="story-relief-chart" role="img" aria-label={`${label}: ${value}. ${slices.map(slice => `${slice.label} ${Number(slice.value.toFixed(1))}%`).join(', ')}`}>
    <svg viewBox="0 0 180 164" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2=".3" y2="1"><stop stopColor="#fff" stopOpacity=".48"/><stop offset=".5" stopColor="#fff" stopOpacity=".04"/><stop offset="1" stopColor="#102956" stopOpacity=".2"/></linearGradient>
        <radialGradient id={`${id}-shadow`}><stop stopColor="#274b83" stopOpacity=".3"/><stop offset="1" stopColor="#274b83" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="94" cy="115" rx="80" ry="35" fill={`url(#${id}-shadow)`}/>
    </svg>
    {sections.map((slice, index) => <span className="story-chart-piece" key={slice.label}><svg viewBox="0 0 180 164" aria-hidden="true"><g className="story-relief-slice" style={{ transform: selected === index ? `translate(${Math.cos(slice.middle)*7}px, ${Math.sin(slice.middle)*4-7}px)` : 'translate(0px, 0px)' }}>
        {[16,12,8,4].map(depth=><path key={depth} d={sector(slice.start,slice.end)} transform={`translate(0 ${depth})`} fill={slice.color} style={{filter:'brightness(.66)'}}/>)}
        <path d={sector(slice.start,slice.end)} fill={slice.color}/>
        <path d={sector(slice.start,slice.end)} fill={`url(#${id}-shine)`} stroke="#fff" strokeOpacity=".45" strokeWidth=".8"/>
      </g></svg></span>)}
    <span className="story-chart-labels"><svg viewBox="0 0 180 164" aria-hidden="true">
      <text x="90" y="77" textAnchor="middle" className="story-relief-value">{value}</text>
      <text x="90" y="93" textAnchor="middle" className="story-relief-label">{label}</text>
    </svg></span>
  </div>
}
