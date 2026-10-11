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

// 데모 페르소나: 알바비 + 용돈으로 한 달을 간당간당하게 버티는 대학생
// - 월 수입 85만원 (편의점 알바 55만 + 용돈 30만)
// - 생활비 예산 55만 / 고정비 12만 / 저축 10만 / 투자 3만
// - 총자산 97만원 = 통장 51.96만 + 소액 투자 45.09만
export const financeSummary = {
  userName: '김마이',
  month: '2024.05',
  goalRate: 37,
  targetAmount: 300_000,
  savedAmount: 112_000,
  remainingAmount: 188_000,
  daysLeft: 12,
  dailyTarget: 15_700,
  totalAsset: 970_500,
  livingBudgetLeft: 57_600,
  investableAmount: 37_600,
  totalSpending: 612_400,
  dailySpending: 34_000,
  budgetRate: 91,
  goalImpact: -3.4,
  investmentProfit: 25_360,
  investmentReturn: 6.3,
  yearlyReturn: 4.8,
  savingRate: 12,
}

export const goals = [
  {
    title: '다음 달까지 30만원 모으기',
    dueDate: '2024.06.01',
    status: '진행 중',
    saved: 112_000,
    target: 300_000,
    rate: 37,
    daysLeft: 12,
    accent: '#2563eb',
    icon: Target,
  },
  {
    title: '비상금 50만원 만들기',
    dueDate: '2024.08.07',
    status: '진행 중',
    saved: 350_000,
    target: 500_000,
    rate: 70,
    daysLeft: 78,
    accent: '#4fcfb0',
    icon: WalletCards,
  },
  {
    title: '여름방학 여행비 40만원',
    dueDate: '2024.08.31',
    status: '진행 중',
    saved: 85_000,
    target: 400_000,
    rate: 21,
    daysLeft: 102,
    accent: '#7c5cff',
    icon: BriefcaseBusiness,
  },
  {
    title: '토익 응시료·교재 12만원',
    dueDate: '2024.07.13',
    status: '일시정지',
    saved: 48_000,
    target: 120_000,
    rate: 40,
    daysLeft: 54,
    accent: '#ff7a3d',
    icon: GraduationCap,
  },
]

export const recommendedActions = [
  { title: '카페 지출 줄이기', detail: '주 2회만 줄여도', saving: 12_000, icon: Coffee, tone: 'violet' },
  { title: '택시 대신 버스 타기', detail: '이번 주 2회만 바꿔도', saving: 9_000, icon: Bus, tone: 'green' },
  { title: '구독 서비스 점검', detail: '안 쓰는 구독 1개 해지 시', saving: 9_900, icon: CreditCard, tone: 'orange' },
]

export const spendingCategories = [
  { name: '식비', amount: 186_000, rate: 30.4, change: 4.2, icon: Utensils, color: '#2f6df6' },
  { name: '배달', amount: 98_500, rate: 16.1, change: 12.8, icon: Rocket, color: '#ff5a1f' },
  { name: '카페/간식', amount: 74_200, rate: 12.1, change: 9.1, icon: Coffee, color: '#a58b7f' },
  { name: '쇼핑', amount: 68_000, rate: 11.1, change: -6.5, icon: ShoppingBag, color: '#7657f4' },
  { name: '교통', amount: 62_000, rate: 10.1, change: 0.8, icon: Bus, color: '#ffbd2e' },
  { name: '통신/구독', amount: 52_900, rate: 8.6, change: 0.0, icon: CreditCard, color: '#4fcfb0' },
  { name: '교재/기타', amount: 70_800, rate: 11.6, change: 18.4, icon: ReceiptText, color: '#9ca3af' },
]

export const spendingTrend = [
  { month: '12월', amount: 585_000, budget: 640_000, goal: 80_000 },
  { month: '1월', amount: 712_000, budget: 650_000, goal: 20_000 },
  { month: '2월', amount: 498_000, budget: 650_000, goal: 150_000 },
  { month: '3월', amount: 688_000, budget: 670_000, goal: 40_000 },
  { month: '4월', amount: 592_000, budget: 670_000, goal: 60_000 },
  { month: '5월', amount: 612_400, budget: 670_000, goal: 112_000 },
]

export const spendingBlockers = [
  { name: '배달', amount: 98_500, impact: -1.2, icon: Rocket, color: '#ff5a1f' },
  { name: '카페/간식', amount: 74_200, impact: -0.9, icon: Coffee, color: '#a58b7f' },
  { name: '쇼핑', amount: 68_000, impact: -0.8, icon: ShoppingBag, color: '#7657f4' },
]

export const portfolioAllocation = [
  { name: '국내 주식', amount: 326_100, rate: 72.4, color: '#2f6df6' },
  { name: 'ETF', amount: 101_200, rate: 22.4, color: '#ffbd2e' },
  { name: '현금', amount: 23_600, rate: 5.2, color: '#6b7280' },
]

export const holdings = [
  { symbol: '005930', name: '삼성전자', quantity: 3, avgPrice: '₩73,700', value: 235_800, profit: 14_800, returnRate: 6.7 },
  { symbol: '360750', name: 'TIGER 미국S&P500', quantity: 8, avgPrice: '₩12,243', value: 101_200, profit: 3_260, returnRate: 3.3 },
  { symbol: '035720', name: '카카오', quantity: 2, avgPrice: '₩41,500', value: 90_300, profit: 7_300, returnRate: 8.8 },
]

export const activities = [
  { title: '알바비가 입금되었어요', detail: '편의점 알바 급여 552,000원이 입금되었습니다.', amount: 552_000, when: '1시간 전', icon: WalletCards, color: '#4fcfb0' },
  { title: '카페에서 결제했어요', detail: '학교 앞 카페 결제', amount: -4_500, when: '어제', icon: Coffee, color: '#a58b7f' },
  { title: 'ETF에 투자했어요', detail: 'TIGER 미국S&P500 1주 매수', amount: -12_650, when: '2일 전', icon: BarChart3, color: '#2563eb' },
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
    text: '현재 추세라면 이번 달 목표 달성률을 37%에서 약 68%까지 높일 수 있어요. 배달을 주 1회로 줄이고 남는 5만 8천원을 저축으로 돌리면 목표 달성 가능성이 90% 이상으로 올라가요.',
    stats: [
      { label: '현재 목표 달성률', value: '37%' },
      { label: '예상 달성률', value: '68%' },
      { label: '90% 달성까지 필요 금액', value: '₩58,000' },
    ],
    suggestions: ['이번 주 배달을 2번만 참으면 +₩24,000 여유 가능', '카페 대신 텀블러·학교 정수기로 +₩15,000 저축 가능'],
  },
]
