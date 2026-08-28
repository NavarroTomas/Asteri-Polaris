import { useState } from 'react'
import wordmark from '../assets/brand/asteri-wordmark-wide.png'

export default function Footer() {
  const [subscribed, setSubscribed] =
    useState(false)

  const onSubmit = event => {
    event.preventDefault()
    setSubscribed(true)
  }

  return (
    <>
      <footer
        className="site-footer"
        id="contacto"
      >
        <div className="footer-newsletter">
          <span className="footer-label">
            NEWSLETTER
          </span>

          <h3>
            SEGUÍ EL PROYECTO
            <br />
            DESDE ADENTRO.
          </h3>

          <p>
            Novedades del equipo,
            próximos partidos, VODs y
            cambios importantes.
          </p>

          <form onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="tu@email.com"
              aria-label="Correo electrónico"
              required
            />

            <button type="submit">
              {subscribed
                ? 'LISTO ✓'
                : 'SUMARME →'}
            </button>
          </form>
        </div>

        <div className="footer-links">
          <div>
            <span className="footer-label">
              NAVEGACIÓN
            </span>

            <a href="/#plantel">
              Plantel
            </a>

            <a href="/#partidos">
              Partidos + VODs
            </a>

            <a href="/#historia">
              Historia
            </a>
          </div>

          <div>
            <span className="footer-label">
              COMUNIDAD
            </span>

            <a href="#">
              Discord ↗
            </a>

            <a href="#">
              Instagram ↗
            </a>

            <a href="#">
              YouTube ↗
            </a>

            <a href="#">
              Steam ↗
            </a>
          </div>
        </div>

        <div className="footer-cta">
          <span className="footer-label">
            CONTACTO
          </span>

          <a
            className="footer-contact"
            href="mailto:contacto@asteri.gg"
          >
            contacto@asteri.gg ↗
          </a>

          <a
            className="footer-discord"
            href="#"
          >
            ENTRAR AL DISCORD
            <span>→</span>
          </a>

          <div className="footer-meta">
            <span>ARGENTINA</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>

      <div className="footer-wordmark">
        <img
          src={wordmark}
          alt="ASTERI Polaris"
        />
      </div>
    </>
  )
}
