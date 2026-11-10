import type { Member } from './member'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

/**
 * 로그인 화면이 뜰 때 서버에 묻는 것.
 * googleClientId 가 없으면 구글 로그인이 꺼져 있다.
 * passwordLoginEnabled 가 false 면 이메일·비밀번호 칸과 데모 버튼을 그리지 않는다(서버도 거절한다).
 */
export interface AuthConfig {
  googleClientId: string | null
  passwordLoginEnabled?: boolean
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  member: Member
}
