const INSTAGRAM = {
  handle: '@ASTERIPOLARIS',
  url: '#', // Reemplazá # por el link real de Instagram
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="instagram-cta-icon"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.7" r="1" className="instagram-cta-icon-dot" />
    </svg>
  )
}

export default function PlayersNumbersTransition() {
  return (
    <section
      className="instagram-transition"
      aria-label="Instagram de ASTERI POLARIS"
    >
      <a
        href={INSTAGRAM.url}
        className="instagram-transition-link"
        target="_blank"
        rel="noreferrer"
      >
        <div className="instagram-transition-left">
          <span className="instagram-transition-icon-wrap">
            <InstagramIcon />
          </span>

          <div className="instagram-transition-copy">
            <span className="instagram-transition-kicker">
              SEGUÍ AL EQUIPO
            </span>

            <strong>
              {INSTAGRAM.handle}
            </strong>
          </div>
        </div>

        <div className="instagram-transition-center" aria-hidden="true">
          <span>INSTAGRAM</span>
          <span>INSTAGRAM</span>
          <span>INSTAGRAM</span>
        </div>

        <div className="instagram-transition-action">
          <span>VER PERFIL</span>
          <span className="instagram-transition-arrow">↗</span>
        </div>
      </a>

      <style>{`
        .instagram-transition {
          position: relative;
          width: 100%;
          background: #050706;
          border-top: 1px solid rgba(255, 255, 255, .07);
          border-bottom: 1px solid rgba(255, 255, 255, .07);
          overflow: hidden;
        }

        .instagram-transition-link {
          position: relative;
          width: min(1500px, calc(100vw - 8vw));
          min-height: 92px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: clamp(28px, 5vw, 84px);

          color: #f2f4f0;
          text-decoration: none;

          transition:
            color .24s ease;
        }

        .instagram-transition::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #00e875;
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform .28s cubic-bezier(.2,.7,.2,1);
        }

        .instagram-transition:hover::before {
          transform: scaleY(1);
        }

        .instagram-transition:hover
        .instagram-transition-link {
          color: #07110b;
        }

        .instagram-transition-left {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          gap: 16px;
        }

        .instagram-transition-icon-wrap {
          width: 42px;
          height: 42px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255, 255, 255, .14);

          transition:
            border-color .24s ease,
            transform .24s ease;
        }

        .instagram-transition:hover
        .instagram-transition-icon-wrap {
          border-color: rgba(7, 17, 11, .24);
          transform: rotate(-5deg);
        }

        .instagram-cta-icon {
          width: 20px;
          height: 20px;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
        }

        .instagram-cta-icon-dot {
          fill: currentColor;
          stroke: none;
        }

        .instagram-transition-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .instagram-transition-kicker {
          color: #00e875;

          font:
            800 8px/1
            'Inter',
            sans-serif;

          letter-spacing: .18em;
          text-transform: uppercase;

          transition: color .24s ease;
        }

        .instagram-transition:hover
        .instagram-transition-kicker {
          color: rgba(7, 17, 11, .62);
        }

        .instagram-transition-copy strong {
          font:
            800 14px/1
            'Inter',
            sans-serif;

          letter-spacing: .08em;
        }

        .instagram-transition-center {
          position: relative;
          z-index: 2;

          min-width: 0;
          overflow: hidden;

          display: flex;
          justify-content: center;
          gap: 28px;

          color: rgba(242, 244, 240, 0.98);

          font:
            850
            clamp(24px, 2.7vw, 44px)/1
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing: -.045em;
          white-space: nowrap;
          text-transform: uppercase;

          transition:
            color .24s ease,
            transform .28s ease;
        }

        .instagram-transition:hover
        .instagram-transition-center {
          color: rgba(7, 17, 11, .12);
          transform: translateX(10px);
        }

        .instagram-transition-action {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          gap: 14px;

          font:
            800 9px/1
            'Inter',
            sans-serif;

          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .instagram-transition-arrow {
          width: 34px;
          height: 34px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,255,255,.14);

          color: #00e875;
          font-size: 14px;
          letter-spacing: 0;

          transition:
            transform .24s ease,
            color .24s ease,
            border-color .24s ease;
        }

        .instagram-transition:hover
        .instagram-transition-arrow {
          transform: translate(3px, -3px);
          color: #07110b;
          border-color: rgba(7, 17, 11, .24);
        }

        @media (max-width: 900px) {
          .instagram-transition-link {
            width: calc(100vw - 48px);
            grid-template-columns: 1fr auto;
          }

          .instagram-transition-center {
            display: none;
          }
        }

        @media (max-width: 560px) {
          .instagram-transition-link {
            width: calc(100vw - 32px);
            min-height: 82px;
            gap: 18px;
          }

          .instagram-transition-icon-wrap {
            width: 38px;
            height: 38px;
          }

          .instagram-transition-action > span:first-child {
            display: none;
          }

          .instagram-transition-copy strong {
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .instagram-transition::before,
          .instagram-transition-center,
          .instagram-transition-arrow,
          .instagram-transition-icon-wrap {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
