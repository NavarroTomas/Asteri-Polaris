import { useState } from 'react'
import { Link } from 'react-router-dom'
import './HomeIntroduction.css'

export default function HomeIntroduction() {
  const [failed, setFailed] = useState(false)
  const videoUrl = import.meta.env.VITE_PRESENTATION_VIDEO_URL?.trim()
  return <section className="ap-section ap-introduction" id="presentacion" aria-labelledby="introduction-title">
    <div className="ap-section-heading"><h2 id="introduction-title">QUÉ ES ASTERI POLARIS</h2></div>
    <div className="ap-introduction-card">
      <div className="ap-introduction-screen">
        {videoUrl && !failed ? <video src={videoUrl} controls playsInline preload="none" onError={() => setFailed(true)} aria-label="Qué es ASTERI Polaris" /> : <div className="ap-introduction-placeholder"><strong>Video de presentación</strong><p>{failed ? 'No pudimos cargar el video de presentación.' : 'Próximamente, nuestra presentación.'}</p></div>}
      </div>
      <div className="ap-introduction-copy"><p>Un equipo argentino de Counter-Strike 2. Conocé cómo empezó el proyecto y quiénes lo hacen posible.</p><Link className="ap-card-link" to="/historia">CONOCÉ NUESTRA HISTORIA</Link></div>
    </div>
  </section>
}
