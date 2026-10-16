import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import asteriA from '../assets/brand/asteri-a.png'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import './Portal.css'

const navigation = [['INICIO', '/'], ['PARTIDOS', '/partidos'], ['TORNEOS', '/torneos'], ['EQUIPO', '/equipo'], ['MEDIA', '/media']]
const organization = [['Nosotros', '/nosotros'], ['Historia', '/historia'], ['Comunidad', '/comunidad'], ['Contacto', '/contacto']]
export default function Header() {
  const { loading, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const toggle = useRef(null)
  const aboutToggle = useRef(null)
  const aboutRoot = useRef(null)
  const location = useLocation()
  const inOrganization = organization.some(([, path]) => path === location.pathname)
  useEffect(() => { setOpen(false); setAboutOpen(false) }, [location.pathname, location.hash])
  useEffect(() => {
    if (!open && !aboutOpen) return undefined
    const onKey = event => {
      if (event.key === 'Escape') {
        if (aboutOpen) { setAboutOpen(false); aboutToggle.current?.focus() }
        else { setOpen(false); toggle.current?.focus() }
      }
    }
    const onOutside = event => { if (!aboutRoot.current?.contains(event.target)) setAboutOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onOutside) }
  }, [open, aboutOpen])
  const close = () => { setOpen(false); setAboutOpen(false) }
  return <header className="ap-header">
    <a className="ap-skip" href="#contenido">Saltar al contenido</a>

    <div className="ap-nav-shell">
      <Link to="/" className="ap-logo" aria-label="ASTERI Polaris, inicio" onClick={close}><img src={asteriA} alt="" /><span>ASTERI<small>POLARIS</small></span></Link>
      <nav id="ap-navigation" aria-label="Navegación principal" className={`ap-nav ${open ? 'is-open' : ''}`}>
        {navigation.map(([label, to]) => <Link key={label} to={to} onClick={close} aria-current={location.pathname === to ? 'page' : undefined}>{label}</Link>)}
        <div className={`ap-about ${inOrganization ? 'is-current' : ''}`} ref={aboutRoot} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAboutOpen(false) }}>
          <Link to="/nosotros" onClick={close} aria-current={location.pathname === '/nosotros' ? 'page' : undefined}>NOSOTROS</Link><button ref={aboutToggle} type="button" aria-label="Secciones de Nosotros" aria-controls="ap-about-links" aria-expanded={aboutOpen} onClick={() => setAboutOpen(value => !value)}>Más</button>
          <div id="ap-about-links" className="ap-about-links" hidden={!aboutOpen}>{organization.filter(([, path]) => path !== '/nosotros').map(([label, to]) => <Link key={to} to={to} onClick={close} aria-current={location.pathname === to ? 'page' : undefined}>{label}</Link>)}</div>
        </div>
        {!loading && <Link className="ap-mobile-account" to={isAuthenticated ? '/account' : '/login'} onClick={close}>{isAuthenticated ? 'Mi cuenta' : 'Ingresar'}</Link>}
      </nav>
      <div className="ap-nav-actions">
        <button className="ap-theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'} aria-pressed={theme === 'dark'}>{theme === 'light' ? 'Oscuro' : 'Claro'}</button>
        {!loading && <Link className="ap-account" to={isAuthenticated ? '/account' : '/login'}>{isAuthenticated ? 'Mi cuenta' : 'Ingresar'}</Link>}
        <Link className="ap-button ap-button-small" to="/inscripcion" onClick={close}>INSCRIBITE </Link>
        <button ref={toggle} className="ap-menu" type="button" aria-controls="ap-navigation" aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(value => !value)}>{open ? 'Cerrar' : 'Menú'}</button>
      </div>
    </div>
  </header>
}
