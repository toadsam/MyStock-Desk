import axios from 'axios'
import type { ApiResponse } from '../types/common'

// 개발(npm run dev)은 8080 의 백엔드를 직접 부르고, 빌드한 화면은 같은 주소의 /api 를 불러 nginx 가 백엔드로 넘긴다.
// API 를 다른 도메인에 둘 때만 VITE_API_BASE_URL 을 채운다.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '')

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
})

export function isMockFallbackEnabled() {
  return import.meta.env.VITE_ALLOW_MOCK_FALLBACK === 'true'
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockflow.accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('stockflow.accessToken')
      localStorage.removeItem('stockflow.member')
      window.dispatchEvent(new CustomEvent('stockflow:auth-expired'))
    }
    return Promise.reject(error)
  },
)

export async function requestData<T>(request: Promise<{ data: ApiResponse<T> }>, fallback: T): Promise<T> {
  try {
    const response = await request
    if (!response.data.success) {
      throw new Error(response.data.error?.message ?? 'API 요청 실패')
    }
    return response.data.data
  } catch (error) {
    if (!isMockFallbackEnabled()) {
      if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
        throw new Error(error.response?.data.error?.message ?? error.message, { cause: error })
      }
      throw error
    }
    return fallback
  }
}

export async function requestStrictData<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await request
    if (!response.data.success) {
      throw new Error(response.data.error?.message ?? 'API 요청 실패')
    }
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new Error(error.response?.data.error?.message ?? error.message, { cause: error })
    }
    throw error
  }
}
