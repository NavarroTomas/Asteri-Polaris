export default function HeroVideo() {
  const videoUrl =
    import.meta.env.VITE_HERO_VIDEO_URL ||
    '/media/hero.mp4'

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

      <div className="hero-brand-entry">
        <span className="hero-brand-line" />

        <div className="hero-brand-text">
          <strong>ASTERI</strong>
          <span>POLARIS</span>
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
          animation:
            heroBrandIn
            1.05s
            cubic-bezier(.16, 1, .3, 1)
            .45s
            both;
        }

        .hero-brand-line {
          width: 42px;
          height: 2px;
          flex-shrink: 0;
          background: #00e875;
          transform-origin: left center;
          animation:
            heroLineIn
            .8s
            cubic-bezier(.16, 1, .3, 1)
            .75s
            both;
        }

        .hero-brand-text {
          display: flex;
          align-items: baseline;
          gap: 11px;
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
        }

        @keyframes heroBrandIn {
          from {
            opacity: 0;
            transform: translateX(-70px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes heroLineIn {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
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
            gap: 7px;
          }

          .hero-brand-text strong {
            font-size: clamp(21px, 6.4vw, 26px);
          }

          .hero-brand-text span {
            font-size: 7px;
            letter-spacing: .18em;
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
          .hero-brand-entry,
          .hero-brand-line {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
