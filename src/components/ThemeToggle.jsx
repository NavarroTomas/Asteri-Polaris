import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'
  return <button type="button" className="ap-theme-float" onClick={toggleTheme} aria-label={label} title={label} aria-pressed={theme === 'dark'}>
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" /></svg>
  </button>
}
