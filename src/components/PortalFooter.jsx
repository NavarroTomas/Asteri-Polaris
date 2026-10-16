import { Link } from 'react-router-dom'
import { SOCIAL_LINKS } from '../config/socialLinks'
import wordmark from '../assets/brand/asteri-wordmark-wide.png'
export default function PortalFooter() {
  return <footer className="ap-footer">
    <Link to="/" aria-label="ASTERI Polaris, inicio"><img src={wordmark} alt="ASTERI Polaris" /></Link>
    <p>Equipo argentino de Counter-Strike 2.</p>
    <a href={SOCIAL_LINKS.discord} target="_blank" rel="noreferrer">Sumate a la comunidad </a>
    <span>© {new Date().getFullYear()} ASTERI POLARIS</span>
  </footer>
}
