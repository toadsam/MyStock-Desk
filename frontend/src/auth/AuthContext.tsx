import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginApi, register as registerApi } from '../api/authApi'
import type { Member } from '../types/member'
import { AuthContext, type AuthContextValue } from './authContextCore'

const TOKEN_KEY = 'stockflow.accessToken'
const MEMBER_KEY = 'stockflow.member'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [member, setMember] = useState<Member | null>(() => {
    const stored = localStorage.getItem(MEMBER_KEY)
    return stored ? (JSON.parse(stored) as Member) : null
  })

  const persist = useCallback((nextToken: string, nextMember: Member) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(MEMBER_KEY, JSON.stringify(nextMember))
    setToken(nextToken)
    setMember(nextMember)
  }, [])

  const updateMember = useCallback((nextMember: Member) => {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(nextMember))
    setMember(nextMember)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(MEMBER_KEY)
    setToken(null)
    setMember(null)
  }, [])

  useEffect(() => {
    window.addEventListener('stockflow:auth-expired', clear)
    return () => window.removeEventListener('stockflow:auth-expired', clear)
  }, [clear])

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
      updateMember,
    }),
    [clear, member, persist, token, updateMember],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
