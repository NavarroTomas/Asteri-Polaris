import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import polarisClassic from '../assets/brand/polaris-classic.png'
import polarisStar from '../assets/brand/polaris-star.png'
import asteriA from '../assets/brand/asteri-a.png'

gsap.registerPlugin(ScrollTrigger)

const eras = [
  {
    period: 'PRIMER ESCUDO',
    title: 'ASTERI POLARIS',
    logo: polarisClassic,
    text: 'El primer escudo nace de una idea simple: nunca dejar de mirar hacia arriba. La figura central representa los sueños, la ambición y la voluntad de seguir superándose; las estrellas simbolizan esas metas que solo se alcanzan con trabajo, perseverancia y la decisión de ir siempre un poco más lejos.'
  },
  {
    period: 'SEGUNDA IDENTIDAD',
    title: 'ESTRELLA POLAR',
    logo: polarisStar,
    text: 'La segunda identidad toma una representación directa de la Estrella Polar. Durante siglos fue una referencia para encontrar el rumbo incluso en la oscuridad; para ASTERI representa una dirección clara, una guía constante y una meta que nunca se deja de perseguir.'
  },
  {
    period: 'IDENTIDAD ACTUAL',
    title: 'ASTERI',
    logo: asteriA,
    text: 'El escudo actual representa la evolución de ASTERI sin borrar su origen. Conserva los valores que dieron forma a Polaris y los transforma en una identidad más moderna, competitiva y reconocible: un símbolo propio para afrontar cada nuevo desafío.'
  }
]

function ScrollRevealText({ children }) {
  const containerRef = useRef(null)

  const words = useMemo(() => {
    return children.split(/(\s+)/).map((part, index) => {
      if (/^\s+$/.test(part)) return part

      return (
        <span className="history-reveal-word" key={`${part}-${index}`}>
          {part}
        </span>
      )
    })
  }, [children])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const context = gsap.context(() => {
      const wordElements = element.querySelectorAll('.history-reveal-word')

      gsap.fromTo(
        element,
        {
          rotate: 2.2,
          transformOrigin: '0% 50%'
        },
        {
          rotate: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            end: 'bottom 52%',
            scrub: 0.7
          }
        }
      )

      gsap.fromTo(
        wordElements,
        {
          opacity: 0.08,
          filter: 'blur(7px)',
          y: 9
        },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          ease: 'none',
          stagger: 0.035,
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
            end: 'bottom 68%',
            scrub: 0.75
          }
        }
      )
    }, element)

    return () => context.revert()
  }, [])

  return (
    <p ref={containerRef} className="history-scroll-reveal">
      {words}
    </p>
  )
}

export default function HistoryTimeline() {
  const rootRef = useRef(null)
  const logoRefs = useRef([])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const context = gsap.context(() => {
      const stories = gsap.utils.toArray('.history-scroll-story', root)
      const logos = logoRefs.current.filter(Boolean)

      const showLogo = (activeIndex, immediate = false) => {
        logos.forEach((logo, index) => {
          if (!logo) return

          if (index === activeIndex) {
            if (immediate) {
              gsap.set(logo, {
                autoAlpha: 1,
                y: 0,
                x: 0,
                scale: 1,
                rotate: 0
              })
              return
            }

            gsap.killTweensOf(logo)
            gsap.fromTo(
              logo,
              {
                autoAlpha: 0,
                y: 42,
                x: 26,
                scale: 0.9,
                rotate: 3
              },
              {
                autoAlpha: 1,
                y: 0,
                x: 0,
                scale: 1,
                rotate: 0,
                duration: 0.72,
                ease: 'power3.out',
                overwrite: true
              }
            )
          } else {
            gsap.killTweensOf(logo)
            gsap.to(logo, {
              autoAlpha: 0,
              y: -34,
              x: -18,
              scale: 0.94,
              rotate: -2,
              duration: immediate ? 0 : 0.38,
              ease: 'power2.in',
              overwrite: true
            })
          }
        })
      }

      showLogo(0, true)

      stories.forEach((story, index) => {
        ScrollTrigger.create({
          trigger: story,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => showLogo(index),
          onEnterBack: () => showLogo(index)
        })

        const period = story.querySelector('.history-scroll-period')
        const title = story.querySelector('.history-scroll-title')

        gsap.fromTo(
          [period, title],
          {
            opacity: 0,
            y: 28
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: story,
              start: 'top 78%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    }, root)

    return () => context.revert()
  }, [])

  return (
    <section id="historia" className="history-scroll-section" ref={rootRef}>
      <div className="history-scroll-layout">
        <div className="history-scroll-copy-column">
          {eras.map((era) => (
            <article className="history-scroll-story" key={era.title}>
              <span className="history-scroll-period">{era.period}</span>
              <h3 className="history-scroll-title">{era.title}</h3>
              <ScrollRevealText>{era.text}</ScrollRevealText>
            </article>
          ))}
        </div>

        <div className="history-scroll-logo-column" aria-hidden="true">
          <div className="history-scroll-logo-sticky">
            <span className="history-logo-kicker">IDENTIDAD / EVOLUCIÓN</span>

            <div className="history-scroll-logo-stage">
              {eras.map((era, index) => (
                <img
                  key={era.title}
                  ref={(element) => {
                    logoRefs.current[index] = element
                  }}
                  src={era.logo}
                  alt=""
                  className="history-scroll-logo"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .history-scroll-section {
          position: relative;
          width: 100%;
          background: #000;
          color: var(--color-text, #f2f4f0);
          overflow: clip;
        }

        .history-scroll-layout {
          width: min(1160px, calc(100vw - 120px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, .72fr);
          gap: clamp(56px, 7vw, 112px);
          align-items: start;
        }

        .history-scroll-copy-column {
          min-width: 0;
          padding: 12vh 0 8vh;
        }

        .history-scroll-story {
          min-height: 76vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8vh 0;
        }

        .history-scroll-story:last-of-type {
          min-height: 78vh;
          padding-bottom: 10vh;
        }

        .history-scroll-period {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 14px;
          color: var(--color-primary, #01D069);
          font: 700 10px/1 'Inter', sans-serif;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .history-scroll-title {
          max-width: 620px;
          margin: 0 0 24px;
          font: 800 clamp(36px, 4.15vw, 64px)/.92 'Bricolage Grotesque', sans-serif;
          letter-spacing: -.045em;
          color: var(--color-text, #f2f4f0);
        }

        .history-scroll-reveal {
          max-width: 590px;
          margin: 0;
          color: var(--color-text-muted, #939F97);
          font: 500 clamp(16px, 1.12vw, 18px)/1.72 'Inter', sans-serif;
        }

        .history-reveal-word {
          display: inline-block;
          will-change: opacity, filter, transform;
        }

        .history-scroll-logo-column {
          position: relative;
          min-height: 100%;
        }

        .history-scroll-logo-sticky {
          position: sticky;
          top: 10vh;
          height: 80vh;
          min-height: 520px;
          display: grid;
          grid-template-rows: auto 1fr;
          align-items: center;
        }

        .history-logo-kicker {
          justify-self: end;
          color: rgba(242, 244, 240, .34);
          font: 700 9px/1 'Inter', sans-serif;
          letter-spacing: .18em;
        }

        .history-scroll-logo-stage {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
        }

        .history-scroll-logo-stage::before {
          content: '';
          position: absolute;
          width: min(360px, 30vw);
          aspect-ratio: 1;
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 50%;
        }

        .history-scroll-logo {
          position: absolute;
          width: min(340px, 27vw);
          max-height: 48vh;
          object-fit: contain;
          opacity: 0;
          visibility: hidden;
          filter: none;
          will-change: transform, opacity;
        }

        @media (max-width: 900px) {
          .history-scroll-layout {
            width: calc(100vw - 64px);
            grid-template-columns: minmax(0, 1fr) minmax(250px, .56fr);
            gap: 32px;
          }

          .history-scroll-story {
            min-height: 78vh;
          }

          .history-scroll-logo {
            width: min(280px, 31vw);
          }
        }

        @media (max-width: 720px) {
          .history-scroll-layout {
            width: calc(100vw - 40px);
            display: block;
          }

          .history-scroll-logo-column {
            position: absolute;
            inset: 0 0 auto;
            height: 100%;
            pointer-events: none;
          }

          .history-scroll-logo-sticky {
            top: 72px;
            height: 32vh;
            min-height: 250px;
            opacity: .26;
          }

          .history-logo-kicker,
          .history-scroll-logo-stage::before {
            display: none;
          }

          .history-scroll-logo {
            width: min(250px, 58vw);
            max-height: 28vh;
          }

          .history-scroll-copy-column {
            position: relative;
            z-index: 2;
            padding: 12vh 0 8vh;
          }

          .history-scroll-story {
            min-height: 82vh;
            padding: 8vh 0;
          }

          .history-scroll-story:last-of-type {
            min-height: 76vh;
            padding-bottom: 8vh;
          }

          .history-scroll-title {
            max-width: 92%;
            font-size: clamp(34px, 11vw, 54px);
          }

          .history-scroll-reveal {
            max-width: 94%;
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .history-reveal-word,
          .history-scroll-logo,
          .history-scroll-period,
          .history-scroll-title {
            opacity: 1 !important;
            filter: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
