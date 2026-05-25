import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginApi, register as registerApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest } from '../types/auth'
import type { Member } from '../types/member'

interface AuthContextValue {
  member: Member | null
  token: string | null
  isAuthenticated: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = 'stockflow.accessToken'
const MEMBER_KEY = 'stockflow.member'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [member, setMember] = useState<Member | null>(() => {
    const stored = localStorage.getItem(MEMBER_KEY)
    return stored ? (JSON.parse(stored) as Member) : null
  })

  const persist = (nextToken: string, nextMember: Member) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(MEMBER_KEY, JSON.stringify(nextMember))
    setToken(nextToken)
    setMember(nextMember)
  }

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(MEMBER_KEY)
    setToken(null)
    setMember(null)
  }

  useEffect(() => {
    window.addEventListener('stockflow:auth-expired', clear)
    return () => window.removeEventListener('stockflow:auth-expired', clear)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      member,
      token,
      isAuthenticated: Boolean(token),
      login: async (request) => {
        const response = await loginApi(request)
        persist(response.accessToken, response.member)
      },
      register: async (request) => {
        const response = await registerApi(request)
        persist(response.accessToken, response.member)
      },
      logout: clear,
    }),
    [member, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
