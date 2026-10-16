import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'asteri-theme'
const ThemeContext = createContext(null)
const validTheme = value => value === 'dark' || value === 'light'

export function initializeTheme() {
  let theme = 'light'
  try { const saved = localStorage.getItem(STORAGE_KEY); if (validTheme(saved)) theme = saved } catch {}
  document.documentElement.dataset.theme = theme
  return theme
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])
  useEffect(() => {
    const sync = event => { if (event.key === STORAGE_KEY) setTheme(validTheme(event.newValue) ? event.newValue : 'light') }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(current => current === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
