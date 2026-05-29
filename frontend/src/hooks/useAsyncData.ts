import { useEffect, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react'
import { isMockFallbackEnabled } from '../api/axios'

export function useAsyncData<T>(loader: () => Promise<T>, initialValue: T, deps: DependencyList = []) {
  const mockFallbackEnabled = isMockFallbackEnabled()
  const effectiveInitialValue = mockFallbackEnabled ? initialValue : emptyRuntimeValue(initialValue)
  const [data, setData] = useState<T>(effectiveInitialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [placeholderData, setPlaceholderData] = useState(!mockFallbackEnabled)

  const updateData: Dispatch<SetStateAction<T>> = (value) => {
    setPlaceholderData(false)
    setData(value)
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    if (!mockFallbackEnabled) {
      setData(emptyRuntimeValue(initialValue))
      setPlaceholderData(true)
    }

    loader()
      .then((result) => {
        if (mounted) {
          setData(result)
          setError(null)
          setPlaceholderData(false)
        }
      })
      .catch((exception: unknown) => {
        if (mounted) {
          const message = exception instanceof Error ? exception.message : '데이터를 불러오지 못했습니다.'
          setError(message)
          if (!mockFallbackEnabled) {
            setData(emptyRuntimeValue(initialValue))
            setPlaceholderData(true)
            window.dispatchEvent(new CustomEvent('stockflow:data-error', { detail: { message } }))
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, deps)

  return { data, setData: updateData, loading, error, placeholderData, mockFallbackEnabled }
}

function emptyRuntimeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [] as T
  }
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value === 'string') {
    return '' as T
  }
  if (typeof value === 'number') {
    return 0 as T
  }
  if (typeof value === 'boolean') {
    return false as T
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, emptyRuntimeValue(nestedValue)]),
    ) as T
  }
  return value
}
