import { LockKeyhole, LogIn, UserPlus } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
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
    <main className="grid min-h-screen place-items-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-md space-y-5">
        <Link to="/" className="flex justify-center">
          <Logo />
        </Link>
        <Card className="p-6 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-300">StockFlow 계정</div>
              <h1 className="mt-2 text-2xl font-black text-white">{title}</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-300">
              {isRegister ? <UserPlus className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
            </div>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {isRegister && (
              <label className="block">
                <span className="text-sm text-slate-400">이름</span>
                <input
                  className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/55 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm text-slate-400">이메일</span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/55 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">비밀번호</span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-slate-700 bg-slate-950/55 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? '처리 중' : title}
            </Button>
            {!isRegister && (
              <Button type="button" variant="outline" className="w-full" onClick={loginDemo} disabled={submitting}>
                데모 계정으로 로그인
              </Button>
            )}
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-sm text-slate-400">
            {isRegister ? (
              <Link to="/login" className="font-semibold text-blue-300">이미 계정이 있습니다</Link>
            ) : (
              <Link to="/register" className="font-semibold text-blue-300">새 계정 만들기</Link>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
