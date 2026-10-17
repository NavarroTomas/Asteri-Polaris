import Header from './Header'
import { useLocation } from 'react-router-dom'
import Mascot from './Mascot'
import SidebarPromotions from './SidebarPromotions'
import PortalFooter from './PortalFooter'
import { SOCIAL_LINKS } from '../config/socialLinks'
import './PortalPages.css'

export const CHANNELS = [
  ['IG', 'Instagram', 'Fotos y publicaciones', SOCIAL_LINKS.instagram],
  ['X', 'X / Twitter', 'Anuncios', SOCIAL_LINKS.x],
  ['DC', 'Discord', 'Conversaciones y partidas', SOCIAL_LINKS.discord],
  ['F', 'FACEIT', 'Club de CS2', SOCIAL_LINKS.faceit],
]

export function ChannelPanel() {
  return <section className="pp-channels"><h2>REDES SOCIALES </h2>{CHANNELS.map(([icon, name, text, href]) => <a key={name} className="pp-channel" href={href} target="_blank" rel="noreferrer"><div><strong>{name}</strong><small>{text}</small></div></a>)}</section>
}

export function PageAside() {
  return <><ChannelPanel /><SidebarPromotions /></>
}

export function PageState({ status, retry, empty, children }) {
  if (status === 'loading') return <div className="pp-empty" role="status">Cargando contenido…</div>
  if (status === 'error') return <div className="pp-empty" role="status"><h3>No pudimos cargar el contenido.</h3><p>Intentá nuevamente en unos instantes.</p><button className="ap-button" onClick={retry}>REINTENTAR </button></div>
  if (empty) return <div className="pp-empty"><h3>{empty}</h3><p>Las publicaciones confirmadas aparecerán acá.</p></div>
  return children
}

export default function PortalPage({ title, intro, children, aside = true }) {
  const { pathname } = useLocation()
  const pose = { '/partidos': 'matches', '/torneos': 'tournaments', '/equipo': 'team', '/nosotros': 'about', '/comunidad': 'community', '/contacto': 'contact', '/inscripcion': 'application' }[pathname.replace(/\/$/, '')]
  return <div className="pp-page"><Header /><main id="contenido" tabIndex={-1} className="pp-shell"><div className={aside ? 'pp-layout' : 'pp-layout pp-layout-wide'}><div className="pp-content"><div className={pose ? 'pp-heading pp-heading-with-mascot' : 'pp-heading'}><div><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{pose && <Mascot pose={pose} priority />}</div>{children}</div>{aside && <aside className="pp-aside" aria-label="Canales y comunidad"><PageAside /></aside>}</div></main><PortalFooter /></div>
}
