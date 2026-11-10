import { useMyWaveData } from './runtime'

export type StarterStepKey = 'budget' | 'expense' | 'goal'

export type StarterStep = {
  key: StarterStepKey
  title: string
  body: string
  action: string
  done: boolean
}

/**
 * 처음 온 사람이 해 볼 세 가지와, 그중 무엇을 이미 했는지.
 *
 * 시작 안내는 기능 소개가 아니라 할 일 목록이다. 생활비를 정하고, 한 번 기록하고, 목표를 하나 만들면
 * 홈의 숫자가 전부 채워진다. 했는지는 따로 저장하지 않고 실제 기록에서 읽는다. 그래야 기록을 지우면 다시 안 한 것이 된다.
 */
export function useStarterSteps() {
  const { status, financeSummary, goals, activities } = useMyWaveData()
  const steps: StarterStep[] = [
    {
      key: 'budget',
      title: '이번 달 생활비 정하기',
      body: '하루에 써도 되는 돈을 알려 드려요.',
      action: '정하기',
      done: financeSummary.livingBudget > 0,
    },
    {
      key: 'expense',
      title: '첫 소비 기록하기',
      body: '커피 한 잔이라도 좋아요. 적은 만큼 홈의 잔이 줄어요.',
      action: '기록하기',
      done: financeSummary.totalSpending > 0 || activities.length > 0,
    },
    {
      key: 'goal',
      title: '모으고 싶은 목표 하나 만들기',
      body: '하루에 얼마씩 모으면 되는지 계산해 드려요.',
      action: '만들기',
      done: goals.length > 0,
    },
  ]
  const doneCount = steps.filter((step) => step.done).length
  return { ready: status === 'ready', steps, doneCount, allDone: doneCount === steps.length }
}
