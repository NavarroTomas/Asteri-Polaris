import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getPublicPlayerBySlug } from '../lib/publicPlayer'
import './PlayerPage.css'

function valueOrDash(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—'
  return `${value}${suffix}`
}

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(`${value}T12:00:00`))
    .toUpperCase()
    .replace('.', '')
}

function externalLinks(player) {
  return [
    ['INSTAGRAM', player.instagram_url],
    ['TWITCH', player.twitch_url],
    ['YOUTUBE', player.youtube_url],
    ['STEAM', player.steam_url],
    ['FACEIT', player.faceit_url],
  ].filter(([, url]) => Boolean(url))
}

export default function PlayerPage() {
  const { slug } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await getPublicPlayerBySlug(slug)

        if (alive) {
          setData(result)
        }
      } catch (err) {
        if (alive) {
          setError(err.message || 'No se pudo cargar el jugador.')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [slug])

  const player = data?.player
  const stats = data?.stats ?? {}
  const config = data?.config ?? {}
  const clips = data?.clips ?? []
  const vods = data?.vods ?? []

  const socials = useMemo(
    () => (player ? externalLinks(player) : []),
    [player],
  )

  const copyCrosshair = async () => {
    if (!config.crosshair_code) return

    try {
      await navigator.clipboard.writeText(config.crosshair_code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <main className="public-player-state">
        <span>ASTERI / CARGANDO JUGADOR</span>
      </main>
    )
  }

  if (error) {
    return (
      <main className="public-player-state">
        <span>PLAYER SYSTEM / ERROR</span>
        <h1>NO SE PUDO<br />CARGAR.</h1>
        <p>{error}</p>
        <Link to="/">← VOLVER A ASTERI</Link>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="public-player-state">
        <span>ASTERI / PLAYER PROFILE</span>
        <h1>JUGADOR NO<br />ENCONTRADO.</h1>
        <Link to="/">← VOLVER A ASTERI</Link>
      </main>
    )
  }

  const primaryStats = [
    ['RATING', valueOrDash(stats.rating)],
    ['K/D', valueOrDash(stats.kd)],
    ['HS%', valueOrDash(stats.hs_percentage, stats.hs_percentage !== null && stats.hs_percentage !== undefined ? '%' : '')],
    ['MAPAS', valueOrDash(stats.maps)],
  ]

  const advancedStats = [
    ['ADR', stats.adr],
    ['KAST', stats.kast, '%'],
    ['IMPACT', stats.impact],
    ['KILLS', stats.kills],
    ['DEATHS', stats.deaths],
    ['ASSISTS', stats.assists],
    ['OPENING KILLS', stats.opening_kills],
    ['CLUTCHES', stats.clutches],
  ]

  const configRows = [
    ['DPI', config.dpi],
    ['SENS', config.sensitivity],
    ['eDPI', config.edpi],
    ['ZOOM SENS', config.zoom_sensitivity],
    ['POLLING', config.polling_rate, config.polling_rate ? ' HZ' : ''],
    ['RESOLUTION', config.resolution],
    ['ASPECT RATIO', config.aspect_ratio],
    ['DISPLAY MODE', config.display_mode],
    ['REFRESH RATE', config.refresh_rate, config.refresh_rate ? ' HZ' : ''],
  ]

  const equipmentRows = [
    ['MOUSE', config.mouse],
    ['KEYBOARD', config.keyboard],
    ['HEADSET', config.headset],
    ['MONITOR', config.monitor],
    ['MOUSEPAD', config.mousepad],
  ]

  return (
    <div className="public-player-page">
      <Header />

      <main>
        <section className="public-player-hero">
          <div className="public-player-hero-copy">
            <span className="public-player-kicker">
              ASTERI / PLAYER {player.jersey_number || '00'}
            </span>

            <p className="public-player-role">
              {player.player_role || 'PLAYER'} · {player.country_code || 'AR'}
            </p>

            <h1>{player.nickname}</h1>

            {player.real_name && (
              <p className="public-player-real-name">
                {player.real_name}
              </p>
            )}

            {socials.length > 0 && (
              <div className="public-player-socials">
                {socials.map(([label, url]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="public-player-hero-visual">
            <span className="public-player-number" aria-hidden="true">
              {player.jersey_number || '00'}
            </span>

            {player.image_url ? (
              <img
                src={player.image_url}
                alt={player.nickname}
              />
            ) : (
              <div className="public-player-no-image">
                PLAYER IMAGE
              </div>
            )}
          </div>
        </section>

        <section className="public-player-primary-stats">
          {primaryStats.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="public-player-section story-section">
          <div className="public-player-section-index">
            <span>01</span>
            <small>HISTORIA</small>
          </div>

          <div className="public-player-story">
            <h2>HISTORIA<br />JUGADOR.</h2>
            <p>{player.biography || 'Historia jugador.'}</p>
          </div>
        </section>

        <section className="public-player-section stats-section">
          <div className="public-player-section-index">
            <span>02</span>
            <small>PERFORMANCE</small>
          </div>

          <div>
            <div className="public-player-section-title">
              <h2>STATS.</h2>
              <p>
                Datos competitivos cargados y actualizados desde el perfil
                privado del jugador.
              </p>
            </div>

            <div className="public-player-advanced-stats">
              {advancedStats.map(([label, value, suffix = '']) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>
                    {valueOrDash(
                      value,
                      value !== null && value !== undefined && value !== ''
                        ? suffix
                        : '',
                    )}
                  </strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="public-player-section config-section-public">
          <div className="public-player-section-index">
            <span>03</span>
            <small>CONFIG CS2</small>
          </div>

          <div>
            <div className="public-player-section-title">
              <h2>SETUP.</h2>
              <p>
                Sensibilidad, video, crosshair y equipamiento utilizados por
                {` ${player.nickname}`}.
              </p>
            </div>

            <div className="public-player-config-grid">
              {configRows.map(([label, value, suffix = '']) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>
                    {valueOrDash(
                      value,
                      value !== null && value !== undefined && value !== ''
                        ? suffix
                        : '',
                    )}
                  </strong>
                </article>
              ))}
            </div>

            <div className="public-player-crosshair">
              <div>
                <span>CROSSHAIR CODE</span>
                <strong>{config.crosshair_code || '—'}</strong>
              </div>

              {config.crosshair_code && (
                <button type="button" onClick={copyCrosshair}>
                  {copied ? 'COPIADO' : 'COPIAR'}
                </button>
              )}
            </div>

            <div className="public-player-viewmodel">
              <span>VIEWMODEL</span>
              <p>
                FOV {valueOrDash(config.viewmodel_fov)}
                {' · '}X {valueOrDash(config.viewmodel_offset_x)}
                {' · '}Y {valueOrDash(config.viewmodel_offset_y)}
                {' · '}Z {valueOrDash(config.viewmodel_offset_z)}
              </p>
            </div>

            <div className="public-player-equipment">
              {equipmentRows.map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{valueOrDash(value)}</strong>
                </article>
              ))}
            </div>

            {config.launch_options && (
              <div className="public-player-launch">
                <span>LAUNCH OPTIONS</span>
                <code>{config.launch_options}</code>
              </div>
            )}
          </div>
        </section>

        <section className="public-player-section clips-section">
          <div className="public-player-section-index">
            <span>04</span>
            <small>HIGHLIGHTS</small>
          </div>

          <div>
            <div className="public-player-section-title">
              <h2>CLIPS.</h2>
              <p>
                Highlights publicados directamente por el jugador.
              </p>
            </div>

            {clips.length === 0 ? (
              <div className="public-player-empty">
                TODAVÍA NO HAY CLIPS PUBLICADOS.
              </div>
            ) : (
              <div className="public-player-clips-grid">
                {clips.map((clip, index) => (
                  <a
                    key={clip.id}
                    href={clip.video_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="public-player-clip-top">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <small>
                        {clip.round_number !== null &&
                        clip.round_number !== undefined
                          ? `ROUND ${clip.round_number}`
                          : 'CLIP'}
                      </small>
                    </div>

                    <strong>{clip.title}</strong>

                    {clip.description && (
                      <p>{clip.description}</p>
                    )}

                    <span className="public-player-clip-action">
                      VER CLIP ↗
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="public-player-section vods-section">
          <div className="public-player-section-index">
            <span>05</span>
            <small>PARTIDOS</small>
          </div>

          <div>
            <div className="public-player-section-title">
              <h2>VODS.</h2>
              <p>
                Últimos partidos publicados en los que participó
                {` ${player.nickname}`}.
              </p>
            </div>

            {vods.length === 0 ? (
              <div className="public-player-empty">
                TODAVÍA NO HAY VODS PUBLICADOS.
              </div>
            ) : (
              <div className="public-player-vods">
                {vods.map(vod => (
                  <article key={vod.id}>
                    <div>
                      <small>
                        {formatDate(vod.match_date)}
                        {vod.competition ? ` · ${vod.competition}` : ''}
                      </small>

                      <strong>
                        ASTERI <em>VS</em> {vod.opponent}
                      </strong>
                    </div>

                    <div className="public-player-vod-meta">
                      <span>{vod.map_name || '—'}</span>

                      <strong>
                        {vod.score_asteri !== null &&
                        vod.score_asteri !== undefined &&
                        vod.score_opponent !== null &&
                        vod.score_opponent !== undefined
                          ? `${vod.score_asteri} — ${vod.score_opponent}`
                          : vod.status?.toUpperCase() || '—'}
                      </strong>
                    </div>

                    {vod.youtube_url ? (
                      <a
                        href={vod.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        VOD ↗
                      </a>
                    ) : (
                      <span className="public-player-vod-disabled">—</span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="public-player-back">
          <Link to="/#plantel">
            ← VOLVER AL PLANTEL
          </Link>

          <strong>ASTERI POLARIS</strong>
        </section>
      </main>

      <Footer />
    </div>
  )
}
