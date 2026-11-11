import { LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuthConfig } from '../api/authApi'
import { GoogleSignInButton } from '../auth/GoogleSignInButton'
import { LOGIN_NOTICE_KEY } from '../auth/loginNotice'
import { useAuth } from '../auth/useAuth'
import { BelugaArt } from '../mywave/BelugaArt'
import { Ocean } from '../mywave/motion'
import { TAGLINE } from '../mywave/brand'
import type { AuthConfig } from '../types/auth'

/** 서버에 묻기 전에는 아무 칸도 그리지 않는다. 숨겨야 할 칸이 잠깐 보였다 사라지면 안 된다. */
type ConfigState = { status: 'loading' } | { status: 'ready'; config: AuthConfig } | { status: 'failed' }

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const isRegister = location.pathname.includes('register')
  // 칸은 비워 둔다. 데모 계정을 미리 채워 두면 그냥 로그인을 누른 사람들이 모두 같은 계정에 들어가 서로의 기록을 보게 된다.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' })

  // 비밀번호를 바꾼 뒤처럼, 다른 화면이 이리로 보내면서 남긴 한마디. 한 번 보여 주면 지운다.
  const [notice] = useState(() => sessionStorage.getItem(LOGIN_NOTICE_KEY))
  useEffect(() => {
    sessionStorage.removeItem(LOGIN_NOTICE_KEY)
  }, [])

  useEffect(() => {
    let ignore = false
    getAuthConfig()
      .then((config) => {
        if (!ignore) setConfigState({ status: 'ready', config })
      })
      .catch(() => {
        if (!ignore) setConfigState({ status: 'failed' })
      })
    return () => {
      ignore = true
    }
  }, [])

  const googleClientId = configState.status === 'ready' ? configState.config.googleClientId : null
  // 설정을 못 읽었으면 이메일 칸을 보여 준다. 서버가 막아 둔 상태라면 눌렀을 때 서버가 이유를 말해 준다.
  const passwordLogin = configState.status === 'failed' || (configState.status === 'ready' && configState.config.passwordLoginEnabled !== false)
  const googleOnly = configState.status === 'ready' && !passwordLogin
  const title = googleOnly ? '시작하기' : isRegister ? '회원가입' : '로그인'

  const goNext = () => {
    const from = typeof location.state === 'object' && location.state && 'from' in location.state
      ? String(location.state.from)
      : '/'
    navigate(from, { replace: true })
  }

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setSubmitting(true)
    setError(null)
    try {
      await action()
      goNext()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : fallback)
    } finally {
      setSubmitting(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(
      () => (isRegister ? auth.register({ name, email, password }) : auth.login({ email, password })),
      '인증 처리 중 오류가 발생했습니다.',
    )
  }

  const loginDemo = () => run(
    () => auth.login({ email: 'investor@stockflow.com', password: 'stockflow1234' }),
    '데모 계정 로그인에 실패했습니다.',
  )

  const loginGoogle = (credential: string) => run(
    () => auth.loginWithGoogle(credential),
    '구글 로그인에 실패했습니다.',
  )

  const messages = (
    <>
      {notice && !error && (
        <div role="status" className="rounded-[12px] bg-blue-50 px-4 py-3 text-[13px] font-semibold text-blue-700">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-[12px] bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}
    </>
  )

  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] px-5 py-10 text-slate-900">
      {/* 첫 화면부터 바다다. 활기 설정과 상관없이 보인다. */}
      <Ocean always />
      <div className="w-full max-w-md space-y-5">
        <Link to="/" className="flex flex-col items-center text-center">
          <span className="beluga-hop block h-28 w-28">
            <BelugaArt mood="hello" className="h-full w-full drop-shadow-[0_10px_16px_rgba(10,40,140,.22)]" />
          </span>
          <img src="/logo-wordmark.webp" alt="MyWave" width={521} height={144} className="mt-2 block h-12 w-auto" />
          <span className="mt-3 text-[13px] font-medium text-slate-500">{TAGLINE}</span>
        </Link>
        <div className="rounded-[20px] bg-white p-6 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-400">MyWave 계정</div>
              <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-slate-900">{title}</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-blue-50 text-blue-700">
              {isRegister && !googleOnly ? <UserPlus className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
            </div>
          </div>

          {configState.status === 'loading' && (
            <div role="status" className="py-6 text-center text-[14px] font-semibold text-slate-400">불러오는 중이에요…</div>
          )}

          {googleOnly && (
            <div className="space-y-4">
              {/* 처음 온 사람은 여기서 무슨 앱인지부터 알아야 한다. */}
              <ul className="space-y-2 rounded-[14px] bg-slate-50 p-4 text-[14px] font-medium leading-6 text-slate-600">
                <li>생활비를 정하면 하루에 써도 되는 돈을 알려 드려요.</li>
                <li>소비를 적으면 어디에 많이 쓰는지 보여 드려요.</li>
                <li>목표를 정하면 하루에 얼마씩 모으면 되는지 계산해 드려요.</li>
              </ul>
              <p className="text-[13px] font-medium leading-5 text-slate-400">
                구글 계정 하나로 가입과 로그인을 같이 해요. 은행이나 카드사에는 연결하지 않아요.
              </p>
              {messages}
              {googleClientId ? (
                <GoogleSignInButton clientId={googleClientId} onCredential={loginGoogle} />
              ) : (
                <div role="alert" className="rounded-[12px] bg-slate-100 px-4 py-3 text-[13px] font-semibold text-slate-600">
                  지금은 로그인을 받을 수 없어요. 잠시 후 다시 와 주세요.
                </div>
              )}
            </div>
          )}

          {passwordLogin && (
            <>
              <form className="space-y-4" onSubmit={submit}>
                {isRegister && (
                  <label className="block">
                    <span className="text-[13px] font-semibold text-slate-500">이름</span>
                    <input
                      className="form-input mt-2"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-500">이메일</span>
                  <input
                    className="form-input mt-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-semibold text-slate-500">비밀번호</span>
                  <input
                    className="form-input mt-2"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                </label>

                {messages}

                <button
                  type="submit"
                  disabled={submitting}
                  className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-blue-700 text-[16px] font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <LogIn className="h-4 w-4" />
                  {submitting ? '처리 중' : title}
                </button>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={loginDemo}
                    disabled={submitting}
                    className="pressable h-14 w-full rounded-[14px] bg-slate-100 text-[16px] font-bold text-slate-600 disabled:text-slate-400"
                  >
                    데모 계정으로 로그인
                  </button>
                )}
                {/* 처음 오는 사람은 가입 화면에서도 구글로 바로 시작할 수 있다. 서버에 설정이 없으면 아무것도 그리지 않는다. */}
                {googleClientId && <GoogleSignInButton clientId={googleClientId} onCredential={loginGoogle} divider />}
              </form>

              <div className="mt-6 pt-5 text-center text-[14px]">
                {isRegister ? (
                  <Link to="/login" className="font-semibold text-slate-500">이미 계정이 있어요</Link>
                ) : (
                  <Link to="/register" className="font-semibold text-blue-700">새 계정 만들기</Link>
                )}
              </div>
            </>
          )}

          <div className="mt-6 text-center text-[13px]">
            <Link to="/privacy" className="font-semibold text-slate-400 underline underline-offset-4">어떤 정보를 받고 어떻게 지우나요?</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
