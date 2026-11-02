export type StoryAction =
  | { type: 'spend'; amount: 3000 | 3800 }
  | { type: 'save'; amount: 10000 | 50000 }
  | { type: 'select'; index: number }
  | { type: 'hello' | 'celebrate' | 'reset' }

export type DemoState = {
  spent: number
  saved: number
  records: number
  selected: number
  sequence: number
  chapter: number
  action: StoryAction['type']
}

export const initialDemo: DemoState = { spent: 6800, saved: 112000, records: 0, selected: -1, sequence: 0, chapter: -1, action: 'reset' }
export const DAILY_BUDGET = 19700
export const GOAL = 300000
export const portions = [46, 32, 22]
export const money = (value: number) => Math.round(value).toLocaleString('ko-KR')
export const remaining = (demo: DemoState) => Math.max(0, DAILY_BUDGET - demo.spent)

export function applyAction(demo: DemoState, action: StoryAction, chapter: number): DemoState {
  const next = { ...demo, sequence: demo.sequence + 1, chapter, action: action.type }
  switch (action.type) {
    case 'reset': return { ...initialDemo, sequence: next.sequence, chapter }
    case 'spend': return { ...next, spent: demo.spent + action.amount, records: demo.records + 1 }
    case 'save': return { ...next, saved: Math.min(GOAL, demo.saved + action.amount) }
    case 'select': return { ...next, selected: Math.max(0, Math.min(2, Math.floor(action.index))) }
    default: return next
  }
}

export function responseLine(demo: DemoState) {
  switch (demo.action) {
    case 'spend': return demo.spent > DAILY_BUDGET ? `오늘 예산보다 ${money(demo.spent - DAILY_BUDGET)}원 더 썼어요. 남은 돈은 0원으로 보여줘요.` : `기록 완료! 잔에 ${money(remaining(demo))}원이 남았어요. 같은 기록이 오늘의 숫자를 바꿔요.`
    case 'save': return demo.saved === GOAL ? '30만원을 모두 채웠어요! 작은 저축들이 모여 목표를 완성했네요!' : `${money(demo.saved)}원을 모았어요! 목표까지 ${(demo.saved / GOAL * 100).toFixed(1)}%, 저금통도 함께 채워져요.`
    case 'select': return `예시 종목 ${'ABC'[demo.selected]}는 전체의 ${portions[demo.selected]}%예요. 조각을 나눠 보면 어디에 얼마나 담겼는지 알 수 있어요.`
    case 'hello': return '반가워요! 제가 움직이는 곳을 따라와 보세요. 잔과 저금통도 직접 누를 수 있어요!'
    case 'celebrate': return `오늘 ${demo.records}번 기록하고, ${money(demo.saved - initialDemo.saved)}원을 더 모아 봤어요. 작은 변화가 모이면 나의 물결이 돼요!`
    default: return '체험을 처음으로 돌렸어요. 다시 눌러서 변화를 만들어 보세요!'
  }
}
