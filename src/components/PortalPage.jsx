import { Link } from 'react-router-dom'
import Header from './Header'
import PortalFooter from './PortalFooter'
import { SOCIAL_LINKS } from '../config/socialLinks'
import './PortalPages.css'

export const CHANNELS = [
  ['IG', 'Instagram', 'El día a día del equipo', SOCIAL_LINKS.instagram],
  ['X', 'X / Twitter', 'Novedades oficiales', SOCIAL_LINKS.x],
  ['DC', 'Discord', 'Nuestra comunidad', SOCIAL_LINKS.discord],
  ['F', 'FACEIT', 'Jugá con la comunidad', SOCIAL_LINKS.faceit],
]

export function ChannelPanel() {
  return <section className="pp-channels"><h2>REDES SOCIALES </h2>{CHANNELS.map(([icon, name, text, href]) => <a key={name} className="pp-channel" href={href} target="_blank" rel="noreferrer"><div><strong>{name}</strong><small>{text}</small></div></a>)}</section>
}

export function PageAside() {
  return <><ChannelPanel /><section className="pp-aside-cta"><h2>POSTULACIÓN<br />AL EQUIPO</h2><p>Compartí tu perfil y postulate al equipo.</p><Link className="ap-button" to="/inscripcion">INSCRIBITE </Link></section></>
}

export function PageState({ status, retry, empty, children }) {
  if (status === 'loading') return <div className="pp-empty" role="status">Cargando contenido…</div>
  if (status === 'error') return <div className="pp-empty" role="status"><h3>No pudimos cargar el contenido.</h3><p>Intentá nuevamente en unos instantes.</p><button className="ap-button" onClick={retry}>REINTENTAR </button></div>
  if (empty) return <div className="pp-empty"><h3>{empty}</h3><p>Encontrá las novedades del equipo en nuestros canales oficiales.</p></div>
  return children
}

export default function PortalPage({ title, intro, children, aside = true }) {
  return <div className="pp-page"><Header /><main id="contenido" tabIndex={-1} className="pp-shell"><div className="pp-heading"><h1>{title}</h1>{intro && <p>{intro}</p>}</div><div className={aside ? 'pp-layout' : 'pp-layout pp-layout-wide'}><div className="pp-content">{children}</div>{aside && <aside className="pp-aside" aria-label="Canales y comunidad"><PageAside /></aside>}</div></main><PortalFooter /></div>
}
