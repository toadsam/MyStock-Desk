import axios from 'axios'
import type { ApiResponse } from '../types/common'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 6000,
})

export async function requestData<T>(request: Promise<{ data: ApiResponse<T> }>, fallback: T): Promise<T> {
  try {
    const response = await request
    if (!response.data.success) {
      throw new Error(response.data.error?.message ?? 'API 요청 실패')
    }
    return response.data.data
  } catch {
    return fallback
  }
}
