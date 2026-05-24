import { useEffect, useState } from 'react'

export function useAsyncData<T>(loader: () => Promise<T>, initialValue: T) {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    loader()
      .then((result) => {
        if (mounted) {
          setData(result)
          setError(null)
        }
      })
      .catch((exception: unknown) => {
        if (mounted) {
          setError(exception instanceof Error ? exception.message : '데이터를 불러오지 못했습니다.')
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
  }, [])

  return { data, setData, loading, error }
}
