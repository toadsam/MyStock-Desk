import {
  Bell,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  LogOut,
  Save,
  Search,
  MessageCircle,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { won } from '../format'
import { Card, ConfirmDeleteButton, Field, NumberField } from '../uiKit'
import { LivelinessPicker } from '../motion'
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
  changeMyWavePassword,
  deleteMyWaveMember,
  logoutMyWaveSession,
  updateMyWaveProfile,
  type MyWaveFinancialAccountResponse,
  type MyWaveMemberResponse,
  type MyWaveMonthlyBudgetResponse,
  type MyWaveNotificationResponse,
  type MyWaveSearchResultResponse,
} from '../myWaveApi'
import { LOGIN_NOTICE_KEY } from '../../auth/loginNotice'
import { useAuth } from '../../auth/useAuth'
import { MiniStat, MobileTitle } from '../components'
import { useMyWaveData } from '../runtime'
import { LivingBudgetSheet } from '../LivingBudgetSheet'
import { useStarterSteps, type StarterStepKey } from '../starter'
import { refreshUnreadNotifications, setUnreadNotifications, useNotificationCounts } from '../unreadNotifications'
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
      // 위쪽 종의 빨간 점도 같은 숫자를 본다.
      setUnreadNotifications(summary.unreadCount)
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
    // 읽지 않은 알림을 지웠을 수 있으니 종의 숫자를 다시 센다.
    void refreshUnreadNotifications()
  }

  async function clearReadNotifications() {
    setItems((current) => current.filter((notice) => !notice.read))
    try {
      await deleteReadMyWaveNotifications()
    } catch {
      // 백엔드가 꺼져 있어도 UI 정리 흐름은 유지합니다.
    }
    void refreshUnreadNotifications()
  }

  async function markAllRead() {
    setItems((current) => current.map((notice) => ({ ...notice, read: true })))
    setUnreadCount(0)
    setUnreadNotifications(0)
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
  // 알림이 하나도 없는 계정에는 알림 줄을 보여 주지 않는다. 헤더의 종과 같은 숫자를 본다.
  const notificationCounts = useNotificationCounts('profile')

  useEffect(() => {
    let live = true
    getMyWaveAccounts()
      .then((accounts) => { if (live) setAccountCount(accounts.length) })
      .catch(() => { if (live) setAccountCount(null) })
    return () => { live = false }
  }, [])
  // 실제로 있는 화면만 적는다. 2단계 인증, 푸시 알림, 고객센터 같은 없는 기능을 메뉴로 보여 주지 않는다.
  const rows = [
    ...(notificationCounts.total > 0 ? [{ icon: Bell, title: '알림', detail: '목표, 소비, 투자에서 온 알림 보기', to: '/notifications' }] : []),
    { icon: WalletCards, title: '계좌와 예산', detail: '직접 적은 계좌, 이번 달 생활비 예산', to: '/assets' },
    { icon: CircleHelp, title: 'MyWave 쓰는 법', detail: '소개 카드 네 장 다시 보기', to: '/welcome' },
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
      // 서버가 예전 비밀번호로 받은 토큰을 모두 버린다. 지금 쓰던 것도 포함이라, 새 비밀번호로 다시 들어오게 한다.
      // 로그아웃하면 보호된 화면이 먼저 로그인으로 돌려보내서 이동할 때 실은 state 가 사라진다. 한마디는 따로 남긴다.
      sessionStorage.setItem(LOGIN_NOTICE_KEY, '비밀번호를 바꿨어요. 새 비밀번호로 다시 로그인해 주세요.')
      auth.logout()
      navigate('/login', { replace: true })
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
        </div>
      </Card>
      <Card title="계정 요약">
        <div className="grid gap-5 sm:grid-cols-3">
          <MiniStat label="등록한 계좌" value={accountCount === null ? '-' : `${accountCount}개`} change="직접 입력한 계좌" />
          <MiniStat label="총 자산" value={won(financeSummary.totalAsset)} change="계좌 + 투자" />
          <MiniStat label="저축률" value={`${financeSummary.savingRate}%`} change="이번 달" />
        </div>
      </Card>
      <Card title="화면 활기">
        <LivelinessPicker />
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
        {member?.loginProvider === 'GOOGLE' ? (
          <Card title="로그인 방식">
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
              구글 계정으로 로그인하고 있어요. 이 계정에는 비밀번호가 없어서 바꿀 것도 없어요.
            </p>
          </Card>
        ) : (
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
        )}
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
      <button onClick={handleLogout} disabled={logoutSaving} className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-slate-700 shadow-card disabled:opacity-60">
        <LogOut className="h-5 w-5" /> {logoutSaving ? '로그아웃 중' : '로그아웃'}
      </button>
      <WithdrawalCard />
    </div>
  )
}

/**
 * 계정 삭제. 한 번 누르면 확인을 묻고, 한 번 더 눌러야 지운다.
 * 지우고 나면 로그인 화면으로 보내면서 무슨 일이 있었는지 한마디 남긴다.
 */
function WithdrawalCard() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function withdraw() {
    setBusy(true)
    setMessage('')
    try {
      await deleteMyWaveMember()
      sessionStorage.setItem(LOGIN_NOTICE_KEY, '계정과 모든 기록을 지웠어요. 그동안 써 주셔서 고마워요.')
      auth.logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '계정을 지우지 못했어요. 잠시 후 다시 시도해 주세요.')
      setBusy(false)
    }
  }

  return (
    <Card title="계정 삭제">
      <div className="space-y-4">
        <p className="text-sm font-bold leading-6 text-slate-500">
          계정과 지금까지 적은 소비, 목표, 계좌, 거래 기록이 모두 바로 지워져요. 되살릴 수 없어요.{' '}
          <Link to="/privacy" className="text-blue-700 underline underline-offset-4">받는 정보 보기</Link>
        </p>
        {message && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
        {armed ? (
          <div role="group" aria-label="계정 삭제 확인" className="space-y-3 rounded-2xl bg-red-50 p-4">
            <p className="text-sm font-black text-red-700">정말 지울까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-3">
              <button onClick={() => setArmed(false)} disabled={busy} className="pressable h-12 flex-1 rounded-2xl bg-white font-black text-slate-600 disabled:opacity-60">취소</button>
              <button onClick={withdraw} disabled={busy} className="pressable h-12 flex-[1.4] rounded-2xl bg-red-500 font-black text-white disabled:opacity-60">
                {busy ? '지우는 중' : '모두 지우고 탈퇴'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setArmed(true)} className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 font-black text-red-500">
            <Trash2 className="h-5 w-5" /> 계정 삭제
          </button>
        )}
      </div>
    </Card>
  )
}

/**
 * 시작 안내. 기능 소개가 아니라 처음 해 볼 세 가지다.
 * 한 것은 체크로 바뀐다. 생활비는 이 화면에서 바로 정하고, 나머지 둘은 그 일을 하는 화면으로 보낸다.
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const { reload } = useMyWaveData()
  const { ready, steps, doneCount, allDone } = useStarterSteps()
  const [budgetOpen, setBudgetOpen] = useState(false)

  function start(key: StarterStepKey) {
    if (key === 'budget') setBudgetOpen(true)
    else if (key === 'expense') navigate('/spending/detail', { state: { focusExpenseForm: true } })
    else navigate('/goals/new')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <MobileTitle title="시작하기" />
      <Card>
        <h2 className="text-[24px] font-black tracking-[-0.03em] text-slate-900">{allDone ? '준비가 끝났어요' : '세 가지만 하면 준비 끝'}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
          {allDone
            ? '이제 홈에서 오늘 써도 되는 돈과 목표까지 남은 금액을 볼 수 있어요.'
            : 'MyWave는 직접 적은 숫자로 계산해요. 은행이나 카드사에 연결하지 않아요.'}
        </p>
        {ready && <p className="mt-4 text-sm font-black text-blue-700" aria-live="polite">{steps.length}개 중 {doneCount}개 했어요</p>}
        <ol className="mt-3 space-y-3">
          {steps.map((step, index) => (
            <li key={step.key} className={`flex items-center gap-3 rounded-2xl p-4 ${step.done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${step.done ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500'}`}>
                {step.done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-900">{step.title}</span>
                <span className="mt-0.5 block text-sm font-bold text-slate-500">{step.done ? '했어요' : step.body}</span>
              </span>
              {!step.done && (
                <button onClick={() => start(step.key)} className="pressable shrink-0 rounded-full bg-blue-700 px-4 py-2 text-sm font-black text-white">
                  {step.action}
                </button>
              )}
            </li>
          ))}
        </ol>
        <button onClick={() => navigate('/')} className="pressable mt-5 h-13 w-full rounded-2xl bg-slate-100 font-black text-slate-700">
          홈으로 <ChevronRight className="inline h-5 w-5" aria-hidden="true" />
        </button>
      </Card>
      {budgetOpen && (
        <LivingBudgetSheet
          onClose={() => setBudgetOpen(false)}
          onSaved={() => {
            setBudgetOpen(false)
            reload()
          }}
        />
      )}
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
    // 서버 값이 오기 전에 남의 숫자처럼 보이는 기본값을 두지 않는다. 비어 있으면 빈 칸이다.
    incomeAmount: 0,
    livingBudgetAmount: 0,
    fixedExpenseAmount: 0,
    plannedSavingAmount: 0,
    plannedInvestmentAmount: 0,
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
  // 총자산과 저축률은 코치, 프로필 등 다른 화면도 공용 데이터로 보여 준다. 여기서 바꾸면 다시 불러야 한다.
  const { financeSummary, activities, reload } = useMyWaveData()
  const [accounts, setAccounts] = useState<MyWaveFinancialAccountResponse[]>([])
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(() => defaultBudgetForm())
  const [assetMetrics, setAssetMetrics] = useState({
    totalAsset: financeSummary.totalAsset,
    // 자세한 숫자가 오기 전에도 세 칸의 합이 맞게 둔다. 전에는 잠깐 총자산 전체가 투자 자산으로 보였다.
    accountBalance: financeSummary.accountBalance,
    investmentAsset: Math.max(0, financeSummary.totalAsset - financeSummary.accountBalance),
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
      setStatusMessage('통장 이름과 은행 이름을 적어 주세요.')
      return
    }
    try {
      if (editingAccountId) {
        await updateMyWaveAccount(editingAccountId, accountForm)
        setStatusMessage('계좌가 수정되었습니다.')
      } else {
        await createMyWaveAccount(accountForm)
        setStatusMessage('계좌를 추가했어요.')
      }
      resetAccountForm()
      await refreshAssets()
      reload()
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
      reload()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '계좌 삭제에 실패했습니다.')
    }
  }

  async function saveBudget() {
    try {
      await saveMyWaveMonthlyBudget(budgetForm)
      setStatusMessage('이번 달 예산이 저장되었습니다.')
      await refreshAssets(budgetForm.budgetMonth)
      reload()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '예산 저장에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-5">
      <MobileTitle title="자산" />
      <Card title="이번 달 재무 상태">
        <div className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="총 자산" value={won(assetMetrics.totalAsset)} change="계좌+투자" />
          <MiniStat label="계좌 잔액" value={won(assetMetrics.accountBalance)} change={`직접 적은 계좌 ${accounts.length}개`} />
          <MiniStat label="남은 생활비" value={won(assetMetrics.remainingLivingBudget)} change={`저축률 ${assetMetrics.savingRate}%`} />
          <MiniStat label="투자 가능 금액" value={won(assetMetrics.investmentAvailableAmount)} />
        </div>
      </Card>
      {statusMessage && <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{statusMessage}</div>}
      <Card title="이번 달 예산">
        <div className="space-y-4">
          <Field label="생활비 예산">
            <NumberField money quick={[100000, 500000]} value={budgetForm.livingBudgetAmount} onChange={(next) => setBudgetForm((value) => ({ ...value, livingBudgetAmount: next }))} />
          </Field>
          <p className="text-sm font-medium leading-6 text-slate-500">식비, 교통비, 카페처럼 그때그때 쓰는 돈이에요. 남은 날짜로 나눠 하루에 써도 되는 돈을 알려 드려요.</p>
          {/* 처음에는 생활비 한 칸이면 충분하다. 나머지는 원하는 사람만 펼쳐서 적는다. */}
          <details className="rounded-2xl bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-black text-slate-600">더 자세히 적기 (수입, 정해진 지출, 저축과 투자 계획)</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="어느 달 예산인가요">
                <input type="month" value={budgetForm.budgetMonth} onChange={(event) => setBudgetForm((value) => ({ ...value, budgetMonth: event.target.value }))} className="form-input" />
              </Field>
              <Field label="한 달 수입">
                <NumberField money value={budgetForm.incomeAmount} onChange={(next) => setBudgetForm((value) => ({ ...value, incomeAmount: next }))} />
              </Field>
              <Field label="정해진 지출 (월세, 통신비 등)">
                <NumberField money value={budgetForm.fixedExpenseAmount} onChange={(next) => setBudgetForm((value) => ({ ...value, fixedExpenseAmount: next }))} />
              </Field>
              <Field label="이번 달 저축할 돈">
                <NumberField money value={budgetForm.plannedSavingAmount} onChange={(next) => setBudgetForm((value) => ({ ...value, plannedSavingAmount: next }))} />
              </Field>
              <Field label="이번 달 투자할 돈">
                <NumberField money value={budgetForm.plannedInvestmentAmount} onChange={(next) => setBudgetForm((value) => ({ ...value, plannedInvestmentAmount: next }))} />
              </Field>
            </div>
          </details>
          <button onClick={saveBudget} className="pressable h-13 w-full rounded-2xl bg-blue-700 font-black text-white shadow-blue">
            <Save className="inline h-5 w-5" /> 예산 저장
          </button>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card title="내 계좌">
          <div className="space-y-3">
            {accounts.length === 0 && <p className="text-sm font-bold text-slate-500">아직 적은 계좌가 없어요. 통장 잔액을 적어 두면 총 자산에 더해져요.</p>}
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
                  </div>
                  <ConfirmDeleteButton compact label="계좌 삭제" onConfirm={() => removeAccount(account.id)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={editingAccountId ? '계좌 수정' : '계좌 추가'}>
          <div className="space-y-4">
            {/* 은행에 연결하는 기능이 아니다. 그렇게 읽히지 않게 먼저 말해 둔다. */}
            <p className="text-sm font-medium leading-6 text-slate-500">은행에 연결하지 않아요. 통장 이름과 지금 잔액을 직접 적으면 돼요.</p>
            <Field label="통장 이름">
              <input value={accountForm.name} onChange={(event) => setAccountForm((value) => ({ ...value, name: event.target.value }))} placeholder="예: 생활비 통장" className="form-input" />
            </Field>
            <Field label="은행이나 증권사">
              <input value={accountForm.institutionName} onChange={(event) => setAccountForm((value) => ({ ...value, institutionName: event.target.value }))} placeholder="예: 카카오뱅크" className="form-input" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="종류">
                <select value={accountForm.accountType} onChange={(event) => setAccountForm((value) => ({ ...value, accountType: event.target.value }))} className="form-input">
                  <option value="BANK">입출금</option>
                  <option value="SAVINGS">저축</option>
                  <option value="INVESTMENT">증권</option>
                  <option value="CASH">현금</option>
                </select>
              </Field>
              <Field label="지금 잔액">
                <NumberField money allowNegative value={accountForm.balance} onChange={(next) => setAccountForm((value) => ({ ...value, balance: next }))} />
              </Field>
            </div>
            <label className="flex items-center justify-between rounded-2xl p-4 text-sm font-black">
              총 자산에 더하기
              <input type="checkbox" checked={accountForm.includedInAssets} onChange={(event) => setAccountForm((value) => ({ ...value, includedInAssets: event.target.checked }))} className="h-5 w-5 accent-blue-700" />
            </label>
            <div className="flex gap-3">
              {editingAccountId && <button onClick={resetAccountForm} className="pressable h-13 flex-1 rounded-2xl font-black text-slate-600">취소</button>}
              <button onClick={saveAccount} className="pressable h-13 flex-[1.5] rounded-2xl bg-blue-700 font-black text-white shadow-blue">
                <Save className="inline h-5 w-5" /> {editingAccountId ? '수정 저장' : '계좌 추가'}
              </button>
            </div>
          </div>
        </Card>
      </div>
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
