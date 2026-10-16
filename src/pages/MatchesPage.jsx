import { useState } from 'react'
import { Link } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { argentinaToday, opponentLabel, usePublishedMatches } from '../hooks/usePublishedMatches'
import asteriA from '../assets/brand/asteri-a.png'

export function MatchRow({ match }) {
  const content = <><span className="pp-match-date"><strong>{match.date}</strong><small>{match.time === '—' ? 'Hora a confirmar' : `${match.time} · ARG`}</small></span><span className="pp-match-teams"><img src={asteriA} alt="" /><b>ASTERI</b><em className={match.status === 'JUGADO' ? `pp-result pp-result-${match.outcome}` : ''}>{match.status === 'JUGADO' ? match.score || 'Finalizado' : match.status === 'CANCELADO' ? 'Cancelado' : 'vs'}</em><b>{opponentLabel(match.opponent)}</b></span><span className="pp-match-event"><strong>{match.competition}</strong><small>{match.status === 'JUGADO' ? 'Ficha y VOD' : match.status === 'CANCELADO' ? 'Partido cancelado' : 'Próximo partido'} {match.vod ? '' : ''}</small></span></>
  return match.vod ? <Link className="pp-match-row" to={match.vod}>{content}</Link> : <div className="pp-match-row">{content}</div>
}

export default function MatchesPage() {
  const { matches, status, retry } = usePublishedMatches()
  const [query, setQuery] = useState('')
  const [competition, setCompetition] = useState('')
  const [limit, setLimit] = useState(10)
  const filtered = matches.filter(match => (!competition || match.competition === competition) && `${opponentLabel(match.opponent)} ${match.competition}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')))
  const upcoming = filtered.filter(match => match.status === 'PRÓXIMO' && match.dateISO >= argentinaToday())
  const history = filtered.filter(match => match.status === 'JUGADO' || match.status === 'CANCELADO').sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  return <PortalPage title="PARTIDOS" intro="Próximos encuentros y resultados del equipo.">
    <div className="pp-filter-bar"><label><span>Buscar rival</span><input type="search" placeholder="Nombre del rival…" value={query} onChange={event => { setQuery(event.target.value); setLimit(10) }} /></label><label><span>Competencia</span><select value={competition} onChange={event => { setCompetition(event.target.value); setLimit(10) }}><option value="">Todas las competencias</option>{[...new Set(matches.map(match => match.competition))].map(name => <option key={name}>{name}</option>)}</select></label></div>
    <PageState status={status} retry={retry}>
      <section className="pp-section"><div className="pp-section-title"><h2>PRÓXIMOS PARTIDOS</h2><span>{upcoming.length} EN AGENDA</span></div>{upcoming.length ? upcoming.map(match => <MatchRow match={match} key={match.id} />) : <div className="pp-empty pp-empty-small"><h3>{query || competition ? 'No hay próximos partidos con estos filtros.' : 'No hay próximos partidos confirmados.'}</h3></div>}</section>
      <section className="pp-section"><div className="pp-section-title"><h2>HISTORIAL DE PARTIDOS</h2><span>{history.length} REGISTROS</span></div>{history.length ? history.slice(0, limit).map(match => <MatchRow match={match} key={match.id} />) : <div className="pp-empty pp-empty-small"><h3>No hay resultados para mostrar.</h3></div>}{history.length > limit && <button className="pp-more" onClick={() => setLimit(value => value + 10)}>MOSTRAR MÁS PARTIDOS </button>}</section>
      <Link className="pp-inline-link" to="/calendario">VER CALENDARIO POR MES </Link>
    </PageState>
  </PortalPage>
}
