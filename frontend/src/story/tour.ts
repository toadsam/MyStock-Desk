import type { StoryAction } from './interaction'

export const TOUR_TAP_TIME = 6.8
export const tourActions: ReadonlyArray<StoryAction> = [
  { type: 'hello' }, { type: 'spend', amount: 3000 }, { type: 'spend', amount: 3000 },
  { type: 'save', amount: 50000 }, { type: 'select', index: 1 }, { type: 'celebrate' },
]
export const tourTargets = ['home', 'coffee', 'coffee', 'save', 'allocation', 'finish'] as const
export const tourHints = ['이 화면이 나의 재무 데스크예요.', '이 커피 버튼을 눌러볼게요!', '한 번 누르면, 바로 기록돼요.', '목표에 5만원을 더해볼게요!', '이 자산을 펼쳐볼까요?', '작은 기록들이 이렇게 모였어요!'] as const
