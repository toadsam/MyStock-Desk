import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getStock, getStockPrices, getOrderBook } from '../api/stockApi'
import { createOrder, getExecutions, getOrders } from '../api/tradeApi'
import { LineAreaChart } from '../components/charts/LineAreaChart'
import { OrderBook } from '../components/stock/OrderBook'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { Toast } from '../components/ui/Toast'
import { mockExecutions, mockOrders, orderBook, stockBySymbol, stockPrices } from '../data/mockData'
import { useAsyncData } from '../hooks/useAsyncData'
import type { OrderMethod, OrderType } from '../types/common'
import type { TradeOrder } from '../types/trade'
import { cn } from '../utils/cn'
import { formatCompactWon, formatDateTime, formatNumber, formatPercent, formatWon, isUp } from '../utils/format'

export default function TradePage() {
  const [params] = useSearchParams()
  const initialSymbol = params.get('symbol') ?? '005930'
  const initialType = (params.get('type') as OrderType | null) ?? 'BUY'
  const [orderType, setOrderType] = useState<OrderType>(initialType)
  const [orderMethod, setOrderMethod] = useState<OrderMethod>('LIMIT')
  const [quantity, setQuantity] = useState(10)
  const [price, setPrice] = useState(78600)
  const [toast, setToast] = useState<string | null>(null)

  const { data: stock } = useAsyncData(() => getStock(initialSymbol), stockBySymbol(initialSymbol))
  const { data: prices } = useAsyncData(() => getStockPrices(initialSymbol), stockPrices(initialSymbol))
  const { data: book } = useAsyncData(() => getOrderBook(initialSymbol), orderBook(initialSymbol))
  const { data: orders, setData: setOrders } = useAsyncData(getOrders, mockOrders)
  const { data: executions } = useAsyncData(getExecutions, mockExecutions)

  const orderPrice = orderMethod === 'MARKET' ? stock.currentPrice : price
  const estimatedAmount = orderPrice * quantity
  const fee = Math.round(estimatedAmount * 0.00015)

  const submit = async () => {
    const created = await createOrder({
      symbol: stock.symbol,
      orderType,
      orderMethod,
      orderPrice,
      quantity,
    })
    setOrders([created, ...orders])
    setToast('가상 주문이 접수되었습니다.')
  }

  return (
    <div className="space-y-4">
      <Toast message={toast} onClose={() => setToast(null)} />
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-slate-500">선택 종목</div>
            <h1 className="mt-1 text-3xl font-black text-slate-50">{stock.name} <span className="text-base text-slate-500">{stock.symbol}</span></h1>
            <div className={cn('mt-2 text-2xl font-bold', isUp(stock.changeRate) ? 'text-emerald-400' : 'text-red-400')}>
              {formatNumber(stock.currentPrice)}원 {isUp(stock.changeRate) ? '▲' : '▼'} {formatPercent(stock.changeRate)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:min-w-[34rem]">
            <Info label="거래량" value={formatNumber(stock.volume)} />
            <Info label="거래대금" value={formatCompactWon(stock.tradingValue)} />
            <Info label="고가" value={formatNumber(stock.highPrice)} />
            <Info label="저가" value={formatNumber(stock.lowPrice)} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_1fr]">
        <Card title="차트">
          <LineAreaChart data={prices} height={420} showVolume />
        </Card>

        <Card title="주문 입력">
          <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950/40 p-1">
            {(['BUY', 'SELL'] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={cn(
                  'min-h-11 rounded-lg text-sm font-bold transition',
                  orderType === type && (type === 'BUY' ? 'bg-red-600/35 text-red-200' : 'bg-blue-600/35 text-blue-200'),
                  orderType !== type && 'text-slate-400',
                )}
              >
                {type === 'BUY' ? '매수' : '매도'}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Tabs
              items={[
                { label: '지정가', value: 'LIMIT' },
                { label: '시장가', value: 'MARKET' },
                { label: '조건부', value: 'CONDITIONAL' },
              ]}
              value={orderMethod}
              onChange={setOrderMethod}
              className="w-full justify-between"
            />
          </div>
          <NumberStepper label="주문수량" value={quantity} suffix="주" onChange={setQuantity} step={1} />
          <NumberStepper label="주문가격" value={orderPrice} suffix="원" onChange={setPrice} step={100} disabled={orderMethod === 'MARKET'} />
          <div className="mt-5 space-y-3 border-t border-slate-800 pt-4 text-sm">
            <Line label="예상금액" value={formatWon(estimatedAmount)} />
            <Line label="수수료" value={formatWon(fee)} />
            <Line label="주문가능" value={formatWon(4690245)} />
          </div>
          <Button variant={orderType === 'BUY' ? 'buy' : 'sell'} className="mt-5 w-full text-base" onClick={submit}>
            {orderType === 'BUY' ? '매수 주문' : '매도 주문'}
          </Button>
          <p className="mt-3 text-xs text-slate-500">주문 확인 시 거래가 실제로 체결되지 않는 가상 주문입니다.</p>
        </Card>

        <Card title="호가창">
          <OrderBook orderBook={book} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_0.8fr]">
        <OrderTable title="미체결 주문" orders={orders.filter((order) => order.status === 'PENDING')} />
        <OrderTable title="주문/체결 내역" orders={orders} />
        <Card title="최근 체결">
          <div className="space-y-3">
            {executions.slice(0, 7).map((execution) => (
              <div key={execution.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-slate-800 bg-slate-950/25 p-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-100">{execution.stock.name}</div>
                  <div className="text-xs text-slate-500">{formatDateTime(execution.executedAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-100">{formatNumber(execution.executionPrice)}</div>
                  <div className="text-xs text-slate-400">{formatNumber(execution.quantity)}주</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function NumberStepper({ label, value, suffix, step, disabled, onChange }: { label: string; value: number; suffix: string; step: number; disabled?: boolean; onChange: (value: number) => void }) {
  return (
    <div className="mt-5">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="mt-2 grid grid-cols-[3rem_1fr_3rem] overflow-hidden rounded-xl border border-slate-700 bg-slate-950/35">
        <button type="button" className="min-h-12 text-xl text-slate-300 disabled:opacity-30" disabled={disabled} onClick={() => onChange(Math.max(step, value - step))}>-</button>
        <div className="grid min-h-12 place-items-center text-lg font-bold text-slate-100">{formatNumber(value)} <span className="ml-1 text-sm text-slate-500">{suffix}</span></div>
        <button type="button" className="min-h-12 text-xl text-slate-300 disabled:opacity-30" disabled={disabled} onClick={() => onChange(value + step)}>+</button>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  )
}

function OrderTable({ title, orders }: { title: string; orders: TradeOrder[] }) {
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="compact-table text-sm">
          <thead>
            <tr>
              <th>주문시간</th>
              <th>종목명</th>
              <th>구분</th>
              <th>가격</th>
              <th>수량</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 8).map((order) => (
              <tr key={order.id}>
                <td>{formatDateTime(order.createdAt)}</td>
                <td>{order.stock.name}</td>
                <td className={order.orderType === 'BUY' ? 'text-red-400' : 'text-blue-400'}>{order.orderType === 'BUY' ? '매수' : '매도'}</td>
                <td>{formatNumber(order.orderPrice)}</td>
                <td>{formatNumber(order.quantity)}</td>
                <td>
                  <Badge tone={order.status === 'COMPLETED' ? 'green' : order.status === 'PENDING' ? 'blue' : 'slate'}>
                    {order.status === 'COMPLETED' ? '체결완료' : order.status === 'PENDING' ? '접수' : '취소'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
