import { HelpCircle } from 'lucide-react'

const glossary: Record<string, { title: string; description: string; check: string }> = {
  PER: {
    title: 'PER',
    description: '회사 이익 대비 주가가 비싼지 보는 지표입니다. 같은 업종끼리 비교해야 의미가 있습니다.',
    check: '너무 높거나 낮다면 왜 그런지 실적 전망과 함께 확인하세요.',
  },
  PBR: {
    title: 'PBR',
    description: '회사 순자산 대비 주가 수준을 보는 지표입니다. 제조업, 금융업처럼 자산이 중요한 업종에서 자주 봅니다.',
    check: '낮다고 무조건 싼 것은 아니며, 수익성이 나빠진 이유가 있는지 봐야 합니다.',
  },
  ROE: {
    title: 'ROE',
    description: '회사가 자기자본으로 얼마나 효율적으로 이익을 내는지 보여줍니다.',
    check: '꾸준히 높게 유지되는지, 일회성 이익은 아닌지 확인하세요.',
  },
  영업이익률: {
    title: '영업이익률',
    description: '매출에서 영업이익이 얼마나 남는지 보는 지표입니다. 본업 경쟁력을 살필 때 유용합니다.',
    check: '매출 증가와 함께 이익률도 개선되는지 확인하세요.',
  },
  배당수익률: {
    title: '배당수익률',
    description: '현재 주가 대비 배당금 비율입니다. 현금흐름을 중시하는 투자자가 봅니다.',
    check: '배당이 꾸준한지, 실적이 배당을 감당할 수 있는지 확인하세요.',
  },
  평균매수가: {
    title: '평균 매수가',
    description: '여러 번 매수했을 때 1주를 평균 얼마에 산 것인지 나타냅니다.',
    check: '추가 매수 전 평균가보다 투자 이유가 더 중요합니다.',
  },
  실현손익: {
    title: '실현손익',
    description: '매도해서 실제로 확정된 이익이나 손실입니다.',
    check: '수수료와 세금까지 반영해야 실제 결과에 가깝습니다.',
  },
}

export function GlossaryTip({ term }: { term: keyof typeof glossary }) {
  const item = glossary[term]
  return (
    <span className="group relative inline-flex align-middle">
      <HelpCircle className="ml-1 h-3.5 w-3.5 text-slate-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-left shadow-xl group-hover:block">
        <span className="block text-sm font-bold text-slate-100">{item.title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
        <span className="mt-2 block text-xs leading-5 text-sky-300">{item.check}</span>
      </span>
    </span>
  )
}
