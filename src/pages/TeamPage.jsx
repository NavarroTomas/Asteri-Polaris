import { optimizedPlayerImage } from '../lib/optimizedPlayerImage'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PortalPage, { PageState, CHANNELS } from '../components/PortalPage'
import { getRosterPlayers } from '../lib/rosterPlayers'
import { getRosters } from '../lib/rosterGroups'
import asteriA from '../assets/brand/asteri-a.webp'
import './TeamGroups.css'

export default function TeamPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  useEffect(() => { if (hash === '#historia') navigate('/historia', { replace: true }) }, [hash, navigate])
  const [players, setPlayers] = useState([])
  const [rosters, setRosters] = useState([])
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setStatus('loading')
    Promise.all([getRosterPlayers(), getRosters(true)]).then(([members, groups]) => { if (alive) { setPlayers(members); setRosters(groups); setStatus('ready') } }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])
  return <PortalPage title="EQUIPO" aside={false}>
    <PageState status={status} retry={() => setAttempt(value => value + 1)} empty={!rosters.length ? 'Todavía no hay planteles publicados.' : null}>
      {rosters.length > 1 && <nav className="pp-roster-navigation" aria-label="Planteles de ASTERI">{rosters.map(roster => <a key={roster.id} href={'#roster-' + roster.id}>{roster.name}</a>)}</nav>}
      {rosters.map(roster => {
        const members = players.filter(player => player.rosterId === roster.id)
        return <section key={roster.id} className="pp-team-feature pp-roster-group" id={'roster-' + roster.id} aria-labelledby={'title-' + roster.id}>
          <div className="pp-team-heading"><div><h2 id={'title-' + roster.id}>{roster.name}</h2>{roster.name !== roster.game && <p>{roster.game}</p>}{roster.description && <p>{roster.description}</p>}</div><Link className="ap-button" to="/historia">NUESTRA HISTORIA</Link></div>
          <div className="pp-team-socials">{CHANNELS.map(([icon, name, , href]) => <a key={name} href={href} target="_blank" rel="noreferrer">{name}</a>)}</div>
          {members.length ? <div className="pp-roster">{members.map(player => <Link key={player.slug} className="pp-player" to={'/players/' + player.slug}><div className="pp-player-photo"><img src={optimizedPlayerImage(player.image) || asteriA} alt={player.nickname} loading="lazy" /></div><div className="pp-player-copy"><h3>{player.nickname}</h3>{player.name && <p>{player.name}</p>}<div><span>{player.age !== '—' ? player.age + ' años' : 'ASTERI'}</span><b>{player.role}</b></div><small>VER FICHA DEL JUGADOR</small></div></Link>)}</div> : <p className="pp-roster-empty">Los jugadores de este plantel se anunciarán próximamente.</p>}
        </section>
      })}
    </PageState>
  </PortalPage>
}
