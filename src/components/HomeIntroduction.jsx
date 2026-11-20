import { SiteVideo } from './SiteMedia'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import './HomeIntroduction.css'

export default function HomeIntroduction() {
  const [failed, setFailed] = useState(false)
  const [videoUrl,setVideoUrl] = useState(import.meta.env.VITE_PRESENTATION_VIDEO_URL?.trim() || '')
  useEffect(()=>{let alive=true;supabase.from('site_settings').select('presentation_video_url').eq('id',1).maybeSingle().then(({data})=>{if(alive&&data?.presentation_video_url){setVideoUrl(data.presentation_video_url);setFailed(false)}});return()=>{alive=false}},[])
  return <section className="ap-section ap-introduction" id="presentacion" aria-labelledby="introduction-title">
    <div className="ap-section-heading"><h2 id="introduction-title">QUÉ ES ASTERI POLARIS</h2></div>
    <div className="ap-introduction-card">
      <div className="ap-introduction-screen">
        {videoUrl && !failed ? <SiteVideo key={videoUrl} src={videoUrl} controls playsInline preload="none" onError={() => setFailed(true)} aria-label="Qué es ASTERI Polaris" /> : <div className="ap-introduction-placeholder"><strong>Video de presentación</strong><p>{failed ? 'No pudimos cargar el video de presentación.' : 'Próximamente, nuestra presentación.'}</p></div>}
      </div>
      <div className="ap-introduction-copy"><p>Un equipo argentino de Counter-Strike 2. Conocé cómo empezó el proyecto y quiénes lo hacen posible.</p><Link className="ap-card-link" to="/historia">CONOCÉ NUESTRA HISTORIA</Link></div>
    </div>
  </section>
}
