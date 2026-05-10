export function StatusBar({ theme }) {
  const now = new Date().toISOString()
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '0.5rem 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>KICKSTART v0.1.0</span>
        <span>theme:{theme} · {now}</span>
      </div>
    </footer>
  )
}
