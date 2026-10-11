import { CheckCircle2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../uiKit'
import {
  addMyWaveWatchlist,
  getMyWaveCompanyAnalysis,
  removeMyWaveWatchlist,
  type MyWaveCompanyAnalysisResponse,
} from '../myWaveApi'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MobileTitle } from '../components'
import { toneBg } from '../format'

export function CompanyDetailPage() {
  const { symbol = '' } = useParams()
  const [watched, setWatched] = useState(false)
  // 분석을 받기 전에는 아무 숫자도 그리지 않는다. 실패하면 실패했다고 말한다.
  const [loaded, setLoaded] = useState<{ symbol: string; analysis: MyWaveCompanyAnalysisResponse | null } | null>(null)

  useEffect(() => {
    let ignore = false
    getMyWaveCompanyAnalysis(symbol).then((result) => {
      if (!ignore) setLoaded({ symbol, analysis: result })
    }).catch(() => {
      if (!ignore) setLoaded({ symbol, analysis: null })
    })
    return () => {
      ignore = true
    }
  }, [symbol])

  async function toggleWatch() {
    const next = !watched
    setWatched(next)
    try {
      if (next) {
        await addMyWaveWatchlist(symbol)
      } else {
        await removeMyWaveWatchlist(symbol)
      }
    } catch {
      // 저장하지 못했으면 버튼도 되돌린다. 저장된 척하지 않는다.
      setWatched(!next)
    }
  }

  if (!loaded || loaded.symbol !== symbol) {
    return <Card><p className="text-sm font-bold text-slate-500">기업 정보를 불러오는 중이에요.</p></Card>
  }
  const analysis = loaded.analysis
  if (!analysis) {
    return (
      <Card>
        <h1 className="text-xl font-black">{symbol} 정보를 불러오지 못했어요</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">종목 코드가 맞는지, 서버가 켜져 있는지 확인해 주세요.</p>
      </Card>
    )
  }
  const company = {
    name: analysis.stock.name,
    ticker: analysis.stock.symbol,
    market: `${analysis.stock.market ?? 'MARKET'} · ${analysis.stock.industry ?? analysis.stock.sector ?? '기업'}`,
    price: formatCompanyPrice(analysis.stock.currentPrice, analysis.stock.market),
    change: `${Number(analysis.stock.changeRate ?? 0) >= 0 ? '+' : ''}${Number(analysis.stock.changeRate ?? 0).toFixed(2)}%`,
    logo: analysis.stock.name.slice(0, 1).toUpperCase(),
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="기업 분석" />
      <Card>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-[20px] bg-blue-700 text-3xl font-black text-white">{company.logo}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end gap-2">
              <h1 className="text-2xl font-black">{company.name}</h1>
              <span className="font-bold text-slate-500">{company.ticker}</span>
            </div>
            <div className="mt-2 text-sm font-bold text-slate-500">{company.market}</div>
            <div className="mt-4 text-2xl font-black">{company.price} <span className={company.change.startsWith('+') ? 'text-red-500' : 'text-blue-700'}>{company.change}</span></div>
          </div>
          <button onClick={toggleWatch} className={`pressable grid h-11 w-11 place-items-center rounded-full ${watched ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'}`}>
            <Save className="h-5 w-5" />
          </button>
        </div>
        {watched && <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-700">관심 기업에 저장되었습니다.</div>}
      </Card>
      <div className="grid gap-3 sm:grid-cols-5">
        {analysis.metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <div className={`grid h-10 w-10 place-items-center rounded-2xl ${toneBg(metric.tone)}`}><CheckCircle2 className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-black">{metric.label}</div>
            <div className="mt-2 text-xl font-black text-blue-700">{metric.value}{metric.unit}</div>
          </Card>
        ))}
      </div>
      <Card title="실적 추이">
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={analysis.performance}>
              <CartesianGrid stroke="#e8eef7" vertical={false} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area dataKey="sales" stroke="#2563eb" fill="#dbeafe" strokeWidth={3} />
              <Line dataKey="operatingProfit" stroke="#60a5fa" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="AI 요약" action="AI 코치에게 묻기" actionTo="/coach">
        <p className="text-base font-bold leading-8 text-slate-600">
          {analysis.aiSummary}
        </p>
      </Card>
    </div>
  )
}

function formatCompanyPrice(price: number, market?: string) {
  if (market?.toUpperCase().includes('NASDAQ') || market?.toUpperCase().includes('NYSE')) {
    return `$${Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
  return `${Number(price).toLocaleString('ko-KR')}원`
}
