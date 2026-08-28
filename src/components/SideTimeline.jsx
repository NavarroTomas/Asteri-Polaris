import { useEffect, useMemo, useState } from 'react'

const chapters = [
  {
    key: 'team',
    number: '01',
    label: 'TEAM',
    href: '/#plantel',
    sectionIds: ['plantel', 'numbers'],
  },
  {
    key: 'compete',
    number: '02',
    label: 'COMPETE',
    href: '/#partidos',
    sectionIds: ['partidos'],
  },
  {
    key: 'story',
    number: '03',
    label: 'STORY',
    href: '/#historia',
    sectionIds: ['historia', 'founder'],
  },
  {
    key: 'future',
    number: '04',
    label: 'FUTURE',
    href: '/#objetivo',
    sectionIds: ['objetivo'],
  },
  {
    key: 'community',
    number: '05',
    label: 'COMMUNITY',
    href: '/#community',
    sectionIds: ['community', 'contacto'],
  },
]

export default function SideTimeline() {
  const [active, setActive] = useState('team')

  const sectionToChapter = useMemo(() => {
    const map = new Map()

    chapters.forEach(chapter => {
      chapter.sectionIds.forEach(id => {
        map.set(id, chapter.key)
      })
    })

    return map
  }, [])

  useEffect(() => {
    const observedSections = []

    chapters.forEach(chapter => {
      chapter.sectionIds.forEach(id => {
        const element = document.getElementById(id)

        if (element) {
          observedSections.push(element)
        }
      })
    })

    if (!observedSections.length) return undefined

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => {
            const aDistance = Math.abs(
              a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight * 0.46,
            )

            const bDistance = Math.abs(
              b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight * 0.46,
            )

            return aDistance - bDistance
          })[0]

        if (!visible?.target?.id) return

        const chapter = sectionToChapter.get(visible.target.id)

        if (chapter) {
          setActive(chapter)
        }
      },
      {
        rootMargin: '-20% 0px -48% 0px',
        threshold: [0, 0.04, 0.12, 0.24],
      },
    )

    observedSections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionToChapter])

  return (
    <aside className="asteri-chapter-nav" aria-label="Capítulos de ASTERI">
      <div className="asteri-chapter-nav-track" aria-hidden="true" />

      {chapters.map(chapter => {
        const isActive = active === chapter.key

        return (
          <a
            key={chapter.key}
            href={chapter.href}
            className={`asteri-chapter-nav-item ${isActive ? 'is-active' : ''}`}
            aria-label={`Ir al capítulo ${chapter.label}`}
          >
            <span className="asteri-chapter-nav-number">
              {chapter.number}
            </span>

            <span className="asteri-chapter-nav-dot" />

            <span className="asteri-chapter-nav-label">
              {chapter.label}
            </span>
          </a>
        )
      })}

      <style>{`
        .asteri-chapter-nav {
          position: fixed;
          left: 16px;
          top: 50%;
          z-index: 90;
          transform: translateY(-50%);

          display: flex;
          flex-direction: column;
          gap: 20px;

          width: 112px;

          pointer-events: none;
        }

        .asteri-chapter-nav-track {
          position: absolute;
          left: 25px;
          top: 9px;
          bottom: 9px;

          width: 1px;

          background:
            linear-gradient(
              to bottom,
              rgba(0, 232, 117, .18),
              rgba(0, 232, 117, .5),
              rgba(0, 232, 117, .18)
            );

          pointer-events: none;
        }

        .asteri-chapter-nav-item {
          position: relative;

          display: grid;
          grid-template-columns: 17px 18px 1fr;
          align-items: center;
          gap: 0 0;

          min-height: 22px;

          color: rgba(242, 244, 240, .28);

          text-decoration: none;

          pointer-events: auto;

          transition:
            color .25s ease,
            opacity .25s ease;
        }

        .asteri-chapter-nav-number {
          font:
            800 8px/1
            'Inter',
            sans-serif;

          letter-spacing: .04em;

          opacity: 0;

          transform: translateX(-4px);

          transition:
            opacity .22s ease,
            transform .22s ease;
        }

        .asteri-chapter-nav-dot {
          position: relative;
          z-index: 2;

          justify-self: center;

          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #173326;

          box-shadow: 0 0 0 1px rgba(0, 232, 117, .15);

          transition:
            width .24s ease,
            height .24s ease,
            background .24s ease,
            box-shadow .24s ease;
        }

        .asteri-chapter-nav-label {
          justify-self: start;

          margin-left: 8px;
          padding: 5px 7px;

          border: 1px solid transparent;

          background: rgba(3, 6, 4, .42);

          font:
            800 8px/1
            'Inter',
            sans-serif;

          letter-spacing: .14em;

          text-transform: uppercase;

          opacity: 0;
          transform: translateX(-6px);

          transition:
            opacity .22s ease,
            transform .22s ease,
            border-color .22s ease,
            background .22s ease;
        }

        .asteri-chapter-nav-item:hover {
          color: rgba(242, 244, 240, .72);
        }

        .asteri-chapter-nav-item:hover
        .asteri-chapter-nav-label,
        .asteri-chapter-nav-item:hover
        .asteri-chapter-nav-number,
        .asteri-chapter-nav-item.is-active
        .asteri-chapter-nav-label,
        .asteri-chapter-nav-item.is-active
        .asteri-chapter-nav-number {
          opacity: 1;
          transform: translateX(0);
        }

        .asteri-chapter-nav-item.is-active {
          color: #00e875;
        }

        .asteri-chapter-nav-item.is-active
        .asteri-chapter-nav-dot {
          width: 9px;
          height: 9px;

          background: #00e875;

          box-shadow:
            0 0 0 4px rgba(0, 232, 117, .09);
        }

        .asteri-chapter-nav-item.is-active
        .asteri-chapter-nav-label {
          border-color: rgba(0, 232, 117, .19);
          background: rgba(2, 8, 5, .84);
        }

        @media (max-height: 760px) {
          .asteri-chapter-nav {
            gap: 14px;
          }
        }

        @media (max-width: 900px) {
          .asteri-chapter-nav {
            left: 9px;
            width: 38px;
          }

          .asteri-chapter-nav-track {
            left: 21px;
          }

          .asteri-chapter-nav-item {
            grid-template-columns: 13px 18px;
          }

          .asteri-chapter-nav-label,
          .asteri-chapter-nav-number {
            display: none;
          }
        }

        @media (max-width: 620px) {
          .asteri-chapter-nav {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .asteri-chapter-nav-item,
          .asteri-chapter-nav-number,
          .asteri-chapter-nav-dot,
          .asteri-chapter-nav-label {
            transition: none !important;
          }
        }
      `}</style>
    </aside>
  )
}
