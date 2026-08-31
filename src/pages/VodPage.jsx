import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getPublicVod } from '../lib/vods'
import './VodPage.css'

const fmtDate=v=>v?new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${v}T12:00:00`)).toUpperCase():'—'
const fmtTime=v=>v?v.slice(0,5):'—'
const fmtStamp=s=>s==null?'':`${Math.floor(Number(s)/60)}:${String(Number(s)%60).padStart(2,'0')}`

export default function VodPage(){
  const {slug}=useParams()
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[err,setErr]=useState('')
  useEffect(()=>{let ok=true;getPublicVod(slug).then(d=>ok&&setData(d)).catch(e=>ok&&setErr(e.message)).finally(()=>ok&&setLoading(false));return()=>{ok=false}},[slug])
  if(loading)return <main className="vod-state"><span>ASTERI / CARGANDO VOD</span></main>
  if(err||!data)return <main className="vod-state"><span>ASTERI / VOD</span><h1>VOD NO<br/>DISPONIBLE.</h1><p>{err}</p><Link to="/">← VOLVER</Link></main>
  const {vod,lineup,clips}=data;const score=vod.score_asteri!=null&&vod.score_opponent!=null
  return <div className="vod-page"><Header/><main>
    <section className="vod-hero"><div><span>{vod.competition||'ASTERI MATCH'} · {fmtDate(vod.match_date)}</span><h1>ASTERI<em>VS</em>{vod.opponent}</h1><p>{vod.title}</p><div className="vod-meta"><b>{vod.map_name||'—'}</b><b>{fmtTime(vod.match_time)}</b><b>{vod.status?.toUpperCase()}</b></div></div><aside><small>RESULTADO</small><strong>{score?<>{vod.score_asteri}<i>—</i>{vod.score_opponent}</>:vod.status==='upcoming'?'PRÓXIMO':'—'}</strong></aside></section>
    {vod.description&&<section className="vod-description"><span>01 / MATCH INFO</span><p>{vod.description}</p></section>}
    <section className="vod-section"><div className="vod-index"><span>02</span><small>LINEUP</small></div><div><h2>PLAYERS.</h2><div className="vod-lineup">{lineup.length?lineup.map((x,i)=><Link key={x.player_id} to={x.player?`/players/${x.player.slug}`:'#'}><span>{String(i+1).padStart(2,'0')}</span><strong>{x.player?.nickname||'PLAYER'}</strong><small>{x.player?.player_role||'PLAYER'}</small></Link>):<p className="vod-empty">LINEUP NO CARGADO.</p>}</div></div></section>
    <section className="vod-section"><div className="vod-index"><span>03</span><small>WATCH</small></div><div><h2>VOD.</h2><div className="vod-actions">{vod.youtube_url?<a className="primary" href={vod.youtube_url} target="_blank" rel="noreferrer">ABRIR VOD ↗</a>:<span>SIN VOD EXTERNO.</span>}</div></div></section>
    <section className="vod-section"><div className="vod-index"><span>04</span><small>CLIPS</small></div><div><h2>HIGHLIGHTS.</h2>{clips.length?<div className="vod-clips">{clips.map((c,i)=><a key={c.id} href={c.video_url} target="_blank" rel="noreferrer"><div><span>{String(i+1).padStart(2,'0')}</span><small>{c.player?.nickname||'ASTERI'}</small></div><strong>{c.title}</strong><p>{[c.round_number!=null?`ROUND ${c.round_number}`:'',fmtStamp(c.timestamp_seconds)].filter(Boolean).join(' · ')}</p><em>VER CLIP ↗</em></a>)}</div>:<p className="vod-empty">SIN CLIPS PUBLICADOS.</p>}</div></section>
    <section className="vod-back"><Link to="/#partidos">← VOLVER A PARTIDOS</Link><strong>ASTERI POLARIS</strong></section>
  </main><Footer/></div>
}
