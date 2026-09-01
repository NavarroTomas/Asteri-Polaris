import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="asteri-not-found">
      <div className="asteri-not-found-copy">
        <span>ERROR / 404</span>

        <h1>
          FUERA
          <br />
          DE MAPA.
        </h1>

        <p>
          La página que buscás no existe o cambió de ubicación.
        </p>

        <Link to="/">
          VOLVER AL INICIO
          <b aria-hidden="true">→</b>
        </Link>
      </div>

      <div className="asteri-not-found-code" aria-hidden="true">
        404
      </div>

      <style>{`
        .asteri-not-found {
          position: relative;
          min-height: 100svh;
          overflow: hidden;

          display: flex;
          align-items: center;

          padding:
            clamp(88px, 12vh, 140px)
            max(5vw, 28px);

          background: #050706;
          color: #f2f4f0;
        }

        .asteri-not-found-copy {
          position: relative;
          z-index: 2;

          width: min(760px, 100%);
        }

        .asteri-not-found-copy > span {
          display: inline-block;

          margin-bottom: 22px;

          color: #00e875;

          font:
            800 9px/1
            'Inter',
            sans-serif;

          letter-spacing: .18em;
        }

        .asteri-not-found-copy h1 {
          margin: 0;

          font:
            800
            clamp(76px, 12vw, 190px)/.78
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing: -.07em;
        }

        .asteri-not-found-copy p {
          max-width: 430px;

          margin: 30px 0 28px;

          color: #8e9992;

          font:
            500 15px/1.6
            'Inter',
            sans-serif;
        }

        .asteri-not-found-copy a {
          min-height: 46px;

          display: inline-flex;
          align-items: center;
          gap: 18px;

          padding: 0 16px;

          border: 1px solid #29312c;

          color: #f2f4f0;

          font:
            800 9px/1
            'Inter',
            sans-serif;

          letter-spacing: .13em;

          transition:
            border-color .2s ease,
            color .2s ease;
        }

        .asteri-not-found-copy a:hover {
          border-color: #00e875;
          color: #00e875;
        }

        .asteri-not-found-copy a b {
          font-size: 16px;
          font-weight: 400;
        }

        .asteri-not-found-code {
          position: absolute;

          right: -2vw;
          bottom: -5vh;

          color: rgba(0, 232, 117, .055);

          font:
            900
            clamp(230px, 38vw, 620px)/.7
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing: -.1em;

          pointer-events: none;
          user-select: none;
        }

        @media (max-width: 680px) {
          .asteri-not-found {
            align-items: flex-end;

            padding:
              96px
              18px
              58px;
          }

          .asteri-not-found-copy h1 {
            font-size: clamp(68px, 22vw, 102px);
          }

          .asteri-not-found-copy p {
            margin-top: 24px;
            font-size: 14px;
          }

          .asteri-not-found-code {
            top: 100px;
            right: -24px;
            bottom: auto;

            font-size: 210px;
          }
        }
      `}</style>
    </main>
  )
}
