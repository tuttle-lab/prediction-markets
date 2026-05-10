import { useState } from 'react'
import { useApi } from '../hooks/useApi'

export function ArbPanel() {
  const [idA, setIdA]     = useState('')
  const [idB, setIdB]     = useState('')
  const [result, setResult] = useState(null)
  const { get, loading, error } = useApi()

  const check = async () => {
    setResult(null)
    const data = await get(`/arb?a=${encodeURIComponent(idA)}&b=${encodeURIComponent(idB)}`)
    setResult(data)
  }

  const opp = result?.opportunity

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Arb Calculator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Enter two market IDs for the same event on different platforms.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input placeholder="Market A — ID or URL"
          value={idA} onChange={e => setIdA(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
        />
        <input placeholder="Market B — ID or URL"
          value={idB} onChange={e => setIdB(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
        />
        <button className="btn btn-primary" onClick={check} disabled={loading || !idA || !idB}>
          {loading ? '…' : 'Check arb'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}

      {result && (
        opp ? (
          <div style={{ background: 'var(--bg-elevated)', border: `1px solid var(--success)`, borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge ok">arb found</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                +{opp.profit_pct.toFixed(2)}% guaranteed
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>Buy <strong>YES</strong> on <span style={{ color: 'var(--accent)' }}>{opp.buy_yes_on}</span> @ {(opp.yes_price * 100).toFixed(1)}¢</div>
              <div>Buy <strong>NO</strong>  on <span style={{ color: 'var(--accent)' }}>{opp.buy_no_on}</span> @ {(opp.no_price * 100).toFixed(1)}¢</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Total cost: {((opp.yes_price + opp.no_price) * 100).toFixed(1)}¢ → collect 100¢
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <a href={opp.url_a} target="_blank" rel="noreferrer" style={{ marginRight: '1rem' }}>{opp.source_a} ↗</a>
              <a href={opp.url_b} target="_blank" rel="noreferrer">{opp.source_b} ↗</a>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
            <span className="badge">no arb</span>
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {result.error || 'No arbitrage opportunity between these markets.'}
            </span>
          </div>
        )
      )}
    </div>
  )
}
