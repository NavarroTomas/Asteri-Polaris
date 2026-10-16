import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import PortalFooter from '../components/PortalFooter'
import asteriA from '../assets/brand/asteri-a.png'
import polarisStar from '../assets/brand/polaris-star.png'
import { SOCIAL_LINKS } from '../config/socialLinks'
import { APPLICATION_URL } from '../config/application'
import { getHomeMatches } from '../lib/homeMatches'
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/siteSettings'
import './HomePage.css'

const channels = [
  ['IG', 'Instagram', 'El día a día del equipo', SOCIAL_LINKS.instagram],
  ['X', 'X / Twitter', 'Novedades de ASTERI', SOCIAL_LINKS.x],
  ['DC', 'Discord', 'Nuestra comunidad', SOCIAL_LINKS.discord],
  ['F', 'FACEIT', 'Jugá con la comunidad', SOCIAL_LINKS.faceit],
]

function MatchList({ matches, status, retry, replays }) {
  if (status === 'loading') return <div className="ap-empty" role="status">Cargando partidos…</div>
  if (status === 'error') return <div className="ap-empty" role="status"><strong>No pudimos cargar la agenda.</strong><p>Intentá nuevamente en unos instantes.</p><button className="ap-text-button" onClick={retry}>Reintentar →</button></div>
  if (!matches.length) return <div className="ap-empty"><span className="ap-empty-symbol" aria-hidden="true">↗</span><strong>{replays ? 'El juego queda para volver a verlo.' : 'La próxima cita está por llegar.'}</strong><p>{replays ? 'Los VODs aparecerán acá cuando estén publicados.' : 'Los próximos partidos aparecerán acá cuando estén confirmados.'}</p></div>
  return <div className="ap-match-list">{matches.map(match => <Link className="ap-match" key={match.id} to={match.vod}>
    <span className="ap-match-date"><strong>{match.date}</strong><small>{replays ? 'FINALIZADO' : match.time === '—' ? 'Hora a confirmar' : `${match.time} h · ARG`}</small></span>
    <span className="ap-match-teams"><img src={asteriA} alt="" /><b>ASTERI</b><em>{replays ? match.score || 'vs' : 'vs'}</em><b>{match.opponent}</b></span>
    <span className="ap-match-meta">{match.competition}<small>{replays ? 'Ver VOD ↗' : 'Ver partido ↗'}</small></span>
  </Link>)}</div>
}

export default function HomePage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (hash === '#plantel') navigate('/equipo', { replace: true })
    if (hash === '#historia') navigate('/historia', { replace: true })
  }, [hash, navigate])
  const [matches, setMatches] = useState([])
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [tab, setTab] = useState('upcoming')
  const [video, setVideo] = useState(import.meta.env.VITE_HERO_VIDEO_URL || DEFAULT_SITE_SETTINGS.hero_video_url)
  useEffect(() => {
    let alive = true
    setStatus('loading')
    getHomeMatches().then(data => { if (alive) { setMatches(data); setStatus('ready') } }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])
  useEffect(() => {
    let alive = true
    getSiteSettings().then(settings => { if (alive) setVideo(settings.hero_video_url) }).catch(() => {})
    return () => { alive = false }
  }, [])
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const upcoming = matches.filter(match => match.status === 'PRÓXIMO' && match.dateISO >= today && match.slug).slice(0, 3)
  const replays = matches.filter(match => match.status === 'JUGADO' && match.slug).sort((a, b) => b.dateISO.localeCompare(a.dateISO)).slice(0, 3)
  return <div className="ap-home" id="inicio">
    <Header />
    <main className="ap-home-main" id="contenido" tabIndex={-1}>
      <div className="ap-page-heading"><div><span className="ap-eyebrow">DREAM. COMPETE. EVOLVE.</span><h1>EL PUNTO DE <span>ENCUENTRO.</span></h1></div><span className="ap-heading-mark">ASTERI / CS2 <i aria-hidden="true">✦</i></span></div>
      <div className="ap-home-grid">
        <div className="ap-main-column">
          <section className="ap-recruit" id="postulate" aria-labelledby="recruit-title">
            <div className="ap-recruit-art" aria-hidden="true"><span className="ap-orbit ap-orbit-one" /><span className="ap-orbit ap-orbit-two" /><img src={asteriA} alt="" /><span className="ap-art-label">EST. ARGENTINA<br />COUNTER-STRIKE 2</span></div>
            <div className="ap-recruit-copy"><span className="ap-tag">FORMÁ PARTE DE ASTERI</span><h2 id="recruit-title">TU PRÓXIMO<br />NIVEL <span>EMPIEZA<br />ACÁ.</span></h2><p>La ambición nos une. Postulate al equipo y compartí tu perfil con el staff.</p><a className="ap-button" href={APPLICATION_URL} target="_blank" rel="noreferrer">COMPLETAR INSCRIPCIÓN <span aria-hidden="true">↗</span></a><small>Postulación al equipo · Formulario externo</small></div>
          </section>
          <section className="ap-section" id="novedades" aria-labelledby="updates-title">
            <div className="ap-section-heading"><h2 id="updates-title">EN EL RADAR<span>01</span></h2><span>LO IMPORTANTE, ACÁ.</span></div>
            <div className="ap-updates">
              <a className="ap-update-card" href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer"><span className="ap-eyebrow">NOVEDADES / CANAL OFICIAL</span><h3>Seguí cada paso<br />de ASTERI.</h3><p>Los anuncios y novedades del equipo, en nuestro canal oficial.</p><span className="ap-card-link">SEGUIR EN X <b>↗</b></span></a>
              <Link className="ap-update-card ap-team-card" to="/equipo"><img src={polarisStar} alt="" /><span className="ap-eyebrow">IDENTIDAD / EQUIPO</span><h3>Un equipo.<br />El mismo norte.</h3><p>Conocé al plantel y la historia detrás de Polaris.</p><span className="ap-card-link">CONOCÉ ASTERI <b>↗</b></span></Link>
            </div>
          </section>
          <section className="ap-section" id="partidos" aria-labelledby="matches-title">
            <div className="ap-section-heading"><h2 id="matches-title">EN EL SERVIDOR<span>02</span></h2><span>COUNTER-STRIKE 2</span></div>
            <div className="ap-match-panel"><div className="ap-tabs" role="group" aria-label="Mostrar partidos"><button aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>PRÓXIMOS PARTIDOS</button><button aria-pressed={tab === 'replays'} onClick={() => setTab('replays')}>ÚLTIMOS VODS</button></div><MatchList matches={tab === 'upcoming' ? upcoming : replays} status={status} retry={() => setAttempt(value => value + 1)} replays={tab === 'replays'} /><Link className="ap-calendar-link" to="/partidos">VER CALENDARIO COMPLETO Y RESULTADOS <span>↗</span></Link></div>
          </section>
          <section className="ap-section" id="media" aria-labelledby="media-title">
            <div className="ap-section-heading"><h2 id="media-title">DENTRO DE ASTERI<span>03</span></h2><span>MEDIA / EQUIPO</span></div>
            <div className="ap-media-card"><video key={video} src={video} controls playsInline preload="metadata" aria-label="Video de presentación de ASTERI" /><div><span className="ap-eyebrow">NUESTRA IDENTIDAD</span><h3>Esto es ASTERI.</h3><p>Conocé el equipo desde adentro.</p><Link className="ap-card-link" to="/historia">NUESTRA HISTORIA <b>↗</b></Link></div></div>
          </section>
        </div>
        <aside className="ap-sidebar" id="comunidad" aria-label="Comunidad y canales oficiales">
          <section className="ap-channels"><span className="ap-eyebrow">CONECTÁ CON EL EQUIPO</span><h2>NUESTROS<br />CANALES<span>↗</span></h2><div>{channels.map(([icon, title, description, href]) => <a className="ap-channel" href={href} key={title} target="_blank" rel="noreferrer"><span className="ap-channel-icon" aria-hidden="true">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><b aria-hidden="true">↗</b></a>)}</div><p>Una misma pasión.<br /><strong>Dentro y fuera del servidor.</strong></p></section>
          <section className="ap-discord"><span className="ap-eyebrow">EL EQUIPO TAMBIÉN SOS VOS</span><span className="ap-discord-symbol" aria-hidden="true">✳</span><h2>HAY LUGAR<br />PARA VOS.</h2><p>Compartí partidas, charlas y todo lo que nos mueve.</p><a className="ap-button" href={SOCIAL_LINKS.discord} target="_blank" rel="noreferrer">ENTRAR AL DISCORD <span>↗</span></a></section>
          <div className="ap-sidebar-note"><img src={polarisStar} alt="" /><span>SIEMPRE<br /><strong>HACIA ARRIBA.</strong></span></div>
        </aside>
      </div>
    </main>
    <PortalFooter />
  </div>
}
