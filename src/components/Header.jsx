import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import asteriA from '../assets/brand/asteri-a.png'

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

    if (!pill || !circle || !labelNode || !hoverLabel) {
      return undefined
    }

    const buildTimeline = () => {
      const { width, height } =
        pill.getBoundingClientRect()

      if (!width || !height) return

      const radius =
        ((width * width) / 4 + height * height) /
        (2 * height)

      const diameter =
        Math.ceil(radius * 2) + 2

      const delta =
        Math.ceil(
          radius -
            Math.sqrt(
              Math.max(
                0,
                radius * radius -
                  (width * width) / 4,
              ),
            ),
        ) + 1

      const originY =
        diameter - delta

      circle.style.width =
        `${diameter}px`

      circle.style.height =
        `${diameter}px`

      circle.style.bottom =
        `-${delta}px`

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin:
          `50% ${originY}px`,
      })

      gsap.set(labelNode, {
        y: 0,
      })

      gsap.set(hoverLabel, {
        y: height + 16,
        opacity: 0,
      })

      timelineRef.current?.kill()

      const timeline =
        gsap.timeline({
          paused: true,
        })

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

      timelineRef.current =
        timeline
    }

    buildTimeline()

    const onResize = () =>
      buildTimeline()

    window.addEventListener(
      'resize',
      onResize,
    )

    document.fonts?.ready
      ?.then(buildTimeline)
      .catch(() => {})

    return () => {
      window.removeEventListener(
        'resize',
        onResize,
      )

      tweenRef.current?.kill()
      timelineRef.current?.kill()
    }
  }, [])

  const handleEnter = () => {
    const timeline =
      timelineRef.current

    if (!timeline) return

    tweenRef.current?.kill()

    tweenRef.current =
      timeline.tweenTo(
        timeline.duration(),
        {
          duration: 0.28,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )
  }

  const handleLeave = () => {
    const timeline =
      timelineRef.current

    if (!timeline) return

    tweenRef.current?.kill()

    tweenRef.current =
      timeline.tweenTo(
        0,
        {
          duration: 0.22,
          ease: 'power2.out',
          overwrite: 'auto',
        },
      )
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
        <span
          ref={labelRef}
          className="asteri-pill-label"
        >
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
  return (
    <header className="site-header">
      <nav
        className="header-nav header-nav-left"
        aria-label="Navegación principal"
      >
        <PillButton
          label="PLANTEL"
          href="/#plantel"
        />

        <PillButton
          label="PARTIDOS"
          href="/#partidos"
        />

        <PillButton
          label="HISTORIA"
          href="/#historia"
        />
      </nav>

      <Link
        className="header-logo"
        to="/"
        aria-label="ASTERI inicio"
      >
        <img
          src={asteriA}
          alt="ASTERI"
        />
      </Link>

      {/* Columna derecha vacía para mantener
          el logo exactamente centrado. */}
      <div
        className="header-nav header-nav-right"
        aria-hidden="true"
      />

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

          border:
            1px solid
            var(--asteri-pill-border);

          border-radius: 999px;

          background:
            var(--asteri-pill-bg);

          color:
            var(--asteri-pill-text);

          box-shadow: none;
          backdrop-filter: none;

          text-decoration: none;

          font:
            700
            11px/1
            'Inter',
            sans-serif;

          letter-spacing: .09em;

          transform:
            translateZ(0);

          transition:
            border-color .2s ease,
            transform .2s ease;

          isolation: isolate;
        }

        .site-header
        .asteri-pill::after {
          display: none !important;
        }

        .site-header
        .asteri-pill:hover {
          background:
            var(--asteri-pill-bg);

          color:
            var(--asteri-pill-text);

          border-color:
            rgba(
              1,
              208,
              105,
              .72
            );

          box-shadow: none;

          transform:
            translateY(-2px);
        }

        .site-header
        .asteri-pill-circle {
          position: absolute;

          left: 50%;
          bottom: 0;

          z-index: 1;

          display: block;

          border-radius: 50%;

          background:
            var(--asteri-pill-hover);

          pointer-events: none;

          will-change:
            transform;
        }

        .site-header
        .asteri-pill-label-stack {
          position: relative;

          z-index: 2;

          display: inline-block;

          line-height: 1;
        }

        .site-header
        .asteri-pill-label,
        .site-header
        .asteri-pill-label-hover {
          display: inline-flex;
          align-items: center;

          line-height: 1;

          white-space: nowrap;

          will-change:
            transform,
            opacity;
        }

        .site-header
        .asteri-pill-label {
          position: relative;

          color:
            var(--asteri-pill-text);
        }

        .site-header
        .asteri-pill-label-hover {
          position: absolute;

          inset:
            0 auto auto 0;

          color:
            var(--asteri-pill-hover-text);

          opacity: 0;
        }

        @media (
          max-width: 680px
        ) {
          .site-header
          .asteri-pill {
            min-height: 36px;

            padding-inline:
              13px;

            font-size: 10px;
          }
        }
      `}</style>
    </header>
  )
}
