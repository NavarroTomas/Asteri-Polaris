export default function HeroVideo() {
  const videoUrl =
    import.meta.env.VITE_HERO_VIDEO_URL ||
    '/media/ejemplox.mp4'

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

      {/* Entrada de marca */}
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

          display: block;
        }


        /* =========================
           OVERLAY
        ========================= */

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


        /* =========================
           BRAND ENTRY
        ========================= */

        .hero-brand-entry {
          position: absolute;

          z-index: 3;

          left:
            clamp(
              34px,
              5.5vw,
              105px
            );

          bottom:
            clamp(
              52px,
              8vh,
              92px
            );

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
            clamp(
              28px,
              3vw,
              52px
            )/1
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing:
            -.035em;
        }

        .hero-brand-text span {
          color: #00e875;

          font:
            700
            clamp(
              8px,
              .72vw,
              11px
            )/1
            'Inter',
            sans-serif;

          letter-spacing:
            .24em;

          text-transform:
            uppercase;
        }


        /* =========================
           ANIMATIONS
        ========================= */

        @keyframes heroBrandIn {
          from {
            opacity: 0;

            transform:
              translateX(-70px);
          }

          to {
            opacity: 1;

            transform:
              translateX(0);
          }
        }

        @keyframes heroLineIn {
          from {
            transform:
              scaleX(0);
          }

          to {
            transform:
              scaleX(1);
          }
        }


        /* =========================
           MOBILE
        ========================= */

        @media (
          max-width: 700px
        ) {
          .hero-video-section {
            height: 88svh;
            min-height: 580px;
            max-height: 760px;
          }

          .hero-background-video {
            object-position: 52% center;
          }

          .hero-video-overlay {
            background: rgba(5, 7, 6, .16);
          }

          .hero-brand-entry {
            left: 20px;
            right: 20px;
            bottom: 28px;
            gap: 11px;
          }

          .hero-brand-line {
            width: 26px;
          }

          .hero-brand-text {
            gap: 7px;
          }

          .hero-brand-text strong {
            font-size: 22px;
          }

          .hero-brand-text span {
            font-size: 7px;
            letter-spacing: .2em;
          }
        }

        @supports (height: 100dvh) {
          @media (max-width: 700px) {
            .hero-video-section {
              height: 88dvh;
            }
          }
        }


        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .hero-brand-entry,
          .hero-brand-line {
            animation:
              none;
          }
        }
      `}</style>
    </section>
  )
}
