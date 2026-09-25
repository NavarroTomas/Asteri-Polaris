import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getHomeCalendarData,
  MATCH_OUTCOME_COLORS,
} from '../lib/homeMatches'
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

const WEEKDAYS = [
  'LUN',
  'MAR',
  'MIÉ',
  'JUE',
  'VIE',
  'SÁB',
  'DOM',
]

function buildMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const mondayIndex = (firstDay + 6) % 7
  const cells = []

  for (let index = 0; index < mondayIndex; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function dateFromISO(value) {
  return value
    ? new Date(`${value}T12:00:00`)
    : null
}

function isoFromDay(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function initialMonth(matches) {
  const now = new Date()

  const sorted = [...matches]
    .filter(match => match.dateISO)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))

  if (!sorted.length) {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const upcoming =
    sorted.find(match => {
      const end = new Date(`${match.dateISO}T23:59:59`)
      return end >= now && match.status !== 'CANCELADO'
    }) ||
    sorted[sorted.length - 1]

  const target = dateFromISO(upcoming.dateISO)

  return new Date(
    target.getFullYear(),
    target.getMonth(),
    1,
  )
}

function outcomeCopy(outcome) {
  if (outcome === 'win') return 'VICTORIA'
  if (outcome === 'loss') return 'DERROTA'
  if (outcome === 'draw') return 'EMPATE'
  return 'PRÓXIMO'
}

export default function MatchesHub() {
  const [matches, setMatches] = useState([])
  const [filters, setFilters] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('all')

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [selectedDateISO, setSelectedDateISO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const data = await getHomeCalendarData()

        if (!alive) return

        setMatches(data.matches)
        setFilters(data.filters)

        const firstMonth = initialMonth(data.matches)
        setViewDate(firstMonth)

        const firstDate =
          data.matches
            .filter(match => {
              const date = dateFromISO(match.dateISO)

              return (
                date &&
                date.getFullYear() === firstMonth.getFullYear() &&
                date.getMonth() === firstMonth.getMonth()
              )
            })
            .map(match => match.dateISO)
            .sort()[0] || null

        setSelectedDateISO(firstDate)
      } catch (error) {
        console.error('No se pudo cargar el calendario:', error)

        if (alive) {
          setLoadError('NO SE PUDO CARGAR EL CALENDARIO.')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  const visibleMatches = useMemo(() => {
    if (selectedFilter === 'all') return matches

    if (selectedFilter === 'none') {
      return matches.filter(match => !match.filter)
    }

    return matches.filter(
      match => match.filter?.id === selectedFilter,
    )
  }, [matches, selectedFilter])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthDays = useMemo(
    () => buildMonth(year, month),
    [year, month],
  )

  const matchesByDay = useMemo(() => {
    const map = new Map()

    visibleMatches.forEach(match => {
      const date = dateFromISO(match.dateISO)

      if (
        !date ||
        date.getFullYear() !== year ||
        date.getMonth() !== month
      ) {
        return
      }

      const day = date.getDate()

      if (!map.has(day)) map.set(day, [])
      map.get(day).push(match)
    })

    return map
  }, [visibleMatches, year, month])

  const selectedMatches = useMemo(
    () =>
      visibleMatches.filter(
        match => match.dateISO === selectedDateISO,
      ),
    [visibleMatches, selectedDateISO],
  )

  const selectedDate = dateFromISO(selectedDateISO)

  const selectedDay =
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month
      ? selectedDate.getDate()
      : null

  const changeMonth = delta => {
    setViewDate(new Date(year, month + delta, 1))
    setSelectedDateISO(null)
  }

  const selectMatch = match => {
    const date = dateFromISO(match.dateISO)
    if (!date) return

    setViewDate(
      new Date(date.getFullYear(), date.getMonth(), 1),
    )
    setSelectedDateISO(match.dateISO)
  }

  const selectDay = day => {
    setSelectedDateISO(isoFromDay(year, month, day))
  }

  return (
    <section
      className="matches matches-minimal"
      id="partidos"
    >
      <div className="section-shell matches-minimal-heading">
        <div>
          <h2>PARTIDOS.</h2>
        </div>

        <p>
          Resultados, VODs y calendario sincronizados
          directamente desde los partidos cargados.
        </p>
      </div>

      <div className="section-shell matches-minimal-layout">
        <aside className="match-list-panel">
          <div className="match-list-title">
            <span>PARTIDOS</span>
            <span>
              {loading
                ? '—'
                : String(visibleMatches.length).padStart(2, '0')}
            </span>
          </div>

          {filters.length > 0 && (
            <div className="calendar-filter-control">
              <label htmlFor="calendar-filter">
                FILTRAR
              </label>

              <select
                id="calendar-filter"
                value={selectedFilter}
                onChange={event => {
                  setSelectedFilter(event.target.value)
                  setSelectedDateISO(null)
                }}
              >
                <option value="all">TODOS LOS PARTIDOS</option>
                <option value="none">SIN CATEGORÍA</option>

                {filters.map(filter => (
                  <option
                    key={filter.id}
                    value={filter.id}
                  >
                    {String(filter.name).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="match-list">
            {loading && (
              <div className="matches-data-state">
                CARGANDO PARTIDOS…
              </div>
            )}

            {!loading && loadError && (
              <div className="matches-data-state error">
                {loadError}
              </div>
            )}

            {!loading &&
              !loadError &&
              visibleMatches.length === 0 && (
                <div className="matches-data-state">
                  NO HAY PARTIDOS PARA ESTE FILTRO.
                </div>
              )}

            {visibleMatches.map(match => (
              <button
                type="button"
                key={match.id}
                className={`match-list-row ${
                  match.dateISO === selectedDateISO
                    ? 'active'
                    : ''
                }`}
                onClick={() => selectMatch(match)}
              >
                <div className="match-list-date">
                  <strong>{match.date}</strong>
                  <span>{match.time}</span>
                </div>

                <div className="match-list-opponent">
                  <small>
                    {match.competition}
                    {match.filter?.name
                      ? ` · ${String(match.filter.name).toUpperCase()}`
                      : ''}
                  </small>

                  <strong>
                    ASTERI <em>VS</em> {match.opponent}
                  </strong>
                </div>

                <div className="match-list-score">
                  <small
                    style={{
                      color:
                        match.outcome === 'upcoming'
                          ? undefined
                          : match.outcomeColor,
                    }}
                  >
                    {match.score
                      ? outcomeCopy(match.outcome)
                      : match.status}
                  </small>

                  <strong>{match.score || '—'}</strong>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="calendar-panel">
          <div className="calendar-head">
            <div>
              <h3>{MONTHS[month]}</h3>
              <span>{year}</span>
            </div>

            <div className="calendar-nav">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
              >
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
                return (
                  <span
                    className="calendar-day empty"
                    key={`empty-${index}`}
                  />
                )
              }

              const dayMatches =
                matchesByDay.get(day) || []

              const active =
                selectedDay === day

              return (
                <button
                  type="button"
                  key={day}
                  disabled={dayMatches.length === 0}
                  onClick={() =>
                    dayMatches.length > 0 && selectDay(day)
                  }
                  className={`calendar-day ${
                    dayMatches.length > 0
                      ? 'has-match'
                      : ''
                  } ${active ? 'active' : ''}`}
                >
                  <span className="calendar-day-number">
                    {String(day).padStart(2, '0')}
                  </span>

                  {dayMatches.length > 0 && (
                    <div className="calendar-result-markers">
                      {dayMatches.slice(0, 4).map(match => (
                        <span
                          key={match.id}
                          title={`${match.opponent} · ${outcomeCopy(
                            match.outcome,
                          )}`}
                          style={{
                            '--outcome-color':
                              match.outcomeColor,
                          }}
                        >
                          ★
                        </span>
                      ))}

                      {dayMatches.length > 4 && (
                        <small>
                          +{dayMatches.length - 4}
                        </small>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="calendar-day-detail">
            {selectedDateISO ? (
              selectedMatches.length > 0 ? (
                <>
                  <div className="calendar-day-detail-head">
                    <div>
                      <strong>
                        {String(selectedDay || '').padStart(2, '0')}
                      </strong>

                      <span>
                        {MONTHS[month].slice(0, 3)}
                      </span>
                    </div>

                    <p>
                      {selectedMatches.length} PARTIDO(S)
                    </p>
                  </div>

                  <div className="calendar-day-matches">
                    {selectedMatches.map(match => (
                      <article key={match.id}>
                        <div className="calendar-date-match-copy">
                          <small>
                            {match.competition}
                            {match.filter?.name
                              ? ` · ${String(
                                  match.filter.name,
                                ).toUpperCase()}`
                              : ''}
                          </small>

                          <strong>
                            ASTERI <em>VS</em>{' '}
                            {match.opponent}
                          </strong>
                        </div>

                        <div className="calendar-date-match-result">
                          <small
                            style={{
                              color:
                                match.outcomeColor,
                            }}
                          >
                            {match.score
                              ? outcomeCopy(
                                  match.outcome,
                                )
                              : match.status}
                          </small>

                          <strong>
                            {match.score || match.status}
                          </strong>
                        </div>

                        <div className="calendar-date-match-actions">
                          {match.vod && (
                            <Link to={match.vod}>
                              FICHA
                            </Link>
                          )}

                          {match.youtube && (
                            <a
                              href={match.youtube}
                              target="_blank"
                              rel="noreferrer"
                            >
                              VER VOD
                            </a>
                          )}

                          {match.downloadUrl && (
                            <a
                              href={match.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              DESCARGAR
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <span className="calendar-empty-copy">
                  NO HAY PARTIDOS PARA ESTE FILTRO.
                </span>
              )
            ) : (
              <span className="calendar-empty-copy">
                SELECCIONÁ UN DÍA CON PARTIDO.
              </span>
            )}
          </div>

          <div className="calendar-result-key">
            <span>
              <i
                style={{
                  background:
                    MATCH_OUTCOME_COLORS.win,
                }}
              />
              GANADO
            </span>

            <span>
              <i
                style={{
                  background:
                    MATCH_OUTCOME_COLORS.loss,
                }}
              />
              PERDIDO
            </span>

            <span>
              <i
                style={{
                  background:
                    MATCH_OUTCOME_COLORS.draw,
                }}
              />
              EMPATE
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .matches-minimal {
          padding:
            clamp(52px, 5.2vh, 68px)
            0
            clamp(46px, 4.6vh, 62px);
          background: #050706;
          color: #f2f4f0;
        }

        .matches-minimal-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 50px;
          margin-bottom: 28px;
        }

        .matches-minimal-heading h2 {
          margin: 0;
          font:
            400
            clamp(56px, 5.8vw, 94px)/.78
            var(--font-impact);
          letter-spacing: -.035em;
        }

        .matches-minimal-heading p {
          max-width: 420px;
          margin: 0;
          color: #7f8a83;
          font: 500 14px/1.5 Inter, sans-serif;
        }

        .matches-minimal-layout {
          display: grid;
          grid-template-columns:
            minmax(300px, .68fr)
            minmax(520px, 1.32fr);
          gap: 8px;
          align-items: start;
        }

        .match-list-panel,
        .calendar-panel {
          background: #090c0a;
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

        .calendar-filter-control {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid #1b211d;
          background: #070907;
        }

        .calendar-filter-control label {
          color: #68736c;
          font: 700 8px/1 var(--font-tactical);
          letter-spacing: .12em;
        }

        .calendar-filter-control select {
          min-width: 0;
          height: 38px;
          border: 1px solid #273029;
          border-radius: 0;
          background: #0d100e;
          color: #d9dedb;
          padding: 0 10px;
          font: 700 9px/1 var(--font-tactical);
        }

        .match-list {
          max-height: 660px;
          overflow-y: auto;
        }

        .matches-data-state {
          min-height: 90px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          color: #66716a;
          font: 700 8px/1.5 var(--font-tactical);
          letter-spacing: .12em;
        }

        .matches-data-state.error {
          color: #d98b85;
        }

        .match-list-row {
          position: relative;
          width: 100%;
          min-height: 76px;
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
        }

        .match-list-row:hover,
        .match-list-row.active {
          background: #111512;
        }

        .match-list-row.active::before {
          content: '';
          position: absolute;
          left: 0;
          width: 3px;
          height: 36px;
          background: #00d96e;
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
          gap: 4px;
        }

        .match-list-date strong {
          font-size: 16px;
        }

        .match-list-date span,
        .match-list-opponent small,
        .match-list-score small {
          color: #707b74;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .1em;
        }

        .match-list-opponent {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .match-list-opponent strong {
          overflow-wrap: anywhere;
          color: #e6e9e7;
          font-size: clamp(14px, 1.12vw, 19px);
        }

        .match-list-opponent em,
        .calendar-date-match-copy em {
          color: #00d96e;
          font-style: normal;
        }

        .match-list-score {
          align-items: flex-end;
        }

        .match-list-score strong {
          font-size: 17px;
        }

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
          font:
            400
            clamp(28px, 2.25vw, 39px)/.85
            var(--font-impact);
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
          width: 36px;
          height: 36px;
          border: 0;
          background: #111512;
          color: #b9c0bc;
          cursor: pointer;
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
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          position: relative;
          min-height: 76px;
          padding: 8px;
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

        .calendar-day.has-match {
          background: #0d110e;
          color: #d8ddda;
          cursor: pointer;
        }

        .calendar-day.has-match:hover,
        .calendar-day.active {
          background: #151a17;
        }

        .calendar-day.active::after {
          content: '';
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 0;
          height: 3px;
          background: #00d96e;
        }

        .calendar-day-number {
          position: relative;
          z-index: 2;
          font: 700 16px/1 var(--font-tactical);
        }

        .calendar-result-markers {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          pointer-events: none;
        }

        .calendar-result-markers span {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          color: var(--outcome-color);
          font: 800 24px/1 var(--font-tactical);
          filter: drop-shadow(0 0 7px color-mix(in srgb, var(--outcome-color) 30%, transparent));
        }

        .calendar-result-markers small {
          color: #8b958e;
          font: 700 9px/1 var(--font-tactical);
        }

        .calendar-day-detail {
          background: #070907;
          border-top: 1px solid #1b211d;
        }

        .calendar-day-detail-head {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid #1b211d;
        }

        .calendar-day-detail-head > div {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .calendar-day-detail-head strong {
          color: #00d96e;
          font: 400 34px/.78 var(--font-impact);
        }

        .calendar-day-detail-head span,
        .calendar-day-detail-head p {
          margin: 0;
          color: #626d66;
          font: 700 8px/1 var(--font-tactical);
          letter-spacing: .13em;
        }

        .calendar-day-matches article {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            120px
            auto;
          gap: 14px;
          align-items: center;
          padding: 14px;
          border-bottom: 1px solid #171c19;
        }

        .calendar-day-matches small {
          display: block;
          color: #68736c;
          font: 700 7px/1.3 var(--font-tactical);
          letter-spacing: .12em;
        }

        .calendar-date-match-copy strong {
          display: block;
          margin-top: 5px;
          font: 700 17px/1 var(--font-tactical);
        }

        .calendar-date-match-result {
          text-align: right;
        }

        .calendar-date-match-result strong {
          display: block;
          margin-top: 6px;
          font: 700 15px/1 var(--font-tactical);
        }

        .calendar-date-match-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }

        .calendar-date-match-actions a {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 9px;
          border: 1px solid #29312c;
          color: #aab4ae;
          text-decoration: none;
          font: 700 7px/1 Inter, sans-serif;
        }

        .calendar-empty-copy {
          display: block;
          padding: 24px 14px;
          color: #626c66;
          font: 700 9px/1.4 var(--font-tactical);
        }

        .calendar-result-key {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 12px 14px;
          border-top: 1px solid #1b211d;
          color: #737e77;
          font: 700 7px/1 var(--font-tactical);
          letter-spacing: .08em;
        }

        .calendar-result-key span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .calendar-result-key i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        @media (max-width: 1120px) {
          .matches-minimal-layout {
            grid-template-columns: 1fr;
          }

          .match-list {
            max-height: 360px;
          }
        }

        @media (max-width: 720px) {
          .matches-minimal-heading {
            display: block;
          }

          .matches-minimal-heading p {
            margin-top: 16px;
          }

          .calendar-panel {
            overflow: hidden;
          }

          .calendar-day {
            min-height: 58px;
            padding: 5px;
          }

          .calendar-result-markers {
            gap: 4px;
          }

          .calendar-result-markers span {
            width: 20px;
            height: 20px;
            font-size: 17px;
          }

          .calendar-day-matches article {
            grid-template-columns: 1fr;
          }

          .calendar-date-match-result {
            text-align: left;
          }

          .calendar-date-match-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 520px) {
          .match-list-row {
            grid-template-columns: 54px minmax(0, 1fr);
          }

          .match-list-score {
            display: none;
          }

          .calendar-filter-control {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .calendar-day {
            min-height: 48px;
          }

          .calendar-day-number {
            font-size: 12px;
          }

          .calendar-result-markers span {
            width: 16px;
            height: 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  )
}
