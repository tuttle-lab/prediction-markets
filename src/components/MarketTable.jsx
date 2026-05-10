import { useState } from 'react'
import { useMarkets } from '../hooks/useMarkets'

const SOURCE_COLORS = {
  kalshi:     '#3b82f6',
  polymarket: '#8b5cf6',
  predictit:  '#f59e0b',
  manifold:   '#10b981',
}

const SOURCES = ['kalshi', 'polymarket', 'predictit', 'manifold']

export function MarketTable() {
  const [search,   setSearch]   = useState('')
  const [source,   setSource]   = useState('')
  const [category, setCategory] = useState('')
  const [sortKey,  setSortKey]  = useState('yes')
  const [sortDir,  setSortDir]  = useState('asc')

  const { markets, loading, error, lastFetch, refresh } = useMarkets(
    { source: source || undefined, category: category || undefined, search: search || undefined }
  )

  const sort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...markets].sort((a, b) => {
    const va = sortKey === 'yes' ? a.contract.yes : sortKey === 'no' ? a.contract.no : (a[sortKey] || '')
    const vb = sortKey === 'yes' ? b.contract.yes : sortKey === 'no' ? b.contract.no : (b[sortKey] || '')
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  const Th = ({ k, label }) => (
    <th onClick={() => sort(k)} style={{ cursor: 'pointer', userSelect: 'none', padding: '0.5rem 0.75rem', textAlign: k === 'yes' || k === 'no' ? 'right' : 'left', whiteSpace: 'nowrap' }}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Markets</h2>
          {lastFetch && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>updated {lastFetch.toLocaleTimeString()}</p>}
        </div>
        <button className="btn btn-ghost" onClick={refresh} disabled={loading} style={{ fontSize: '0.8rem' }}>
          {loading ? 'loading…' : '⟳ refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="search markets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '160px', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
        />
        <select value={source} onChange={e => setSource(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.85rem' }}>
          <option value="">all sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="category…" value={category} onChange={e => setCategory(e.target.value)}
          style={{ width: '120px', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }}
        />
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <Th k="source"   label="Source" />
              <Th k="category" label="Category" />
              <Th k="title"    label="Market" />
              <Th k="yes"      label="YES" />
              <Th k="no"       label="NO" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={`${m.source}-${m.id}`}
                style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)' }}
              >
                <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: SOURCE_COLORS[m.source] || 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {m.source}
                  </span>
                </td>
                <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {m.category}
                </td>
                <td style={{ padding: '0.45rem 0.75rem', maxWidth: '400px' }}>
                  <a href={m.url} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--text)', textDecoration: 'none' }}
                    title={m.title}
                  >
                    {m.title.length > 60 ? m.title.slice(0, 60) + '…' : m.title}
                  </a>
                </td>
                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}>
                  {(m.contract.yes * 100).toFixed(1)}¢
                </td>
                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>
                  {(m.contract.no * 100).toFixed(1)}¢
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sorted.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.875rem' }}>
            No markets found.
          </p>
        )}
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {sorted.length} markets · auto-refreshes every 60s
      </p>
    </div>
  )
}
