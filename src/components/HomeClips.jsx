import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ScrollStack, { ScrollStackItem } from './ScrollStack'
import './HomeClips.css'

function videoSource(value) {
  try {
    const url = new URL(value, window.location.origin)
    if (!['https:', 'http:'].includes(url.protocol)) return null
    const host = url.hostname.replace(/^www\./, '')
    const youtube = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'm.youtube.com'].includes(host) ? (url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]) : null
    if (youtube && /^[\w-]{11}$/.test(youtube)) return { type: 'youtube', url: `https://www.youtube-nocookie.com/embed/${youtube}` }
    if (host.endsWith('.supabase.co') || /\.(mp4|webm|ogg|mov)$/i.test(url.pathname)) return { type: 'video', url: url.href }
    return { type: 'external', url: url.href }
  } catch { return null }
}

function ClipVideo({ clip }) {
  const [failed, setFailed] = useState(false)
  const source = videoSource(clip.video_url)
  if (!source) return <p className="ap-clip-unavailable">Este clip no está disponible.</p>
  if (failed || source.type === 'external') return <a className="ap-clip-external" href={source.url} target="_blank" rel="noopener noreferrer">Abrir clip en otra pestaña</a>
  if (source.type === 'youtube') return <iframe src={source.url} title={clip.title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
  return <video src={source.url} controls playsInline preload="metadata" aria-label={clip.title} onError={() => setFailed(true)} />
}

export default function HomeClips({ fallbackVideoUrl }) {
  const [clips, setClips] = useState([])
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setStatus('loading')
    supabase.from('clips').select('id,title,description,video_url,created_at').eq('is_published', true).not('video_url', 'is', null).order('created_at', { ascending: false }).limit(4)
      .then(({ data, error }) => {
        if (!alive) return
        if (error) { setStatus('error'); return }
        setClips((data || []).filter(clip => videoSource(clip.video_url)))
        setStatus('ready')
      }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])
  const fallback = fallbackVideoUrl && videoSource(fallbackVideoUrl) ? [{ id: 'home-clip', title: 'Clip del equipo', video_url: fallbackVideoUrl }] : []
  const visible = status === 'loading' ? [] : [...clips, ...fallback.filter(item => !clips.some(clip => clip.video_url === item.video_url))].slice(0, 4)
  return <section className="ap-section ap-clips-section" id="media" aria-labelledby="clips-title">
    <div className="ap-section-heading"><h2 id="clips-title">CLIPS</h2><Link className="ap-card-link" to="/media">VER MULTIMEDIA</Link></div>
    {status === 'loading' && <p role="status" className="ap-empty">Cargando clips…</p>}
    {status === 'error' && <div className="ap-clips-error" role="status"><p>No pudimos cargar los últimos clips.</p><button type="button" className="ap-text-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div>}
    {visible.length ? <ScrollStack key={visible.map(clip => clip.id).join(',')} className="ap-clips-stack" useWindowScroll smoothScroll={false} snap={false} itemDistance={72} itemStackDistance={64} stackPosition="5%" itemScale={0.025} baseScale={0.92} dimAmount={0.1} holdDistance={80}>
      {visible.map(clip => <ScrollStackItem key={clip.id} itemClassName="ap-clip-stack-card">
        <article aria-label={clip.title}><h3>{clip.title}</h3><div className="ap-clip-player"><ClipVideo clip={clip} /></div>{clip.description && <p className="ap-clip-description">{clip.description}</p>}</article>
      </ScrollStackItem>)}
    </ScrollStack> : status === 'ready' && <p className="ap-empty">Los clips del equipo aparecerán acá cuando estén publicados.</p>}
  </section>
}
