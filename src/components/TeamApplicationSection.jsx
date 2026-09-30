const APPLICATION_URL = 'https://koya.gg/form/nh5mG438'

export default function TeamApplicationSection() {
  return (
    <section className="team-application-section" id="postulate">
      <div className="section-shell team-application-shell">
        <div className="team-application-copy">
          <span>TEAM / RECRUITMENT</span>

          <h2>
            POSTULATE
            <br />
            AL EQUIPO.
          </h2>

          <p>
            ¿Querés competir con ASTERI POLARIS? Completá el formulario de
            postulación y dejá tus datos para que el staff pueda revisar tu perfil.
          </p>
        </div>

        <div className="team-application-action">
          <span>FORMULARIO ABIERTO</span>

          <a
            href={APPLICATION_URL}
            target="_blank"
            rel="noreferrer"
          >
            COMPLETAR POSTULACIÓN ↗
          </a>
        </div>
      </div>

      <style>{`
        .team-application-section {
          width: 100%;
          padding: clamp(84px, 10vw, 150px) 0;
          background: #050706;
          color: #f2f4f0;
          border-top: 1px solid #1b211d;
          border-bottom: 1px solid #1b211d;
        }

        .team-application-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr);
          gap: clamp(50px, 8vw, 130px);
          align-items: end;
        }

        .team-application-copy > span,
        .team-application-action > span {
          display: block;
          color: #00e875;
          font: 800 9px/1 'Inter', sans-serif;
          letter-spacing: .17em;
        }

        .team-application-copy h2 {
          margin: 18px 0 24px;
          font: 800 clamp(58px, 7.2vw, 118px)/.82 'Bricolage Grotesque', sans-serif;
          letter-spacing: -.065em;
        }

        .team-application-copy p {
          max-width: 650px;
          margin: 0;
          color: #8d9891;
          font: 500 clamp(14px, 1.1vw, 17px)/1.65 'Inter', sans-serif;
        }

        .team-application-action {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 18px;
          padding-bottom: 8px;
        }

        .team-application-action a {
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          border: 1px solid #00e875;
          background: #00e875;
          color: #031109;
          text-decoration: none;
          font: 800 10px/1 'Inter', sans-serif;
          letter-spacing: .09em;
          transition: transform .18s ease, background .18s ease;
        }

        .team-application-action a:hover {
          transform: translateY(-2px);
          background: #16f08a;
        }

        @media (max-width: 820px) {
          .team-application-shell {
            grid-template-columns: 1fr;
            gap: 42px;
          }
        }

        @media (max-width: 580px) {
          .team-application-section {
            padding: 74px 0;
          }

          .team-application-copy h2 {
            font-size: clamp(48px, 15vw, 70px);
          }

          .team-application-action a {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </section>
  )
}
