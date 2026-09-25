import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addClip,
  deleteCalendarFilter,
  deleteClip,
  deleteVod,
  emptyVod,
  getVodDetail,
  listCalendarFilters,
  listVodsAndPlayers,
  saveCalendarFilter,
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

const emptyFilter = {
  name: '',
  color: '#7f8a83',
  is_active: true,
  sort_order: 0,
}

export default function VodAdminPage() {
  const { user } = useAuth()

  const [vods, setVods] = useState([])
  const [players, setPlayers] = useState([])
  const [filters, setFilters] = useState([])

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyVod)
  const [lineup, setLineup] = useState([])
  const [clips, setClips] = useState([])
  const [mapRows, setMapRows] = useState([])

  const [clipFile, setClipFile] = useState(null)
  const [clip, setClip] = useState(emptyClip)

  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilterId, setSelectedFilterId] = useState(null)
  const [filterForm, setFilterForm] = useState(emptyFilter)

  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const current = useMemo(
    () => vods.find(vod => vod.id === selected) || null,
    [vods, selected],
  )

  const selectedFilter = useMemo(
    () =>
      filters.find(item => item.id === selectedFilterId) ||
      null,
    [filters, selectedFilterId],
  )

  async function refresh() {
    try {
      const [vodData, filterData] = await Promise.all([
        listVodsAndPlayers(),
        listCalendarFilters(),
      ])

      setVods(vodData.vods)
      setPlayers(vodData.players)
      setFilters(filterData)
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
      .then(data => {
        setForm({
          ...emptyVod,
          ...data.vod,
          calendar_filter_id:
            data.vod.calendar_filter_id || '',
          match_outcome:
            data.vod.match_outcome || 'auto',
        })

        setLineup(
          data.lineup.map(item => item.player_id),
        )

        setClips(data.clips || [])
        setMapRows(
          (data.maps || []).map(item => ({
            map_name: item.map_name,
            score_asteri: item.score_asteri ?? '',
            score_opponent: item.score_opponent ?? '',
          })),
        )
      })
      .catch(error => setErr(error.message))
  }, [selected])

  useEffect(() => {
    if (!selectedFilter) {
      setFilterForm(emptyFilter)
      return
    }

    setFilterForm({
      name: selectedFilter.name || '',
      color: selectedFilter.color || '#7f8a83',
      is_active: selectedFilter.is_active !== false,
      sort_order: selectedFilter.sort_order || 0,
    })
  }, [selectedFilter])

  const set = (key, value) => {
    setForm(currentForm => ({
      ...currentForm,
      [key]: value,
    }))
    setMsg('')
    setErr('')
  }

  const togglePlayer = id => {
    setLineup(currentLineup =>
      currentLineup.includes(id)
        ? currentLineup.filter(value => value !== id)
        : [...currentLineup, id],
    )
  }

  const seriesLimit =
    SERIES_MAP_LIMITS[form.series_format || 'bo1'] || 1

  const toggleSeriesMap = mapId => {
    setErr('')

    setMapRows(currentRows => {
      const existingIndex = currentRows.findIndex(
        row => row.map_name === mapId,
      )

      if (existingIndex >= 0) {
        return currentRows.filter(
          (_, index) => index !== existingIndex,
        )
      }

      if (currentRows.length >= seriesLimit) {
        setErr(
          `${String(
            form.series_format || 'bo1',
          ).toUpperCase()} permite hasta ${seriesLimit} mapa${
            seriesLimit === 1 ? '' : 's'
          }.`,
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
    setMapRows(currentRows =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [key]: value }
          : row,
      ),
    )
  }

  const moveSeriesMap = (index, delta) => {
    setMapRows(currentRows => {
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

  const newVod = () => {
    setSelected(null)
    setForm(emptyVod)
    setLineup([])
    setClips([])
    setMapRows([])
    setMsg('')
    setErr('')
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    try {
      if (
        !form.title.trim() ||
        !form.opponent.trim() ||
        !form.match_date
      ) {
        throw new Error(
          'Completá título, rival y fecha.',
        )
      }

      let scoreA = form.score_asteri
      let scoreB = form.score_opponent

      if (form.result_type === 'series') {
        const limit =
          SERIES_MAP_LIMITS[
            form.series_format || 'bo1'
          ] || 1

        if (mapRows.length > limit) {
          throw new Error(
            `${String(
              form.series_format || 'bo1',
            ).toUpperCase()} permite hasta ${limit} mapas.`,
          )
        }

        if (
          form.status === 'played' &&
          mapRows.length === 0
        ) {
          throw new Error(
            'Seleccioná al menos un mapa jugado.',
          )
        }

        if (form.status === 'played') {
          const incomplete = mapRows.some(
            row =>
              row.score_asteri === '' ||
              row.score_asteri == null ||
              row.score_opponent === '' ||
              row.score_opponent == null,
          )

          if (incomplete) {
            throw new Error(
              'Completá el resultado de cada mapa jugado.',
            )
          }
        }

        const completed = mapRows.filter(
          row =>
            row.score_asteri !== '' &&
            row.score_opponent !== '',
        )

        scoreA = completed.filter(
          row =>
            Number(row.score_asteri) >
            Number(row.score_opponent),
        ).length

        scoreB = completed.filter(
          row =>
            Number(row.score_opponent) >
            Number(row.score_asteri),
        ).length
      }

      const saved = await saveVod(
        selected,
        {
          ...form,
          score_asteri: scoreA,
          score_opponent: scoreB,
          slug:
            form.slug ||
            slugifyVod(
              `${form.opponent}-${form.match_date}`,
            ),
        },
        user.id,
      )

      await saveVodMaps(
        saved.id,
        form.result_type === 'series'
          ? mapRows
          : [],
      )

      // La base de datos recalcula MATCHES de cada jugador
      // automáticamente al guardar este lineup.
      await saveLineup(saved.id, lineup)

      await refresh()
      setSelected(saved.id)
      setMsg(
        selected
          ? 'VOD actualizada.'
          : 'VOD creada.',
      )
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitFilter(event) {
    event.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    try {
      const saved = await saveCalendarFilter(
        selectedFilterId,
        filterForm,
        user.id,
      )

      await refresh()
      setSelectedFilterId(saved.id)
      setMsg('Filtro guardado.')
    } catch (error) {
      setErr(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function addNewClip(event) {
    event.preventDefault()

    if (!selected) {
      setErr('Guardá la VOD primero.')
      return
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

      setClips(currentClips => [
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
        <Link to="/admin">Volver al panel</Link>

        <div className="vod-admin-top-actions">
          <button
            type="button"
            onClick={() =>
              setShowFilters(current => !current)
            }
          >
            {showFilters
              ? 'Cerrar filtros'
              : 'Personalizar filtros'}
          </button>

          <button
            type="button"
            onClick={newVod}
          >
            Nuevo VOD
          </button>
        </div>
      </header>

      <section className="vod-admin-heading">
        <h1>Partidos y VODs</h1>
        <p>
          Esta es la única fuente del calendario público.
          Cada VOD define fecha, resultado, categoría,
          lineup y —si corresponde— serie/mapas.
        </p>
      </section>

      {(msg || err) && (
        <div
          className={`vod-admin-message ${
            err ? 'error' : ''
          }`}
        >
          {err || msg}
        </div>
      )}

      {showFilters && (
        <section className="vod-filter-manager">
          <aside>
            <button
              type="button"
              className={
                selectedFilterId === null
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setSelectedFilterId(null)
                setFilterForm(emptyFilter)
              }}
            >
              + Nuevo filtro
            </button>

            {filters.map(filter => (
              <button
                type="button"
                key={filter.id}
                className={
                  selectedFilterId === filter.id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setSelectedFilterId(filter.id)
                }
              >
                <i
                  style={{
                    background: filter.color,
                  }}
                />
                {filter.name}
              </button>
            ))}
          </aside>

          <form onSubmit={submitFilter}>
            <h2>
              {selectedFilterId
                ? 'Editar filtro'
                : 'Nuevo filtro'}
            </h2>

            <div className="vod-filter-form-grid">
              <label>
                <span>Nombre</span>
                <input
                  value={filterForm.name}
                  onChange={event =>
                    setFilterForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Liga, Scrim, Qualifier"
                  required
                />
              </label>

              <label>
                <span>Color identificador</span>
                <input
                  type="color"
                  value={filterForm.color}
                  onChange={event =>
                    setFilterForm(current => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Orden</span>
                <input
                  type="number"
                  value={filterForm.sort_order}
                  onChange={event =>
                    setFilterForm(current => ({
                      ...current,
                      sort_order: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={filterForm.is_active}
                  onChange={event =>
                    setFilterForm(current => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
                <span>Activo</span>
              </label>
            </div>

            <div className="vod-admin-actions">
              <button
                className="save"
                disabled={busy}
              >
                Guardar filtro
              </button>

              {selectedFilterId && (
                <button
                  type="button"
                  className="delete"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !confirm(
                        `¿Eliminar el filtro "${selectedFilter?.name}"?`,
                      )
                    ) {
                      return
                    }

                    setBusy(true)

                    try {
                      await deleteCalendarFilter(
                        selectedFilterId,
                      )
                      setSelectedFilterId(null)
                      setFilterForm(emptyFilter)
                      await refresh()
                      setMsg('Filtro eliminado.')
                    } catch (error) {
                      setErr(error.message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Eliminar filtro
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <div className="vod-admin-layout">
        <aside className="vod-admin-list">
          {vods.length === 0 ? (
            <p className="vod-admin-empty-list">
              SIN VODS
            </p>
          ) : (
            vods.map(vod => (
              <button
                type="button"
                key={vod.id}
                className={
                  selected === vod.id
                    ? 'active'
                    : ''
                }
                onClick={() => setSelected(vod.id)}
              >
                <small>
                  {vod.match_date || 'SIN FECHA'} ·{' '}
                  {vod.is_published
                    ? 'PUBLICADO'
                    : 'BORRADOR'}
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
                {selected
                  ? 'EDITAR VOD'
                  : 'NUEVO VOD'}
              </strong>

              {selected &&
                form.is_published && (
                  <Link
                    to={`/vods/${form.slug}`}
                    target="_blank"
                  >
                    Ver público
                  </Link>
                )}
            </div>

            <div className="vod-admin-grid">
              <label className="wide">
                <span>Título</span>
                <input
                  value={form.title}
                  onChange={event =>
                    set('title', event.target.value)
                  }
                  required
                />
              </label>

              <label>
                <span>Rival</span>
                <input
                  value={form.opponent}
                  onChange={event =>
                    set(
                      'opponent',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Competición</span>
                <input
                  value={form.competition || ''}
                  onChange={event =>
                    set(
                      'competition',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.match_date}
                  onChange={event =>
                    set(
                      'match_date',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Hora</span>
                <input
                  type="time"
                  value={form.match_time || ''}
                  onChange={event =>
                    set(
                      'match_time',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>Filtro del calendario</span>
                <select
                  value={
                    form.calendar_filter_id || ''
                  }
                  onChange={event =>
                    set(
                      'calendar_filter_id',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    SIN CATEGORÍA
                  </option>

                  {filters
                    .filter(item => item.is_active)
                    .map(filter => (
                      <option
                        key={filter.id}
                        value={filter.id}
                      >
                        {filter.name}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={form.status}
                  onChange={event =>
                    set(
                      'status',
                      event.target.value,
                    )
                  }
                >
                  <option value="upcoming">
                    PRÓXIMO
                  </option>
                  <option value="played">
                    JUGADO
                  </option>
                  <option value="cancelled">
                    CANCELADO
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Resultado en calendario
                </span>
                <select
                  value={
                    form.match_outcome || 'auto'
                  }
                  onChange={event =>
                    set(
                      'match_outcome',
                      event.target.value,
                    )
                  }
                >
                  <option value="auto">
                    AUTOMÁTICO
                  </option>
                  <option value="win">
                    GANADO
                  </option>
                  <option value="loss">
                    PERDIDO
                  </option>
                  <option value="draw">
                    EMPATE
                  </option>
                </select>
              </label>

              <label>
                <span>Tipo de resultado</span>
                <select
                  value={
                    form.result_type || 'rounds'
                  }
                  onChange={event =>
                    set(
                      'result_type',
                      event.target.value,
                    )
                  }
                >
                  <option value="rounds">
                    MATCH
                  </option>
                  <option value="series">
                    SERIE / MAPAS
                  </option>
                  <option value="elimination">
                    ELIMINACIÓN
                  </option>
                  <option value="custom">
                    PERSONALIZADO
                  </option>
                </select>
              </label>

              {form.result_type === 'series' && (
                <label>
                  <span>Formato de serie</span>
                  <select
                    value={
                      form.series_format || 'bo1'
                    }
                    onChange={event => {
                      set(
                        'series_format',
                        event.target.value,
                      )
                      setMapRows([])
                    }}
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
                    <span>Score ASTERI</span>
                    <input
                      type="number"
                      min="0"
                      value={
                        form.score_asteri ?? ''
                      }
                      onChange={event =>
                        set(
                          'score_asteri',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Score rival</span>
                    <input
                      type="number"
                      min="0"
                      value={
                        form.score_opponent ?? ''
                      }
                      onChange={event =>
                        set(
                          'score_opponent',
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </>
              )}

              {form.result_type === 'series' && (
                <div className="vod-map-picker wide">
                  <div className="vod-map-picker-head">
                    <div>
                      <span>
                        Mapas de la serie
                      </span>

                      <small>
                        Solo se muestran dentro de
                        la VOD, nunca en el
                        calendario.
                      </small>
                    </div>

                    <strong>
                      {mapRows.length}/{seriesLimit}
                    </strong>
                  </div>

                  <div className="vod-map-grid">
                    {ACTIVE_DUTY_MAPS.map(map => {
                      const selectedMap =
                        mapRows.some(
                          row =>
                            row.map_name === map.id,
                        )

                      return (
                        <button
                          type="button"
                          key={map.id}
                          className={
                            selectedMap
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            toggleSeriesMap(map.id)
                          }
                        >
                          <img
                            src={map.image}
                            alt=""
                          />
                          <span>{map.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="vod-map-results">
                    {mapRows.map((row, index) => {
                      const map =
                        getCompetitiveMap(
                          row.map_name,
                        )

                      return (
                        <div
                          className="vod-map-result-row"
                          key={`${row.map_name}-${index}`}
                        >
                          <div className="vod-map-result-name">
                            <img
                              src={map.image}
                              alt=""
                            />
                            <span>
                              {String(
                                index + 1,
                              ).padStart(2, '0')}
                            </span>
                            <strong>
                              {map.name}
                            </strong>
                          </div>

                          <label>
                            <span>ASTERI</span>
                            <input
                              type="number"
                              min="0"
                              value={
                                row.score_asteri
                              }
                              onChange={event =>
                                updateSeriesMap(
                                  index,
                                  'score_asteri',
                                  event.target.value,
                                )
                              }
                            />
                          </label>

                          <label>
                            <span>RIVAL</span>
                            <input
                              type="number"
                              min="0"
                              value={
                                row.score_opponent
                              }
                              onChange={event =>
                                updateSeriesMap(
                                  index,
                                  'score_opponent',
                                  event.target.value,
                                )
                              }
                            />
                          </label>

                          <div className="vod-map-result-actions">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() =>
                                moveSeriesMap(
                                  index,
                                  -1,
                                )
                              }
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                mapRows.length - 1
                              }
                              onClick={() =>
                                moveSeriesMap(
                                  index,
                                  1,
                                )
                              }
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <label className="wide">
                <span>
                  Resultado textual
                </span>
                <input
                  value={
                    form.result_label || ''
                  }
                  onChange={event =>
                    set(
                      'result_label',
                      event.target.value,
                    )
                  }
                  placeholder="Opcional"
                />
              </label>

              <label className="wide">
                <span>VOD / YouTube / Drive</span>
                <input
                  type="url"
                  value={
                    form.youtube_url || ''
                  }
                  onChange={event =>
                    set(
                      'youtube_url',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="wide">
                <span>Link de descarga</span>
                <input
                  type="url"
                  value={
                    form.vod_download_url || ''
                  }
                  onChange={event =>
                    set(
                      'vod_download_url',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="wide">
                <span>Slug</span>
                <input
                  value={form.slug || ''}
                  onChange={event =>
                    set(
                      'slug',
                      slugifyVod(
                        event.target.value,
                      ),
                    )
                  }
                />
              </label>

              <label className="wide">
                <span>Descripción</span>
                <textarea
                  rows="4"
                  value={
                    form.description || ''
                  }
                  onChange={event =>
                    set(
                      'description',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="check wide">
                <input
                  type="checkbox"
                  checked={Boolean(
                    form.is_published,
                  )}
                  onChange={event =>
                    set(
                      'is_published',
                      event.target.checked,
                    )
                  }
                />
                <span>Publicar VOD</span>
              </label>
            </div>

            <div className="vod-admin-section">
              <div className="vod-admin-section-head">
                <div>
                  <span>Lineup</span>
                  <small>
                    Cada jugador seleccionado suma
                    automáticamente 1 MATCH en sus
                    estadísticas. Si lo quitás, se
                    recalcula.
                  </small>
                </div>

                <strong>{lineup.length}</strong>
              </div>

              <div className="vod-admin-lineup">
                {players.map(player => (
                  <button
                    type="button"
                    key={player.id}
                    className={
                      lineup.includes(player.id)
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      togglePlayer(player.id)
                    }
                  >
                    <strong>
                      {player.nickname}
                    </strong>
                    <small>
                      {player.player_role || 'PLAYER'}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className="vod-admin-actions">
              <button
                className="save"
                disabled={busy}
              >
                {busy
                  ? 'Guardando…'
                  : selected
                    ? 'Guardar cambios'
                    : 'Crear VOD'}
              </button>

              {selected && (
                <button
                  type="button"
                  className="delete"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !confirm(
                        `¿Eliminar ${current?.title}?`,
                      )
                    ) {
                      return
                    }

                    setBusy(true)

                    try {
                      await deleteVod(current)
                      newVod()
                      await refresh()
                      setMsg('VOD eliminada.')
                    } catch (error) {
                      setErr(error.message)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  Eliminar VOD
                </button>
              )}
            </div>
          </form>

          <div className="vod-admin-section">
            <div className="vod-admin-section-head">
              <span>Clips</span>
              <strong>{clips.length}</strong>
            </div>

            {!selected ? (
              <p className="vod-admin-empty">
                Guardá la VOD para agregar clips.
              </p>
            ) : (
              <>
                <form
                  className="vod-admin-clipform"
                  onSubmit={addNewClip}
                >
                  <div className="vod-admin-grid">
                    <label>
                      <span>Título</span>
                      <input
                        value={clip.title}
                        onChange={event =>
                          setClip(currentClip => ({
                            ...currentClip,
                            title:
                              event.target.value,
                          }))
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>Jugador</span>
                      <select
                        value={clip.player_id}
                        onChange={event =>
                          setClip(currentClip => ({
                            ...currentClip,
                            player_id:
                              event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          SIN JUGADOR
                        </option>

                        {players.map(player => (
                          <option
                            key={player.id}
                            value={player.id}
                          >
                            {player.nickname}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="wide">
                      <span>URL</span>
                      <input
                        type="url"
                        value={clip.video_url}
                        onChange={event =>
                          setClip(currentClip => ({
                            ...currentClip,
                            video_url:
                              event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="wide file">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={event =>
                          setClipFile(
                            event.target.files?.[0] ||
                              null,
                          )
                        }
                      />
                      <span>
                        {clipFile?.name ||
                          'O SUBIR VIDEO'}
                      </span>
                    </label>

                    <label className="check wide">
                      <input
                        type="checkbox"
                        checked={
                          clip.is_published
                        }
                        onChange={event =>
                          setClip(currentClip => ({
                            ...currentClip,
                            is_published:
                              event.target.checked,
                          }))
                        }
                      />
                      <span>Publicar clip</span>
                    </label>
                  </div>

                  <button
                    className="vod-admin-addclip"
                    disabled={busy}
                  >
                    Agregar clip
                  </button>
                </form>

                <div className="vod-admin-clips">
                  {clips.map(currentClip => (
                    <article key={currentClip.id}>
                      <div>
                        <strong>
                          {currentClip.title}
                        </strong>
                      </div>

                      <span
                        className={
                          currentClip.is_published
                            ? 'on'
                            : ''
                        }
                      >
                        {currentClip.is_published
                          ? 'PUBLICADO'
                          : 'PRIVADO'}
                      </span>

                      <div>
                        {currentClip.video_url && (
                          <a
                            href={
                              currentClip.video_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            VER
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const updated =
                                await toggleClip(
                                  currentClip,
                                )

                              setClips(currentClips =>
                                currentClips.map(item =>
                                  item.id === updated.id
                                    ? updated
                                    : item,
                                ),
                              )
                            } catch (error) {
                              setErr(error.message)
                            }
                          }}
                        >
                          {currentClip.is_published
                            ? 'OCULTAR'
                            : 'PUBLICAR'}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              !confirm(
                                '¿Eliminar clip?',
                              )
                            ) {
                              return
                            }

                            try {
                              await deleteClip(
                                currentClip,
                              )

                              setClips(currentClips =>
                                currentClips.filter(
                                  item =>
                                    item.id !==
                                    currentClip.id,
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
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
