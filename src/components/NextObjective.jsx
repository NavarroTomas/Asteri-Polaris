import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TextType from './TextType'

gsap.registerPlugin(ScrollTrigger)

const objectives = [
  {
    title: 'COMPETIR',
    text: 'Competir a nivel regional en todos los torneos.',
  },
  {
    title: 'FORMAR',
    text: 'Impulsar la producción de jugadores a nivel local.',
  },
]

export default function NextObjective() {
  const rootRef = useRef(null)
  const heroRef = useRef(null)
  const rowsRef = useRef([])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current,
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 75%',
          },
        }
      )

      rowsRef.current.forEach((row, index) => {
        if (!row) return

        gsap.fromTo(
          row,
          {
            y: 36,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: index * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              start: 'top 88%',
            },
          }
        )
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section className="next-objective" id="next-objective" ref={rootRef}>
      <div className="next-objective-shell">
        <div className="next-objective-hero" ref={heroRef}>
          <h2 className="next-objective-title">
            PRÓXIMO
            <br />
            OBJETIVO
          </h2>

          <div className="next-objective-typing-wrap">
            <TextType
              text={[
                'COMPETIR A NIVEL REGIONAL.',
                'FORMAR JUGADORES A NIVEL LOCAL.',
              ]}
              as="div"
              typingSpeed={42}
              deletingSpeed={22}
              pauseDuration={2100}
              initialDelay={350}
              loop={true}
              startOnVisible={true}
              showCursor={true}
              cursorCharacter="|"
              className="next-objective-typing"
              cursorClassName="next-objective-cursor"
            />
          </div>
        </div>

        <div className="next-objective-grid">
          {objectives.map((objective, index) => (
            <article
              key={objective.title}
              className="next-objective-card"
              ref={element => {
                rowsRef.current[index] = element
              }}
            >
              <h3>{objective.title}</h3>
              <p>{objective.text}</p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .next-objective {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          background: #090c0a;
          color: #f3f5f1;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .next-objective-shell {
          width: min(1420px, calc(100vw - 8vw));
          margin: 0 auto;
          padding: clamp(90px, 11vh, 140px) 0;
          display: flex;
          flex-direction: column;
          gap: clamp(56px, 8vh, 90px);
        }

        .next-objective-hero {
          display: grid;
          grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.05fr);
          gap: clamp(30px, 6vw, 90px);
          align-items: end;
        }

        .next-objective-title {
          margin: 0;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-size: clamp(5.5rem, 11vw, 11.5rem);
          line-height: 0.82;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #f3f5f1;
        }

        .next-objective-typing-wrap {
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          min-height: 100%;
          padding-bottom: clamp(6px, 1vw, 14px);
        }

        .next-objective-typing {
          min-height: 2.4em;
          max-width: 680px;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-size: clamp(1.8rem, 3vw, 3.8rem);
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #01D069;
        }

        .next-objective-cursor {
          color: #01D069;
        }

        .next-objective-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .next-objective-card {
          position: relative;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(28px, 3vw, 40px);
          background: #0d120f;
          transition: background 0.25s ease, transform 0.25s ease;
        }

        .next-objective-card + .next-objective-card {
          border-left: 1px solid rgba(255, 255, 255, 0.08);
        }

        .next-objective-card:hover {
          background: #111913;
          transform: translateY(-4px);
        }

        .next-objective-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: #01D069;
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.28s ease;
        }

        .next-objective-card:hover::before {
          transform: scaleX(1);
        }

        .next-objective-card h3 {
          margin: 0 0 16px;
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-size: clamp(3rem, 5.4vw, 5.8rem);
          line-height: 0.88;
          letter-spacing: -0.045em;
          text-transform: uppercase;
          color: #f3f5f1;
        }

        .next-objective-card p {
          margin: 0;
          max-width: 520px;
          font-family: 'Inter', sans-serif;
          font-size: clamp(1rem, 1.2vw, 1.16rem);
          line-height: 1.45;
          color: #b9c4bc;
        }

        @media (max-width: 980px) {
          .next-objective-shell {
            width: calc(100vw - 52px);
          }

          .next-objective-hero {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .next-objective-typing-wrap {
            padding-bottom: 0;
          }

          .next-objective-grid {
            grid-template-columns: 1fr;
          }

          .next-objective-card + .next-objective-card {
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
        }

        @media (max-width: 640px) {
          .next-objective-shell {
            width: calc(100vw - 34px);
            padding: 82px 0;
            gap: 44px;
          }

          .next-objective-title {
            font-size: clamp(4.4rem, 18vw, 7rem);
          }

          .next-objective-typing {
            font-size: clamp(1.45rem, 8vw, 2.4rem);
            min-height: 3em;
          }

          .next-objective-card {
            min-height: 220px;
            padding: 24px 22px;
          }

          .next-objective-card h3 {
            font-size: clamp(2.5rem, 12vw, 4rem);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .next-objective-card,
          .next-objective-card::before {
            transition: none;
          }
        }
      `}</style>
    </section>
  )
}