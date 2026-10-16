import { Link } from 'react-router-dom'
import { SOCIAL_LINKS } from '../config/socialLinks'

export default function PortalFooter() {
  return <footer className="ap-footer">
    <div className="ap-footer-grid">
      <div className="ap-footer-identity"><p>Counter-Strike 2<br />Argentina</p></div>
      <nav aria-label="Navegación del pie de página"><h2>Navegación</h2>{[['Inicio','/'],['Partidos','/partidos'],['Torneos','/torneos'],['Equipo','/equipo'],['Media','/media']].map(([label,to]) => <Link to={to} key={to}>{label}</Link>)}</nav>
      <nav aria-label="Información de ASTERI"><h2>Nosotros</h2>{[['Historia','/historia'],['Comunidad','/comunidad'],['Contacto','/contacto'],['Inscripción','/inscripcion']].map(([label,to]) => <Link to={to} key={to}>{label}</Link>)}</nav>
      <nav aria-label="Redes sociales del pie de página"><h2>Redes sociales</h2>{[['Instagram',SOCIAL_LINKS.instagram],['X / Twitter',SOCIAL_LINKS.x],['Discord',SOCIAL_LINKS.discord],['FACEIT',SOCIAL_LINKS.faceit]].map(([label,href]) => <a href={href} target="_blank" rel="noreferrer" key={href}>{label}</a>)}</nav>
    </div>
    <div className="ap-footer-bottom">© {new Date().getFullYear()} ASTERI POLARIS</div>
  </footer>
}
