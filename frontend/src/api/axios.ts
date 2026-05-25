import axios from 'axios'
import type { ApiResponse } from '../types/common'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 6000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockflow.accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
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

export async function requestStrictData<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await request
    if (!response.data.success) {
      throw new Error(response.data.error?.message ?? 'API 요청 실패')
    }
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      throw new Error(error.response?.data.error?.message ?? error.message)
    }
    throw error
  }
}
