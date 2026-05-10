import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/useApi'

const SOURCE_COLORS = {
  polymarket: '#8b5cf6',
  predictit:  '#f59e0b',
  manifold:   '#10b981',
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

function fmt(p) { return (p * 100).toFixed(1) + '¢' }
function fmtM(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'k'
  return '$' + n.toFixed(0)
}

function GapBadge({ gap }) {
  if (Math.abs(gap) < 0.02) return <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>~</span>
  const pct   = (gap * 100).toFixed(1)
  const below = gap < 0
  const color = below ? 'var(--success)' : 'var(--error)'
  const label = below ? `↑ ${Math.abs(pct)}% under` : `↓ ${Math.abs(pct)}% over`
  return (
    <span style={{
      color, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
      padding: '0.1rem 0.35rem', borderRadius: '4px',
      background: below ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function MatchRow({ m }) {
  const color = SOURCE_COLORS[m.source] || '#6b7280'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
      <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, minWidth: '5.5rem' }}>{m.source}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', minWidth: '3rem' }}>{fmt(m.yes)}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)', minWidth: '3rem' }}>{fmt(m.no)}</span>
      <span style={{ color: 'var(--text-muted)', minWidth: '4rem', fontSize: '0.7rem' }}>{fmtM(m.liquidity)}</span>
      <a href={m.url} target="_blank" rel="noreferrer"
        style={{ color: 'var(--text-muted)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={m.title}
      >
        {m.title}
      </a>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: '3rem', textAlign: 'right' }}>
        {(m.similarity * 100).toFixed(0)}% match
      </span>
    </div>
  )
}

function ConsensusRow({ row }) {
  const [open, setOpen] = useState(false)
  const gap = row.gap

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '0.4rem' }}>
      {/* Summary row — div not button so <a> nesting is valid HTML */}
      <div role="button" tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'var(--bg-elevated)',
          cursor: 'pointer', padding: '0.6rem 0.75rem',
          display: 'grid', alignItems: 'center', color: 'var(--text)',
          gridTemplateColumns: '1fr auto auto auto auto auto',
          gap: '0.75rem',
        }}
      >
        {/* Title */}
        <div style={{ overflow: 'hidden' }}>
          <a href={row.url} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 500 }}
          >
            {(row.title || '').length > 72 ? row.title.slice(0, 72) + '…' : row.title}
          </a>
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.63rem', padding: '0.05rem 0.3rem', borderRadius: '3px', background: (CATEGORY_COLORS[row.category] || '#6b7280') + '22', color: CATEGORY_COLORS[row.category] || '#6b7280', fontFamily: 'var(--font-mono)' }}>
              {row.category}
            </span>
            {row.sources.map(s => (
              <span key={s} style={{ fontSize: '0.63rem', padding: '0.05rem 0.3rem', borderRadius: '3px', background: (SOURCE_COLORS[s] || '#6b7280') + '22', color: SOURCE_COLORS[s] || '#6b7280', fontFamily: 'var(--font-mono)' }}>{s}</span>
            ))}
            {row.sources.length === 1 && row.sources[0] === 'manifold' && (
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>play $</span>
            )}
          </div>
        </div>

        {/* Kalshi price */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kalshi</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>{fmt(row.kalshi_yes)}</div>
        </div>

        {/* Consensus */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>consensus</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{fmt(row.consensus)}</div>
        </div>

        {/* Gap */}
        <GapBadge gap={gap} />

        {/* Confidence */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>conf</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{(row.confidence * 100).toFixed(0)}%</div>
        </div>

        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {/* Interpretation */}
          <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${gap < 0 ? 'var(--success)' : gap > 0 ? 'var(--error)' : 'var(--border)'}` }}>
            {Math.abs(gap) < 0.02
              ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kalshi is priced in line with external consensus.</span>
              : gap < 0
                ? <span style={{ fontSize: '0.8rem' }}>
                    External markets price YES at <strong>{fmt(row.consensus)}</strong> — Kalshi is <strong style={{ color: 'var(--success)' }}>{Math.abs((gap * 100)).toFixed(1)}¢ cheaper</strong>. Potential <strong>BUY YES</strong> on Kalshi.
                  </span>
                : <span style={{ fontSize: '0.8rem' }}>
                    External markets price YES at <strong>{fmt(row.consensus)}</strong> — Kalshi is <strong style={{ color: 'var(--error)' }}>{(gap * 100).toFixed(1)}¢ higher</strong>. Potential <strong>BUY NO</strong> on Kalshi.
                  </span>
            }
          </div>

          {/* Matched markets table */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'grid', gridTemplateColumns: '5.5rem 3rem 3rem 4rem 1fr 4rem', gap: '0.75rem' }}>
            <span>source</span><span>YES</span><span>NO</span><span>liquidity</span><span>title</span><span style={{ textAlign: 'right' }}>match</span>
          </div>
          {row.matches.map((m, i) => <MatchRow key={i} m={m} />)}

          {row.kalshi_volume && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Kalshi volume: {fmtM(row.kalshi_volume)} · open interest: {fmtM(row.kalshi_liquidity)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ConsensusTable() {
  const { get, loading, error } = useApi()
  const [rows, setRows]           = useState([])
  const [meta, setMeta]           = useState(null)
  const [threshold, setThreshold] = useState(0.25)
  const [minGap, setMinGap]       = useState(0)
  const [search, setSearch]       = useState('')

  const load = useCallback(async () => {
    const data = await get(`/consensus?threshold=${threshold}&limit=500`)
    if (data?.rows) {
      setRows(data.rows)
      setMeta({ kalshi: data.kalshi_count, other: data.other_count })
    }
  }, [get, threshold])

  useEffect(() => { load() }, [load])

  const visible = rows.filter(r =>
    Math.abs(r.gap) >= minGap &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Kalshi vs. Market Consensus</h1>
          {meta && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
              {meta.kalshi} Kalshi markets · {meta.other} external · {visible.length} with signal
            </p>
          )}
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ fontSize: '0.8rem' }}>
          {loading ? 'loading…' : '⟳ refresh'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="search markets…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '160px', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.85rem' }}
        />
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          min gap
          <input type="range" min="0" max="0.3" step="0.01" value={minGap} onChange={e => setMinGap(parseFloat(e.target.value))} style={{ width: '70px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '2.5rem' }}>{(minGap * 100).toFixed(0)}¢</span>
        </label>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          match threshold
          <input type="range" min="0.1" max="0.5" step="0.05" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} style={{ width: '70px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '2.5rem' }}>{(threshold * 100).toFixed(0)}%</span>
        </label>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

      {!loading && visible.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.875rem' }}>
          No markets found. Try lowering the threshold or gap filter.
        </p>
      )}

      <div>
        {visible.map(row => <ConsensusRow key={row.id} row={row} />)}
      </div>
    </div>
  )
}
