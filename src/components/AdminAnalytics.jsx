import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminMapResults } from '../lib/admin'
import { getSiteSettings } from '../lib/siteSettings'
import { teamAnalytics, matchOutcome } from '../lib/adminAnalytics'

const resultNames = { win: 'Victoria', loss: 'Derrota', draw: 'Empate' }
function Metric({ title, value, note }) {
  return <article className="admin-analytic-metric"><h3>{title}</h3><strong>{value}</strong>{note && <p>{note}</p>}</article>
}
function ResultBar({ row }) {
  return <div className="admin-result-bar" role="img" aria-label={`${row.played} partidos: ${row.win} victorias, ${row.loss} derrotas, ${row.draw} empates`}>
    {['win', 'draw', 'loss'].map(result => row[result] > 0 && <span key={result} className={result} style={{ width: `${row[result] / row.played * 100}%` }} />)}
  </div>
}
export default function AdminAnalytics({ snapshot, isOwner, onSettings }) {
  const [tab, setTab] = useState('team')
  const [period, setPeriod] = useState('all')
  const [extra, setExtra] = useState({ status: 'loading', maps: [], settings: null, mapError: false, settingsError: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setExtra(current => ({ ...current, status: 'loading' }))
    Promise.allSettled([getAdminMapResults(), getSiteSettings()]).then(([maps, settings]) => {
      if (!alive) return
      setExtra({ status: 'ready', maps: maps.status === 'fulfilled' ? maps.value : [], settings: settings.status === 'fulfilled' ? settings.value : null, mapError: maps.status === 'rejected', settingsError: settings.status === 'rejected' })
    })
    return () => { alive = false }
  }, [attempt, snapshot])
  const team = useMemo(() => teamAnalytics(snapshot.vods, extra.maps, period), [snapshot.vods, extra.maps, period])
  const published = snapshot.vods.filter(v => v.is_published).length
  const clips = snapshot.clips.filter(c => c.is_published).length
  const active = snapshot.players.filter(p => p.is_active).length
  const maxMonth = Math.max(1, ...team.monthly.map(row => row.played))
  return <div className="admin-analytics">
    <div className="admin-analytics-controls">
      <div className="admin-analytics-tabs" role="group" aria-label="Analítica de">
        <button type="button" aria-pressed={tab === 'team'} onClick={() => setTab('team')}>Equipo</button>
        <button type="button" aria-pressed={tab === 'web'} onClick={() => setTab('web')}>Web</button>
      </div>
      {tab === 'team' && <label>Período<select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">Todo el historial</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Último año</option></select></label>}
    </div>
    {tab === 'team' ? <>
      <p className="admin-analytics-note">Partidos publicados y finalizados. Las victorias se calculan sobre los resultados confirmados del período elegido.</p>
      <div className="admin-analytic-metrics">
        <Metric title="Partidos" value={team.played.length} />
        <Metric title="Victorias" value={team.results.win} />
        <Metric title="Efectividad" value={team.winRate === null ? 'Sin resultados' : `${team.winRate}%`} />
        <Metric title="Plantel activo" value={active} note="Estado actual" />
      </div>
      {team.missing > 0 && <p role="status">Hay {team.missing} partidos finalizados sin resultado confirmado. No se cuentan como empates.</p>}
      <div className="admin-chart-grid">
        <section className="admin-analytic-panel"><h2>Evolución mensual</h2>
          {team.monthly.length ? <><div className="admin-month-chart">{team.monthly.map(row => <div className="admin-month-row" key={row.month}><span>{new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(new Date(`${row.month}-15T12:00:00`))}</span><div className="admin-month-track"><div style={{ width: `${row.played / maxMonth * 100}%` }}><ResultBar row={row} /></div></div><strong>{row.played}</strong></div>)}</div><div className="admin-chart-legend"><span>Victorias</span><span>Empates</span><span>Derrotas</span></div></> : <p>No hay partidos finalizados en este período.</p>}
        </section>
        <section className="admin-analytic-panel"><h2>Resultados</h2><dl className="admin-results-list">{Object.entries(resultNames).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{team.results[key]}</dd></div>)}</dl></section>
      </div>
      <section className="admin-analytic-panel"><h2>Rendimiento por mapa</h2>
        {extra.status === 'loading' ? <p role="status">Cargando mapas…</p> : extra.mapError ? <div role="alert"><p>No se pudieron consultar los mapas.</p><button type="button" onClick={() => setAttempt(v => v + 1)}>Reintentar</button></div> : team.maps.length ? <div className="admin-data-scroll"><table className="admin-analytics-table"><thead><tr><th>Mapa</th><th>Jugados</th><th>Victorias</th><th>Empates</th><th>Derrotas</th><th>Efectividad</th></tr></thead><tbody>{team.maps.map(row => <tr key={row.name}><th scope="row">{row.name.replace(/^de_/, '')}</th><td>{row.played}</td><td>{row.win}</td><td>{row.draw}</td><td>{row.loss}</td><td>{Math.round(row.win / row.played * 100)}%</td></tr>)}</tbody></table></div> : <p>No hay resultados de mapas cargados para este período.</p>}
      </section>
      <section className="admin-analytic-panel"><h2>Últimos partidos</h2>{team.recent.length ? <div className="admin-recent-matches">{team.recent.map(match => <Link key={match.id} to={`/vods/${match.slug}`}><span><strong>{match.opponent || match.title}</strong><small>{match.match_date ? new Intl.DateTimeFormat('es-AR').format(new Date(`${match.match_date}T12:00:00`)) : 'Sin fecha'}</small></span><span>{resultNames[matchOutcome(match)] || 'Sin resultado'}<b>{match.score_asteri != null && match.score_opponent != null ? `${match.score_asteri} — ${match.score_opponent}` : '—'}</b></span></Link>)}</div> : <p>No hay partidos para mostrar.</p>}</section>
    </> : <>
      <div className="admin-analytic-metrics">
        <Metric title="Partidos publicados" value={published} />
        <Metric title="Clips publicados" value={clips} />
        <Metric title="Borradores" value={snapshot.vods.length - published + snapshot.clips.length - clips} />
        <Metric title="Cuentas activas" value={snapshot.profiles.filter(p => p.status === 'active').length} note="Cuentas del sitio; no visitantes" />
      </div>
      <section className="admin-analytic-panel"><h2>Audiencia de la web</h2>
        {extra.status === 'loading' ? <p role="status">Comprobando configuración…</p> : extra.settingsError ? <><p role="alert">No se pudo consultar la configuración de medición.</p><button type="button" onClick={() => setAttempt(v => v + 1)}>Reintentar</button></> : <>
          <p>{extra.settings?.ga_measurement_id ? 'El sitio tiene un identificador de Google Analytics configurado.' : 'Todavía no hay un identificador de Google Analytics configurado.'}</p>
          <p>Las visitas, las fuentes de tráfico y los dispositivos se consultan en Google Analytics. Este panel todavía no tiene acceso de lectura a esos informes.</p>
          <div className="admin-analytic-actions"><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Abrir Google Analytics</a>{isOwner && <button type="button" onClick={onSettings}>Configurar medición</button>}</div>
        </>}
      </section>
      <section className="admin-analytic-panel"><h2>Contenido publicado</h2><dl className="admin-results-list"><div><dt>Fichas activas de jugadores</dt><dd>{active}</dd></div><div><dt>Partidos pendientes de publicación</dt><dd>{snapshot.vods.length - published}</dd></div><div><dt>Clips pendientes de publicación</dt><dd>{snapshot.clips.length - clips}</dd></div></dl><p className="admin-analytics-note">Datos del contenido y las cuentas de la plataforma. No representan tráfico ni usuarios únicos.</p></section>
    </>}
  </div>
}
