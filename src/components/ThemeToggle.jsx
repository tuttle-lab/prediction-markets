const ICONS = { light: '☀️', dark: '🌙', amber: '⚡' }
const LABELS = { light: 'Light', dark: 'Dark', amber: 'Amber' }

export function ThemeToggle({ theme, setTheme, themes }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem' }}>
      {themes.map(t => (
        <button
          key={t}
          className={`btn btn-ghost${theme === t ? ' active' : ''}`}
          onClick={() => setTheme(t)}
          title={`${LABELS[t]} mode`}
          style={theme === t ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
        >
          {ICONS[t]}
        </button>
      ))}
    </div>
  )
}
