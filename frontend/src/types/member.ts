export interface Member {
  id: number
  name: string
  email: string
  profileImageUrl: string
  membershipGrade: string
  /** GOOGLE 이면 비밀번호가 없는 계정이다. */
  loginProvider?: 'GOOGLE' | 'PASSWORD'
  createdAt: string
}
