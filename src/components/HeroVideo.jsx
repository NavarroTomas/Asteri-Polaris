import { useEffect, useState } from 'react'
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
} from '../lib/siteSettings'

const FULL_BRAND = 'ASTERI POLARIS'
const ASTERI_LENGTH = 'ASTERI'.length
const POLARIS_START = 'ASTERI '.length
const INTRO_DELAY = 2200

export default function HeroVideo() {
  const fallbackVideoUrl =
    import.meta.env.VITE_HERO_VIDEO_URL ||
    DEFAULT_SITE_SETTINGS.hero_video_url

  const [videoUrl, setVideoUrl] = useState(fallbackVideoUrl)
  const [typedLength, setTypedLength] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const settings = await getSiteSettings()

        if (alive && settings.hero_video_url) {
          setVideoUrl(settings.hero_video_url)
        }
      } catch (error) {
        console.error(
          'No se pudo cargar el video configurado del Hero:',
          error,
        )
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) {
      setTypedLength(FULL_BRAND.length)
      setDeleting(false)
      return undefined
    }

    let timer = 0

    if (!deleting && typedLength === 0) {
      timer = window.setTimeout(() => {
        setTypedLength(1)
      }, INTRO_DELAY)

      return () => window.clearTimeout(timer)
    }

    if (!deleting && typedLength >= FULL_BRAND.length) {
      timer = window.setTimeout(() => {
        setDeleting(true)
      }, 1450)

      return () => window.clearTimeout(timer)
    }

    if (deleting && typedLength <= 0) {
      timer = window.setTimeout(() => {
        setDeleting(false)
        setTypedLength(1)
      }, 520)

      return () => window.clearTimeout(timer)
    }

    timer = window.setTimeout(
      () => {
        setTypedLength(current =>
          deleting
            ? Math.max(0, current - 1)
            : Math.min(FULL_BRAND.length, current + 1),
        )
      },
      deleting ? 58 : 92,
    )

    return () => window.clearTimeout(timer)
  }, [typedLength, deleting])

  const typed = FULL_BRAND.slice(0, typedLength)
  const asteriText = typed.slice(0, ASTERI_LENGTH)
  const polarisText =
    typedLength > POLARIS_START
      ? FULL_BRAND.slice(
          POLARIS_START,
          typedLength,
        )
      : ''

  return (
    <section
      className="hero-video-section"
      id="inicio"
    >
      <video
        className="hero-background-video"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      <div className="hero-video-overlay" />

      <div
        className="hero-brand-entry"
        aria-label="ASTERI POLARIS"
      >
        <span className="hero-brand-line" />

        <div
          className="hero-brand-text"
          aria-hidden="true"
        >
          <strong>
            {asteriText || '\u00A0'}
          </strong>

          {polarisText && (
            <span>{polarisText}</span>
          )}

          <i className="hero-brand-cursor" />
        </div>
      </div>

      <style>{`
        .hero-video-section {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 700px;
          overflow: hidden;
          background: #050706;
        }

        .hero-background-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
        }

        .hero-video-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              90deg,
              rgba(5, 7, 6, .24) 0%,
              rgba(5, 7, 6, .04) 38%,
              rgba(5, 7, 6, .02) 72%,
              rgba(5, 7, 6, .12) 100%
            );
        }

        .hero-brand-entry {
          position: absolute;
          z-index: 3;
          left: clamp(34px, 5.5vw, 105px);
          bottom: clamp(52px, 8vh, 92px);
          display: flex;
          align-items: center;
          gap: 18px;
          pointer-events: none;
        }

        .hero-brand-line {
          width: 42px;
          height: 2px;
          flex-shrink: 0;
          background: #00e875;
        }

        .hero-brand-text {
          position: relative;
          min-width: clamp(235px, 23vw, 415px);
          min-height: clamp(28px, 3vw, 52px);

          display: block;

          white-space: nowrap;
        }

        .hero-brand-text strong {
          color: #f2f4f0;
          font:
            800
            clamp(28px, 3vw, 52px)/1
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing: -.035em;
        }

        .hero-brand-text span {
          color: #00e875;
          font:
            700
            clamp(8px, .72vw, 11px)/1
            'Inter',
            sans-serif;

          letter-spacing: .24em;
          text-transform: uppercase;
          margin-left: 11px;
        }

        .hero-brand-cursor {
          width: 2px;
          height: clamp(22px, 2.6vw, 42px);

          display: inline-block;
          vertical-align: -.12em;

          margin-left: 3px;

          background: #00e875;

          animation:
            heroCursorBlink
            .72s
            steps(1, end)
            infinite;
        }

        @keyframes heroCursorBlink {
          0%,
          46% {
            opacity: 1;
          }

          47%,
          100% {
            opacity: .08;
          }
        }

        @media (max-width: 900px) {
          .hero-video-section {
            height: 78svh;
            min-height: 560px;
            max-height: 760px;
          }

          .hero-background-video {
            object-position: 52% center;
          }

          .hero-brand-entry {
            left: 28px;
            bottom: 32px;
          }
        }

        @media (max-width: 680px) {
          .hero-video-section {
            height: 72svh;
            min-height: 500px;
            max-height: 660px;
          }

          .hero-background-video {
            object-position: 52% center;
          }

          .hero-video-overlay {
            background:
              linear-gradient(
                to bottom,
                rgba(5, 7, 6, .02) 0%,
                rgba(5, 7, 6, .04) 48%,
                rgba(5, 7, 6, .42) 100%
              );
          }

          .hero-brand-entry {
            left: 18px;
            right: 18px;
            bottom: 20px;
            gap: 10px;
          }

          .hero-brand-line {
            width: 24px;
          }

          .hero-brand-text {
            min-width: 220px;
            min-height: 26px;
          }

          .hero-brand-text strong {
            font-size:
              clamp(
                21px,
                6.4vw,
                26px
              );
          }

          .hero-brand-text span {
            font-size: 7px;
            letter-spacing: .18em;
            margin-left: 7px;
          }

          .hero-brand-cursor {
            height: 21px;
          }
        }

        @media (max-width: 390px) {
          .hero-video-section {
            height: 69svh;
            min-height: 470px;
          }

          .hero-brand-entry {
            left: 16px;
            right: 16px;
            bottom: 18px;
          }
        }

        @supports (height: 100dvh) {
          @media (max-width: 900px) {
            .hero-video-section {
              height: 78dvh;
            }
          }

          @media (max-width: 680px) {
            .hero-video-section {
              height: 72dvh;
            }
          }

          @media (max-width: 390px) {
            .hero-video-section {
              height: 69dvh;
            }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-brand-cursor {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}
