import { api, requestData } from './axios'
import { mockMember } from '../data/mockData'
import type { Member } from '../types/member'

export function getCurrentMember() {
  return requestData<Member>(api.get('/api/members/me'), mockMember)
}
