import {
  BarChart3,
  BriefcaseBusiness,
  Bus,
  Coffee,
  CreditCard,
  GraduationCap,
  Home,
  MessageCircle,
  ReceiptText,
  Rocket,
  ShoppingBag,
  Target,
  Utensils,
  WalletCards,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type NavItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}

export const navItems: NavItem[] = [
  { label: '홈', path: '/', icon: Home },
  { label: '목표', path: '/goals', icon: Target },
  { label: '소비', path: '/spending', icon: ReceiptText },
  { label: '투자', path: '/portfolio', icon: BarChart3 },
  { label: '리포트', path: '/reports', icon: BriefcaseBusiness },
  { label: 'AI코치', path: '/coach', icon: MessageCircle },
]

export const mobileNavItems = navItems.filter((item) => item.path !== '/reports')

export const financeSummary = {
  userName: '김마이',
  month: '2024.05',
  goalRate: 63,
  targetAmount: 1_000_000,
  savedAmount: 630_000,
  remainingAmount: 370_000,
  daysLeft: 12,
  dailyTarget: 30_800,
  totalAsset: 24_850_000,
  livingBudgetLeft: 820_000,
  investableAmount: 530_000,
  totalSpending: 2_480_500,
  dailySpending: 80_016,
  budgetRate: 95,
  goalImpact: -6.2,
  investmentProfit: 4_200_000,
  investmentReturn: 20.3,
  yearlyReturn: 15.6,
  savingRate: 42,
}

export const goals = [
  {
    title: '다음 달까지 100만원 모으기',
    dueDate: '2024.06.01',
    status: '진행 중',
    saved: 630_000,
    target: 1_000_000,
    rate: 63,
    daysLeft: 12,
    accent: '#2563eb',
    icon: Target,
  },
  {
    title: '비상금 300만원 만들기',
    dueDate: '2024.12.31',
    status: '진행 중',
    saved: 1_350_000,
    target: 3_000_000,
    rate: 45,
    daysLeft: 78,
    accent: '#4fcfb0',
    icon: WalletCards,
  },
  {
    title: '여행 자금 150만원',
    dueDate: '2025.03.15',
    status: '진행 중',
    saved: 420_000,
    target: 1_500_000,
    rate: 28,
    daysLeft: 102,
    accent: '#7c5cff',
    icon: BriefcaseBusiness,
  },
  {
    title: '자기계발 비용 50만원',
    dueDate: '2024.09.20',
    status: '일시정지',
    saved: 300_000,
    target: 500_000,
    rate: 60,
    daysLeft: 54,
    accent: '#ff7a3d',
    icon: GraduationCap,
  },
]

export const recommendedActions = [
  { title: '카페 지출 줄이기', detail: '주 2회 줄이면', saving: 24_000, icon: Coffee, tone: 'violet' },
  { title: '대중교통 이용하기', detail: '이번 주 3회 이용하면', saving: 9_600, icon: Bus, tone: 'green' },
  { title: '구독 서비스 점검', detail: '불필요 구독 해지 시', saving: 15_000, icon: CreditCard, tone: 'orange' },
]

export const spendingCategories = [
  { name: '주거/통신', amount: 720_000, rate: 29.0, change: 2.1, icon: Home, color: '#2f6df6' },
  { name: '식비', amount: 620_000, rate: 25.0, change: 6.3, icon: Utensils, color: '#4fcfb0' },
  { name: '교통/차량', amount: 340_000, rate: 13.7, change: 1.2, icon: Bus, color: '#ffbd2e' },
  { name: '쇼핑', amount: 290_000, rate: 11.7, change: 15.2, icon: ShoppingBag, color: '#7657f4' },
  { name: '카페/간식', amount: 210_000, rate: 8.5, change: 9.1, icon: Coffee, color: '#a58b7f' },
  { name: '배달', amount: 180_000, rate: 7.3, change: 8.4, icon: Rocket, color: '#ff5a1f' },
  { name: '기타', amount: 120_500, rate: 4.8, change: -1.8, icon: ReceiptText, color: '#9ca3af' },
]

export const spendingTrend = [
  { month: '12월', amount: 1_180_000, budget: 1_500_000, goal: 420_000 },
  { month: '1월', amount: 1_860_000, budget: 1_520_000, goal: 810_000 },
  { month: '2월', amount: 1_320_000, budget: 1_520_000, goal: 480_000 },
  { month: '3월', amount: 2_130_000, budget: 1_540_000, goal: 920_000 },
  { month: '4월', amount: 2_020_000, budget: 1_540_000, goal: 640_000 },
  { month: '5월', amount: 2_480_500, budget: 1_560_000, goal: 1_120_000 },
]

export const spendingBlockers = [
  { name: '배달', amount: 180_000, impact: -1.8, icon: Rocket, color: '#ff5a1f' },
  { name: '카페/간식', amount: 210_000, impact: -1.6, icon: Coffee, color: '#a58b7f' },
  { name: '쇼핑', amount: 290_000, impact: -1.4, icon: ShoppingBag, color: '#7657f4' },
]

export const portfolioAllocation = [
  { name: '국내 주식', amount: 9_950_000, rate: 40.1, color: '#2f6df6' },
  { name: '해외 주식', amount: 6_200_000, rate: 25.0, color: '#4fcfb0' },
  { name: '채권', amount: 4_200_000, rate: 16.9, color: '#7657f4' },
  { name: 'ETF', amount: 3_300_000, rate: 13.3, color: '#ffbd2e' },
  { name: '현금', amount: 1_200_000, rate: 4.7, color: '#6b7280' },
]

export const holdings = [
  { symbol: 'AAPL', name: '애플', quantity: 10, avgPrice: '$160.21', value: 4_620_000, profit: 716_000, returnRate: 18.3 },
  { symbol: 'NVDA', name: '엔비디아', quantity: 8, avgPrice: '$704.12', value: 3_980_000, profit: 760_000, returnRate: 23.6 },
  { symbol: '005930', name: '삼성전자', quantity: 50, avgPrice: '₩68,200', value: 2_400_000, profit: 270_000, returnRate: 12.8 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', quantity: 15, avgPrice: '$404.35', value: 2_100_000, profit: 261_000, returnRate: 14.2 },
  { symbol: 'KO', name: '코카콜라', quantity: 20, avgPrice: '$58.71', value: 1_420_000, profit: 89_000, returnRate: 6.7 },
]

export const activities = [
  { title: '월급이 입금되었어요', detail: '급여 4,200,000원이 입금되었습니다.', amount: 4_200_000, when: '1시간 전', icon: WalletCards, color: '#4fcfb0' },
  { title: '카페에서 결제했어요', detail: '스타벅스 결제', amount: -5_400, when: '어제', icon: Coffee, color: '#a58b7f' },
  { title: '해외 주식에 투자했어요', detail: '애플 0.12주 매수', amount: -18_300, when: '2일 전', icon: BarChart3, color: '#2563eb' },
]

export const coachMessages = [
  {
    from: 'bot',
    text: '안녕하세요, 김마이님! 오늘 자산 흐름을 분석했어요. 어떤 부분을 도와드릴까요?',
  },
  {
    from: 'user',
    text: '이번 달 목표 달성 가능할까?',
  },
  {
    from: 'bot',
    text: '현재 추세라면 이번 달 목표 달성률을 63%에서 약 88%까지 높일 수 있어요. 추가로 32만원을 투자하지 않고 저축으로 돌리면 목표 달성 가능성이 95% 이상으로 올라가요.',
    stats: [
      { label: '현재 목표 달성률', value: '63%' },
      { label: '예상 달성률', value: '88%' },
      { label: '95% 달성까지 필요 금액', value: '₩320,000' },
    ],
    suggestions: ['이번 주 지출을 10% 줄이면 +₩120,000 여유 가능', '보유 ETF 중 수익률 상위 3개 리밸런싱 +₩200,000 투자 여력 확보'],
  },
]
