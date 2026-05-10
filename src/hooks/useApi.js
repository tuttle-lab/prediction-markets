import { useState, useCallback } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const request = useCallback(async (path, options = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const get  = useCallback((path) => request(path), [request])
  const post = useCallback((path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }), [request])

  return { get, post, loading, error }
}
