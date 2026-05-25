import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'
import { api, requestStrictData } from './axios'

export function login(request: LoginRequest) {
  return requestStrictData<AuthResponse>(api.post('/api/auth/login', request))
}

export function register(request: RegisterRequest) {
  return requestStrictData<AuthResponse>(api.post('/api/auth/register', request))
}
