import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { opponentLabel, usePublishedMatches } from '../hooks/usePublishedMatches'
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../lib/siteSettings'

export default function MediaPage() {
  const { matches, status, retry } = usePublishedMatches()
  const [limit, setLimit] = useState(6)
  const [video, setVideo] = useState(import.meta.env.VITE_HERO_VIDEO_URL || DEFAULT_SITE_SETTINGS.hero_video_url)
  useEffect(() => {
    let alive = true
    getSiteSettings().then(settings => { if (alive) setVideo(settings.hero_video_url) }).catch(() => {})
    return () => { alive = false }
  }, [])
  const vods = matches.filter(match => match.status === 'JUGADO' && match.slug && (match.youtube || match.downloadUrl)).sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  return <PortalPage title="MEDIA" intro="Videos del equipo y grabaciones de partidos publicados."><section className="pp-section"><div className="pp-section-title"><h2>PRESENTACIÓN</h2></div><div className="pp-video-feature"><video key={video} src={video} controls playsInline preload="metadata" aria-label="Video de presentación de ASTERI" /><div><h3>Contenido y partidas</h3><Link to="/historia" className="pp-inline-link">CONOCÉ NUESTRA HISTORIA </Link></div></div></section><section className="pp-section"><div className="pp-section-title"><h2>ÚLTIMOS VODS</h2></div><PageState status={status} retry={retry} empty={!vods.length ? 'Todavía no hay videos de partidos publicados.' : null}><div className="pp-media-grid">{vods.slice(0, limit).map(match => <Link className="pp-vod-card" to={match.vod} key={match.id}><div><h3>ASTERI vs {opponentLabel(match.opponent)}</h3><span className="pp-inline-link">VER PARTIDO </span></div></Link>)}</div>{vods.length > limit && <button className="pp-more" onClick={() => setLimit(value => value + 6)}>MOSTRAR MÁS VIDEOS </button>}</PageState></section></PortalPage>
}
