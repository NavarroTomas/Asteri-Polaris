import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  createRosterPlayer,
  getRosterAdminData,
  saveRosterPlayer,
  setRosterPlayerActive,
  slugifyPlayer,
  swapRosterOrder,
  unlinkRosterAccount,
  uploadRosterPlayerImage,
} from '../lib/rosterAdmin'
import './RosterManager.css'

const EMPTY_STATS = {
  rating: '',
  kd: '',
  hs_percentage: '',
  maps: '',
  adr: '',
  kast: '',
  impact: '',
  kills: '',
  deaths: '',
  assists: '',
  opening_kills: '',
  clutches: '',
}

const EMPTY_CONFIG = {
  dpi: '',
  sensitivity: '',
  zoom_sensitivity: '',
  edpi: '',
  polling_rate: '',
  resolution: '',
  aspect_ratio: '',
  display_mode: '',
  refresh_rate: '',
  crosshair_code: '',
  viewmodel_fov: '',
  viewmodel_offset_x: '',
  viewmodel_offset_y: '',
  viewmodel_offset_z: '',
  mouse: '',
  keyboard: '',
  headset: '',
  monitor: '',
  mousepad: '',
  launch_options: '',
}

const EMPTY_PLAYER = {
  id: null,
  user_id: null,
  slug: '',
  nickname: '',
  real_name: '',
  player_role: '',
  country_code: 'AR',
  jersey_number: '',
  biography: 'Historia jugador.',
  image_url: '',
  instagram_url: '',
  twitch_url: '',
  youtube_url: '',
  steam_url: '',
  faceit_url: '',
  is_active: true,
  sort_order: 0,
  linked_profile: null,
  stats: EMPTY_STATS,
  config: EMPTY_CONFIG,
}

function inputValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value)
}

function normalizePlayer(player) {
  if (!player) {
    return {
      ...EMPTY_PLAYER,
      stats: { ...EMPTY_STATS },
      config: { ...EMPTY_CONFIG },
    }
  }

  return {
    ...EMPTY_PLAYER,
    ...player,

    slug: inputValue(player.slug),
    nickname: inputValue(player.nickname),
    real_name: inputValue(player.real_name),
    player_role:
      inputValue(player.player_role),
    country_code:
      inputValue(player.country_code) || 'AR',
    jersey_number:
      inputValue(player.jersey_number),
    biography:
      inputValue(player.biography) ||
      'Historia jugador.',
    image_url: inputValue(player.image_url),
    instagram_url:
      inputValue(player.instagram_url),
    twitch_url:
      inputValue(player.twitch_url),
    youtube_url:
      inputValue(player.youtube_url),
    steam_url:
      inputValue(player.steam_url),
    faceit_url:
      inputValue(player.faceit_url),
    sort_order:
      inputValue(player.sort_order),

    stats: {
      ...EMPTY_STATS,
      ...(player.stats ?? {}),
      rating:
        inputValue(player.stats?.rating),
      kd:
        inputValue(player.stats?.kd),
      hs_percentage:
        inputValue(
          player.stats?.hs_percentage,
        ),
      maps:
        inputValue(player.stats?.maps),
      adr:
        inputValue(player.stats?.adr),
      kast:
        inputValue(player.stats?.kast),
      impact:
        inputValue(player.stats?.impact),
      kills:
        inputValue(player.stats?.kills),
      deaths:
        inputValue(player.stats?.deaths),
      assists:
        inputValue(player.stats?.assists),
      opening_kills:
        inputValue(
          player.stats?.opening_kills,
        ),
      clutches:
        inputValue(
          player.stats?.clutches,
        ),
    },

    config: Object.fromEntries(
      Object.keys(EMPTY_CONFIG).map(
        (key) => [
          key,
          inputValue(player.config?.[key]),
        ],
      ),
    ),
  }
}

function fieldLabel(label, children) {
  return (
    <label className="roster-manager-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function RosterManager() {
  const [players, setPlayers] = useState([])
  const [selectedId, setSelectedId] =
    useState(null)

  const [form, setForm] = useState(
    normalizePlayer(null),
  )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [imageFile, setImageFile] =
    useState(null)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const selectedIndex = useMemo(
    () =>
      players.findIndex(
        (player) => player.id === selectedId,
      ),
    [players, selectedId],
  )

  const selectedPlayer =
    selectedIndex >= 0
      ? players[selectedIndex]
      : null

  const load = async ({
    selectId = selectedId,
  } = {}) => {
    setError('')

    try {
      const data =
        await getRosterAdminData()

      setPlayers(data)

      const desired =
        data.find(
          (player) =>
            player.id === selectId,
        ) ??
        data[0] ??
        null

      if (desired) {
        setSelectedId(desired.id)
        setForm(
          normalizePlayer(desired),
        )
      } else {
        setSelectedId(null)
        setForm(
          normalizePlayer(null),
        )
      }
    } catch (err) {
      setError(
        err.message ||
        'No se pudo cargar el plantel.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectPlayer = (player) => {
    if (saving) return

    setSelectedId(player.id)
    setForm(
      normalizePlayer(player),
    )
    setImageFile(null)
    setMessage('')
    setError('')
  }

  const newPlayer = () => {
    if (saving) return

    const nextOrder =
      players.length === 0
        ? 1
        : Math.max(
            ...players.map(
              (player) =>
                Number(
                  player.sort_order,
                ) || 0,
            ),
          ) + 1

    setSelectedId(null)
    setForm({
      ...normalizePlayer(null),
      sort_order: String(nextOrder),
    })
    setImageFile(null)
    setMessage('')
    setError('')
  }

  const set = (key, value) => {
    setMessage('')
    setError('')

    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const setStat = (key, value) => {
    setMessage('')
    setError('')

    setForm((current) => ({
      ...current,
      stats: {
        ...current.stats,
        [key]: value,
      },
    }))
  }

  const setConfig = (
    key,
    value,
  ) => {
    setMessage('')
    setError('')

    setForm((current) => ({
      ...current,
      config: {
        ...current.config,
        [key]: value,
      },
    }))
  }

  const save = async (event) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      let playerId = selectedId

      if (!playerId) {
        const created =
          await createRosterPlayer({
            ...form,
            slug:
              form.slug ||
              slugifyPlayer(
                form.nickname,
              ),
          })

        playerId = created.id

        await saveRosterPlayer(
          playerId,
          {
            ...form,
            slug:
              form.slug ||
              slugifyPlayer(
                form.nickname,
              ),
          },
        )
      } else {
        await saveRosterPlayer(
          playerId,
          form,
        )
      }

      if (imageFile) {
        const currentImage =
          selectedPlayer?.image_url ||
          form.image_url ||
          null

        await uploadRosterPlayerImage(
          playerId,
          imageFile,
          currentImage,
        )
      }

      setImageFile(null)

      await load({
        selectId: playerId,
      })

      setMessage(
        selectedId
          ? 'Jugador actualizado.'
          : 'Jugador creado.',
      )
    } catch (err) {
      setError(
        err.message ||
        'No se pudo guardar el jugador.',
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    if (!selectedPlayer) return

    const next =
      !selectedPlayer.is_active

    setSaving(true)
    setMessage('')
    setError('')

    try {
      await setRosterPlayerActive(
        selectedPlayer.id,
        next,
      )

      await load({
        selectId:
          selectedPlayer.id,
      })

      setMessage(
        next
          ? 'Jugador activado.'
          : 'Jugador desactivado.',
      )
    } catch (err) {
      setError(
        err.message ||
        'No se pudo cambiar el estado.',
      )
    } finally {
      setSaving(false)
    }
  }

  const move = async (
    direction,
  ) => {
    if (
      !selectedPlayer ||
      selectedIndex < 0
    ) {
      return
    }

    const targetIndex =
      selectedIndex + direction

    if (
      targetIndex < 0 ||
      targetIndex >= players.length
    ) {
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      await swapRosterOrder(
        selectedPlayer,
        players[targetIndex],
      )

      await load({
        selectId:
          selectedPlayer.id,
      })

      setMessage(
        direction < 0
          ? 'Jugador movido hacia arriba.'
          : 'Jugador movido hacia abajo.',
      )
    } catch (err) {
      setError(
        err.message ||
        'No se pudo reordenar.',
      )
    } finally {
      setSaving(false)
    }
  }

  const unlink = async () => {
    if (
      !selectedPlayer?.user_id
    ) {
      return
    }

    const name =
      selectedPlayer
        .linked_profile
        ?.display_name ||
      selectedPlayer
        .linked_profile
        ?.email ||
      selectedPlayer.nickname

    if (
      !window.confirm(
        `¿Desvincular la cuenta de ${name}?`,
      )
    ) {
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      await unlinkRosterAccount(
        selectedPlayer.user_id,
      )

      await load({
        selectId:
          selectedPlayer.id,
      })

      setMessage(
        'Cuenta desvinculada.',
      )
    } catch (err) {
      setError(
        err.message ||
        'No se pudo desvincular la cuenta.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="roster-manager-state">
        CARGANDO PLANTEL…
      </div>
    )
  }

  return (
    <div className="roster-manager">
      <div className="roster-manager-head">
        <div>
          <span>
            CONTROL / ROSTER
          </span>

          <h1>
            PLANTEL.
          </h1>

          <p>
            Altas, fichas, orden,
            configuración y estado de
            los jugadores.
          </p>
        </div>

        <button
          type="button"
          onClick={newPlayer}
          disabled={saving}
        >
          + NUEVO JUGADOR
        </button>
      </div>

      {(message || error) && (
        <div
          className={`roster-manager-message ${
            error ? 'error' : ''
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="roster-manager-layout">
        <aside className="roster-manager-list">
          <div className="roster-manager-list-head">
            <span>
              JUGADORES
            </span>

            <strong>
              {String(
                players.length,
              ).padStart(2, '0')}
            </strong>
          </div>

          {players.length === 0 ? (
            <div className="roster-manager-state">
              NO HAY JUGADORES.
            </div>
          ) : (
            players.map((player) => (
              <button
                type="button"
                key={player.id}
                className={
                  selectedId ===
                  player.id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  selectPlayer(player)
                }
              >
                <span className="roster-manager-list-number">
                  {player.jersey_number ||
                    String(
                      player.sort_order ??
                        '',
                    ).padStart(
                      2,
                      '0',
                    )}
                </span>

                <div>
                  <strong>
                    {player.nickname}
                  </strong>

                  <small>
                    {player.player_role ||
                      'PLAYER'}
                  </small>
                </div>

                <i
                  className={
                    player.is_active
                      ? 'online'
                      : ''
                  }
                >
                  {player.is_active
                    ? 'ACTIVO'
                    : 'OFF'}
                </i>
              </button>
            ))
          )}
        </aside>

        <section className="roster-manager-editor">
          <form onSubmit={save}>
            <div className="roster-manager-editor-head">
              <div>
                <small>
                  {selectedId
                    ? 'EDITAR JUGADOR'
                    : 'NUEVO JUGADOR'}
                </small>

                <strong>
                  {form.nickname ||
                    'SIN NOMBRE'}
                </strong>
              </div>

              {selectedId &&
                form.slug && (
                  <Link
                    to={`/players/${form.slug}`}
                    target="_blank"
                  >
                    VER PERFIL ↗
                  </Link>
                )}
            </div>

            <div className="roster-manager-main-grid">
              <div className="roster-manager-image-column">
                <div className="roster-manager-image">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt={
                        form.nickname ||
                        'Jugador'
                      }
                    />
                  ) : (
                    <span>
                      SIN IMAGEN
                    </span>
                  )}
                </div>

                <label className="roster-manager-file">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving}
                    onChange={(event) =>
                      setImageFile(
                        event.target
                          .files?.[0] ??
                          null,
                      )
                    }
                  />

                  <span>
                    {imageFile
                      ? imageFile.name
                      : 'SUBIR IMAGEN'}
                  </span>
                </label>

                {fieldLabel(
                  'IMAGE URL',
                  <input
                    value={
                      form.image_url
                    }
                    onChange={(event) =>
                      set(
                        'image_url',
                        event.target
                          .value,
                      )
                    }
                    placeholder="/players/... o https://..."
                  />,
                )}

                {selectedId && (
                  <div className="roster-manager-order">
                    <span>
                      ORDEN DEL ROSTER
                    </span>

                    <div>
                      <button
                        type="button"
                        disabled={
                          saving ||
                          selectedIndex <=
                            0
                        }
                        onClick={() =>
                          move(-1)
                        }
                      >
                        ↑ SUBIR
                      </button>

                      <button
                        type="button"
                        disabled={
                          saving ||
                          selectedIndex ===
                            players.length -
                              1
                        }
                        onClick={() =>
                          move(1)
                        }
                      >
                        ↓ BAJAR
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="roster-manager-fields">
                <div className="roster-manager-field-grid">
                  {fieldLabel(
                    'NICKNAME',
                    <input
                      value={
                        form.nickname
                      }
                      onChange={(event) => {
                        const nickname =
                          event.target
                            .value

                        setForm(
                          (current) => ({
                            ...current,
                            nickname,
                            slug:
                              selectedId ||
                              current.slug
                                ? current.slug
                                : slugifyPlayer(
                                    nickname,
                                  ),
                          }),
                        )
                      }}
                      required
                    />,
                  )}

                  {fieldLabel(
                    'NOMBRE REAL',
                    <input
                      value={
                        form.real_name
                      }
                      onChange={(event) =>
                        set(
                          'real_name',
                          event.target
                            .value,
                        )
                      }
                    />,
                  )}

                  {fieldLabel(
                    'ROL',
                    <input
                      value={
                        form.player_role
                      }
                      onChange={(event) =>
                        set(
                          'player_role',
                          event.target
                            .value,
                        )
                      }
                      placeholder="Rifler / AWPer / IGL"
                    />,
                  )}

                  {fieldLabel(
                    'PAÍS',
                    <input
                      value={
                        form.country_code
                      }
                      maxLength="3"
                      onChange={(event) =>
                        set(
                          'country_code',
                          event.target
                            .value
                            .toUpperCase(),
                        )
                      }
                    />,
                  )}

                  {fieldLabel(
                    'NÚMERO',
                    <input
                      value={
                        form.jersey_number
                      }
                      onChange={(event) =>
                        set(
                          'jersey_number',
                          event.target
                            .value,
                        )
                      }
                    />,
                  )}

                  {fieldLabel(
                    'SORT ORDER',
                    <input
                      type="number"
                      value={
                        form.sort_order
                      }
                      onChange={(event) =>
                        set(
                          'sort_order',
                          event.target
                            .value,
                        )
                      }
                    />,
                  )}

                  <label className="roster-manager-field wide">
                    <span>
                      SLUG
                    </span>

                    <input
                      value={
                        form.slug
                      }
                      onChange={(event) =>
                        set(
                          'slug',
                          slugifyPlayer(
                            event.target
                              .value,
                          ),
                        )
                      }
                      required
                    />
                  </label>

                  <label className="roster-manager-field wide">
                    <span>
                      HISTORIA
                    </span>

                    <textarea
                      rows="7"
                      value={
                        form.biography
                      }
                      onChange={(event) =>
                        set(
                          'biography',
                          event.target
                            .value,
                        )
                      }
                    />
                  </label>
                </div>

                <div className="roster-manager-account">
                  <div>
                    <span>
                      CUENTA VINCULADA
                    </span>

                    <strong>
                      {form
                        .linked_profile
                        ?.display_name ||
                        form
                          .linked_profile
                          ?.email ||
                        'SIN CUENTA'}
                    </strong>

                    {form
                      .linked_profile
                      ?.email && (
                      <small>
                        {
                          form
                            .linked_profile
                            .email
                        }
                      </small>
                    )}
                  </div>

                  {form.user_id && (
                    <button
                      type="button"
                      onClick={unlink}
                      disabled={saving}
                    >
                      DESVINCULAR
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="roster-manager-section">
              <div className="roster-manager-section-head">
                <div>
                  <small>
                    PERFORMANCE
                  </small>
                  <h2>
                    STATS.
                  </h2>
                </div>
              </div>

              <div className="roster-manager-stat-grid">
                {[
                  ['RATING', 'rating'],
                  ['K/D', 'kd'],
                  ['HS %', 'hs_percentage'],
                  ['MAPAS', 'maps'],
                  ['ADR', 'adr'],
                  ['KAST %', 'kast'],
                  ['IMPACT', 'impact'],
                  ['KILLS', 'kills'],
                  ['DEATHS', 'deaths'],
                  ['ASSISTS', 'assists'],
                  [
                    'OPENING KILLS',
                    'opening_kills',
                  ],
                  ['CLUTCHES', 'clutches'],
                ].map(
                  ([label, key]) => (
                    <label
                      key={key}
                      className="roster-manager-stat"
                    >
                      <span>
                        {label}
                      </span>

                      <input
                        type="number"
                        step="any"
                        value={
                          form.stats[
                            key
                          ]
                        }
                        onChange={(
                          event,
                        ) =>
                          setStat(
                            key,
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </label>
                  ),
                )}
              </div>
            </div>

            <div className="roster-manager-section">
              <div className="roster-manager-section-head">
                <div>
                  <small>
                    CS2
                  </small>
                  <h2>
                    CONFIG.
                  </h2>
                </div>
              </div>

              <div className="roster-manager-config-grid">
                {[
                  ['DPI', 'dpi'],
                  [
                    'SENSITIVITY',
                    'sensitivity',
                  ],
                  [
                    'ZOOM SENS',
                    'zoom_sensitivity',
                  ],
                  ['eDPI', 'edpi'],
                  [
                    'POLLING RATE',
                    'polling_rate',
                  ],
                  [
                    'RESOLUTION',
                    'resolution',
                  ],
                  [
                    'ASPECT RATIO',
                    'aspect_ratio',
                  ],
                  [
                    'DISPLAY MODE',
                    'display_mode',
                  ],
                  [
                    'REFRESH RATE',
                    'refresh_rate',
                  ],
                  [
                    'VIEWMODEL FOV',
                    'viewmodel_fov',
                  ],
                  [
                    'OFFSET X',
                    'viewmodel_offset_x',
                  ],
                  [
                    'OFFSET Y',
                    'viewmodel_offset_y',
                  ],
                  [
                    'OFFSET Z',
                    'viewmodel_offset_z',
                  ],
                ].map(
                  ([label, key]) => (
                    <label
                      key={key}
                      className="roster-manager-field"
                    >
                      <span>
                        {label}
                      </span>

                      <input
                        value={
                          form.config[
                            key
                          ]
                        }
                        onChange={(
                          event,
                        ) =>
                          setConfig(
                            key,
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </label>
                  ),
                )}

                <label className="roster-manager-field wide">
                  <span>
                    CROSSHAIR CODE
                  </span>

                  <input
                    value={
                      form.config
                        .crosshair_code
                    }
                    onChange={(event) =>
                      setConfig(
                        'crosshair_code',
                        event.target
                          .value,
                      )
                    }
                  />
                </label>

                {[
                  ['MOUSE', 'mouse'],
                  [
                    'KEYBOARD',
                    'keyboard',
                  ],
                  ['HEADSET', 'headset'],
                  ['MONITOR', 'monitor'],
                  ['MOUSEPAD', 'mousepad'],
                ].map(
                  ([label, key]) => (
                    <label
                      key={key}
                      className="roster-manager-field"
                    >
                      <span>
                        {label}
                      </span>

                      <input
                        value={
                          form.config[
                            key
                          ]
                        }
                        onChange={(
                          event,
                        ) =>
                          setConfig(
                            key,
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </label>
                  ),
                )}

                <label className="roster-manager-field wide">
                  <span>
                    LAUNCH OPTIONS
                  </span>

                  <textarea
                    rows="3"
                    value={
                      form.config
                        .launch_options
                    }
                    onChange={(event) =>
                      setConfig(
                        'launch_options',
                        event.target
                          .value,
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="roster-manager-section">
              <div className="roster-manager-section-head">
                <div>
                  <small>
                    LINKS
                  </small>
                  <h2>
                    SOCIAL.
                  </h2>
                </div>
              </div>

              <div className="roster-manager-field-grid">
                {[
                  [
                    'INSTAGRAM',
                    'instagram_url',
                  ],
                  [
                    'TWITCH',
                    'twitch_url',
                  ],
                  [
                    'YOUTUBE',
                    'youtube_url',
                  ],
                  ['STEAM', 'steam_url'],
                  [
                    'FACEIT',
                    'faceit_url',
                  ],
                ].map(
                  ([label, key]) => (
                    <label
                      key={key}
                      className="roster-manager-field"
                    >
                      <span>
                        {label}
                      </span>

                      <input
                        type="url"
                        value={
                          form[key]
                        }
                        onChange={(
                          event,
                        ) =>
                          set(
                            key,
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </label>
                  ),
                )}
              </div>
            </div>

            <div className="roster-manager-actions">
              <button
                className="save"
                disabled={saving}
              >
                {saving
                  ? 'GUARDANDO…'
                  : selectedId
                    ? 'GUARDAR CAMBIOS'
                    : 'CREAR JUGADOR'}
              </button>

              {selectedId && (
                <button
                  type="button"
                  className={
                    form.is_active
                      ? 'deactivate'
                      : 'activate'
                  }
                  disabled={saving}
                  onClick={toggleActive}
                >
                  {form.is_active
                    ? 'DESACTIVAR JUGADOR'
                    : 'ACTIVAR JUGADOR'}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
