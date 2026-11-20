import { SiteImage } from '../components/SiteMedia'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { listTournaments } from '../lib/contentAdmin'
import { argentinaToday, usePublishedMatches } from '../hooks/usePublishedMatches'
import './TournamentsPage.css'

const dateLabel=value=>new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00'))
export default function TournamentsPage(){
 const [items,setItems]=useState([]),[status,setStatus]=useState('loading'),[attempt,setAttempt]=useState(0)
 const {matches,status:matchStatus,retry}=usePublishedMatches()
 useEffect(()=>{let alive=true;setStatus('loading');listTournaments(true).then(data=>{if(alive){setItems(data);setStatus('ready')}}).catch(()=>{if(alive)setStatus('error')});return()=>{alive=false}},[attempt])
 const today=argentinaToday()
 const groups=[['EN CURSO',items.filter(item=>item.starts_on<=today&&(item.ends_on||item.starts_on)>=today)],['PRÓXIMOS TORNEOS',items.filter(item=>item.starts_on>today)],['TORNEOS ANTERIORES',items.filter(item=>(item.ends_on||item.starts_on)<today)]]
 return <PortalPage title="TORNEOS" intro="Competencias, fechas y partidos de nuestros equipos."><PageState status={status} retry={()=>setAttempt(value=>value+1)} empty={!items.length?'Todavía no hay torneos publicados.':null}>{groups.filter(([,rows])=>rows.length).map(([title,rows])=><section className="pp-section" key={title}><h2>{title}</h2><div className="tournament-cards">{rows.map(item=><article className="tournament-card" id={'tournament-'+item.id} key={item.id}>{item.cover_url&&<SiteImage src={item.cover_url} alt="" loading="lazy"/>}<div><p>{item.game}</p><h3>{item.title}</h3><p>{dateLabel(item.starts_on)}{item.ends_on&&item.ends_on!==item.starts_on?' — '+dateLabel(item.ends_on):''}</p>{item.description&&<p className="tournament-description">{item.description}</p>}{item.external_url&&<a href={item.external_url} target="_blank" rel="noopener noreferrer">Sitio del torneo</a>}<h4>Partidos</h4>{matchStatus==='error'?<button onClick={retry}>Reintentar partidos</button>:matchStatus==='loading'?<p>Cargando partidos…</p>:matches.some(match=>match.tournamentId===item.id&&!match.isEvent)?<ul>{matches.filter(match=>match.tournamentId===item.id&&!match.isEvent).map(match=><li key={match.id}><Link to={match.vod}><span>{match.date} · {match.time}</span><strong>vs {match.opponent}</strong><span>{match.score||match.status}</span></Link></li>)}</ul>:<p>Los partidos se anunciarán próximamente.</p>}</div></article>)}</div></section>)}</PageState></PortalPage>
}
