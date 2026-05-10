import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'

const POLL_MS = (parseInt(import.meta.env.VITE_POLL_INTERVAL_SECONDS) || 60) * 1000

export function useMarkets({ source, category, search } = {}) {
  const { get, loading, error } = useApi()
  const [markets, setMarkets]   = useState([])
  const [lastFetch, setLastFetch] = useState(null)

  const fetch = useCallback(async () => {
    const params = new URLSearchParams()
    if (source)   params.set('source', source)
    if (category) params.set('category', category)
    if (search)   params.set('search', search)
    const data = await get(`/markets?${params}`)
    if (data?.markets) {
      setMarkets(data.markets)
      setLastFetch(new Date())
    }
  }, [source, category, search, get])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, POLL_MS)
    return () => clearInterval(id)
  }, [fetch])

  return { markets, loading, error, lastFetch, refresh: fetch }
}
