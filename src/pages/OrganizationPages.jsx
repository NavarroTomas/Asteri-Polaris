import { Link } from 'react-router-dom'
import PortalPage, { CHANNELS } from '../components/PortalPage'
import { APPLICATION_URL } from '../config/application'
import { SOCIAL_LINKS } from '../config/socialLinks'
import classic from '../assets/brand/polaris-classic.png'
import star from '../assets/brand/polaris-star.png'
import asteriA from '../assets/brand/asteri-a.png'

const eras = [
  { label: '01 / PRIMER ESCUDO', title: 'ASTERI POLARIS', logo: classic, text: 'El primer escudo nace de una idea simple: nunca dejar de mirar hacia arriba. La figura central representa los sueños, la ambición y la voluntad de seguir superándose; las estrellas simbolizan esas metas que solo se alcanzan con trabajo, perseverancia y la decisión de ir siempre un poco más lejos.' },
  { label: '02 / SEGUNDO ESCUDO', title: 'ESTRELLA POLAR', logo: star, text: 'La segunda identidad toma una representación directa de la Estrella Polar. Durante siglos fue una referencia para encontrar el rumbo incluso en la oscuridad; para ASTERI representa una dirección clara, una guía constante y una meta que nunca se deja de perseguir.' },
  { label: '03 / ESCUDO ACTUAL', title: 'ASTERI', logo: asteriA, text: 'El escudo actual representa la evolución de ASTERI sin borrar su origen. Conserva los valores que dieron forma a Polaris y los transforma en una identidad más moderna, competitiva y reconocible: un símbolo propio para afrontar cada nuevo desafío.' },
]

export function HistoryPage() {
  return <PortalPage title="NUESTRA HISTORIA" intro="La identidad evoluciona. El rumbo se mantiene."><div className="pp-history" id="historia">{eras.map(era => <article key={era.title} className="pp-history-card"><div><img src={era.logo} alt={`Escudo ${era.title}`} /></div><div><span className="pp-kicker">{era.label}</span><h2>{era.title}</h2><p>{era.text}</p></div></article>)}</div><blockquote className="pp-quote"><span className="pp-kicker">FUNDADOR / VISIÓN</span><p>“Creé ASTERI POLARIS para construir un proyecto competitivo que pudiera crecer y mantenerse en el tiempo. Más allá de los torneos, la idea siempre fue formar una base sólida, desarrollar jugadores y evolucionar sin perder nuestra identidad.”</p><cite>ASTERI POLARIS</cite></blockquote></PortalPage>
}

export function AboutPage() {
  return <PortalPage title="SOMOS ASTERI" intro="Un proyecto argentino de Counter-Strike 2. Ambición, identidad y un mismo norte."><div className="pp-about-hero"><img src={asteriA} alt="" /><span className="pp-kicker">DREAM. COMPETE. EVOLVE.</span><h2>SIEMPRE<br />HACIA ARRIBA.</h2><p>Conocé al equipo, descubrí nuestra historia y encontrá tu lugar en la comunidad.</p></div><div className="pp-link-grid">{[['HISTORIA', 'La evolución de nuestra identidad.', '/historia'], ['EQUIPO', 'Los jugadores que nos representan.', '/equipo'], ['COMUNIDAD', 'Los canales que nos conectan.', '/comunidad'], ['CONTACTO', 'Hablemos del próximo paso.', '/contacto']].map(([title, copy, href]) => <Link key={href} className="pp-link-card" to={href}><h2>{title} ↗</h2><p>{copy}</p></Link>)}</div></PortalPage>
}

export function CommunityPage() {
  return <PortalPage title="COMUNIDAD" intro="El equipo también sos vos. Encontranos dentro y fuera del servidor." aside={false}><div className="pp-community-hero"><div><span className="pp-kicker">COMPARTIMOS EL MISMO NORTE</span><h2>HAY LUGAR<br />PARA VOS.</h2><p>Partidas, charlas y novedades. Sumate a nuestra comunidad en Discord.</p><a className="ap-button" href={SOCIAL_LINKS.discord} target="_blank" rel="noreferrer">ENTRAR AL DISCORD <span>↗</span></a></div><span aria-hidden="true">✳</span></div><div className="pp-community-grid">{CHANNELS.map(([icon, name, copy, href]) => <a className="pp-link-card" key={name} href={href} target="_blank" rel="noreferrer"><span className="pp-community-icon">{icon}</span><h2>{name} ↗</h2><p>{copy}</p></a>)}</div></PortalPage>
}

export function ContactPage() {
  return <PortalPage title="CONTACTO" intro="Hablemos del próximo paso."><div className="pp-contact-card"><span className="pp-kicker">CONTACTO DEL EQUIPO</span><h2>CONSTRUYAMOS<br />LO QUE VIENE.</h2><p>Para consultas sobre ASTERI POLARIS, escribinos al correo del equipo.</p><a className="pp-contact-email" href="mailto:nachoalvarezcs2@gmail.com">nachoalvarezcs2@gmail.com ↗</a></div><div className="pp-link-grid"><Link className="pp-link-card" to="/inscripcion"><h2>QUIERO POSTULARME ↗</h2><p>Conocé cómo enviar tu perfil al staff.</p></Link><Link className="pp-link-card" to="/comunidad"><h2>BUSCO LA COMUNIDAD ↗</h2><p>Encontrá nuestros canales oficiales.</p></Link></div></PortalPage>
}

export function ApplicationPage() {
  return <PortalPage title="INSCRIPCIÓN" intro="Tu próximo nivel empieza acá."><section className="pp-application"><span className="pp-kicker">POSTULACIÓN AL EQUIPO</span><h2>COMPETÍ<br />CON ASTERI.</h2><p>¿Querés formar parte de ASTERI POLARIS? Completá el formulario de postulación y compartí tu perfil para que el staff pueda revisarlo.</p><ol><li><strong>Contanos quién sos.</strong><span>Presentá tu perfil en el formulario de postulación.</span></li><li><strong>Compartí tu experiencia.</strong><span>Completá los datos solicitados sobre tu recorrido.</span></li><li><strong>Enviá tu postulación.</strong><span>El staff podrá revisar la información que compartas.</span></li></ol><a className="ap-button" href={APPLICATION_URL} target="_blank" rel="noreferrer">COMPLETAR POSTULACIÓN <span>↗</span></a><small>El formulario se abre en una nueva pestaña.</small></section></PortalPage>
}
