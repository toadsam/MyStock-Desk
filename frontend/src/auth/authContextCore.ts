import { createContext } from 'react'
import type { LoginRequest, RegisterRequest } from '../types/auth'
import type { Member } from '../types/member'

export interface AuthContextValue {
  member: Member | null
  token: string | null
  isAuthenticated: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
