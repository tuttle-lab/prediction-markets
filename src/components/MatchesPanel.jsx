import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/useApi'

const SOURCE_COLORS = {
  kalshi:     '#3b82f6',
  polymarket: '#8b5cf6',
  predictit:  '#f59e0b',
  manifold:   '#10b981',
}

export function MatchesPanel() {
  const { get, loading, error } = useApi()
  const [clusters, setClusters] = useState([])
  const [scanned, setScanned]   = useState(0)
  const [threshold, setThreshold] = useState(0.55)
  const [expanded, setExpanded] = useState({})

  const load = useCallback(async () => {
    const data = await get(`/matches?threshold=${threshold}`)
    if (data?.clusters) {
      setClusters(data.clusters)
      setScanned(data.markets_scanned)
    }
  }, [get, threshold])

  useEffect(() => { load() }, [load])

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }))

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Matched Markets</h2>
          {scanned > 0 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {clusters.length} clusters found across {scanned} markets
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            threshold
            <input
              type="range" min="0.3" max="0.9" step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ marginLeft: '0.5rem', verticalAlign: 'middle', width: '80px' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '0.25rem' }}>{threshold.toFixed(2)}</span>
          </label>
          <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ fontSize: '0.8rem' }}>
            {loading ? 'scanning…' : '⟳ refresh'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

      {!loading && clusters.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.875rem' }}>
          No matches found. Try lowering the threshold.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {clusters.map((c, i) => (
          <div key={i}
            style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
          >
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%', textAlign: 'left', padding: '0.6rem 0.75rem',
                background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '2.5rem' }}>
                {(c.confidence * 100).toFixed(0)}%
              </span>

              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500 }}>
                {c.markets[0]?.title?.slice(0, 70)}{c.markets[0]?.title?.length > 70 ? '…' : ''}
              </span>

              <span style={{ display: 'flex', gap: '0.25rem' }}>
                {c.sources.map(s => (
                  <span key={s} style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem',
                    borderRadius: '3px', background: SOURCE_COLORS[s] + '22',
                    color: SOURCE_COLORS[s], fontFamily: 'var(--font-mono)',
                  }}>{s}</span>
                ))}
              </span>

              {c.arb_pct != null && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                  borderRadius: '4px', background: 'var(--success)', color: '#fff',
                  fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                }}>
                  ⚡ {c.arb_pct}%
                </span>
              )}

              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {expanded[i] ? '▲' : '▼'}
              </span>
            </button>

            {expanded[i] && (
              <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {c.markets.map((m, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{
                      color: SOURCE_COLORS[m.source] || 'var(--accent)',
                      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, minWidth: '5rem',
                    }}>{m.source}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', minWidth: '3.5rem' }}>
                      Y {(m.yes * 100).toFixed(1)}¢
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)', minWidth: '3.5rem' }}>
                      N {(m.no * 100).toFixed(1)}¢
                    </span>
                    <a href={m.url} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--text-muted)', textDecoration: 'none', flex: 1 }}
                      title={m.title}
                    >
                      {m.title.length > 65 ? m.title.slice(0, 65) + '…' : m.title}
                    </a>
                  </div>
                ))}
                {c.arb_pct != null && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                    combined cost {(c.combined_cost * 100).toFixed(1)}¢ → {c.arb_pct}% potential arb
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
