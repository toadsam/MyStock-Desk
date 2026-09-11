import { LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Logo } from '../layouts/Header'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const mode = location.pathname.includes('register') ? 'register' : 'login'
  const isRegister = mode === 'register'
  const [name, setName] = useState('김투자')
  const [email, setEmail] = useState('investor@stockflow.com')
  const [password, setPassword] = useState('stockflow1234')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (isRegister ? '회원가입' : '로그인'), [isRegister])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isRegister) {
        await auth.register({ name, email, password })
      } else {
        await auth.login({ email, password })
      }
      const from = typeof location.state === 'object' && location.state && 'from' in location.state
        ? String(location.state.from)
        : '/'
      navigate(from, { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '인증 처리 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const loginDemo = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await auth.login({ email: 'investor@stockflow.com', password: 'stockflow1234' })
      const from = typeof location.state === 'object' && location.state && 'from' in location.state
        ? String(location.state.from)
        : '/'
      navigate(from, { replace: true })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '데모 계정 로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-5 py-10 text-slate-900">
      <div className="w-full max-w-md space-y-5">
        <Link to="/" className="flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-[20px] bg-white p-6 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-400">StockFlow 계정</div>
              <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] text-slate-900">{title}</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-blue-50 text-blue-700">
              {isRegister ? <UserPlus className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
            </div>
          </div>

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

            {error && (
              <div className="rounded-[12px] bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
                {error}
              </div>
            )}

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
          </form>

          <div className="mt-6 pt-5 text-center text-[14px]">
            {isRegister ? (
              <Link to="/login" className="font-semibold text-slate-500">이미 계정이 있어요</Link>
            ) : (
              <Link to="/register" className="font-semibold text-blue-700">새 계정 만들기</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
