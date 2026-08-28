import { useMemo, useState } from 'react'
import { matches } from '../data/matches'
import './AsteriTypography.css'

const MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
]

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function buildMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const mondayIndex = (firstDay + 6) % 7
  const cells = []

  for (let i = 0; i < mondayIndex; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

function opponentShort(name = '') {
  const clean = name.trim()
  if (clean.length <= 13) return clean
  return `${clean.slice(0, 12)}…`
}

export default function MatchesHub() {
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 1))
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthDays = useMemo(() => buildMonth(year, month), [year, month])

  const matchesByDay = useMemo(() => {
    const map = new Map()

    matches.forEach(match => {
      const date = new Date(`${match.dateISO}T12:00:00`)

      if (date.getFullYear() !== year || date.getMonth() !== month) return

      const day = date.getDate()
      if (!map.has(day)) map.set(day, [])
      map.get(day).push(match)
    })

    return map
  }, [year, month])

  const firstMatchInMonth = useMemo(() => {
    return matches.find(match => {
      const date = new Date(`${match.dateISO}T12:00:00`)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }, [year, month])

  const selectedMatch =
    matches.find(match => match.id === selectedMatchId) || firstMatchInMonth || null

  const selectedDate = selectedMatch
    ? new Date(`${selectedMatch.dateISO}T12:00:00`)
    : null

  const selectedDay =
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month
      ? selectedDate.getDate()
      : null

  const changeMonth = delta => {
    setSelectedMatchId(null)
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  const selectMatch = match => {
    setSelectedMatchId(match.id)

    const date = new Date(`${match.dateISO}T12:00:00`)
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  return (
    <section className="matches matches-minimal" id="partidos">
      <div className="section-shell matches-minimal-heading">
        <div>
          <h2>PARTIDOS.</h2>
        </div>

        <p>
          Próximos encuentros, resultados y VODs del equipo.
        </p>
      </div>

      <div className="section-shell matches-minimal-layout">
        <div className="match-list-panel">
          <div className="match-list-title">
            <span>PARTIDOS</span>
            <span>{String(matches.length).padStart(2, '0')}</span>
          </div>

          <div className="match-list">
            {matches.map(match => {
              const active = selectedMatch?.id === match.id
              const played = Boolean(match.score)

              return (
                <button
                  type="button"
                  key={match.id}
                  className={`match-list-row ${active ? 'active' : ''}`}
                  onClick={() => selectMatch(match)}
                >
                  <div className="match-list-date">
                    <strong>{match.date}</strong>
                    <span>{match.time}</span>
                  </div>

                  <div className="match-list-opponent">
                    <small>{match.type}</small>
                    <strong>ASTERI <em>VS</em> {match.opponent}</strong>
                  </div>

                  <div className="match-list-score">
                    <small>{played ? 'FINAL' : 'PRÓXIMO'}</small>
                    <strong>{match.score || '—'}</strong>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="calendar-panel">
          <div className="calendar-head">
            <div>
              <h3>{MONTHS[month]}</h3>
              <span>{year}</span>
            </div>

            <div className="calendar-nav">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
                ←
              </button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
                →
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {monthDays.map((day, index) => {
              if (!day) {
                return <span className="calendar-day empty" key={`empty-${index}`} />
              }

              const dayMatches = matchesByDay.get(day) || []
              const match = dayMatches[0]
              const hasMatch = Boolean(match)
              const active = selectedDay === day

              return (
                <button
                  type="button"
                  key={day}
                  disabled={!hasMatch}
                  onClick={() => hasMatch && setSelectedMatchId(match.id)}
                  className={`calendar-day ${hasMatch ? 'has-match' : ''} ${active ? 'active' : ''}`}
                >
                  <span className="calendar-day-number">
                    {String(day).padStart(2, '0')}
                  </span>

                  {hasMatch && (
                    <div className="calendar-day-match">
                      <i aria-hidden="true" />
                      <span>{opponentShort(match.opponent)}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="calendar-selected">
            {selectedMatch ? (
              <>
                <div className="calendar-selected-date">
                  <strong>{String(selectedDay || '').padStart(2, '0')}</strong>
                  <span>{MONTHS[month].slice(0, 3)}</span>
                </div>

                <div className="calendar-selected-match">
                  <small>{selectedMatch.type} · {selectedMatch.time}</small>
                  <strong>ASTERI <em>VS</em> {selectedMatch.opponent}</strong>
                </div>

                <div className="calendar-selected-result">
                  <small>{selectedMatch.score ? 'RESULTADO' : 'ESTADO'}</small>
                  <strong>{selectedMatch.score || selectedMatch.status}</strong>
                </div>

                <div className="calendar-selected-vod">
                  {selectedMatch.vod ? (
                    <a href={selectedMatch.vod}>VOD ↗</a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </>
            ) : (
              <span className="calendar-empty-copy">SIN PARTIDOS ESTE MES</span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /*
          Calendario ASTERI inspirado en la lectura rápida de CS:
          plano, compacto, tipografía condensada y jerarquía de información.
          Sin glow, sin gradients, sin bordes de color.
        */

        .matches-minimal {
          min-height: auto;
          padding: clamp(52px, 5.2vh, 68px) 0 clamp(46px, 4.6vh, 62px);
          background: #050706;
          color: #f2f4f0;
        }

        .matches-minimal-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 50px;
          margin-bottom: clamp(22px, 2.8vh, 32px);
        }

        .matches-minimal-heading h2 {
          margin: 0;
          font: 400 clamp(56px, 5.8vw, 94px)/.78 var(--font-impact);
          letter-spacing: -.035em;
          text-transform: uppercase;
        }

        .matches-minimal-heading p {
          max-width: 400px;
          margin: 0 0 5px;
          color: #7f8a83;
          font: 500 14px/1.45 'Inter', sans-serif;
        }

        .matches-minimal-layout {
          display: grid;
          grid-template-columns: minmax(300px, .68fr) minmax(520px, 1.32fr);
          gap: 8px;
          align-items: start;
          max-height: 70vh;
        }

        .match-list-panel,
        .calendar-panel {
          background: #090c0a;
          max-height: 70vh;
        }

        .match-list-panel {
          overflow: hidden;
        }

        .calendar-panel {
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #263029 #090c0a;
        }

        .calendar-panel::-webkit-scrollbar {
          width: 6px;
        }

        .calendar-panel::-webkit-scrollbar-track {
          background: #090c0a;
        }

        .calendar-panel::-webkit-scrollbar-thumb {
          background: #263029;
          border-radius: 999px;
        }

        .calendar-panel::-webkit-scrollbar-thumb:hover {
          background: #344039;
        }

        .match-list-title {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          border-bottom: 1px solid #1b211d;
          color: #7c8780;
          font: 700 9px/1 var(--font-tactical);
          letter-spacing: .18em;
        }

        .match-list {
          display: flex;
          flex-direction: column;
          max-height: calc(70vh - 44px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #263029 #090c0a;
        }

        .match-list::-webkit-scrollbar {
          width: 5px;
        }

        .match-list::-webkit-scrollbar-thumb {
          background: #263029;
        }

        .match-list-row {
          width: 100%;
          min-height: 68px;
          display: grid;
          grid-template-columns: 68px minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
          padding: 10px 14px;
          border: 0;
          border-bottom: 1px solid #1b211d;
          background: #090c0a;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background .16s ease;
        }

        .match-list-row:last-child {
          border-bottom: 0;
        }

        .match-list-row:hover,
        .match-list-row.active {
          background: #111512;
        }

        .match-list-row.active::before {
          content: '';
          position: absolute;
          width: 3px;
          height: 34px;
          left: 0;
          background: #00d96e;
        }

        .match-list-row {
          position: relative;
        }

        .match-list-date,
        .match-list-opponent,
        .match-list-score {
          font-family: var(--font-tactical);
          text-transform: uppercase;
        }

        .match-list-date,
        .match-list-score {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .match-list-date strong {
          font-size: 16px;
          letter-spacing: .02em;
        }

        .match-list-date span,
        .match-list-opponent small,
        .match-list-score small {
          color: #707b74;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .14em;
        }

        .match-list-opponent {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .match-list-opponent strong {
          color: #e6e9e7;
          font-size: clamp(14px, 1.12vw, 19px);
          line-height: 1;
          font-weight: 700;
        }

        .match-list-opponent em,
        .calendar-selected-match em {
          color: #00d96e;
          font-style: normal;
        }

        .match-list-score {
          align-items: flex-end;
        }

        .match-list-score strong {
          color: #e6e9e7;
          font-size: 17px;
        }

        /* ============================
           CALENDAR
        ============================ */

        .calendar-head {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid #1b211d;
        }

        .calendar-head > div:first-child {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .calendar-head h3 {
          margin: 0;
          font: 400 clamp(28px, 2.25vw, 39px)/.85 var(--font-impact);
          letter-spacing: -.02em;
        }

        .calendar-head span {
          color: #68736c;
          font: 700 9px/1 var(--font-tactical);
          letter-spacing: .14em;
        }

        .calendar-nav {
          display: flex;
          gap: 3px;
        }

        .calendar-nav button {
          width: 34px;
          height: 34px;
          border: 0;
          background: #111512;
          color: #b9c0bc;
          cursor: pointer;
          transition: background .16s ease, color .16s ease;
        }

        .calendar-nav button:hover {
          background: #181e1a;
          color: #00d96e;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #1b211d;
        }

        .calendar-weekdays span {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #59635d;
          font: 700 7px/1 var(--font-tactical);
          letter-spacing: .13em;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #090c0a;
        }

        .calendar-day {
          position: relative;
          min-height: 52px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          border: 0;
          border-right: 1px solid #171c19;
          border-bottom: 1px solid #171c19;
          background: #090c0a;
          color: #4e5852;
          text-align: left;
        }

        .calendar-day:nth-child(7n) {
          border-right: 0;
        }

        .calendar-day.empty {
          background: #070907;
        }

        button.calendar-day:not(:disabled) {
          cursor: pointer;
        }

        .calendar-day.has-match {
          background: #0d110e;
          color: #d8ddda;
        }

        .calendar-day.has-match:hover {
          background: #121713;
        }

        .calendar-day.active {
          background: #151a17;
        }

        .calendar-day.active::after {
          content: '';
          position: absolute;
          left: 6px;
          right: 6px;
          bottom: 0;
          height: 3px;
          background: #00d96e;
        }

        .calendar-day-number {
          font: 700 clamp(13px, 1vw, 18px)/1 var(--font-tactical);
          letter-spacing: .02em;
        }

        .calendar-day-match {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          color: #8a948e;
          font: 700 7px/1 var(--font-tactical);
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .calendar-day-match i {
          width: 5px;
          height: 5px;
          flex: 0 0 auto;
          background: #00d96e;
        }

        .calendar-day-match span {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        /* ============================
           SELECTED MATCH
        ============================ */

        .calendar-selected {
          min-height: 64px;
          display: grid;
          grid-template-columns: 62px minmax(0, 1fr) 116px 50px;
          align-items: stretch;
          background: #070907;
          border-top: 1px solid #1b211d;
        }

        .calendar-selected > div {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 9px 11px;
          border-right: 1px solid #1b211d;
        }

        .calendar-selected > div:last-child {
          border-right: 0;
        }

        .calendar-selected-date {
          align-items: flex-start;
        }

        .calendar-selected-date strong {
          color: #00d96e;
          font: 400 31px/.78 var(--font-impact);
        }

        .calendar-selected-date span,
        .calendar-selected-match small,
        .calendar-selected-result small {
          margin-top: 5px;
          color: #626d66;
          font: 700 7px/1 var(--font-tactical);
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .calendar-selected-match strong {
          margin-top: 5px;
          color: #e7eae8;
          font: 700 clamp(14px, 1.08vw, 18px)/1 var(--font-tactical);
          text-transform: uppercase;
        }

        .calendar-selected-result strong {
          margin-top: 5px;
          color: #dce1de;
          font: 700 14px/1 var(--font-tactical);
          text-transform: uppercase;
        }

        .calendar-selected-vod {
          align-items: center;
        }

        .calendar-selected-vod a,
        .calendar-selected-vod span {
          color: #00d96e;
          font: 700 9px/1 var(--font-tactical);
          letter-spacing: .1em;
          text-decoration: none;
        }

        .calendar-empty-copy {
          grid-column: 1 / -1;
          align-self: center;
          padding: 20px;
          color: #626c66;
          font: 700 9px/1 var(--font-tactical);
          letter-spacing: .15em;
        }

        @media (max-width: 1120px) {
          .matches-minimal-layout {
            grid-template-columns: 1fr;
            max-height: none;
          }

          .match-list-panel,
          .calendar-panel {
            max-height: none;
          }

          .calendar-panel {
            overflow: visible;
          }

          .match-list {
            max-height: none;
            overflow: visible;
          }
        }

        @media (max-width: 720px) {
          .matches-minimal-heading {
            display: block;
          }

          .matches-minimal-heading p {
            margin-top: 24px;
          }

          .calendar-day {
            min-height: 72px;
            padding: 8px;
          }

          .calendar-day-match span {
            display: none;
          }

          .calendar-selected {
            grid-template-columns: 64px minmax(0, 1fr) 90px;
          }

          .calendar-selected-vod {
            display: none !important;
          }
        }

        @media (max-width: 520px) {
          .matches-minimal {
            padding-top: 80px;
          }

          .matches-minimal-heading h2 {
            font-size: clamp(64px, 19vw, 90px);
          }

          .match-list-row {
            grid-template-columns: 62px minmax(0, 1fr);
          }

          .match-list-score {
            display: none;
          }

          .calendar-weekdays span {
            font-size: 7px;
            letter-spacing: .05em;
          }

          .calendar-day {
            min-height: 68px;
          }

          .calendar-selected {
            grid-template-columns: 58px minmax(0, 1fr);
          }

          .calendar-selected-result {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
