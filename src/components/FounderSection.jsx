import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const founder = {
  label: 'FOUNDER / VISIÓN',
  quote:
    'Creé ASTERI POLARIS para construir un proyecto competitivo que pudiera crecer y mantenerse en el tiempo. Más allá de los torneos, la idea siempre fue formar una base sólida, desarrollar jugadores y evolucionar sin perder nuestra identidad.',
  name: 'FUNDADOR',
  role: 'ASTERI POLARIS',
}

export default function FounderSection() {
  const rootRef = useRef(null)
  const imageRef = useRef(null)
  const copyRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const context = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        {
          opacity: 0,
          y: 28,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 72%',
          },
        },
      )

      gsap.fromTo(
        copyRef.current,
        {
          opacity: 0,
          y: 34,
        },
        {
          opacity: 1,
          y: 0,
          duration: .9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 68%',
          },
        },
      )
    }, root)

    return () => context.revert()
  }, [])

  return (
    <section
      className="founder-minimal"
      id="founder"
      ref={rootRef}
    >
      <div className="founder-minimal-shell">
        <div className="founder-minimal-visual">
          <img
            ref={imageRef}
            src="/players/Founder3.png"
            alt="Founder de ASTERI POLARIS"
          />
        </div>

        <div
          className="founder-minimal-copy"
          ref={copyRef}
        >
          <span className="founder-minimal-kicker">
            {founder.label}
          </span>

          <blockquote>
            “{founder.quote}”
          </blockquote>

          <div className="founder-minimal-signature">
            <strong>{founder.name}</strong>
            <span>{founder.role}</span>
          </div>
        </div>
      </div>

      <style>{`
        .founder-minimal {
          width: 100%;
          min-height: 92vh;

          display: flex;
          align-items: center;

          overflow: hidden;

          background: #050706;
          color: #f2f4f0;
        }

        .founder-minimal-shell {
          width: min(1460px, calc(100vw - 9vw));
          margin: 0 auto;

          display: grid;
          grid-template-columns:
            minmax(390px, .88fr)
            minmax(0, 1.12fr);

          gap: clamp(64px, 8vw, 138px);
          align-items: center;

          padding: clamp(76px, 8vh, 110px) 0;
        }

        .founder-minimal-visual {
          position: relative;

          min-height: min(74vh, 760px);

          display: flex;
          align-items: flex-end;
          justify-content: center;

          overflow: hidden;

          isolation: isolate;
        }

        /* Base visual para que el personaje no quede cortado en el aire */
        /* Humo / máscara para esconder el recorte de los pies */
        .founder-minimal-visual::before {
          content: '';

          position: absolute;

          z-index: 3;

          left: 50%;
          bottom: -8px;

          width: 82%;
          height: 92px;

          transform: translateX(-50%);

          background:
            radial-gradient(
              ellipse at center bottom,
              rgba(5, 7, 6, 1) 0%,
              rgba(5, 7, 6, .98) 30%,
              rgba(5, 7, 6, .82) 52%,
              rgba(5, 7, 6, .34) 72%,
              rgba(5, 7, 6, 0) 100%
            );

          filter: blur(7px);

          pointer-events: none;
        }

        .founder-minimal-visual::after {
          content: '';

          position: absolute;

          z-index: 4;

          left: 50%;
          bottom: -2px;

          width: 58%;
          height: 54px;

          transform: translateX(-50%);

          background:
            radial-gradient(
              ellipse at center,
              rgba(5, 7, 6, 1) 0%,
              rgba(5, 7, 6, .9) 44%,
              rgba(5, 7, 6, 0) 100%
            );

          filter: blur(10px);

          pointer-events: none;
        }

        .founder-minimal-visual img {
          position: relative;

          z-index: 2;

          width: min(610px, 100%);
          max-height: min(74vh, 760px);

          object-fit: contain;
          object-position: center bottom;

          display: block;

          filter: none;

          will-change: transform, opacity;
        }

        .founder-minimal-copy {
          max-width: 840px;

          will-change: transform, opacity;
        }

        .founder-minimal-kicker {
          display: inline-block;

          margin-bottom: clamp(24px, 3vh, 38px);

          color: #00e875;

          font:
            800 10px/1
            'Inter',
            sans-serif;

          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .founder-minimal-copy blockquote {
          max-width: 820px;

          margin: 0;

          color: #f2f4f0;

          font:
            650
            clamp(
              28px,
              2.9vw,
              48px
            )/1.05
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing: -.045em;
        }

        .founder-minimal-signature {
          margin-top: clamp(34px, 4vh, 52px);

          display: flex;
          align-items: baseline;

          gap: 14px;
        }

        .founder-minimal-signature strong {
          color: #00e875;

          font:
            800 11px/1
            'Inter',
            sans-serif;

          letter-spacing: .14em;
        }

        .founder-minimal-signature span {
          color: rgba(242,244,240,.38);

          font:
            650 9px/1
            'Inter',
            sans-serif;

          letter-spacing: .12em;
        }

        @media (max-width: 900px) {
          .founder-minimal {
            min-height: auto;
          }

          .founder-minimal-shell {
            width: calc(100vw - 48px);

            grid-template-columns: 1fr;
            gap: 38px;

            padding: 84px 0 70px;
          }

          .founder-minimal-copy {
            order: 1;
          }

          .founder-minimal-visual {
            order: 2;

            min-height: 540px;
          }

          .founder-minimal-visual img {
            max-height: 560px;
          }

          .founder-minimal-copy blockquote {
            font-size:
              clamp(
                26px,
                7vw,
                42px
              );
          }
        }

        @media (max-width: 560px) {
          .founder-minimal-shell {
            width: calc(100vw - 32px);
          }

          .founder-minimal-visual {
            min-height: 470px;
          }

          .founder-minimal-visual img {
            max-height: 490px;
          }

          .founder-minimal-visual::before {
            width: 92%;
            height: 78px;
          }

          .founder-minimal-visual::after {
            width: 68%;
            height: 46px;
          }

          .founder-minimal-signature {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .founder-minimal-visual img,
          .founder-minimal-copy {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
