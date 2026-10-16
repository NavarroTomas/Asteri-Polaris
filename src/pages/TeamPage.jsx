import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { getRosterPlayers } from '../lib/rosterPlayers'
import { CHANNELS } from '../components/PortalPage'
import asteriA from '../assets/brand/asteri-a.png'

export default function TeamPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => { if (hash === '#historia') navigate('/historia', { replace: true }) }, [hash, navigate])
  const [players, setPlayers] = useState([])
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setStatus('loading')
    getRosterPlayers().then(data => { if (alive) { setPlayers(data); setStatus('ready') } }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])
  return <PortalPage title="PLANTEL" aside={false}>

    <section className="pp-team-feature" id="plantel"><div className="pp-team-heading"><div><h2>Counter-Strike 2</h2></div><Link className="ap-button" to="/historia">NUESTRA HISTORIA </Link></div><div className="pp-team-socials">{CHANNELS.map(([icon, name, , href]) => <a key={name} href={href} target="_blank" rel="noreferrer">{name} </a>)}</div>
      <PageState status={status} retry={() => setAttempt(value => value + 1)} empty={!players.length ? 'Todavía no hay jugadores publicados.' : null}><div className="pp-roster">{players.map(player => <Link key={player.slug} className="pp-player" to={`/players/${player.slug}`}><div className="pp-player-photo"><img src={player.image || asteriA} alt={player.nickname} loading="lazy" /></div><div className="pp-player-copy"><h3>{player.nickname}</h3>{player.name && <p>{player.name}</p>}<div><span>{player.age !== '—' ? `${player.age} años` : 'ASTERI'}</span><b>{player.role}</b></div><small>VER FICHA DEL JUGADOR </small></div></Link>)}</div></PageState>
    </section>

  </PortalPage>
}
