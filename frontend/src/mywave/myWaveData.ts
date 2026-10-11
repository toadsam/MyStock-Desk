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

/**
 * 화면이 쓰는 "숫자가 아닌 것"만 모아 둔다. 메뉴, 카테고리별 아이콘과 색, 목표 카드의 색.
 *
 * 예전에는 여기에 데모 사용자의 금액이 통째로 들어 있었고, API 가 비거나 실패하면
 * 화면이 그 숫자를 대신 그렸다. 실제 기록과 남의 숫자가 섞여 보이는 원인이었다.
 * 이제 금액은 전부 API 에서만 온다. 여기에는 숫자를 두지 않는다.
 */

type Icon = ComponentType<{ className?: string; style?: { color?: string } }>

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

const CATEGORY_STYLES: Array<{ keys: string[]; icon: Icon; color: string }> = [
  { keys: ['식비', '식사', '학식', '편의점'], icon: Utensils, color: '#2f6df6' },
  { keys: ['배달'], icon: Rocket, color: '#ff5a1f' },
  { keys: ['카페', '간식'], icon: Coffee, color: '#a58b7f' },
  { keys: ['쇼핑'], icon: ShoppingBag, color: '#7657f4' },
  { keys: ['교통', '택시', '버스'], icon: Bus, color: '#ffbd2e' },
  { keys: ['통신', '구독'], icon: CreditCard, color: '#4fcfb0' },
  { keys: ['교재', '교육', '학원'], icon: GraduationCap, color: '#0ea5e9' },
]

const OTHER_CATEGORY = { icon: ReceiptText as Icon, color: '#9ca3af' }

/** 카테고리 이름으로 아이콘과 색을 고른다. 모르는 이름이면 회색 영수증. */
export function categoryStyle(name: string) {
  return CATEGORY_STYLES.find((style) => style.keys.some((key) => name.includes(key))) ?? OTHER_CATEGORY
}

const GOAL_STYLES: Array<{ accent: string; icon: Icon }> = [
  { accent: '#2563eb', icon: Target },
  { accent: '#4fcfb0', icon: WalletCards },
  { accent: '#7c5cff', icon: BriefcaseBusiness },
  { accent: '#ff7a3d', icon: GraduationCap },
]

/** 목표 카드는 순서대로 색을 돌려 쓴다. */
export function goalStyle(index: number) {
  return GOAL_STYLES[index % GOAL_STYLES.length]
}

const ALLOCATION_COLORS = ['#2f6df6', '#ffbd2e', '#4fcfb0', '#7657f4', '#ff5a1f', '#6b7280']

export function allocationColor(name: string, index: number) {
  return name.includes('현금') ? '#6b7280' : ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
}

const ACTION_TONES = ['violet', 'green', 'orange'] as const

export function actionTone(index: number) {
  return ACTION_TONES[index % ACTION_TONES.length]
}
