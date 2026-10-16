import { Link } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { argentinaToday, usePublishedMatches } from '../hooks/usePublishedMatches'
import asteriA from '../assets/brand/asteri-a.png'

export default function TournamentsPage() {
  const { matches, status, retry } = usePublishedMatches()
  // The current source contains match competitions, not tournament dates or prize pools.
  const competitions = new Map()
  for (const match of matches) {
    const name = String(match.competition || '').trim()
    if (!name || /amistos|scrim|^partido$|^match$/i.test(name) || match.status === 'CANCELADO') continue
    if (!competitions.has(name)) competitions.set(name, [])
    competitions.get(name).push(match)
  }
  const entries = [...competitions.entries()].map(([name, games]) => ({ name, games, upcoming: games.some(game => game.status === 'PRÓXIMO' && game.dateISO >= argentinaToday()) }))
  function cards(items) {
    return <div className="pp-tournament-grid">{items.map(({ name, games }) => <article className="pp-tournament-card" key={name}><div className="pp-tournament-art"><img src={asteriA} alt="" /></div><div><h3>{name}</h3><p>{games.length} {games.length === 1 ? 'partido publicado' : 'partidos publicados'}</p><Link className="pp-inline-link" to="/partidos">VER PARTIDOS </Link></div></article>)}</div>
  }
  return <PortalPage title="TORNEOS" intro="Las competencias de ASTERI, a partir de los partidos publicados."><PageState status={status} retry={retry} empty={!entries.length ? 'Todavía no hay torneos publicados.' : null}><section className="pp-section"><div className="pp-section-title"><h2>PRÓXIMAS PARTICIPACIONES</h2></div>{entries.some(entry => entry.upcoming) ? cards(entries.filter(entry => entry.upcoming)) : <div className="pp-empty pp-empty-small"><h3>No hay participaciones confirmadas en agenda.</h3></div>}</section><section className="pp-section"><div className="pp-section-title"><h2>HISTORIAL DE COMPETENCIAS</h2></div>{entries.some(entry => !entry.upcoming) ? cards(entries.filter(entry => !entry.upcoming)) : <div className="pp-empty pp-empty-small"><h3>El historial aparecerá cuando haya competencias publicadas.</h3></div>}</section></PageState></PortalPage>
}
