import { Link, useParams } from 'react-router-dom'
import { players } from '../data/players'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PlayerPage() {
  const { slug } = useParams()
  const player = players.find((p) => p.slug === slug)
  if (!player) return <div className="center-page"><h1>Jugador no encontrado</h1><Link to="/">Volver</Link></div>

  return (
    <div>
      <Header />
      <main className="player-page">
        <section className="player-hero">
          <div>
            <span className="section-kicker">ASTERI / PLAYER PROFILE</span>
            <span className="tag">{player.role}</span>
            <h1>{player.nickname}</h1>
            <p>{player.name} · {player.country}</p>
          </div>
          <div className="profile-number">{player.number}</div>
        </section>

        <section className="profile-grid">
          <article className="profile-card wide"><span>HISTORIA</span><h2>Sobre {player.nickname}</h2><p>{player.bio} Esta zona está preparada para una historia más extensa, hitos personales y trayectoria competitiva.</p></article>
          <article className="profile-card"><span>RATING</span><strong>{player.stats.rating}</strong></article>
          <article className="profile-card"><span>K/D</span><strong>{player.stats.kd}</strong></article>
          <article className="profile-card"><span>HS%</span><strong>{player.stats.hs}</strong></article>
          <article className="profile-card"><span>MAPAS</span><strong>{player.stats.maps}</strong></article>
        </section>

        <section className="config-section">
          <div><span className="section-kicker">CONFIGURACIÓN</span><h2>SETUP DE CS2</h2></div>
          <div className="config-grid">
            {Object.entries(player.config).map(([key, value]) => <div key={key}><span>{key.toUpperCase()}</span><strong>{value}</strong></div>)}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
