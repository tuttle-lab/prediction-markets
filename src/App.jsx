import './styles/global.css'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { SearchView } from './components/SearchView'
import { StatusBar } from './components/StatusBar'

export default function App() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header theme={theme} setTheme={setTheme} themes={themes} />

      <main className="container" style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <SearchView />
      </main>

      <StatusBar theme={theme} />
    </div>
  )
}
