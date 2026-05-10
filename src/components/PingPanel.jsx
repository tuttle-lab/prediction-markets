import { useState } from 'react'
import { useApi } from '../hooks/useApi'

export function PingPanel() {
  const { get, post, loading, error } = useApi()
  const [result, setResult] = useState(null)

  const ping = async () => {
    const data = await get('/ping')
    setResult(data)
  }

  const echo = async () => {
    const data = await post('/echo', { message: 'hello from kickstart', timestamp: Date.now() })
    setResult(data)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>API Connectivity</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Verify the FastAPI backend is reachable.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={ping} disabled={loading}>
          {loading ? '...' : 'GET /api/ping'}
        </button>
        <button className="btn btn-ghost" onClick={echo} disabled={loading}>
          {loading ? '...' : 'POST /api/echo'}
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge err">error</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{error}</span>
        </div>
      )}

      <div className="response-block">
        {result ? JSON.stringify(result, null, 2) : '// response will appear here'}
      </div>
    </div>
  )
}
