import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApi } from '../hooks/useApi'

const SOURCE_COLORS = {
  kalshi:     '#06b6d4',
  polymarket: '#8b5cf6',
  predictit:  '#f59e0b',
  manifold:   '#10b981',
}

const SOURCE_SHORT = {
  kalshi:     'KA',
  polymarket: 'PM',
  predictit:  'PI',
  manifold:   'MF',
}

const CATEGORY_COLORS = {
  politics:     '#3b82f6',
  sports:       '#ef4444',
  crypto:       '#f59e0b',
  economics:    '#10b981',
  science:      '#8b5cf6',
  entertainment:'#ec4899',
  other:        '#6b7280',
}

function fmt(p) { return (p * 100).toFixed(0) + '¢' }

function PriceChip({ market }) {
  const color = SOURCE_COLORS[market.source] || '#6b7280'
  return (
    <a
      href={market.url}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.2rem 0.5rem', borderRadius: '4px',
        border: `1px solid ${color}44`,
        background: color + '11',
        textDecoration: 'none',
        fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <span style={{ color, fontWeight: 700, fontSize: '0.65rem' }}>
        {SOURCE_SHORT[market.source] || market.source.slice(0, 2).toUpperCase()}
      </span>
      <span style={{ color: 'var(--success)' }}>{fmt(market.yes)}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>/</span>
      <span style={{ color: 'var(--error)' }}>{fmt(market.no)}</span>
    </a>
  )
}

function clusterSpread(cluster) {
  const prices = cluster.markets.map(m => m.yes)
  return Math.max(...prices) - Math.min(...prices)
}

function clusterTitle(cluster) {
  const k = cluster.markets.find(m => m.source === 'kalshi')
  if (k) return k.title
  return cluster.markets.reduce((a, b) => a.title.length >= b.title.length ? a : b).title
}

function clusterCategory(cluster) {
  const k = cluster.markets.find(m => m.source === 'kalshi')
  return k?.category || cluster.markets[0]?.category || 'other'
}

function ClusterRow({ cluster }) {
  const [open, setOpen] = useState(false)
  const title    = clusterTitle(cluster)
  const spread   = clusterSpread(cluster)
  const category = clusterCategory(cluster)
  const catColor = CATEGORY_COLORS[category] || '#6b7280'

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        role="button" tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.55rem 0.75rem', cursor: 'pointer',
          background: open ? 'var(--bg-elevated)' : 'transparent',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0 }} />

        <span style={{
          flex: 1, fontSize: '0.85rem', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)',
        }}>
          {title}
        </span>

        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          {cluster.markets.map((m, i) => <PriceChip key={i} market={m} />)}
        </div>

        {spread >= 0.05 ? (
          <span style={{
            fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: spread >= 0.15 ? 'var(--error)' : 'var(--text-muted)',
            minWidth: '3rem', textAlign: 'right', flexShrink: 0,
          }}>
            Δ{(spread * 100).toFixed(0)}¢
          </span>
        ) : (
          <span style={{ minWidth: '3rem', flexShrink: 0 }} />
        )}

        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{ padding: '0.5rem 0.75rem 0.75rem 1.5rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          {cluster.markets.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: '0.75rem',
              padding: '0.3rem 0',
              borderBottom: i < cluster.markets.length - 1 ? '1px solid var(--border)' : 'none',
              fontSize: '0.8rem',
            }}>
              <span style={{
                color: SOURCE_COLORS[m.source] || '#6b7280',
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700,
                minWidth: '5.5rem', flexShrink: 0,
              }}>{m.source}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', minWidth: '2.5rem', flexShrink: 0 }}>{fmt(m.yes)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)', minWidth: '2.5rem', flexShrink: 0 }}>{fmt(m.no)}</span>
              <a
                href={m.url} target="_blank" rel="noreferrer"
                style={{ color: 'var(--text-muted)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={m.title}
              >{m.title}</a>
            </div>
          ))}
          <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {(cluster.confidence * 100).toFixed(0)}% match · {cluster.sources.length} source{cluster.sources.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

export function SearchView() {
  const { get, loading, error } = useApi()
  const [clusters, setClusters]     = useState([])
  const [meta, setMeta]             = useState(null)
  const [search, setSearch]         = useState('')
  const [categoryFilter, setCat]    = useState('all')
  const [minSources, setMinSources] = useState(1)
  const [sortBy, setSortBy]         = useState('spread')

  const load = useCallback(async () => {
    const data = await get('/matches?threshold=0.25&limit=2000')
    if (data?.clusters) {
      setClusters(data.clusters)
      setMeta({ total: data.count, scanned: data.markets_scanned })
    }
  }, [get])

  useEffect(() => { load() }, [load])

  const categories = useMemo(() => {
    const cats = new Set(clusters.flatMap(c => c.markets.map(m => m.category || 'other')))
    return ['all', ...Array.from(cats).sort()]
  }, [clusters])

  const visible = useMemo(() => {
    const q = search.toLowerCase()
    return clusters
      .filter(c => {
        if (c.sources.length < minSources) return false
        if (categoryFilter !== 'all' && !c.markets.some(m => (m.category || 'other') === categoryFilter)) return false
        if (q && !c.markets.some(m => m.title.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'spread')     return clusterSpread(b) - clusterSpread(a)
        if (sortBy === 'confidence') return b.confidence - a.confidence
        if (sortBy === 'sources')    return b.sources.length - a.sources.length
        return 0
      })
  }, [clusters, search, categoryFilter, minSources, sortBy])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Prediction Market Search</h1>
          {meta && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
              {meta.scanned} markets scanned · {meta.total} clusters found · {visible.length} shown
            </p>
          )}
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ fontSize: '0.8rem' }}>
          {loading ? 'loading…' : '⟳ refresh'}
        </button>
      </div>

      {/* Search bar */}
      <input
        placeholder="Search markets across all platforms…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        style={{
          width: '100%', padding: '0.6rem 0.85rem',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem',
        }}
      />

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCat(cat)} style={{
            padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid',
            fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            borderColor: categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--border)',
            background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') + '22' : 'transparent',
            color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--text-muted)',
          }}>{cat}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <select value={minSources} onChange={e => setMinSources(Number(e.target.value))}
            style={{ padding: '0.3rem 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.78rem' }}>
            <option value={1}>any sources</option>
            <option value={2}>2+ sources</option>
            <option value={3}>3+ sources</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.3rem 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.78rem' }}>
            <option value="spread">sort: spread</option>
            <option value="confidence">sort: confidence</option>
            <option value="sources">sort: sources</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', fontSize: '0.875rem' }}>
          Fetching from Kalshi, Polymarket, PredictIt, Manifold…
        </p>
      )}

      {!loading && visible.length === 0 && clusters.length > 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.875rem' }}>
          No markets match your search.
        </p>
      )}

      {!loading && visible.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {visible.map((cluster, i) => <ClusterRow key={i} cluster={cluster} />)}
        </div>
      )}
    </div>
  )
}
