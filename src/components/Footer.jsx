import { useState } from 'react'
import wordmark from '../assets/brand/asteri-wordmark-wide.png'
import { SOCIAL_LINKS } from '../config/socialLinks'

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

            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noreferrer"
            >
              Discord ↗
            </a>

            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗
            </a>

            <a
              href={SOCIAL_LINKS.x}
              target="_blank"
              rel="noreferrer"
            >
              X ↗
            </a>

            <a
              href={SOCIAL_LINKS.faceit}
              target="_blank"
              rel="noreferrer"
            >
              FACEIT ↗
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
            href={SOCIAL_LINKS.discord}
            target="_blank"
            rel="noreferrer"
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
