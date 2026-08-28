const channels = [
  { name: 'DISCORD', label: 'COMUNIDAD', href: '#' },
  { name: 'INSTAGRAM', label: 'SOCIAL', href: '#' },
  { name: 'YOUTUBE', label: 'VODS + CLIPS', href: '#' },
  { name: 'STEAM', label: 'TEAM', href: '#' },
]

export default function CommunitySection() {
  return (
    <section className="community-section" id="community">
      <div className="community-shell">
        <div className="community-heading">
          <span>COMMUNITY / FOLLOW THE JOURNEY</span>
          <h2>NO MIRES<br />DESDE AFUERA.</h2>
          <p>
            Seguí los partidos, clips, novedades y todo lo que pasa alrededor del equipo.
          </p>
        </div>

        <div className="community-links">
          {channels.map((channel) => (
            <a key={channel.name} href={channel.href} className="community-link">
              <span className="community-link-label">{channel.label}</span>
              <strong>{channel.name}</strong>
              <span className="community-link-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .community-section {
          width: 100%;
          min-height: 74vh;
          display: flex;
          align-items: center;
          padding: clamp(80px, 10vh, 120px) 0;
          background: #00c96a;
          color: #04110a;
        }

        .community-shell {
          width: min(1440px, calc(100vw - 10vw));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8vw;
          align-items: end;
        }

        .community-heading > span {
          font: 800 10px/1 'Inter', sans-serif;
          letter-spacing: .17em;
        }

        .community-heading h2 {
          margin: 17px 0 22px;
          font: 800 clamp(52px, 6.4vw, 104px)/.82 'Bricolage Grotesque', sans-serif;
          letter-spacing: -.065em;
        }

        .community-heading p {
          max-width: 500px;
          margin: 0;
          color: rgba(4, 17, 10, .72);
          font: 600 15px/1.6 'Inter', sans-serif;
        }

        .community-links {
          border-top: 1px solid rgba(4, 17, 10, .28);
        }

        .community-link {
          min-height: 88px;
          display: grid;
          grid-template-columns: 105px 1fr 30px;
          gap: 18px;
          align-items: center;
          border-bottom: 1px solid rgba(4, 17, 10, .28);
          color: #04110a;
          transition: padding .22s ease, background .22s ease;
        }

        .community-link:hover {
          padding-left: 16px;
          background: rgba(4, 17, 10, .08);
        }

        .community-link-label {
          font: 750 9px/1 'Inter', sans-serif;
          letter-spacing: .13em;
          opacity: .55;
        }

        .community-link strong {
          font: 800 clamp(22px, 2.2vw, 36px)/1 'Bricolage Grotesque', sans-serif;
          letter-spacing: -.035em;
        }

        .community-link-arrow {
          justify-self: end;
          font-size: 18px;
          transition: transform .2s ease;
        }

        .community-link:hover .community-link-arrow {
          transform: translate(3px, -3px);
        }

        @media (max-width: 820px) {
          .community-shell { grid-template-columns: 1fr; gap: 56px; }
        }

        @media (max-width: 580px) {
          .community-shell { width: calc(100vw - 36px); }
          .community-link { grid-template-columns: 82px 1fr 24px; gap: 10px; }
        }
      `}</style>
    </section>
  )
}
