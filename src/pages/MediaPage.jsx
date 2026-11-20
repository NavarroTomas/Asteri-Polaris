import { SiteImage, SiteVideo } from '../components/SiteMedia'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalPage, { PageState, CHANNELS } from '../components/PortalPage'
import SocialIcon from '../components/SocialIcon'
import HomeIntroduction from '../components/HomeIntroduction'
import { supabase } from '../lib/supabase'
import { opponentLabel, usePublishedMatches } from '../hooks/usePublishedMatches'
import { compareMatchesNewestFirst } from '../lib/matchOrdering'
import './MediaWall.css'

export default function MediaPage() {
  const { matches, status, retry } = usePublishedMatches()
  const [clips, setClips] = useState([])
  const [posts, setPosts] = useState([])
  const [postsState,setPostsState] = useState('loading')
  const [clipsError, setClipsError] = useState(false)
  const [clipsLoading, setClipsLoading] = useState(true)
  const [limit, setLimit] = useState(9)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setPostsState('loading')
    supabase.from('media_posts').select('id,title,kind,media_url,description').eq('is_published',true).order('created_at',{ascending:false}).limit(30).then(({data,error})=>{if(alive){setPosts(data||[]);setPostsState(error?'error':'ready')}}).catch(()=>{if(alive)setPostsState('error')})
    setClipsError(false)
    setClipsLoading(true)
    supabase.from('clips').select('id,title,description,video_url').eq('is_published', true).not('video_url', 'is', null).order('created_at', { ascending: false }).limit(24)
      .then(({ data, error }) => { if (alive) { setClips(data || []); setClipsError(Boolean(error)) } })
      .catch(() => { if (alive) setClipsError(true) }).finally(() => { if (alive) setClipsLoading(false) })
    return () => { alive = false }
  }, [attempt])
  const vods = matches.filter(match => match.status === 'JUGADO' && match.slug && (match.youtube || match.downloadUrl)).sort(compareMatchesNewestFirst)
  return <PortalPage title="MEDIA" intro="Las redes y los videos del equipo." aside={false}>
    <nav className="media-social-grid" aria-label="Redes oficiales">{CHANNELS.map(([,name,,href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"><SocialIcon name={name} size={42}/><strong>{name}</strong></a>)}</nav>
    <HomeIntroduction />
    <section className="pp-section"><h2>FOTOS Y VIDEOS</h2>
      {postsState==='error'&&<p role="status">No pudimos cargar las publicaciones. <button className="pp-more" onClick={()=>setAttempt(value=>value+1)}>Reintentar</button></p>}
      <div className="media-wall">{posts.map(post=><article className="media-wall-item" key={post.id}>{post.kind==='image'?<SiteImage src={post.media_url} alt={post.title} loading="lazy"/>:<ClipContent clip={{title:post.title,video_url:post.media_url}}/>}<h3>{post.title}</h3>{post.description&&<p>{post.description}</p>}</article>)}</div>
      {clipsError && <p role="status">No pudimos cargar los clips. <button className="pp-more" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></p>}
      <div className="media-wall">{clips.map(clip => <article className="media-wall-item" key={clip.id}><ClipContent clip={clip}/><h3>{clip.title}</h3>{clip.description && <p>{clip.description}</p>}</article>)}</div>
      <PageState status={status} retry={retry} empty={!clipsLoading && !clipsError && postsState==='ready' && !posts.length && !vods.length && !clips.length ? 'Todavía no hay videos publicados.' : null}><div className="media-wall">{vods.slice(0, limit).map(match => <Link className="media-wall-item media-wall-match" to={match.vod} key={match.id}><span>{match.date}</span><h3>ASTERI vs {opponentLabel(match.opponent)}</h3><p>{match.competition}</p><strong>{match.score}</strong><span>Ver partido</span></Link>)}</div>{vods.length > limit && <button className="pp-more" onClick={() => setLimit(value => value + 9)}>Mostrar más partidos</button>}</PageState>
    </section>
  </PortalPage>
}

function ClipContent({ clip }) {
  const [failed, setFailed] = useState(false)
  let url
  try { url = new URL(clip.video_url); if (!['https:', 'http:'].includes(url.protocol)) return <p>Video no disponible.</p> } catch { return <p>Video no disponible.</p> }
  const host = url.hostname.replace(/^www\./, '')
  const yt = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com','m.youtube.com'].includes(host) ? (url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]) : null
  if (yt && /^[\w-]{11}$/.test(yt)) return <iframe title={clip.title} src={'https://www.youtube-nocookie.com/embed/' + yt} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
  if (!failed && (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname) || host.endsWith('.supabase.co'))) return <SiteVideo src={url.href} controls playsInline preload="none" aria-label={clip.title} onError={() => setFailed(true)}/>
  return <a href={url.href} target="_blank" rel="noopener noreferrer">Abrir video</a>
}
