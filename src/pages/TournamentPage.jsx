import MatchRosterBadge from '../components/MatchRosterBadge'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { SiteImage } from '../components/SiteMedia'
import { getPublishedTournament } from '../lib/contentAdmin'
import { usePublishedMatches } from '../hooks/usePublishedMatches'
import './TournamentsPage.css'

const dateLabel=value=>new Intl.DateTimeFormat('es-AR',{dateStyle:'long'}).format(new Date(value+'T12:00:00'))
const httpsUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}}
export function TournamentContent({item,matches=[],matchStatus='ready',retry=()=>{}}){
 const games=matches.filter(match=>match.tournamentId===item.id&&!match.isEvent)
 const rules=httpsUrl(item.rules_url), official=httpsUrl(item.external_url)
 return <article className="tournament-detail">
  {item.cover_url&&<SiteImage className="tournament-hero" src={item.cover_url} alt=""/>}
  <div className="tournament-details"><p>{item.game}</p><p>{dateLabel(item.starts_on)}{item.ends_on&&item.ends_on!==item.starts_on?' — '+dateLabel(item.ends_on):''}</p>
   {(item.format||item.location)&&<dl>{item.format&&<><dt>Formato</dt><dd>{item.format}</dd></>}{item.location&&<><dt>Modalidad / ubicación</dt><dd>{item.location}</dd></>}</dl>}
   {item.description&&<p className="tournament-description">{item.description}</p>}
   {item.page_body&&<div className="tournament-body">{item.page_body.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>}
   {(rules||official)&&<div className="tournament-links">{official&&<a className="ap-button" href={official} target="_blank" rel="noopener noreferrer">Sitio oficial</a>}{rules&&<a className="ap-button ap-button-outline" href={rules} target="_blank" rel="noopener noreferrer">Reglamento</a>}</div>}
  </div>
  <section className="tournament-games"><h2>Partidos</h2><PageState status={matchStatus} retry={retry} empty={!games.length?'Los partidos se anunciarán próximamente.':null}><ul>{games.map(match=><li key={match.id}><Link to={match.vod}><span>{match.date} · {match.time}</span><strong><MatchRosterBadge match={match}/> vs {match.opponent}</strong><span>{match.score||match.status}</span></Link></li>)}</ul></PageState></section>
 </article>
}
export default function TournamentPage(){
 const {id}=useParams(), [loaded,setLoaded]=useState({id:null,item:null,status:'loading'}), [attempt,setAttempt]=useState(0)
 const {matches,status:matchStatus,retry}=usePublishedMatches()
 useEffect(()=>{let alive=true;setLoaded({id,item:null,status:'loading'});getPublishedTournament(id).then(item=>{if(alive)setLoaded({id,item,status:'ready'})}).catch(()=>{if(alive)setLoaded({id,item:null,status:'error'})});return()=>{alive=false}},[id,attempt])
 const current=loaded.id===id?loaded:{item:null,status:'loading'}
 return <PortalPage title={current.item?.page_title||current.item?.title||'TORNEO'}><Link className="tournament-back" to="/torneos">Todos los torneos</Link><PageState status={current.status} retry={()=>setAttempt(value=>value+1)} empty={!current.item?'Este torneo no está disponible.':null}>{current.item&&<TournamentContent item={current.item} matches={matches} matchStatus={matchStatus} retry={retry}/>}</PageState></PortalPage>
}
