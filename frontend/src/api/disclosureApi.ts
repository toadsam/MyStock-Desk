import { api, requestData } from './axios'
import type { Disclosure } from '../types/disclosure'

export function getSecDisclosures(params?: { symbols?: string; limit?: number }) {
  return requestData<Disclosure[]>(api.get('/api/disclosures/sec', { params }), [])
}
