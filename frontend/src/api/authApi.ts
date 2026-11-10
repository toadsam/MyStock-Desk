import type { AuthConfig, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'
import { api, requestStrictData } from './axios'

export function login(request: LoginRequest) {
  return requestStrictData<AuthResponse>(api.post('/api/auth/login', request))
}

/** 구글 버튼이 돌려준 토큰을 그대로 서버에 넘긴다. 이름이나 이메일은 보내지 않는다. 서버가 토큰에서 꺼낸다. */
export function loginWithGoogle(credential: string) {
  return requestStrictData<AuthResponse>(api.post('/api/auth/google', { credential }))
}

export function getAuthConfig() {
  return requestStrictData<AuthConfig>(api.get('/api/auth/config'))
}

export function register(request: RegisterRequest) {
  return requestStrictData<AuthResponse>(api.post('/api/auth/register', request))
}
