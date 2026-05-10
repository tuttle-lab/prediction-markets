import { useState, useEffect } from 'react'

const THEMES = ['light', 'dark', 'amber']
const STORAGE_KEY = 'ks-theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES.includes(saved)) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const cycle = () => setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])

  return { theme, setTheme, cycle, themes: THEMES }
}
