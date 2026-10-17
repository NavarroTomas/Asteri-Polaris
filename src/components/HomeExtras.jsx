import { Link } from 'react-router-dom'
import Mascot from './Mascot'
import { APPLICATION_URL } from '../config/application'
import { SOCIAL_LINKS } from '../config/socialLinks'
import './HomeExtras.css'

export function LatestMatch({ match, status, retry }) {
  return <section className="ap-section" aria-labelledby="latest-match-title">
    <div className="ap-section-heading"><h2 id="latest-match-title">ÚLTIMO PARTIDO</h2></div>
    <div className="ap-home-feature ap-latest-match">
      {status === 'loading' ? <p role="status">Cargando el último resultado…</p> : status === 'error' ? <div role="status"><p>No pudimos cargar el resultado.</p><button className="ap-text-button" onClick={retry}>Reintentar</button></div> : match ? <>
        <p className="ap-latest-meta">{match.date} · {match.competition}</p>
        <div className="ap-latest-score"><strong>ASTERI</strong><span aria-label={match.score ? `Resultado: ${match.score}` : 'Finalizado'}>{match.score || 'Finalizado'}</span><strong>{match.opponent}</strong></div>
        {match.vod && <Link className="ap-button" to={match.vod}>VER FICHA DEL PARTIDO</Link>}
      </> : <p>Todavía no hay resultados publicados.</p>}
    </div>
  </section>
}

export default function HomeExtras() {
  return <>
    <section className="ap-section" aria-labelledby="about-team-title">
      <div className="ap-section-heading"><h2 id="about-team-title">SOBRE EL EQUIPO</h2></div>
      <div className="ap-home-feature ap-home-about"><h3>Asteri, desde Argentina</h3><p>ASTERI POLARIS es un proyecto competitivo que busca desarrollar jugadores y construir un equipo que pueda crecer con el tiempo.</p><p>Empezamos como Polaris. Nuestra identidad fue cambiando, pero seguimos trabajando para darle continuidad al proyecto dentro y fuera del servidor.</p><Link className="pp-inline-link" to="/historia">CONOCÉ NUESTRA HISTORIA</Link></div>
    </section>
    <section className="ap-section" aria-labelledby="cocoliche-title">
      <div className="ap-section-heading"><h2 id="cocoliche-title">CONOCÉ A COCOLICHE</h2></div>
      <div className="ap-home-feature ap-cocoliche-intro"><div><p>Nuestro cocodrilo ya tiene nombre y camiseta.</p><p>Es la mascota del equipo. Lo vas a encontrar saludando al entrar, jugando frente a la compu o acompañándote por las distintas secciones de la web.</p></div><Mascot pose="history" /></div>
    </section>
    <section className="ap-section ap-faq" aria-labelledby="faq-title">
      <div className="ap-section-heading"><h2 id="faq-title">PREGUNTAS FRECUENTES</h2></div>
      <div className="ap-faq-list">
        <details><summary>¿Cómo me postulo al equipo?</summary><div><p>Completá el formulario de inscripción con tus datos y tu experiencia para que el staff pueda revisar tu perfil.</p><a href={APPLICATION_URL} target="_blank" rel="noreferrer">Abrir formulario de inscripción</a></div></details>
        <details><summary>¿Dónde veo los resultados y las grabaciones?</summary><div><p>En <Link to="/partidos">Partidos</Link> encontrás el historial y la ficha de cada encuentro. Cuando hay una grabación publicada, podés acceder a ella desde esa ficha.</p></div></details>
        <details><summary>¿Puedo sumarme a la comunidad?</summary><div><p>Sí. Podés entrar al <a href={SOCIAL_LINKS.discord} target="_blank" rel="noreferrer">Discord</a> para conversar y organizar partidas, o visitar nuestro <a href={SOCIAL_LINKS.faceit} target="_blank" rel="noreferrer">club de FACEIT</a>.</p></div></details>
        <details><summary>¿Cómo contacto al equipo?</summary><div><p>Encontrás el correo y los canales oficiales en <Link to="/contacto">Contacto</Link>. Si querés enviar tu perfil como jugador, usá el formulario de inscripción.</p></div></details>
      </div>
    </section>
  </>
}
