import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  createExternalClip,
  deleteMyClip,
  getMyPlayerData,
  saveMyConfig,
  saveMyStats,
  updateMyPlayer,
  uploadPlayerClip,
  uploadPlayerImage,
} from '../lib/playerAccount'
import './PlayerAccount.css'

const TABS = [
  ['profile', 'PERFIL'],
  ['stats', 'STATS'],
  ['config', 'CONFIG CS2'],
  ['image', 'IMAGEN'],
  ['clips', 'CLIPS'],
]

const emptyStats = {
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

const emptyConfig = {
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

function cleanNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AccountPage() {
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    isPending,
    isActive,
    isOwner,
    isAdmin,
  } = useAuth()

  const navigate = useNavigate()

  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(emptyStats)
  const [config, setConfig] = useState(emptyConfig)
  const [clips, setClips] = useState([])

  const [imageFile, setImageFile] = useState(null)

  const [clipMode, setClipMode] = useState('url')
  const [clipFile, setClipFile] = useState(null)
  const [clipForm, setClipForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    roundNumber: '',
    isPublished: true,
  })

  const load = async () => {
    if (!user?.id || !isActive || isOwner || isAdmin) {
      setLoading(false)
      return
    }

    setError('')

    try {
      const data = await getMyPlayerData(user.id)

      setPlayer(data.player)

      setStats({
        ...emptyStats,
        ...(data.stats ?? {}),
      })

      setConfig({
        ...emptyConfig,
        ...(data.config ?? {}),
      })

      setClips(data.clips ?? [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu perfil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (isOwner || isAdmin) {
      navigate('/admin', { replace: true })
      return
    }

    load()
  }, [
    authLoading,
    user?.id,
    isActive,
    isOwner,
    isAdmin,
  ])

  const profileForm = useMemo(
    () => ({
      nickname: player?.nickname ?? '',
      real_name: player?.real_name ?? '',
      player_role: player?.player_role ?? '',
      country_code: player?.country_code ?? 'AR',
      jersey_number: player?.jersey_number ?? '',
      biography: player?.biography ?? '',
      instagram_url: player?.instagram_url ?? '',
      twitch_url: player?.twitch_url ?? '',
      youtube_url: player?.youtube_url ?? '',
      steam_url: player?.steam_url ?? '',
      faceit_url: player?.faceit_url ?? '',
    }),
    [player],
  )

  const changePlayer = (field, value) => {
    setMessage('')
    setError('')
    setPlayer(current => ({
      ...current,
      [field]: value,
    }))
  }

  const changeStats = (field, value) => {
    setMessage('')
    setError('')
    setStats(current => ({
      ...current,
      [field]: value,
    }))
  }

  const changeConfig = (field, value) => {
    setMessage('')
    setError('')
    setConfig(current => ({
      ...current,
      [field]: value,
    }))
  }

  const saveProfile = async event => {
    event.preventDefault()
    if (!player?.id) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const updated = await updateMyPlayer(player.id, profileForm)
      setPlayer(updated)
      setMessage('Perfil actualizado.')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const saveStats = async event => {
    event.preventDefault()
    if (!player?.id) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const numeric = {
        rating: cleanNumber(stats.rating),
        kd: cleanNumber(stats.kd),
        hs_percentage: cleanNumber(stats.hs_percentage),
        maps: cleanNumber(stats.maps),
        adr: cleanNumber(stats.adr),
        kast: cleanNumber(stats.kast),
        impact: cleanNumber(stats.impact),
        kills: cleanNumber(stats.kills),
        deaths: cleanNumber(stats.deaths),
        assists: cleanNumber(stats.assists),
        opening_kills: cleanNumber(stats.opening_kills),
        clutches: cleanNumber(stats.clutches),
      }

      const saved = await saveMyStats(player.id, numeric)
      setStats({
        ...emptyStats,
        ...saved,
      })
      setMessage('Estadísticas actualizadas.')
    } catch (err) {
      setError(err.message || 'No se pudieron guardar las stats.')
    } finally {
      setSaving(false)
    }
  }

  const saveConfig = async event => {
    event.preventDefault()
    if (!player?.id) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        dpi: cleanNumber(config.dpi),
        sensitivity: cleanNumber(config.sensitivity),
        zoom_sensitivity: cleanNumber(config.zoom_sensitivity),
        edpi: cleanNumber(config.edpi),
        polling_rate: cleanNumber(config.polling_rate),
        resolution: config.resolution || null,
        aspect_ratio: config.aspect_ratio || null,
        display_mode: config.display_mode || null,
        refresh_rate: cleanNumber(config.refresh_rate),
        crosshair_code: config.crosshair_code || null,
        viewmodel_fov: cleanNumber(config.viewmodel_fov),
        viewmodel_offset_x: cleanNumber(config.viewmodel_offset_x),
        viewmodel_offset_y: cleanNumber(config.viewmodel_offset_y),
        viewmodel_offset_z: cleanNumber(config.viewmodel_offset_z),
        mouse: config.mouse || null,
        keyboard: config.keyboard || null,
        headset: config.headset || null,
        monitor: config.monitor || null,
        mousepad: config.mousepad || null,
        launch_options: config.launch_options || null,
      }

      const saved = await saveMyConfig(player.id, payload)
      setConfig({
        ...emptyConfig,
        ...saved,
      })
      setMessage('Configuración CS2 actualizada.')
    } catch (err) {
      setError(err.message || 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  const saveImage = async event => {
    event.preventDefault()
    if (!player?.id || !imageFile) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await uploadPlayerImage(player.id, imageFile)
      setPlayer(result.player)
      setImageFile(null)
      setMessage('Imagen actualizada.')
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen.')
    } finally {
      setSaving(false)
    }
  }

  const resetClipForm = () => {
    setClipForm({
      title: '',
      description: '',
      videoUrl: '',
      roundNumber: '',
      isPublished: true,
    })
    setClipFile(null)
  }

  const createClip = async event => {
    event.preventDefault()
    if (!player?.id || !user?.id) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      let created

      if (clipMode === 'file') {
        created = await uploadPlayerClip({
          playerId: player.id,
          userId: user.id,
          title: clipForm.title,
          description: clipForm.description,
          file: clipFile,
          roundNumber: clipForm.roundNumber,
          isPublished: clipForm.isPublished,
        })
      } else {
        created = await createExternalClip({
          playerId: player.id,
          userId: user.id,
          title: clipForm.title,
          description: clipForm.description,
          videoUrl: clipForm.videoUrl,
          roundNumber: clipForm.roundNumber,
          isPublished: clipForm.isPublished,
        })
      }

      setClips(current => [created, ...current])
      resetClipForm()
      setMessage('Clip agregado.')
    } catch (err) {
      setError(err.message || 'No se pudo crear el clip.')
    } finally {
      setSaving(false)
    }
  }

  const removeClip = async clip => {
    if (!window.confirm(`¿Eliminar "${clip.title}"?`)) return

    setSaving(true)
    setMessage('')
    setError('')

    try {
      await deleteMyClip(clip)
      setClips(current => current.filter(item => item.id !== clip.id))
      setMessage('Clip eliminado.')
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el clip.')
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (authLoading || loading) {
    return (
      <main className="auth-loading">
        <span>ASTERI / CARGANDO PLAYER SYSTEM</span>
      </main>
    )
  }

  if (isPending) {
    return (
      <main className="player-control-shell">
        <header className="player-control-top">
          <Link to="/">← ASTERI</Link>

          <div>
            <Link to="/update-password">CAMBIAR CONTRASEÑA</Link>
            <button type="button" onClick={logout}>CERRAR SESIÓN</button>
          </div>
        </header>

        <section className="player-pending">
          <span>PLAYER SYSTEM / PENDING</span>
          <h1>CUENTA<br />PENDIENTE.</h1>
          <p>
            El Owner todavía debe aprobar esta cuenta y vincularla con tu ficha
            de jugador.
          </p>

          <div>
            <small>EMAIL</small>
            <strong>{user?.email}</strong>
          </div>
        </section>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="player-control-shell">
        <header className="player-control-top">
          <Link to="/">← ASTERI</Link>

          <div>
            <Link to="/update-password">CAMBIAR CONTRASEÑA</Link>
            <button type="button" onClick={logout}>CERRAR SESIÓN</button>
          </div>
        </header>

        <section className="player-pending">
          <span>PLAYER SYSTEM / LINK</span>
          <h1>SIN PERFIL<br />VINCULADO.</h1>
          <p>
            La cuenta está activa, pero todavía no tiene un jugador asociado.
            El Owner debe vincularla desde CONTROL → USUARIOS.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="player-control-shell">
      <header className="player-control-top">
        <Link to="/">← ASTERI</Link>

        <div>
          <Link to={`/players/${player.slug}`}>VER PERFIL ↗</Link>
          <Link to="/update-password">CAMBIAR CONTRASEÑA</Link>
          <button type="button" onClick={logout}>CERRAR SESIÓN</button>
        </div>
      </header>

      <section className="player-control-hero">
        <div className="player-control-identity">
          <span>PLAYER CONTROL / {player.jersey_number || '00'}</span>
          <h1>{player.nickname}</h1>
          <p>
            {player.player_role || 'PLAYER'} · {player.country_code || 'AR'}
          </p>
        </div>

        <div className="player-control-avatar">
          {player.image_url ? (
            <img src={player.image_url} alt={player.nickname} />
          ) : (
            <span>NO IMAGE</span>
          )}
        </div>
      </section>

      <nav className="player-control-tabs">
        {TABS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id)
              setMessage('')
              setError('')
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {(message || error) && (
        <div className={`player-control-message ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}

      <section className="player-control-content">
        {tab === 'profile' && (
          <form className="player-form" onSubmit={saveProfile}>
            <div className="player-form-heading">
              <span>01 / PERFIL</span>
              <h2>IDENTIDAD.</h2>
            </div>

            <div className="player-form-grid">
              <label>
                <span>NICKNAME</span>
                <input
                  value={player.nickname || ''}
                  onChange={e => changePlayer('nickname', e.target.value)}
                  required
                />
              </label>

              <label>
                <span>NOMBRE REAL</span>
                <input
                  value={player.real_name || ''}
                  onChange={e => changePlayer('real_name', e.target.value)}
                />
              </label>

              <label>
                <span>ROL</span>
                <input
                  value={player.player_role || ''}
                  onChange={e => changePlayer('player_role', e.target.value)}
                  placeholder="Rifler / AWPer / IGL"
                />
              </label>

              <label>
                <span>PAÍS</span>
                <input
                  value={player.country_code || ''}
                  onChange={e => changePlayer('country_code', e.target.value.toUpperCase())}
                  maxLength="2"
                />
              </label>

              <label>
                <span>NÚMERO</span>
                <input
                  value={player.jersey_number || ''}
                  onChange={e => changePlayer('jersey_number', e.target.value)}
                  maxLength="3"
                />
              </label>

              <label className="span-2">
                <span>HISTORIA</span>
                <textarea
                  rows="6"
                  value={player.biography || ''}
                  onChange={e => changePlayer('biography', e.target.value)}
                />
              </label>

              <label>
                <span>INSTAGRAM</span>
                <input
                  value={player.instagram_url || ''}
                  onChange={e => changePlayer('instagram_url', e.target.value)}
                />
              </label>

              <label>
                <span>TWITCH</span>
                <input
                  value={player.twitch_url || ''}
                  onChange={e => changePlayer('twitch_url', e.target.value)}
                />
              </label>

              <label>
                <span>YOUTUBE</span>
                <input
                  value={player.youtube_url || ''}
                  onChange={e => changePlayer('youtube_url', e.target.value)}
                />
              </label>

              <label>
                <span>STEAM</span>
                <input
                  value={player.steam_url || ''}
                  onChange={e => changePlayer('steam_url', e.target.value)}
                />
              </label>

              <label>
                <span>FACEIT</span>
                <input
                  value={player.faceit_url || ''}
                  onChange={e => changePlayer('faceit_url', e.target.value)}
                />
              </label>
            </div>

            <button className="player-save" disabled={saving}>
              {saving ? 'GUARDANDO…' : 'GUARDAR PERFIL'}
            </button>
          </form>
        )}

        {tab === 'stats' && (
          <form className="player-form" onSubmit={saveStats}>
            <div className="player-form-heading">
              <span>02 / STATS</span>
              <h2>NÚMEROS.</h2>
            </div>

            <div className="player-form-grid stats-grid">
              {[
                ['rating', 'RATING'],
                ['kd', 'K/D'],
                ['hs_percentage', 'HS %'],
                ['maps', 'MAPAS'],
                ['adr', 'ADR'],
                ['kast', 'KAST %'],
                ['impact', 'IMPACT'],
                ['kills', 'KILLS'],
                ['deaths', 'DEATHS'],
                ['assists', 'ASSISTS'],
                ['opening_kills', 'OPENING KILLS'],
                ['clutches', 'CLUTCHES'],
              ].map(([field, label]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    type="number"
                    step="any"
                    value={stats[field] ?? ''}
                    onChange={e => changeStats(field, e.target.value)}
                  />
                </label>
              ))}
            </div>

            <button className="player-save" disabled={saving}>
              {saving ? 'GUARDANDO…' : 'GUARDAR STATS'}
            </button>
          </form>
        )}

        {tab === 'config' && (
          <form className="player-form" onSubmit={saveConfig}>
            <div className="player-form-heading">
              <span>03 / CONFIG CS2</span>
              <h2>SETUP.</h2>
            </div>

            <div className="player-config-group">
              <h3>MOUSE</h3>

              <div className="player-form-grid">
                {[
                  ['dpi', 'DPI', 'number'],
                  ['sensitivity', 'SENSITIVITY', 'number'],
                  ['edpi', 'eDPI', 'number'],
                  ['zoom_sensitivity', 'ZOOM SENSITIVITY', 'number'],
                  ['polling_rate', 'POLLING RATE', 'number'],
                ].map(([field, label, type]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      type={type}
                      step="any"
                      value={config[field] ?? ''}
                      onChange={e => changeConfig(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="player-config-group">
              <h3>VIDEO</h3>

              <div className="player-form-grid">
                {[
                  ['resolution', 'RESOLUTION'],
                  ['aspect_ratio', 'ASPECT RATIO'],
                  ['display_mode', 'DISPLAY MODE'],
                  ['refresh_rate', 'REFRESH RATE'],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      value={config[field] ?? ''}
                      onChange={e => changeConfig(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="player-config-group">
              <h3>CROSSHAIR / VIEWMODEL</h3>

              <div className="player-form-grid">
                <label className="span-2">
                  <span>CROSSHAIR CODE</span>
                  <input
                    value={config.crosshair_code ?? ''}
                    onChange={e => changeConfig('crosshair_code', e.target.value)}
                  />
                </label>

                {[
                  ['viewmodel_fov', 'VIEWMODEL FOV'],
                  ['viewmodel_offset_x', 'OFFSET X'],
                  ['viewmodel_offset_y', 'OFFSET Y'],
                  ['viewmodel_offset_z', 'OFFSET Z'],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      type="number"
                      step="any"
                      value={config[field] ?? ''}
                      onChange={e => changeConfig(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="player-config-group">
              <h3>EQUIPMENT</h3>

              <div className="player-form-grid">
                {[
                  ['mouse', 'MOUSE'],
                  ['keyboard', 'KEYBOARD'],
                  ['headset', 'HEADSET'],
                  ['monitor', 'MONITOR'],
                  ['mousepad', 'MOUSEPAD'],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input
                      value={config[field] ?? ''}
                      onChange={e => changeConfig(field, e.target.value)}
                    />
                  </label>
                ))}

                <label className="span-2">
                  <span>LAUNCH OPTIONS</span>
                  <textarea
                    rows="4"
                    value={config.launch_options ?? ''}
                    onChange={e => changeConfig('launch_options', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <button className="player-save" disabled={saving}>
              {saving ? 'GUARDANDO…' : 'GUARDAR CONFIG'}
            </button>
          </form>
        )}

        {tab === 'image' && (
          <form className="player-form" onSubmit={saveImage}>
            <div className="player-form-heading">
              <span>04 / IMAGEN</span>
              <h2>PLAYER IMAGE.</h2>
            </div>

            <div className="player-image-editor">
              <div>
                {player.image_url ? (
                  <img src={player.image_url} alt={player.nickname} />
                ) : (
                  <span>SIN IMAGEN</span>
                )}
              </div>

              <label className="player-file-picker">
                <span>SUBIR NUEVA IMAGEN</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                />
                <strong>
                  {imageFile?.name || 'SELECCIONAR ARCHIVO'}
                </strong>
                <small>JPG / PNG / WEBP · MÁXIMO 5 MB</small>
              </label>
            </div>

            <button
              className="player-save"
              disabled={saving || !imageFile}
            >
              {saving ? 'SUBIENDO…' : 'ACTUALIZAR IMAGEN'}
            </button>
          </form>
        )}

        {tab === 'clips' && (
          <div className="player-form">
            <div className="player-form-heading">
              <span>05 / CLIPS</span>
              <h2>HIGHLIGHTS.</h2>
            </div>

            <form className="player-clip-creator" onSubmit={createClip}>
              <div className="player-clip-mode">
                <button
                  type="button"
                  className={clipMode === 'url' ? 'active' : ''}
                  onClick={() => setClipMode('url')}
                >
                  URL
                </button>

                <button
                  type="button"
                  className={clipMode === 'file' ? 'active' : ''}
                  onClick={() => setClipMode('file')}
                >
                  SUBIR VIDEO
                </button>
              </div>

              <div className="player-form-grid">
                <label>
                  <span>TÍTULO</span>
                  <input
                    value={clipForm.title}
                    onChange={e =>
                      setClipForm(current => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    placeholder="ACE vs Team X"
                    required
                  />
                </label>

                <label>
                  <span>ROUND</span>
                  <input
                    type="number"
                    min="0"
                    value={clipForm.roundNumber}
                    onChange={e =>
                      setClipForm(current => ({
                        ...current,
                        roundNumber: e.target.value,
                      }))
                    }
                  />
                </label>

                {clipMode === 'url' ? (
                  <label className="span-2">
                    <span>URL DEL CLIP</span>
                    <input
                      type="url"
                      value={clipForm.videoUrl}
                      onChange={e =>
                        setClipForm(current => ({
                          ...current,
                          videoUrl: e.target.value,
                        }))
                      }
                      placeholder="https://youtube.com/..."
                      required
                    />
                  </label>
                ) : (
                  <label className="span-2 player-file-picker compact">
                    <span>ARCHIVO DE VIDEO</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={e => setClipFile(e.target.files?.[0] ?? null)}
                    />
                    <strong>
                      {clipFile?.name || 'SELECCIONAR VIDEO'}
                    </strong>
                  </label>
                )}

                <label className="span-2">
                  <span>DESCRIPCIÓN</span>
                  <textarea
                    rows="4"
                    value={clipForm.description}
                    onChange={e =>
                      setClipForm(current => ({
                        ...current,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="player-checkbox">
                  <input
                    type="checkbox"
                    checked={clipForm.isPublished}
                    onChange={e =>
                      setClipForm(current => ({
                        ...current,
                        isPublished: e.target.checked,
                      }))
                    }
                  />
                  <span>PUBLICAR EN MI PERFIL</span>
                </label>
              </div>

              <button
                className="player-save"
                disabled={saving || (clipMode === 'file' && !clipFile)}
              >
                {saving ? 'GUARDANDO…' : 'AGREGAR CLIP'}
              </button>
            </form>

            <div className="player-clips-list">
              <div className="player-clips-head">
                <span>MIS CLIPS</span>
                <strong>{clips.length.toString().padStart(2, '0')}</strong>
              </div>

              {clips.length === 0 ? (
                <div className="player-clips-empty">
                  TODAVÍA NO HAY CLIPS.
                </div>
              ) : (
                clips.map(clip => (
                  <article key={clip.id}>
                    <div>
                      <small>
                        {formatDate(clip.created_at)}
                        {clip.round_number !== null && clip.round_number !== undefined
                          ? ` · ROUND ${clip.round_number}`
                          : ''}
                      </small>

                      <strong>{clip.title}</strong>
                    </div>

                    <span className={clip.is_published ? 'published' : ''}>
                      {clip.is_published ? 'PUBLICADO' : 'PRIVADO'}
                    </span>

                    <div>
                      {clip.video_url && (
                        <a href={clip.video_url} target="_blank" rel="noreferrer">
                          VER ↗
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => removeClip(clip)}
                      >
                        ELIMINAR
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
