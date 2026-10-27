import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import PortalFooter from '../components/PortalFooter'
import { SOCIAL_LINKS } from '../config/socialLinks'
import { APPLICATION_URL } from '../config/application'
import { getHomeMatches } from '../lib/homeMatches'
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/siteSettings'
import './HomePage.css'
import Mascot from '../components/Mascot'
import SidebarPromotions from '../components/SidebarPromotions'
import HomeExtras, { LatestMatch } from '../components/HomeExtras'
import HomeIntroduction from '../components/HomeIntroduction'
import HomeClips from '../components/HomeClips'

const channels = [
  ['IG', 'Instagram', 'Fotos y publicaciones', SOCIAL_LINKS.instagram],
  ['X', 'X / Twitter', 'Anuncios', SOCIAL_LINKS.x],
  ['DC', 'Discord', 'Conversaciones y partidas', SOCIAL_LINKS.discord],
  ['F', 'FACEIT', 'Club de CS2', SOCIAL_LINKS.faceit],
]

function MatchList({ matches, status, retry, replays }) {
  if (status === 'loading') return <div className="ap-empty" role="status">Cargando partidos…</div>
  if (status === 'error') return <div className="ap-empty" role="status"><strong>No pudimos cargar la agenda.</strong><p>Intentá nuevamente en unos instantes.</p><button className="ap-text-button" onClick={retry}>Reintentar </button></div>
  if (!matches.length) return <div className="ap-empty"><strong>{replays ? 'Todavía no hay VODs publicados.' : 'No hay próximos partidos confirmados.'}</strong><p>{replays ? 'Los VODs aparecerán acá cuando estén publicados.' : 'Los próximos partidos aparecerán acá cuando estén confirmados.'}</p></div>
  return <div className="ap-match-list">{matches.map(match => <Link className="ap-match" key={match.id} to={match.vod}>
    <span className="ap-match-date"><strong>{match.date}</strong><small>{replays ? 'FINALIZADO' : match.time === '—' ? 'Hora a confirmar' : `${match.time} h · ARG`}</small></span>
    <span className="ap-match-teams"><b>ASTERI</b><em>{replays ? match.score || 'vs' : 'vs'}</em><b>{match.opponent}</b></span>
    <span className="ap-match-meta">{match.competition}<small>{replays ? 'Ver VOD ' : 'Ver partido '}</small></span>
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
  const latestMatch = matches.filter(match => match.status === 'JUGADO').sort((a,b) => b.dateISO.localeCompare(a.dateISO) || b.time.localeCompare(a.time))[0]
  return <div className="ap-home" id="inicio">
    <Header />
    <main className="ap-home-main" id="contenido" tabIndex={-1}>
      <div className="ap-home-grid">
        <div className="ap-main-column">
          <section className="ap-recruit" id="postulate" aria-labelledby="recruit-title">
            <div className="ap-recruit-copy"><h1 id="recruit-title">Sumate al plantel</h1><p>Contanos sobre tu experiencia y compartí tu perfil con el staff.</p><a className="ap-button" href={APPLICATION_URL} target="_blank" rel="noreferrer">ABRIR FORMULARIO</a><small>Se abre en una nueva pestaña.</small></div>
            <div className="ap-mascot-stage"><Mascot pose="welcome" priority /></div>
          </section>
          <section className="ap-section" id="novedades" aria-labelledby="updates-title">
            <div className="ap-section-heading"><h2 id="updates-title">NOVEDADES</h2></div>
            <div className="ap-updates">
              <a className="ap-update-card" href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer"><h3>Comunicados</h3><p>Anuncios y cambios publicados en X.</p><span className="ap-card-link">VER PUBLICACIONES</span></a>
              <Link className="ap-update-card ap-team-card" to="/equipo"><h3>Jugadores</h3><p>Roles y fichas individuales.</p><span className="ap-card-link">VER PLANTEL</span></Link>
            </div>
          </section>
          <LatestMatch match={latestMatch} status={status} retry={() => setAttempt(value => value + 1)} />
          <section className="ap-section" id="partidos" aria-labelledby="matches-title">
            <div className="ap-section-heading"><h2 id="matches-title">PARTIDOS</h2></div>
            <div className="ap-match-panel"><div className="ap-tabs" role="group" aria-label="Mostrar partidos"><button aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>PRÓXIMOS PARTIDOS</button><button aria-pressed={tab === 'replays'} onClick={() => setTab('replays')}>ÚLTIMOS VODS</button></div><MatchList matches={tab === 'upcoming' ? upcoming : replays} status={status} retry={() => setAttempt(value => value + 1)} replays={tab === 'replays'} /><Link className="ap-calendar-link" to="/partidos">VER CALENDARIO COMPLETO Y RESULTADOS </Link></div>
          </section>
          <HomeClips fallbackVideoUrl={video} />
          <HomeIntroduction />
          <HomeExtras />
        </div>
        <aside className="ap-sidebar" id="comunidad" aria-label="Comunidad y canales oficiales">
          <section className="ap-channels"><h2>REDES SOCIALES</h2><div>{channels.map(([icon, title, description, href]) => <a className="ap-channel" href={href} key={title} target="_blank" rel="noreferrer"><span><strong>{title}</strong><small>{description}</small></span></a>)}</div></section>
          <SidebarPromotions />
        </aside>
      </div>
    </main>
    <PortalFooter />
  </div>
}
