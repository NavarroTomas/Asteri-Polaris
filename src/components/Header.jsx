import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import asteriA from '../assets/brand/asteri-a.png'
import { useAuth } from '../context/AuthContext'

function PillButton({ label, href }) {
  const pillRef = useRef(null)
  const circleRef = useRef(null)
  const labelRef = useRef(null)
  const hoverLabelRef = useRef(null)
  const timelineRef = useRef(null)
  const tweenRef = useRef(null)

  useEffect(() => {
    const pill = pillRef.current
    const circle = circleRef.current
    const labelNode = labelRef.current
    const hoverLabel = hoverLabelRef.current

    if (!pill || !circle || !labelNode || !hoverLabel) return undefined

    const buildTimeline = () => {
      const { width, height } = pill.getBoundingClientRect()
      if (!width || !height) return

      const radius = ((width * width) / 4 + height * height) / (2 * height)
      const diameter = Math.ceil(radius * 2) + 2
      const delta =
        Math.ceil(
          radius -
            Math.sqrt(Math.max(0, radius * radius - (width * width) / 4)),
        ) + 1
      const originY = diameter - delta

      circle.style.width = `${diameter}px`
      circle.style.height = `${diameter}px`
      circle.style.bottom = `-${delta}px`

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`,
      })

      gsap.set(labelNode, { y: 0 })
      gsap.set(hoverLabel, {
        y: height + 16,
        opacity: 0,
      })

      timelineRef.current?.kill()

      const timeline = gsap.timeline({ paused: true })

      timeline.to(
        circle,
        {
          scale: 1.22,
          xPercent: -50,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: 'auto',
        },
        0,
      )

      timeline.to(
        labelNode,
        {
          y: -(height + 8),
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
        },
        0,
      )

      timeline.to(
        hoverLabel,
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
        },
        0.03,
      )

      timelineRef.current = timeline
    }

    buildTimeline()
    const onResize = () => buildTimeline()

    window.addEventListener('resize', onResize)
    document.fonts?.ready?.then(buildTimeline).catch(() => {})

    return () => {
      window.removeEventListener('resize', onResize)
      tweenRef.current?.kill()
      timelineRef.current?.kill()
    }
  }, [])

  const handleEnter = () => {
    const timeline = timelineRef.current
    if (!timeline) return

    tweenRef.current?.kill()
    tweenRef.current = timeline.tweenTo(timeline.duration(), {
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const handleLeave = () => {
    const timeline = timelineRef.current
    if (!timeline) return

    tweenRef.current?.kill()
    tweenRef.current = timeline.tweenTo(0, {
      duration: 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  return (
    <a
      ref={pillRef}
      className="asteri-pill"
      href={href}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        ref={circleRef}
        className="asteri-pill-circle"
        aria-hidden="true"
      />

      <span className="asteri-pill-label-stack">
        <span ref={labelRef} className="asteri-pill-label">
          {label}
        </span>

        <span
          ref={hoverLabelRef}
          className="asteri-pill-label-hover"
          aria-hidden="true"
        >
          {label}
        </span>
      </span>
    </a>
  )
}

export default function Header() {
  const { loading, isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className={`site-header ${mobileOpen ? 'mobile-menu-open' : ''}`}>
      <nav
        className={`header-nav header-nav-left ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Navegación principal"
        id="asteri-mobile-nav"
        onClick={() => setMobileOpen(false)}
      >
        <PillButton label="PLANTEL" href="/#plantel" />
        <PillButton label="PARTIDOS" href="/#partidos" />
        <PillButton label="HISTORIA" href="/#historia" />
      </nav>

      <Link
        className="header-logo"
        to="/"
        aria-label="ASTERI inicio"
        onClick={() => setMobileOpen(false)}
      >
        <img src={asteriA} alt="ASTERI" />
      </Link>

      <nav
        className="header-nav header-nav-right"
        aria-label="Área privada"
      >
        {!loading && (
          <PillButton
            label={isAuthenticated ? 'MI CUENTA' : 'LOGIN'}
            href={isAuthenticated ? '/account' : '/login'}
          />
        )}

        <button
          type="button"
          className="asteri-mobile-menu-toggle"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-controls="asteri-mobile-nav"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </nav>

      <style>{`
        .site-header .asteri-pill {
          --asteri-pill-bg: #0d100e;
          --asteri-pill-border: #29312c;
          --asteri-pill-text: #f2f4f0;
          --asteri-pill-hover: #01d069;
          --asteri-pill-hover-text: #031109;

          position: relative;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 17px;
          overflow: hidden;
          border: 1px solid var(--asteri-pill-border);
          border-radius: 999px;
          background: var(--asteri-pill-bg);
          color: var(--asteri-pill-text);
          box-shadow: none;
          backdrop-filter: none;
          text-decoration: none;
          font: 700 11px/1 'Inter', sans-serif;
          letter-spacing: .09em;
          transform: translateZ(0);
          transition: border-color .2s ease, transform .2s ease;
          isolation: isolate;
        }

        .site-header .asteri-pill::after {
          display: none !important;
        }

        .site-header .asteri-pill:hover {
          background: var(--asteri-pill-bg);
          color: var(--asteri-pill-text);
          border-color: rgba(1, 208, 105, .72);
          box-shadow: none;
          transform: translateY(-2px);
        }

        .site-header .asteri-pill-circle {
          position: absolute;
          left: 50%;
          bottom: 0;
          z-index: 1;
          display: block;
          border-radius: 50%;
          background: var(--asteri-pill-hover);
          pointer-events: none;
          will-change: transform;
        }

        .site-header .asteri-pill-label-stack {
          position: relative;
          z-index: 2;
          display: inline-block;
          line-height: 1;
        }

        .site-header .asteri-pill-label,
        .site-header .asteri-pill-label-hover {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          white-space: nowrap;
          will-change: transform, opacity;
        }

        .site-header .asteri-pill-label {
          position: relative;
          color: var(--asteri-pill-text);
        }

        .site-header .asteri-pill-label-hover {
          position: absolute;
          inset: 0 auto auto 0;
          color: var(--asteri-pill-hover-text);
          opacity: 0;
        }

        .asteri-mobile-menu-toggle {
          display: none;
          width: 40px;
          height: 40px;
          padding: 0;
          border: 1px solid #29312c;
          border-radius: 999px;
          background: #0d100e;
          cursor: pointer;
        }

        .asteri-mobile-menu-toggle span {
          width: 14px;
          height: 1px;
          display: block;
          margin: 4px auto;
          background: #f2f4f0;
          transition: transform .2s ease, opacity .2s ease;
        }

        .mobile-menu-open .asteri-mobile-menu-toggle span:first-child {
          transform: translateY(2.5px) rotate(45deg);
        }

        .mobile-menu-open .asteri-mobile-menu-toggle span:last-child {
          transform: translateY(-2.5px) rotate(-45deg);
        }

        @media (max-width: 680px) {
          .site-header {
            height: 64px;
            grid-template-columns: auto 1fr auto !important;
            padding: 0 14px !important;
            background: #050706 !important;
            border-bottom: 1px solid #171d19;
          }

          .site-header .header-logo {
            grid-column: 1 !important;
            justify-self: start !important;
            width: 44px !important;
            height: 44px !important;
          }

          .site-header .header-nav-right {
            grid-column: 3 !important;
            justify-self: end;
            gap: 7px !important;
          }

          .site-header .header-nav-left {
            position: fixed;
            z-index: 120;
            top: 72px;
            left: 12px;
            right: 12px;
            width: auto;
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 1px !important;
            padding: 4px;
            border: 1px solid #29312c;
            background: #0d100e;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(-8px);
            transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
          }

          .site-header .header-nav-left.is-mobile-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
          }

          .site-header .header-nav-left.is-mobile-open .asteri-pill {
            width: 100%;
            min-height: 48px;
            display: inline-flex !important;
            justify-content: flex-start;
            padding: 0 15px;
            border: 0;
            border-radius: 0;
            background: #0d100e;
            font-size: 10px;
          }

          .site-header .header-nav-left.is-mobile-open .asteri-pill + .asteri-pill {
            border-top: 1px solid #1b211d;
          }

          .asteri-mobile-menu-toggle {
            display: block;
            flex: 0 0 40px;
          }

          .site-header .header-nav-right .asteri-pill {
            min-height: 38px;
            max-width: 96px;
            padding-inline: 11px;
            font-size: 9px;
            letter-spacing: .055em;
          }

          .site-header .asteri-pill {
            min-height: 36px;
            padding-inline: 13px;
            font-size: 10px;
          }

          .header-nav-right {
            display: flex;
          }
        }
      `}</style>
    </header>
  )
}
