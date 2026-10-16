import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import asteriA from '../assets/brand/asteri-a.png'
import { useAuth } from '../context/AuthContext'
import { APPLICATION_URL } from '../config/application'
import './Portal.css'

const navigation = [['INICIO', '/'], ['PARTIDOS', '/#partidos'], ['EQUIPO', '/equipo#plantel'], ['HISTORIA', '/equipo#historia'], ['COMUNIDAD', '/#comunidad']]

export default function Header() {
  const { loading, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const toggle = useRef(null)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location.pathname, location.hash])
  useEffect(() => {
    if (!open) return undefined
    const onKey = event => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return <header className="ap-header">
    <a className="ap-skip" href="#contenido">Saltar al contenido</a>
    <div className="ap-topbar"><span>ASTERI <b>POLARIS</b></span><span>COUNTER-STRIKE 2</span><span>ARGENTINA <i aria-hidden="true">✦</i></span></div>
    <div className="ap-nav-shell">
      <Link to="/" className="ap-logo" aria-label="ASTERI Polaris, inicio"><img src={asteriA} alt="" /><span>ASTERI<small>POLARIS</small></span></Link>
      <nav id="ap-navigation" aria-label="Navegación principal" className={`ap-nav ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        {navigation.map(([label, to]) => <Link key={label} to={to} aria-current={location.pathname === to && !location.hash ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <div className="ap-nav-actions">
        {!loading && <Link className="ap-account" to={isAuthenticated ? '/account' : '/login'}>{isAuthenticated ? 'Mi cuenta' : 'Ingresar'}</Link>}
        <a className="ap-button ap-button-small" href={APPLICATION_URL} target="_blank" rel="noreferrer">INSCRIBITE <span aria-hidden="true">↗</span></a>
        <button ref={toggle} className="ap-menu" type="button" aria-controls="ap-navigation" aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(value => !value)}>{open ? '✕' : '☰'}</button>
      </div>
    </div>
  </header>
}
