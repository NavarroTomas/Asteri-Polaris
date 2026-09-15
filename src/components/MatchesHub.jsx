import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeCalendarData } from '../lib/homeMatches'
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

const EVENT_LABELS = {
  event: 'EVENTO',
  matchday: 'FECHA',
  tournament: 'TORNEO',
  scrim: 'SCRIM',
  other: 'OTRO',
}

function buildMonth(year, month) {
  const daysInMonth =
    new Date(
      year,
      month + 1,
      0,
    ).getDate()

  const firstDay =
    new Date(
      year,
      month,
      1,
    ).getDay()

  const mondayIndex =
    (firstDay + 6) % 7

  const cells = []

  for (
    let index = 0;
    index < mondayIndex;
    index += 1
  ) {
    cells.push(null)
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    cells.push(day)
  }

  while (
    cells.length % 7 !== 0
  ) {
    cells.push(null)
  }

  return cells
}

function dateFromISO(value) {
  return value
    ? new Date(
        `${value}T12:00:00`,
      )
    : null
}

function isoFromDay(
  year,
  month,
  day,
) {
  return [
    year,
    String(
      month + 1,
    ).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function opponentShort(
  name = '',
) {
  const clean =
    name.trim()

  if (
    clean.length <= 13
  ) {
    return clean
  }

  return `${clean.slice(0, 12)}…`
}

function initialCalendarDate(
  matches,
  events,
) {
  const now =
    new Date()

  const dated = [
    ...matches.map(
      (match) => ({
        dateISO:
          match.dateISO,
        status:
          match.status,
      }),
    ),
    ...events.map(
      (event) => ({
        dateISO:
          event.dateISO,
        status:
          'EVENTO',
      }),
    ),
  ]
    .filter(
      (item) =>
        item.dateISO,
    )
    .sort(
      (a, b) =>
        a.dateISO.localeCompare(
          b.dateISO,
        ),
    )

  if (!dated.length) {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )
  }

  const upcoming =
    dated.find(
      (item) => {
        const date =
          new Date(
            `${item.dateISO}T23:59:59`,
          )

        return (
          date >= now &&
          item.status !==
            'CANCELADO'
        )
      },
    )

  const target =
    upcoming ||
    dated[
      dated.length - 1
    ]

  const date =
    dateFromISO(
      target.dateISO,
    )

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  )
}

function dayHasContent(
  matches,
  events,
) {
  return (
    matches.length > 0 ||
    events.length > 0
  )
}

export default function MatchesHub() {
  const [
    matches,
    setMatches,
  ] = useState([])

  const [
    events,
    setEvents,
  ] = useState([])

  const [
    viewDate,
    setViewDate,
  ] = useState(() => {
    const now =
      new Date()

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )
  })

  const [
    selectedDateISO,
    setSelectedDateISO,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    loadError,
    setLoadError,
  ] = useState('')

  useEffect(() => {
    let alive = true

    const load =
      async () => {
        try {
          const data =
            await getHomeCalendarData()

          if (!alive) return

          setMatches(
            data.matches,
          )

          setEvents(
            data.events,
          )

          const monthDate =
            initialCalendarDate(
              data.matches,
              data.events,
            )

          setViewDate(
            monthDate,
          )

          const firstDate =
            [
              ...data.matches.map(
                (item) =>
                  item.dateISO,
              ),
              ...data.events.map(
                (item) =>
                  item.dateISO,
              ),
            ]
              .filter(Boolean)
              .sort()
              .find(
                (dateISO) => {
                  const date =
                    dateFromISO(
                      dateISO,
                    )

                  return (
                    date.getFullYear() ===
                      monthDate.getFullYear() &&
                    date.getMonth() ===
                      monthDate.getMonth()
                  )
                },
              )

          setSelectedDateISO(
            firstDate ||
              null,
          )
        } catch (error) {
          console.error(
            'No se pudo cargar el calendario:',
            error,
          )

          if (alive) {
            setLoadError(
              'NO SE PUDO CARGAR EL CALENDARIO.',
            )
          }
        } finally {
          if (alive) {
            setLoading(false)
          }
        }
      }

    load()

    return () => {
      alive = false
    }
  }, [])

  const year =
    viewDate.getFullYear()

  const month =
    viewDate.getMonth()

  const monthDays =
    useMemo(
      () =>
        buildMonth(
          year,
          month,
        ),
      [
        year,
        month,
      ],
    )

  const matchesByDay =
    useMemo(() => {
      const map =
        new Map()

      matches.forEach(
        (match) => {
          const date =
            dateFromISO(
              match.dateISO,
            )

          if (
            !date ||
            date.getFullYear() !==
              year ||
            date.getMonth() !==
              month
          ) {
            return
          }

          const day =
            date.getDate()

          if (
            !map.has(day)
          ) {
            map.set(
              day,
              [],
            )
          }

          map.get(day)
            .push(match)
        },
      )

      return map
    }, [
      matches,
      year,
      month,
    ])

  const eventsByDay =
    useMemo(() => {
      const map =
        new Map()

      events.forEach(
        (event) => {
          const date =
            dateFromISO(
              event.dateISO,
            )

          if (
            !date ||
            date.getFullYear() !==
              year ||
            date.getMonth() !==
              month
          ) {
            return
          }

          const day =
            date.getDate()

          if (
            !map.has(day)
          ) {
            map.set(
              day,
              [],
            )
          }

          map.get(day)
            .push(event)
        },
      )

      return map
    }, [
      events,
      year,
      month,
    ])

  const selectedDate =
    dateFromISO(
      selectedDateISO,
    )

  const selectedDay =
    selectedDate &&
    selectedDate.getFullYear() ===
      year &&
    selectedDate.getMonth() ===
      month
      ? selectedDate.getDate()
      : null

  const selectedMatches =
    useMemo(
      () =>
        matches.filter(
          (match) =>
            match.dateISO ===
            selectedDateISO,
        ),
      [
        matches,
        selectedDateISO,
      ],
    )

  const selectedEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.dateISO ===
            selectedDateISO,
        ),
      [
        events,
        selectedDateISO,
      ],
    )

  const changeMonth =
    (delta) => {
      const next =
        new Date(
          year,
          month + delta,
          1,
        )

      setViewDate(
        next,
      )

      setSelectedDateISO(
        null,
      )
    }

  const selectMatch =
    (match) => {
      const date =
        dateFromISO(
          match.dateISO,
        )

      if (!date) return

      setViewDate(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1,
        ),
      )

      setSelectedDateISO(
        match.dateISO,
      )
    }

  const selectDay =
    (day) => {
      setSelectedDateISO(
        isoFromDay(
          year,
          month,
          day,
        ),
      )
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
          Fechas, resultados,
          VODs y calendario
          competitivo del equipo.
        </p>
      </div>

      <div className="section-shell matches-minimal-layout">
        <div className="match-list-panel">
          <div className="match-list-title">
            <span>
              PARTIDOS
            </span>

            <span>
              {loading
                ? '—'
                : String(
                    matches.length,
                  ).padStart(
                    2,
                    '0',
                  )}
            </span>
          </div>

          <div className="match-list">
            {loading && (
              <div className="matches-data-state">
                CARGANDO PARTIDOS…
              </div>
            )}

            {!loading &&
              loadError && (
                <div className="matches-data-state error">
                  {loadError}
                </div>
              )}

            {!loading &&
              !loadError &&
              matches.length ===
                0 && (
                <div className="matches-data-state">
                  TODAVÍA NO HAY
                  PARTIDOS
                  PUBLICADOS.
                </div>
              )}

            {matches.map(
              (match) => {
                const active =
                  match.dateISO ===
                  selectedDateISO

                const played =
                  Boolean(
                    match.score,
                  )

                return (
                  <button
                    type="button"
                    key={match.id}
                    className={`match-list-row ${
                      active
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      selectMatch(
                        match,
                      )
                    }
                  >
                    <div className="match-list-date">
                      <strong>
                        {
                          match.date
                        }
                      </strong>
                      <span>
                        {
                          match.time
                        }
                      </span>
                    </div>

                    <div className="match-list-opponent">
                      <small>
                        {
                          match.type
                        }
                        {match.map
                          ? ` · ${match.map}`
                          : ''}
                      </small>

                      <strong>
                        ASTERI{' '}
                        <em>
                          VS
                        </em>{' '}
                        {
                          match.opponent
                        }
                      </strong>
                    </div>

                    <div className="match-list-score">
                      <small>
                        {played
                          ? match.resultLabel
                          : match.status}
                      </small>

                      <strong>
                        {match.score ||
                          '—'}
                      </strong>
                    </div>
                  </button>
                )
              },
            )}
          </div>
        </div>

        <div className="calendar-panel">
          <div className="calendar-head">
            <div>
              <h3>
                {
                  MONTHS[
                    month
                  ]
                }
              </h3>

              <span>
                {year}
              </span>
            </div>

            <div className="calendar-nav">
              <button
                type="button"
                onClick={() =>
                  changeMonth(
                    -1,
                  )
                }
                aria-label="Mes anterior"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() =>
                  changeMonth(
                    1,
                  )
                }
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map(
              (day) => (
                <span
                  key={day}
                >
                  {day}
                </span>
              ),
            )}
          </div>

          <div className="calendar-grid">
            {monthDays.map(
              (
                day,
                index,
              ) => {
                if (!day) {
                  return (
                    <span
                      className="calendar-day empty"
                      key={`empty-${index}`}
                    />
                  )
                }

                const dayMatches =
                  matchesByDay.get(
                    day,
                  ) || []

                const dayEvents =
                  eventsByDay.get(
                    day,
                  ) || []

                const hasContent =
                  dayHasContent(
                    dayMatches,
                    dayEvents,
                  )

                const active =
                  selectedDay ===
                  day

                const primary =
                  dayEvents[0]
                    ?.title ||
                  dayMatches[0]
                    ?.opponent ||
                  ''

                const extraCount =
                  dayMatches.length +
                  dayEvents.length -
                  1

                return (
                  <button
                    type="button"
                    key={day}
                    disabled={
                      !hasContent
                    }
                    onClick={() =>
                      hasContent &&
                      selectDay(
                        day,
                      )
                    }
                    className={`calendar-day ${
                      hasContent
                        ? 'has-match'
                        : ''
                    } ${
                      active
                        ? 'active'
                        : ''
                    }`}
                  >
                    <span className="calendar-day-number">
                      {String(
                        day,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>

                    {hasContent && (
                      <div className="calendar-day-match">
                        <i
                          aria-hidden="true"
                        />

                        <span>
                          {opponentShort(
                            primary,
                          )}
                          {extraCount >
                          0
                            ? ` +${extraCount}`
                            : ''}
                        </span>
                      </div>
                    )}
                  </button>
                )
              },
            )}
          </div>

          <div className="calendar-day-detail">
            {selectedDateISO ? (
              <>
                <div className="calendar-day-detail-head">
                  <div>
                    <strong>
                      {String(
                        selectedDay ||
                          '',
                      ).padStart(
                        2,
                        '0',
                      )}
                    </strong>

                    <span>
                      {MONTHS[
                        month
                      ].slice(
                        0,
                        3,
                      )}
                    </span>
                  </div>

                  <p>
                    {selectedEvents.length >
                      0 ||
                    selectedMatches.length >
                      0
                      ? `${selectedEvents.length} EVENTO(S) · ${selectedMatches.length} PARTIDO(S)`
                      : 'SIN CONTENIDO'}
                  </p>
                </div>

                {selectedEvents.length >
                  0 && (
                  <div className="calendar-agenda-events">
                    {selectedEvents.map(
                      (event) => (
                        <article
                          key={
                            event.id
                          }
                        >
                          <div>
                            <small>
                              {EVENT_LABELS[
                                event
                                  .type
                              ] ||
                                'EVENTO'}
                              {event.time !==
                              '—'
                                ? ` · ${event.time}`
                                : ''}
                            </small>

                            <strong>
                              {
                                event.title
                              }
                            </strong>
                          </div>

                          {event.description && (
                            <p>
                              {
                                event.description
                              }
                            </p>
                          )}
                        </article>
                      ),
                    )}
                  </div>
                )}

                {selectedMatches.length >
                  0 && (
                  <div className="calendar-day-matches">
                    {selectedMatches.map(
                      (match) => (
                        <article
                          key={
                            match.id
                          }
                        >
                          <div className="calendar-date-match-copy">
                            <small>
                              {
                                match.type
                              }
                              {' · '}
                              {
                                match.time
                              }
                              {match.map
                                ? ` · ${match.map}`
                                : ''}
                            </small>

                            <strong>
                              ASTERI{' '}
                              <em>
                                VS
                              </em>{' '}
                              {
                                match.opponent
                              }
                            </strong>
                          </div>

                          <div className="calendar-date-match-result">
                            <small>
                              {match.score
                                ? match.resultLabel
                                : 'ESTADO'}
                            </small>

                            <strong>
                              {match.score ||
                                match.status}
                            </strong>
                          </div>

                          <div className="calendar-date-match-actions">
                            {match.vod && (
                              <Link
                                to={
                                  match.vod
                                }
                              >
                                FICHA
                              </Link>
                            )}

                            {match.youtube && (
                              <a
                                href={
                                  match.youtube
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                VER VOD ↗
                              </a>
                            )}

                            {match.downloadUrl && (
                              <a
                                href={
                                  match.downloadUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                DESCARGAR ↓
                              </a>
                            )}
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}

                {selectedEvents.length ===
                  0 &&
                  selectedMatches.length ===
                    0 && (
                    <span className="calendar-empty-copy">
                      NO HAY NADA
                      CARGADO PARA ESTA
                      FECHA.
                    </span>
                  )}
              </>
            ) : (
              <span className="calendar-empty-copy">
                SELECCIONÁ UNA
                FECHA DEL
                CALENDARIO.
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
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
        }

        .match-list-panel,
        .calendar-panel {
          background: #090c0a;
        }

        .match-list-panel {
          overflow: hidden;
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
          max-height: 660px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #263029 #090c0a;
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
          min-height: 72px;
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
        }

        .match-list-date span,
        .match-list-opponent small,
        .match-list-score small {
          color: #707b74;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
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
        .calendar-date-match-copy em {
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
        }

        .calendar-nav button:hover {
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
          min-height: 66px;
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

        .calendar-day-detail {
          min-height: 86px;
          background: #070907;
          border-top: 1px solid #1b211d;
        }

        .calendar-day-detail-head {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
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

        .calendar-agenda-events article {
          display: grid;
          grid-template-columns: minmax(180px, .7fr) 1fr;
          gap: 24px;
          padding: 14px;
          border-bottom: 1px solid #171c19;
          background: #0a0d0b;
        }

        .calendar-agenda-events small,
        .calendar-day-matches small {
          display: block;
          color: #68736c;
          font: 700 7px/1.3 var(--font-tactical);
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .calendar-agenda-events strong {
          display: block;
          margin-top: 5px;
          font: 700 18px/1 var(--font-tactical);
          text-transform: uppercase;
        }

        .calendar-agenda-events p {
          margin: 0;
          color: #919a94;
          font: 500 12px/1.55 Inter, sans-serif;
        }

        .calendar-day-matches article {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px auto;
          gap: 14px;
          align-items: center;
          padding: 14px;
          border-bottom: 1px solid #171c19;
        }

        .calendar-date-match-copy strong {
          display: block;
          margin-top: 5px;
          font: 700 clamp(15px, 1.2vw, 19px)/1 var(--font-tactical);
          text-transform: uppercase;
        }

        .calendar-date-match-result {
          text-align: right;
        }

        .calendar-date-match-result strong {
          display: block;
          margin-top: 6px;
          font: 700 15px/1 var(--font-tactical);
          text-transform: uppercase;
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
          letter-spacing: .08em;
        }

        .calendar-date-match-actions a:hover {
          border-color: #00d96e;
          color: #00d96e;
        }

        .calendar-empty-copy {
          display: block;
          padding: 22px 14px;
          color: #626c66;
          font: 700 9px/1.4 var(--font-tactical);
          letter-spacing: .15em;
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
          .matches-minimal {
            padding-top: 72px;
          }

          .matches-minimal-heading {
            display: block;
          }

          .matches-minimal-heading p {
            margin-top: 18px;
          }

          .matches-minimal-layout {
            gap: 26px;
          }

          .calendar-panel {
            padding-inline: 8px;
          }

          .calendar-day {
            min-height: clamp(44px, 11vw, 56px);
            padding: 5px;
          }

          .calendar-day-match span {
            display: none;
          }

          .calendar-agenda-events article,
          .calendar-day-matches article {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .calendar-date-match-result {
            text-align: left;
          }

          .calendar-date-match-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 520px) {
          .matches-minimal {
            padding-top: 64px;
          }

          .matches-minimal-heading h2 {
            font-size: clamp(54px, 15vw, 68px);
          }

          .match-list-row {
            min-height: 80px;
            grid-template-columns: 54px minmax(0, 1fr);
            gap: 10px;
          }

          .match-list-score {
            display: none;
          }

          .calendar-weekdays span {
            font-size: 6px;
            letter-spacing: .03em;
          }

          .calendar-day {
            min-height: clamp(40px, 10.5vw, 48px);
            padding: 4px 2px;
          }

          .calendar-day-detail-head {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </section>
  )
}
