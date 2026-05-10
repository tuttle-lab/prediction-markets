import { ThemeToggle } from './ThemeToggle'

export function Header({ theme, setTheme, themes }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      padding: '0.75rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--accent)' }}>
          PREDICTION MARKETS
        </span>
        <ThemeToggle theme={theme} setTheme={setTheme} themes={themes} />
      </div>
    </header>
  )
}
