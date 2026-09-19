import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addClip,
  deleteCalendarEvent,
  deleteClip,
  deleteVod,
  emptyCalendarEvent,
  emptyVod,
  getVodDetail,
  listCalendarEvents,
  listVodsAndPlayers,
  saveCalendarEvent,
  saveLineup,
  saveVod,
  saveVodMaps,
  slugifyVod,
  toggleClip,
} from '../lib/vods'
import {
  ACTIVE_DUTY_MAPS,
  SERIES_MAP_LIMITS,
  getCompetitiveMap,
} from '../config/competitiveMaps'
import {
  CALENDAR_EVENT_OPTIONS,
  CALENDAR_MARKERS,
} from '../config/calendarMarkers'
import './VodAdminPage.css'

const emptyClip = {
  title: '',
  description: '',
  player_id: '',
  round_number: '',
  timestamp_seconds: '',
  video_url: '',
  is_published: true,
}

export default function VodAdminPage() {
  const { user } = useAuth()

  const [mode, setMode] = useState('vods')

  const [vods, setVods] = useState([])
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyVod)
  const [lineup, setLineup] = useState([])
  const [clips, setClips] = useState([])
  const [mapRows, setMapRows] = useState([])
  const [clipFile, setClipFile] = useState(null)
  const [clip, setClip] = useState(emptyClip)

  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventForm, setEventForm] = useState(emptyCalendarEvent)

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const current = useMemo(
    () => vods.find((vod) => vod.id === selected) || null,
    [vods, selected],
  )

  const currentEvent = useMemo(
    () => events.find((event) => event.id === selectedEvent) || null,
    [events, selectedEvent],
  )

  async function refresh() {
    try {
      const [vodData, calendarData] = await Promise.all([
        listVodsAndPlayers(),
        listCalendarEvents(),
      ])

      setVods(vodData.vods)
      setPlayers(vodData.players)
      setEvents(calendarData)
    } catch (error) {
      setErr(error.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!selected) {
      setForm(emptyVod)
      setLineup([])
      setClips([])
      setMapRows([])
      return
    }

    getVodDetail(selected)
      .then((data) => {
        setForm({
          ...emptyVod,
          ...data.vod,
        })

        setLineup(
          data.lineup.map(
            (item) => item.player_id,
          ),
        )

        setClips(data.clips)
        setMapRows(
          (data.maps || []).map((item) => ({
            map_name: item.map_name,
            score_asteri:
              item.score_asteri ?? '',
            score_opponent:
              item.score_opponent ?? '',
          })),
        )
      })
      .catch((error) => setErr(error.message))
  }, [selected])

  useEffect(() => {
    if (!selectedEvent) {
      setEventForm(emptyCalendarEvent)
      return
    }

    if (currentEvent) {
      setEventForm({
        ...emptyCalendarEvent,
        ...currentEvent,
      })
    }
  }, [selectedEvent, currentEvent])

  const set = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))

    setMsg('')
    setErr('')
  }

  const setEvent = (key, value) => {
    setEventForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))

    setMsg('')
    setErr('')
  }

  const togglePlayer = (id) => {
    setLineup((currentLineup) =>
      currentLineup.includes(id)
        ? currentLineup.filter((value) => value !== id)
        : [...currentLineup, id],
    )
  }

  const seriesLimit =
    SERIES_MAP_LIMITS[form.series_format || 'bo1'] || 1

  const toggleSeriesMap = (mapId) => {
    setErr('')

    setMapRows((currentRows) => {
      const existingIndex = currentRows.findIndex(
        (row) => row.map_name === mapId,
      )

      if (existingIndex >= 0) {
        return currentRows.filter(
          (_, index) => index !== existingIndex,
        )
      }

      if (currentRows.length >= seriesLimit) {
        setErr(
          `${String(form.series_format || 'bo1').toUpperCase()} permite hasta ${seriesLimit} mapa${seriesLimit === 1 ? '' : 's'}.`,
        )
        return currentRows
      }

      return [
        ...currentRows,
        {
          map_name: mapId,
          score_asteri: '',
          score_opponent: '',
        },
      ]
    })
  }

  const updateSeriesMap = (index, key, value) => {
    setMapRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [key]: value }
          : row,
      ),
    )
  }

  const moveSeriesMap = (index, delta) => {
    setMapRows((currentRows) => {
      const target = index + delta

      if (target < 0 || target >= currentRows.length) {
        return currentRows
      }

      const next = [...currentRows]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const removeSeriesMap = (index) => {
    setMapRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index),
    )
  }

  const newVod = () => {
    setSelected(null)
    setForm(emptyVod)
    setLineup([])
    setClips([])
    setMapRows([])
    setMsg('')
    setErr('')
  }

  const newEvent = () => {
    setSelectedEvent(null)
    setEventForm(emptyCalendarEvent)
    setMsg('')
    setErr('')
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    const wasEditing = Boolean(selected)

    try {
      if (
        !form.title.trim() ||
        !form.opponent.trim() ||
        !form.match_date
      ) {
        throw new Error('Completá título, rival y fecha')
      }

      if (
        ['elimination', 'custom'].includes(form.result_type) &&
        form.status === 'played' &&
        !String(form.result_label || '').trim()
      ) {
        throw new Error('Completá el resultado textual')
      }

      let seriesScoreA = form.score_asteri
      let seriesScoreB = form.score_opponent

      if (form.result_type === 'series') {
        const limit =
          SERIES_MAP_LIMITS[form.series_format || 'bo1'] || 1

        if (mapRows.length > limit) {
          throw new Error(
            `${String(form.series_format || 'bo1').toUpperCase()} permite hasta ${limit} mapa${limit === 1 ? '' : 's'}.`,
          )
        }

        if (form.status === 'played' && mapRows.length === 0) {
          throw new Error('Seleccioná al menos un mapa jugado')
        }

        if (form.status === 'played') {
          const incomplete = mapRows.some(
            (row) =>
              row.score_asteri === '' ||
              row.score_asteri == null ||
              row.score_opponent === '' ||
              row.score_opponent == null,
          )

          if (incomplete) {
            throw new Error('Completá el resultado de cada mapa jugado')
          }
        }

        const completedMaps = mapRows.filter(
          (row) =>
            row.score_asteri !== '' &&
            row.score_asteri != null &&
            row.score_opponent !== '' &&
            row.score_opponent != null,
        )

        if (completedMaps.length > 0) {
          seriesScoreA = completedMaps.filter(
            (row) => Number(row.score_asteri) > Number(row.score_opponent),
          ).length

          seriesScoreB = completedMaps.filter(
            (row) => Number(row.score_opponent) > Number(row.score_asteri),
          ).length
        } else {
          seriesScoreA = ''
          seriesScoreB = ''
        }
      }

      const payload = {
        ...form,
        score_asteri: seriesScoreA,
        score_opponent: seriesScoreB,
        slug:
          form.slug ||
          slugifyVod(
            `${form.opponent}-${form.match_date}`,
          ),
      }

      const saved = await saveVod(
        selected,
        payload,
        user.id,
      )

      await saveVodMaps(
        saved.id,
        form.result_type === 'series' ? mapRows : [],
      )

      await saveLineup(
        saved.id,
        lineup,
      )

      await refresh()
      setSelected(saved.id)

      setMsg(
        wasEditing
          ? 'VOD actualizada.'
          : 'VOD creada.',
      )
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitEvent(event) {
    event.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    try {
      if (
        !eventForm.title.trim() ||
        !eventForm.event_date
      ) {
        throw new Error('Completá título y fecha')
      }

      const saved = await saveCalendarEvent(
        selectedEvent,
        eventForm,
        user.id,
      )

      await refresh()
      setSelectedEvent(saved.id)

      setMsg(
        selectedEvent
          ? 'Fecha actualizada.'
          : 'Fecha creada.',
      )
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function addNewClip(event) {
    event.preventDefault()

    if (!selected) {
      return setErr('Guardá el VOD primero')
    }

    setBusy(true)
    setErr('')
    setMsg('')

    try {
      const created = await addClip({
        vodId: selected,
        playerId: clip.player_id,
        userId: user.id,
        form: clip,
        file: clipFile,
      })

      setClips((currentClips) => [
        created,
        ...currentClips,
      ])

      setClip(emptyClip)
      setClipFile(null)
      setMsg('Clip agregado.')
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="vod-admin-page">
      <header className="vod-admin-top">
        <Link to="/admin">← CONTROL</Link>

        <div className="vod-admin-top-actions">
          <button
            type="button"
            className={mode === 'vods' ? 'active' : ''}
            onClick={() => setMode('vods')}
          >
            VODS
          </button>

          <button
            type="button"
            className={mode === 'calendar' ? 'active' : ''}
            onClick={() => setMode('calendar')}
          >
            CALENDARIO
          </button>

          <button
            type="button"
            onClick={mode === 'vods' ? newVod : newEvent}
          >
            {mode === 'vods' ? '+ NUEVO VOD' : '+ NUEVA FECHA'}
          </button>
        </div>
      </header>

      <section className="vod-admin-heading">
        <span>ASTERI / MATCH CENTER</span>

        <h1>
          {mode === 'vods' ? 'VODS.' : 'CALENDARIO.'}
        </h1>

        <p>
          {mode === 'vods'
            ? 'Partidos, resultados, VODs, descargas, lineup y clips.'
            : 'Fechas, torneos, scrims y notas visibles en el calendario.'}
        </p>
      </section>

      {(msg || err) && (
        <div className={`vod-admin-message ${err ? 'error' : ''}`}>
          {err || msg}
        </div>
      )}

      {mode === 'calendar' ? (
        <div className="vod-admin-layout">
          <aside className="vod-admin-list">
            {events.length === 0 ? (
              <p className="vod-admin-empty-list">
                SIN FECHAS
              </p>
            ) : (
              events.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={selectedEvent === item.id ? 'active' : ''}
                  onClick={() => setSelectedEvent(item.id)}
                >
                  <small>
                    {item.event_date}
                    {item.event_time ? ` · ${String(item.event_time).slice(0, 5)}` : ''}
                    {' · '}
                    {item.is_published ? 'PUBLICADO' : 'BORRADOR'}
                  </small>

                  <strong>{item.title}</strong>
                  <span>{item.event_type?.toUpperCase()}</span>
                </button>
              ))
            )}
          </aside>

          <section className="vod-admin-editor">
            <form onSubmit={submitEvent}>
              <div className="vod-admin-editorbar">
                <strong>
                  {selectedEvent ? 'EDITAR FECHA' : 'NUEVA FECHA'}
                </strong>
              </div>

              <div className="vod-admin-grid">
                <label className="wide">
                  <span>TÍTULO / NOTA DE LA FECHA</span>
                  <input
                    value={eventForm.title}
                    onChange={(event) =>
                      setEvent('title', event.target.value)
                    }
                    placeholder="Clasificatorio — Día 2"
                    required
                  />
                </label>

                <label>
                  <span>FECHA</span>
                  <input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(event) =>
                      setEvent('event_date', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>HORA</span>
                  <input
                    type="time"
                    value={eventForm.event_time || ''}
                    onChange={(event) =>
                      setEvent('event_time', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>TIPO</span>
                  <select
                    value={eventForm.event_type}
                    onChange={(event) =>
                      setEvent('event_type', event.target.value)
                    }
                  >
                    {CALENDAR_EVENT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.symbol} {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div
                  className="calendar-event-marker-preview wide"
                  style={{
                    '--event-marker-color':
                      CALENDAR_MARKERS[eventForm.event_type]?.color ||
                      CALENDAR_MARKERS.other.color,
                  }}
                >
                  <span aria-hidden="true">★</span>
                  <div>
                    <strong>
                      {CALENDAR_MARKERS[eventForm.event_type]?.label || 'OTRO'}
                    </strong>
                    <small>
                      ESTE MARCADOR APARECE EN EL CALENDARIO. LOS PARTIDOS CREADOS COMO VOD SE MARCAN AUTOMÁTICAMENTE EN AZUL.
                    </small>
                  </div>
                </div>

                <label className="wide">
                  <span>DESCRIPCIÓN / ACLARACIÓN</span>
                  <textarea
                    rows="4"
                    value={eventForm.description || ''}
                    onChange={(event) =>
                      setEvent('description', event.target.value)
                    }
                    placeholder="Información que aparecerá al entrar a esta fecha."
                  />
                </label>

                <label className="check wide">
                  <input
                    type="checkbox"
                    checked={Boolean(eventForm.is_published)}
                    onChange={(event) =>
                      setEvent('is_published', event.target.checked)
                    }
                  />
                  <span>MOSTRAR EN EL CALENDARIO PÚBLICO</span>
                </label>
              </div>

              <div className="vod-admin-actions">
                <button className="save" disabled={busy}>
                  {busy
                    ? 'GUARDANDO…'
                    : selectedEvent
                      ? 'GUARDAR FECHA'
                      : 'CREAR FECHA'}
                </button>

                {selectedEvent && (
                  <button
                    type="button"
                    className="delete"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirm(`¿Eliminar ${currentEvent?.title}?`)) {
                        return
                      }

                      setBusy(true)

                      try {
                        await deleteCalendarEvent(selectedEvent)
                        newEvent()
                        await refresh()
                        setMsg('Fecha eliminada.')
                      } catch (error) {
                        setErr(error.message)
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    ELIMINAR FECHA
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      ) : (
        <div className="vod-admin-layout">
          <aside className="vod-admin-list">
            {vods.length === 0 ? (
              <p className="vod-admin-empty-list">
                SIN VODS
              </p>
            ) : (
              vods.map((vod) => (
                <button
                  type="button"
                  key={vod.id}
                  className={selected === vod.id ? 'active' : ''}
                  onClick={() => setSelected(vod.id)}
                >
                  <small>
                    {vod.match_date} · {vod.is_published ? 'PUBLICADO' : 'BORRADOR'}
                  </small>

                  <strong>{vod.title}</strong>
                  <span>vs {vod.opponent}</span>
                </button>
              ))
            )}
          </aside>

          <section className="vod-admin-editor">
            <form onSubmit={submit}>
              <div className="vod-admin-editorbar">
                <strong>
                  {selected ? 'EDITAR VOD' : 'NUEVO VOD'}
                </strong>

                {selected && form.is_published && (
                  <Link
                    to={`/vods/${form.slug}`}
                    target="_blank"
                  >
                    VER PÚBLICO ↗
                  </Link>
                )}
              </div>

              <div className="vod-admin-grid">
                <label className="wide">
                  <span>TÍTULO</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      set('title', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>RIVAL</span>
                  <input
                    value={form.opponent}
                    onChange={(event) =>
                      set('opponent', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>COMPETICIÓN</span>
                  <input
                    value={form.competition}
                    onChange={(event) =>
                      set('competition', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>FECHA</span>
                  <input
                    type="date"
                    value={form.match_date}
                    onChange={(event) =>
                      set('match_date', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>HORA</span>
                  <input
                    type="time"
                    value={form.match_time || ''}
                    onChange={(event) =>
                      set('match_time', event.target.value)
                    }
                  />
                </label>

                {form.result_type !== 'series' && (
                  <label>
                    <span>MAPA</span>
                    <input
                      value={form.map_name || ''}
                      onChange={(event) =>
                        set('map_name', event.target.value)
                      }
                    />
                  </label>
                )}

                <label>
                  <span>ESTADO</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      set('status', event.target.value)
                    }
                  >
                    <option value="upcoming">PRÓXIMO</option>
                    <option value="played">JUGADO</option>
                    <option value="cancelled">CANCELADO</option>
                  </select>
                </label>

                <label>
                  <span>TIPO DE RESULTADO</span>
                  <select
                    value={form.result_type || 'rounds'}
                    onChange={(event) =>
                      set('result_type', event.target.value)
                    }
                  >
                    <option value="rounds">RONDAS</option>
                    <option value="series">SERIE / MAPAS</option>
                    <option value="elimination">ELIMINACIÓN</option>
                    <option value="custom">PERSONALIZADO</option>
                  </select>
                </label>

                {form.result_type === 'series' && (
                  <label>
                    <span>FORMATO DE SERIE</span>
                    <select
                      value={form.series_format || 'bo1'}
                      onChange={(event) =>
                        set('series_format', event.target.value)
                      }
                    >
                      <option value="bo1">BO1</option>
                      <option value="bo2">BO2</option>
                      <option value="bo3">BO3</option>
                      <option value="bo5">BO5</option>
                    </select>
                  </label>
                )}

                {form.result_type === 'rounds' && (
                  <>
                    <label>
                      <span>RONDAS ASTERI</span>
                      <input
                        type="number"
                        min="0"
                        value={form.score_asteri ?? ''}
                        onChange={(event) =>
                          set('score_asteri', event.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span>RONDAS RIVAL</span>
                      <input
                        type="number"
                        min="0"
                        value={form.score_opponent ?? ''}
                        onChange={(event) =>
                          set('score_opponent', event.target.value)
                        }
                      />
                    </label>
                  </>
                )}

                {form.result_type === 'series' && (
                  <div className="vod-map-picker wide">
                    <div className="vod-map-picker-head">
                      <div>
                        <span>MAPAS DE LA SERIE</span>
                        <small>
                          POOL ACTIVO · MÁXIMO {seriesLimit} · EL ORDEN DE SELECCIÓN ES EL ORDEN DE JUEGO
                        </small>
                      </div>

                      <strong>
                        {mapRows.length}/{seriesLimit}
                      </strong>
                    </div>

                    <div className="vod-map-grid">
                      {ACTIVE_DUTY_MAPS.map((map) => {
                        const selectedIndex = mapRows.findIndex(
                          (row) => row.map_name === map.id,
                        )

                        return (
                          <button
                            type="button"
                            key={map.id}
                            className={selectedIndex >= 0 ? 'selected' : ''}
                            onClick={() => toggleSeriesMap(map.id)}
                          >
                            <img
                              src={map.image}
                              alt={`Mapa ${map.name}`}
                              loading="lazy"
                            />
                            <span>{map.name}</span>
                            {selectedIndex >= 0 && (
                              <b>{String(selectedIndex + 1).padStart(2, '0')}</b>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {mapRows.length > 0 && (
                      <div className="vod-map-results">
                        {mapRows.map((row, index) => {
                          const map = getCompetitiveMap(row.map_name)

                          return (
                            <div className="vod-map-result-row" key={`${row.map_name}-${index}`}>
                              <div className="vod-map-result-name">
                                <img src={map.image} alt="" />
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <strong>{map.name}</strong>
                              </div>

                              <label>
                                <span>ASTERI</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.score_asteri}
                                  onChange={(event) =>
                                    updateSeriesMap(index, 'score_asteri', event.target.value)
                                  }
                                />
                              </label>

                              <label>
                                <span>RIVAL</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.score_opponent}
                                  onChange={(event) =>
                                    updateSeriesMap(index, 'score_opponent', event.target.value)
                                  }
                                />
                              </label>

                              <div className="vod-map-result-actions">
                                <button
                                  type="button"
                                  onClick={() => moveSeriesMap(index, -1)}
                                  disabled={index === 0}
                                  aria-label={`Mover ${map.name} arriba`}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSeriesMap(index, 1)}
                                  disabled={index === mapRows.length - 1}
                                  aria-label={`Mover ${map.name} abajo`}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSeriesMap(index)}
                                  aria-label={`Quitar ${map.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <p className="vod-map-picker-note">
                      El resultado general de la serie se calcula automáticamente según los mapas cargados.
                    </p>
                  </div>
                )}

                <label className="wide">
                  <span>
                    RESULTADO TEXTUAL
                    {['elimination', 'custom'].includes(form.result_type)
                      ? ' · OBLIGATORIO SI ESTÁ JUGADO'
                      : ' · OPCIONAL'}
                  </span>
                  <input
                    value={form.result_label || ''}
                    onChange={(event) =>
                      set('result_label', event.target.value)
                    }
                    placeholder="CLASIFICADO / ELIMINADO / 1° PUESTO / 16-12..."
                  />
                </label>

                <label className="wide">
                  <span>VOD / YOUTUBE / DRIVE</span>
                  <input
                    type="url"
                    value={form.youtube_url || ''}
                    onChange={(event) =>
                      set('youtube_url', event.target.value)
                    }
                    placeholder="https://youtube.com/... o https://drive.google.com/..."
                  />
                </label>

                <label className="wide">
                  <span>LINK DE DESCARGA DE LA VOD</span>
                  <input
                    type="url"
                    value={form.vod_download_url || ''}
                    onChange={(event) =>
                      set('vod_download_url', event.target.value)
                    }
                    placeholder="https://drive.google.com/... o enlace directo"
                  />
                </label>

                <label className="wide">
                  <span>SLUG</span>
                  <input
                    value={form.slug || ''}
                    onChange={(event) =>
                      set('slug', slugifyVod(event.target.value))
                    }
                    placeholder="se genera automático"
                  />
                </label>

                <label className="wide">
                  <span>DESCRIPCIÓN</span>
                  <textarea
                    rows="4"
                    value={form.description || ''}
                    onChange={(event) =>
                      set('description', event.target.value)
                    }
                  />
                </label>

                <label className="check wide">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_published)}
                    onChange={(event) =>
                      set('is_published', event.target.checked)
                    }
                  />
                  <span>PUBLICAR VOD</span>
                </label>
              </div>

              <div className="vod-admin-section">
                <div className="vod-admin-section-head">
                  <span>LINEUP</span>
                  <strong>{lineup.length}</strong>
                </div>

                <div className="vod-admin-lineup">
                  {players.map((player) => (
                    <button
                      type="button"
                      key={player.id}
                      className={lineup.includes(player.id) ? 'selected' : ''}
                      onClick={() => togglePlayer(player.id)}
                    >
                      <strong>{player.nickname}</strong>
                      <small>{player.player_role || 'PLAYER'}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="vod-admin-actions">
                <button className="save" disabled={busy}>
                  {busy
                    ? 'GUARDANDO…'
                    : selected
                      ? 'GUARDAR CAMBIOS'
                      : 'CREAR VOD'}
                </button>

                {selected && (
                  <button
                    type="button"
                    className="delete"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirm(`¿Eliminar ${current?.title}?`)) {
                        return
                      }

                      setBusy(true)

                      try {
                        await deleteVod(current)
                        newVod()
                        await refresh()
                        setMsg('VOD eliminado.')
                      } catch (error) {
                        setErr(error.message)
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    ELIMINAR VOD
                  </button>
                )}
              </div>
            </form>

            <div className="vod-admin-section">
              <div className="vod-admin-section-head">
                <span>CLIPS DEL VOD</span>
                <strong>{clips.length}</strong>
              </div>

              {!selected ? (
                <p className="vod-admin-empty">
                  GUARDÁ EL VOD PARA AGREGAR CLIPS.
                </p>
              ) : (
                <>
                  <form
                    className="vod-admin-clipform"
                    onSubmit={addNewClip}
                  >
                    <div className="vod-admin-grid">
                      <label>
                        <span>TÍTULO</span>
                        <input
                          value={clip.title}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              title: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>JUGADOR</span>
                        <select
                          value={clip.player_id}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              player_id: event.target.value,
                            }))
                          }
                        >
                          <option value="">SIN JUGADOR</option>
                          {players.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.nickname}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>ROUND</span>
                        <input
                          type="number"
                          min="0"
                          value={clip.round_number}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              round_number: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>TIMESTAMP SEG.</span>
                        <input
                          type="number"
                          min="0"
                          value={clip.timestamp_seconds}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              timestamp_seconds: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="wide">
                        <span>URL (opcional si subís archivo)</span>
                        <input
                          type="url"
                          value={clip.video_url}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              video_url: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="wide file">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(event) =>
                            setClipFile(event.target.files?.[0] || null)
                          }
                        />
                        <span>{clipFile?.name || 'O SUBIR VIDEO'}</span>
                      </label>

                      <label className="wide">
                        <span>DESCRIPCIÓN</span>
                        <textarea
                          rows="3"
                          value={clip.description}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              description: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="check wide">
                        <input
                          type="checkbox"
                          checked={clip.is_published}
                          onChange={(event) =>
                            setClip((currentClip) => ({
                              ...currentClip,
                              is_published: event.target.checked,
                            }))
                          }
                        />
                        <span>PUBLICAR CLIP</span>
                      </label>
                    </div>

                    <button className="vod-admin-addclip" disabled={busy}>
                      + AGREGAR CLIP
                    </button>
                  </form>

                  <div className="vod-admin-clips">
                    {clips.map((currentClip) => {
                      const player =
                        players.find(
                          (item) => item.id === currentClip.player_id,
                        )

                      return (
                        <article key={currentClip.id}>
                          <div>
                            <small>
                              {player?.nickname || 'ASTERI'}
                              {currentClip.round_number != null
                                ? ` · R${currentClip.round_number}`
                                : ''}
                            </small>

                            <strong>{currentClip.title}</strong>
                          </div>

                          <span className={currentClip.is_published ? 'on' : ''}>
                            {currentClip.is_published ? 'PUBLICADO' : 'PRIVADO'}
                          </span>

                          <div>
                            {currentClip.video_url && (
                              <a
                                href={currentClip.video_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                VER ↗
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const updated = await toggleClip(currentClip)

                                  setClips((currentClips) =>
                                    currentClips.map((item) =>
                                      item.id === updated.id ? updated : item,
                                    ),
                                  )
                                } catch (error) {
                                  setErr(error.message)
                                }
                              }}
                            >
                              {currentClip.is_published ? 'OCULTAR' : 'PUBLICAR'}
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('¿Eliminar clip?')) {
                                  return
                                }

                                try {
                                  await deleteClip(currentClip)

                                  setClips((currentClips) =>
                                    currentClips.filter(
                                      (item) => item.id !== currentClip.id,
                                    ),
                                  )
                                } catch (error) {
                                  setErr(error.message)
                                }
                              }}
                            >
                              ELIMINAR
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
