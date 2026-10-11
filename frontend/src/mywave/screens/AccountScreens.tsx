import {
  Bell,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  LogOut,
  MessageCircle,
  Save,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { won } from '../format'
import { Card, Field } from '../uiKit'
import {
  createMyWaveAccount,
  deleteMyWaveAccount,
  deleteMyWaveNotification,
  deleteReadMyWaveNotifications,
  getMyWaveAccounts,
  getMyWaveAssetSummary,
  getMyWaveMember,
  getMyWaveNotifications,
  markAllMyWaveNotificationsRead,
  markMyWaveNotificationRead,
  searchMyWave,
  saveMyWaveMonthlyBudget,
  updateMyWaveAccount,
  updateMyWaveMembership,
  changeMyWavePassword,
  logoutMyWaveSession,
  updateMyWaveProfile,
  type MyWaveFinancialAccountResponse,
  type MyWaveMemberResponse,
  type MyWaveMonthlyBudgetResponse,
  type MyWaveNotificationResponse,
  type MyWaveSearchResultResponse,
} from '../myWaveApi'
import { useAuth } from '../../auth/useAuth'
import { MiniStat, MobileTitle } from '../components'
import { useMyWaveData } from '../runtime'
import { toneBg } from '../format'

export function NotificationsPage() {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState('전체')
  const [items, setItems] = useState<MyWaveNotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let ignore = false
    getMyWaveNotifications(selectedFilter).then((summary) => {
      if (ignore) return
      setItems(summary.notifications)
      setUnreadCount(summary.unreadCount)
    }).catch(() => {
      if (ignore) return
      setItems([])
      setUnreadCount(0)
    })
    return () => {
      ignore = true
    }
  }, [selectedFilter])

  async function openNotification(item: MyWaveNotificationResponse) {
    setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice))
    setUnreadCount((current) => Math.max(0, current - (item.read ? 0 : 1)))
    try {
      await markMyWaveNotificationRead(item.id)
    } catch {
      // 화면 이동은 유지합니다.
    }
    navigate(item.targetPath)
  }

  async function removeNotification(id: number) {
    setItems((current) => current.filter((notice) => notice.id !== id))
    try {
      await deleteMyWaveNotification(id)
    } catch {
      // 백엔드가 꺼져 있어도 UI 삭제 흐름은 유지합니다.
    }
  }

  async function clearReadNotifications() {
    setItems((current) => current.filter((notice) => !notice.read))
    try {
      await deleteReadMyWaveNotifications()
    } catch {
      // 백엔드가 꺼져 있어도 UI 정리 흐름은 유지합니다.
    }
  }

  async function markAllRead() {
    setItems((current) => current.map((notice) => ({ ...notice, read: true })))
    setUnreadCount(0)
    try {
      await markAllMyWaveNotificationsRead()
    } catch {
      // 백엔드가 꺼져 있어도 UI 읽음 흐름은 유지합니다.
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <MobileTitle title="알림" />
        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={markAllRead} className="pressable rounded-full px-4 py-2 text-sm font-black text-blue-700">전체 읽음 {unreadCount > 0 ? unreadCount : ''}</button>
          <button onClick={clearReadNotifications} className="pressable flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-slate-600">
          <Trash2 className="h-4 w-4" /> 읽은 알림 정리
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', '목표', '소비', '투자', 'AI 코치', '이벤트'].map((filter, index) => (
          <button key={filter} onClick={() => setSelectedFilter(filter)} className={`shrink-0 rounded-full px-5 py-3 text-sm font-black ${selectedFilter === filter ? 'bg-blue-700 text-white shadow-blue' : 'bg-slate-100 text-slate-500'}`}>
            {index === 0 && <SlidersHorizontal className="mr-1 inline h-4 w-4" />}
            {filter}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-blue-700" />
              <div className="mt-4 text-xl font-black">새 알림이 없습니다</div>
              <p className="mt-2 text-sm font-bold text-slate-500">새로운 흐름이 생기면 이곳에 보여드릴게요.</p>
            </div>
          </Card>
        ) : items.map((item) => {
          const Icon = notificationIcon(item.category, item.title)
          return (
            <Card key={item.id} className="motion-card">
              <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${toneBg(item.tone)}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <button onClick={() => openNotification(item)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-black">{item.title}</div>
                    <div className="shrink-0 text-xs font-bold text-slate-400">{relativeTime(item.createdAt)}</div>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{item.body}</p>
                  <div className="mt-3 text-sm font-black text-blue-700">{item.read ? '다시 보기' : '새 알림'} <ChevronRight className="inline h-4 w-4" /></div>
                </button>
                <button onClick={() => removeNotification(item.id)} className="pressable rounded-full p-2 text-slate-400 hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { financeSummary } = useMyWaveData()
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [member, setMember] = useState<MyWaveMemberResponse | null>(null)
  const [profileName, setProfileName] = useState(auth.member?.name ?? '')
  const [profileEmail, setProfileEmail] = useState(auth.member?.email ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [logoutSaving, setLogoutSaving] = useState(false)
  const [accountCount, setAccountCount] = useState<number | null>(null)

  useEffect(() => {
    let live = true
    getMyWaveAccounts()
      .then((accounts) => { if (live) setAccountCount(accounts.length) })
      .catch(() => { if (live) setAccountCount(null) })
    return () => { live = false }
  }, [])
  const rows = [
    { icon: UserRound, title: '계정 설정', detail: '프로필, 이메일, 비밀번호 변경', to: '/profile' },
    { icon: Bell, title: '알림 설정', detail: '푸시 알림 및 이메일 알림 관리', to: '/notifications' },
    { icon: WalletCards, title: '연결 계좌 관리', detail: '계좌 연결 및 갱신', to: '/assets' },
    { icon: ShieldAlert, title: '보안 설정', detail: '2단계 인증, 로그인 관리', to: '/profile' },
    { icon: MessageCircle, title: 'AI 설정', detail: '투자 성향 및 리포트 설정', to: '/coach' },
    { icon: CircleHelp, title: '도움말', detail: 'FAQ 및 고객센터', to: '/onboarding' },
  ]

  function syncAuthMember(updated: MyWaveMemberResponse) {
    auth.updateMember({
      id: auth.member?.id ?? updated.id,
      name: updated.name,
      email: updated.email,
      profileImageUrl: updated.profileImageUrl ?? auth.member?.profileImageUrl ?? '',
      membershipGrade: updated.membershipGrade ?? auth.member?.membershipGrade ?? 'Wave 사용자',
      createdAt: auth.member?.createdAt ?? new Date().toISOString(),
    })
  }

  async function toggleMembership() {
    const open = !membershipOpen
    setMembershipOpen(open)
    try {
      const updated = await updateMyWaveMembership(open ? '프리미엄' : 'Wave 사용자')
      setMember(updated)
      syncAuthMember(updated)
    } catch {
      // 백엔드가 꺼져 있어도 멤버십 패널 흐름은 유지합니다.
    }
  }

  async function saveProfile() {
    const name = profileName.trim()
    const email = profileEmail.trim()
    if (!name || !email) {
      setProfileMessage('이름과 이메일을 모두 입력해주세요.')
      return
    }
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const updated = await updateMyWaveProfile({
        name,
        email,
        profileImageUrl: member?.profileImageUrl ?? auth.member?.profileImageUrl,
      })
      setMember(updated)
      setProfileName(updated.name)
      setProfileEmail(updated.email)
      syncAuthMember(updated)
      setProfileMessage('프로필이 저장되었습니다.')
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword() {
    if (newPassword.length < 8) {
      setPasswordMessage('새 비밀번호는 8자 이상이어야 합니다.')
      return
    }
    setPasswordSaving(true)
    setPasswordMessage('')
    try {
      await changeMyWavePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage('비밀번호가 변경되었습니다.')
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleLogout() {
    setLogoutSaving(true)
    try {
      await logoutMyWaveSession()
    } catch {
      // 서버 세션 만료 상태여도 로컬 인증 정보는 정리합니다.
    } finally {
      auth.logout()
      navigate('/login', { replace: true })
    }
  }

  useEffect(() => {
    let ignore = false
    getMyWaveMember().then((profile) => {
      if (!ignore) {
        setMember(profile)
        setProfileName(profile.name)
        setProfileEmail(profile.email)
      }
    }).catch(() => {
      if (!ignore) {
        setMember(null)
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <MobileTitle title="마이" />
      <Card>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-blue-100 to-blue-50">
            <UserRound className="h-11 w-11 fill-blue-500 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{member?.name ?? auth.member?.name ?? ''}</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{member?.membershipGrade ?? 'Wave 사용자'}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-500">{member?.email ?? auth.member?.email ?? ''}</p>
          </div>
          <ChevronRight className="h-6 w-6 text-slate-400" />
        </div>
        <div className="mt-6 rounded-[20px] bg-blue-700 p-5 text-white">
          <div className="text-lg font-black">MyWave 프리미엄</div>
          <p className="mt-2 text-sm font-bold text-blue-100">다양한 데이터와 AI 인사이트를 무제한으로 이용해 보세요.</p>
          <button onClick={toggleMembership} className="pressable mt-4 rounded-full border border-white/35 px-4 py-2 text-sm font-black">
            {membershipOpen ? '멤버십 상세 닫기' : '멤버십 관리'} <ChevronRight className="inline h-4 w-4" />
          </button>
          {membershipOpen && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm font-bold text-blue-50">현재 플랜은 프리미엄입니다. AI 코치와 기업 분석 리포트가 활성화되어 있어요.</p>}
        </div>
      </Card>
      <Card title="계정 요약">
        <div className="grid gap-5 sm:grid-cols-3">
          <MiniStat label="등록한 계좌" value={accountCount === null ? '-' : `${accountCount}개`} change="직접 입력한 계좌" />
          <MiniStat label="총 자산" value={won(financeSummary.totalAsset)} change="계좌 + 투자" />
          <MiniStat label="저축률" value={`${financeSummary.savingRate}%`} change="이번 달" />
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="프로필 수정">
          <div className="space-y-4">
            <Field label="이름">
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="form-input" />
            </Field>
            <Field label="이메일">
              <input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} className="form-input" />
            </Field>
            {profileMessage && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{profileMessage}</p>}
            <button onClick={saveProfile} disabled={profileSaving} className="pressable h-13 w-full rounded-2xl bg-blue-700 font-black text-white shadow-blue disabled:opacity-60">
              <Save className="inline h-5 w-5" /> {profileSaving ? '저장 중' : '프로필 저장'}
            </button>
          </div>
        </Card>
        <Card title="비밀번호 변경">
          <div className="space-y-4">
            <Field label="현재 비밀번호">
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="form-input" autoComplete="current-password" />
            </Field>
            <Field label="새 비밀번호">
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="form-input" autoComplete="new-password" />
            </Field>
            {passwordMessage && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">{passwordMessage}</p>}
            <button onClick={savePassword} disabled={passwordSaving || !currentPassword || !newPassword} className="pressable h-13 w-full rounded-2xl bg-blue-50 font-black text-blue-700 disabled:opacity-50">
              <ShieldAlert className="inline h-5 w-5" /> {passwordSaving ? '변경 중' : '비밀번호 변경'}
            </button>
          </div>
        </Card>
      </div>
      <Card>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => {
            const Icon = row.icon
            return (
              <button key={row.title} onClick={() => navigate(row.to)} className="pressable flex w-full items-center gap-4 py-4 text-left">
                <Icon className="h-6 w-6 text-blue-700" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">{row.title}</span>
                  <span className="mt-1 block text-sm font-bold text-slate-500">{row.detail}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            )
          })}
        </div>
      </Card>
      <button onClick={handleLogout} disabled={logoutSaving} className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-red-500 shadow-card disabled:opacity-60">
        <LogOut className="h-5 w-5" /> {logoutSaving ? '로그아웃 중' : '로그아웃'}
      </button>
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const steps = [
    { title: '모든 금융을 하나의 흐름으로', body: '계좌, 소비, 투자, 목표를 연결해 현재 돈 상태를 한눈에 확인합니다.', icon: WalletCards },
    { title: '목표 달성 가능성을 계산해요', body: '목표 금액과 남은 기간을 기준으로 필요한 저축액과 줄일 소비를 보여줍니다.', icon: Target },
    { title: 'AI 코치가 다음 행동을 제안해요', body: '투자 추천이 아니라 판단에 필요한 정보를 쉽게 정리해줍니다.', icon: MessageCircle },
  ]
  const CurrentIcon = steps[step].icon

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
      <Card>
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-blue-50 text-blue-700">
            <CurrentIcon className="h-12 w-12" />
          </div>
          <h1 className="mt-8 text-3xl font-black tracking-[-0.04em] lg:text-5xl">{steps[step].title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-7 text-slate-500 lg:text-lg">{steps[step].body}</p>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2">
          {steps.map((item, index) => <span key={item.title} className={`h-2 rounded-full ${index === step ? 'w-8 bg-blue-700' : 'w-2 bg-slate-200'}`} />)}
        </div>
        <div className="mt-10 flex gap-3">
          <button onClick={() => step === 0 ? navigate('/') : setStep((value) => value - 1)} className="pressable h-14 flex-1 rounded-2xl font-black text-slate-600">
            이전
          </button>
          <button onClick={() => step === steps.length - 1 ? navigate('/') : setStep((value) => value + 1)} className="pressable h-14 flex-[1.4] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
            {step === steps.length - 1 ? '시작하기' : '다음'} <ChevronRight className="inline h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  )
}

export function SearchResultsPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const { goals, spendingCategories, holdings, recommendedActions } = useMyWaveData()
  const fallbackResults = useMemo(() => {
    const keyword = query.toLowerCase()
    const sources = [
      ...goals.map((item) => ({ title: item.title, detail: `목표 달성률 ${item.rate}%`, targetPath: '/goals' })),
      ...spendingCategories.map((item) => ({ title: item.name, detail: `이번 달 ${won(item.amount)} 지출`, targetPath: '/spending/detail' })),
      ...holdings.map((item) => ({ title: `${item.symbol} ${item.name}`, detail: `수익률 ${item.returnRate}%`, targetPath: `/company/${item.symbol}` })),
      ...recommendedActions.map((item) => ({ title: item.title, detail: `${won(item.saving)} 절약 가능`, targetPath: '/spending/simulation' })),
    ]
    return keyword ? sources.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(keyword)) : sources
  }, [goals, holdings, query, recommendedActions, spendingCategories])
  const [results, setResults] = useState<Array<Pick<MyWaveSearchResultResponse, 'title' | 'detail' | 'targetPath'>>>(fallbackResults)

  useEffect(() => {
    let ignore = false
    searchMyWave(query).then((items) => {
      if (!ignore) setResults(items)
    }).catch(() => {
      if (!ignore) setResults(fallbackResults)
    })
    return () => {
      ignore = true
    }
  }, [fallbackResults, query])

  return (
    <div className="space-y-5">
      <MobileTitle title="검색" />
      <Card>
        <div className="text-sm font-black text-blue-700">검색 결과</div>
        <h1 className="mt-2 text-2xl font-black">{query ? `"${query}"` : '전체 항목'}</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">목표, 소비, 투자, AI 액션을 한 번에 찾습니다.</p>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {results.map((result) => (
          <SearchResultRow key={`${result.targetPath}-${result.title}`} title={result.title} detail={result.detail} to={result.targetPath} />
        ))}
        {results.length === 0 && (
          <Card>
            <div className="py-8 text-center text-sm font-bold text-slate-500">검색 결과가 없습니다.</div>
          </Card>
        )}
      </div>
    </div>
  )
}

function SearchResultRow({ title, detail, to }: { title: string; detail: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="pressable rounded-[20px] bg-white p-5 text-left shadow-card">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Search className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black">{title}</div>
          <div className="mt-1 text-sm font-bold text-slate-500">{detail}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </button>
  )
}

type AccountFormState = {
  name: string
  accountType: string
  institutionName: string
  balance: number
  includedInAssets: boolean
}

type BudgetFormState = {
  budgetMonth: string
  incomeAmount: number
  livingBudgetAmount: number
  fixedExpenseAmount: number
  plannedSavingAmount: number
  plannedInvestmentAmount: number
}

const emptyAccountForm: AccountFormState = {
  name: '',
  accountType: 'BANK',
  institutionName: '',
  balance: 0,
  includedInAssets: true,
}

function toAccountForm(account: MyWaveFinancialAccountResponse): AccountFormState {
  return {
    name: account.name,
    accountType: account.accountType,
    institutionName: account.institutionName,
    balance: Number(account.balance),
    includedInAssets: Boolean(account.includedInAssets),
  }
}

function toBudgetForm(budget: MyWaveMonthlyBudgetResponse): BudgetFormState {
  return {
    budgetMonth: budget.budgetMonth,
    incomeAmount: Number(budget.incomeAmount),
    livingBudgetAmount: Number(budget.livingBudgetAmount),
    fixedExpenseAmount: Number(budget.fixedExpenseAmount),
    plannedSavingAmount: Number(budget.plannedSavingAmount),
    plannedInvestmentAmount: Number(budget.plannedInvestmentAmount),
  }
}

function defaultBudgetForm(): BudgetFormState {
  const now = new Date()
  return {
    budgetMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    incomeAmount: 850_000,
    livingBudgetAmount: 550_000,
    fixedExpenseAmount: 120_000,
    plannedSavingAmount: 100_000,
    plannedInvestmentAmount: 30_000,
  }
}

function accountTypeLabel(type: string) {
  const labels: Record<string, string> = {
    BANK: '입출금',
    SAVINGS: '저축',
    INVESTMENT: '증권',
    CASH: '현금',
  }
  return labels[type] ?? type
}

export function AssetDetailPage() {
  const { financeSummary, activities } = useMyWaveData()
  const [accounts, setAccounts] = useState<MyWaveFinancialAccountResponse[]>([])
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(() => defaultBudgetForm())
  const [assetMetrics, setAssetMetrics] = useState({
    totalAsset: financeSummary.totalAsset,
    accountBalance: 0,
    investmentAsset: financeSummary.totalAsset,
    monthlyExpense: financeSummary.totalSpending,
    remainingLivingBudget: financeSummary.livingBudgetLeft,
    investmentAvailableAmount: financeSummary.investableAmount,
    savingRate: financeSummary.savingRate,
  })
  const [statusMessage, setStatusMessage] = useState('')

  async function refreshAssets(month = budgetForm.budgetMonth) {
    const summary = await getMyWaveAssetSummary(month)
    setAccounts(summary.accounts)
    setBudgetForm(toBudgetForm(summary.budget))
    setAssetMetrics({
      totalAsset: Number(summary.totalAsset),
      accountBalance: Number(summary.accountBalance),
      investmentAsset: Number(summary.investmentAsset),
      monthlyExpense: Number(summary.monthlyExpense),
      remainingLivingBudget: Number(summary.remainingLivingBudget),
      investmentAvailableAmount: Number(summary.investmentAvailableAmount),
      savingRate: Number(summary.savingRate),
    })
  }

  useEffect(() => {
    let ignore = false
    getMyWaveAssetSummary().then((summary) => {
      if (ignore) return
      setAccounts(summary.accounts)
      setBudgetForm(toBudgetForm(summary.budget))
      setAssetMetrics({
        totalAsset: Number(summary.totalAsset),
        accountBalance: Number(summary.accountBalance),
        investmentAsset: Number(summary.investmentAsset),
        monthlyExpense: Number(summary.monthlyExpense),
        remainingLivingBudget: Number(summary.remainingLivingBudget),
        investmentAvailableAmount: Number(summary.investmentAvailableAmount),
        savingRate: Number(summary.savingRate),
      })
    }).catch(() => {
      if (!ignore) setStatusMessage('자산 데이터를 불러오지 못했습니다.')
    })
    return () => {
      ignore = true
    }
  }, [])

  function editAccount(account: MyWaveFinancialAccountResponse) {
    setEditingAccountId(account.id)
    setAccountForm(toAccountForm(account))
    setStatusMessage('')
  }

  function resetAccountForm() {
    setEditingAccountId(null)
    setAccountForm(emptyAccountForm)
  }

  async function saveAccount() {
    if (!accountForm.name.trim() || !accountForm.institutionName.trim()) {
      setStatusMessage('계좌명과 금융기관을 입력해주세요.')
      return
    }
    try {
      if (editingAccountId) {
        await updateMyWaveAccount(editingAccountId, accountForm)
        setStatusMessage('계좌가 수정되었습니다.')
      } else {
        await createMyWaveAccount(accountForm)
        setStatusMessage('새 계좌가 연결되었습니다.')
      }
      resetAccountForm()
      await refreshAssets()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 저장에 실패했습니다.')
    }
  }

  async function removeAccount(id: number) {
    try {
      await deleteMyWaveAccount(id)
      if (editingAccountId === id) resetAccountForm()
      setStatusMessage('계좌가 삭제되었습니다.')
      await refreshAssets()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.')
    }
  }

  async function saveBudget() {
    try {
      await saveMyWaveMonthlyBudget(budgetForm)
      setStatusMessage('이번 달 예산이 저장되었습니다.')
      await refreshAssets(budgetForm.budgetMonth)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '예산 저장에 실패했습니다.')
    }
  }

  async function loadAccountsOnly() {
    try {
      const result = await getMyWaveAccounts()
      setAccounts(result)
      setStatusMessage('계좌 목록을 새로고침했습니다.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 목록 새로고침에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="자산" />
      <Card title="이번 달 재무 상태">
        <div className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="총 자산" value={won(assetMetrics.totalAsset)} change="계좌+투자" />
          <MiniStat label="계좌 잔액" value={won(assetMetrics.accountBalance)} change={`${accounts.length}개 연결`} />
          <MiniStat label="남은 생활비" value={won(assetMetrics.remainingLivingBudget)} change={`저축률 ${assetMetrics.savingRate}%`} />
          <MiniStat label="투자 가능 금액" value={won(assetMetrics.investmentAvailableAmount)} />
        </div>
      </Card>
      {statusMessage && <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{statusMessage}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card
          title="연결 계좌"
          action={<button onClick={loadAccountsOnly} className="pressable rounded-full px-3 py-1.5 text-xs font-black text-blue-700">새로고침</button>}
        >
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <button onClick={() => editAccount(account)} className="pressable flex min-w-0 items-center gap-3 text-left">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-700">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <span className="min-w-0">
                    <span className="block text-base font-black">{account.name}</span>
                    <span className="mt-1 block text-sm font-bold text-slate-500">{account.institutionName} · {accountTypeLabel(account.accountType)} · {account.includedInAssets ? '자산 포함' : '자산 제외'}</span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
                    <div className="text-lg font-black">{won(Number(account.balance))}</div>
                    <div className="text-xs font-bold text-slate-400">ID {account.id}</div>
                  </div>
                  <button onClick={() => removeAccount(account.id)} className="pressable grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={editingAccountId ? '계좌 수정' : '새 계좌 연결'}>
          <div className="space-y-4">
            <Field label="계좌명">
              <input value={accountForm.name} onChange={(event) => setAccountForm((value) => ({ ...value, name: event.target.value }))} className="form-input" />
            </Field>
            <Field label="금융기관">
              <input value={accountForm.institutionName} onChange={(event) => setAccountForm((value) => ({ ...value, institutionName: event.target.value }))} className="form-input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="계좌 유형">
                <select value={accountForm.accountType} onChange={(event) => setAccountForm((value) => ({ ...value, accountType: event.target.value }))} className="form-input">
                  <option value="BANK">입출금</option>
                  <option value="SAVINGS">저축</option>
                  <option value="INVESTMENT">증권</option>
                  <option value="CASH">현금</option>
                </select>
              </Field>
              <Field label="잔액">
                <input type="number" value={accountForm.balance} onChange={(event) => setAccountForm((value) => ({ ...value, balance: Number(event.target.value) }))} className="form-input" />
              </Field>
            </div>
            <label className="flex items-center justify-between rounded-2xl p-4 text-sm font-black">
              총자산 계산에 포함
              <input type="checkbox" checked={accountForm.includedInAssets} onChange={(event) => setAccountForm((value) => ({ ...value, includedInAssets: event.target.checked }))} className="h-5 w-5 accent-blue-700" />
            </label>
            <div className="flex gap-3">
              {editingAccountId && <button onClick={resetAccountForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveAccount} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingAccountId ? '수정 저장' : '계좌 연결'}
              </button>
            </div>
          </div>
        </Card>
      </div>
      <Card title="월 예산 설정">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="기준 월">
            <input type="month" value={budgetForm.budgetMonth} onChange={(event) => setBudgetForm((value) => ({ ...value, budgetMonth: event.target.value }))} className="form-input" />
          </Field>
          <Field label="월 수입">
            <input type="number" value={budgetForm.incomeAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, incomeAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="생활비 예산">
            <input type="number" value={budgetForm.livingBudgetAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, livingBudgetAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="고정 지출">
            <input type="number" value={budgetForm.fixedExpenseAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, fixedExpenseAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="목표 저축액">
            <input type="number" value={budgetForm.plannedSavingAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, plannedSavingAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
          <Field label="계획 투자액">
            <input type="number" value={budgetForm.plannedInvestmentAmount} onChange={(event) => setBudgetForm((value) => ({ ...value, plannedInvestmentAmount: Number(event.target.value) }))} className="form-input" />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-500">예산 저장 후 남은 생활비와 투자 가능 금액이 다시 계산됩니다.</div>
          <button onClick={saveBudget} className="pressable rounded-2xl bg-blue-700 px-5 py-3 font-black text-white shadow-blue">
            <Save className="inline h-5 w-5" /> 예산 저장
          </button>
        </div>
      </Card>
      <Card title="최근 활동">
        <div className="divide-y divide-slate-100">
          {activities.length === 0 && <p className="py-4 text-sm font-bold text-slate-500">이번 달 기록이 아직 없어요.</p>}
          {activities.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: item.color }}><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="font-black">{item.title}</div>
                  <div className="text-sm font-bold text-slate-500">{item.detail}</div>
                </div>
                <div className={`font-black ${item.amount >= 0 ? 'text-blue-700' : 'text-slate-900'}`}>{won(item.amount)}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function notificationIcon(category: string, title: string) {
  if (category.includes('소비')) return ShieldAlert
  if (category.includes('투자') || title.includes('포트폴리오')) return BarChart3
  if (category.includes('AI')) return MessageCircle
  if (category.includes('이벤트') || title.includes('리포트')) return FileText
  return Target
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.round(hours / 24)}일 전`
}
