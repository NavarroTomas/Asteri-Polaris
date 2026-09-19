import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getPublicVod } from '../lib/vods'
import { getVodDownloadHref } from '../lib/vodLinks'
import { getCompetitiveMap } from '../config/competitiveMaps'
import './VodPage.css'

const fmtDate = (value) =>
  value
    ? new Intl.DateTimeFormat(
        'es-AR',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        },
      )
        .format(
          new Date(
            `${value}T12:00:00`,
          ),
        )
        .toUpperCase()
    : '—'

const fmtTime = (value) =>
  value
    ? value.slice(0, 5)
    : '—'

const fmtStamp = (seconds) =>
  seconds == null
    ? ''
    : `${Math.floor(Number(seconds) / 60)}:${String(Number(seconds) % 60).padStart(2, '0')}`

function getResult(vod) {
  const hasScore =
    vod.score_asteri != null &&
    vod.score_opponent != null

  const text =
    String(
      vod.result_label ||
        '',
    ).trim()

  if (
    vod.result_type ===
    'series'
  ) {
    return {
      label:
        vod.series_format
          ? `SERIE ${String(vod.series_format).toUpperCase()}`
          : 'SERIE',
      value: hasScore
        ? `${vod.score_asteri} — ${vod.score_opponent}`
        : text || '—',
    }
  }

  if (
    vod.result_type ===
    'elimination'
  ) {
    return {
      label:
        'ELIMINACIÓN',
      value:
        text ||
        (hasScore
          ? `${vod.score_asteri} — ${vod.score_opponent}`
          : '—'),
    }
  }

  if (
    vod.result_type ===
    'custom'
  ) {
    return {
      label:
        'RESULTADO',
      value:
        text ||
        (hasScore
          ? `${vod.score_asteri} — ${vod.score_opponent}`
          : '—'),
    }
  }

  return {
    label: 'RONDAS',
    value: hasScore
      ? `${vod.score_asteri} — ${vod.score_opponent}`
      : text || '—',
  }
}

export default function VodPage() {
  const { slug } = useParams()

  const [data, setData] =
    useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    err,
    setErr,
  ] = useState('')

  useEffect(() => {
    let ok = true

    getPublicVod(slug)
      .then(
        (nextData) =>
          ok &&
          setData(
            nextData,
          ),
      )
      .catch(
        (error) =>
          ok &&
          setErr(
            error.message,
          ),
      )
      .finally(
        () =>
          ok &&
          setLoading(
            false,
          ),
      )

    return () => {
      ok = false
    }
  }, [slug])

  if (loading) {
    return (
      <main className="vod-state">
        <span>
          ASTERI / CARGANDO VOD
        </span>
      </main>
    )
  }

  if (err || !data) {
    return (
      <main className="vod-state">
        <span>
          ASTERI / VOD
        </span>

        <h1>
          VOD NO
          <br />
          DISPONIBLE.
        </h1>

        <p>{err}</p>

        <Link to="/">
          ← VOLVER
        </Link>
      </main>
    )
  }

  const {
    vod,
    lineup,
    clips,
    maps = [],
  } = data

  const result =
    getResult(vod)

  const played =
    vod.status ===
    'played'

  const hasSeriesMaps =
    vod.result_type === 'series' && maps.length > 0

  const watchIndex = hasSeriesMaps ? '04' : '03'
  const clipsIndex = hasSeriesMaps ? '05' : '04'

  return (
    <div className="vod-page">
      <Header />

      <main>
        <section className="vod-hero">
          <div>
            <span>
              {vod.competition ||
                'ASTERI MATCH'}{' '}
              ·{' '}
              {fmtDate(
                vod.match_date,
              )}
            </span>

            <h1>
              ASTERI
              <em>VS</em>
              {vod.opponent}
            </h1>

            <p>
              {vod.title}
            </p>

            <div className="vod-meta">
              <b>
                {vod.result_type === 'series'
                  ? maps.length
                    ? `${maps.length} MAPA${maps.length === 1 ? '' : 'S'}`
                    : String(vod.series_format || 'SERIE').toUpperCase()
                  : vod.map_name || '—'}
              </b>

              <b>
                {fmtTime(
                  vod.match_time,
                )}
              </b>

              <b>
                {vod.status?.toUpperCase()}
              </b>

              <b>
                {
                  result.label
                }
              </b>
            </div>
          </div>

          <aside>
            <small>
              {played
                ? result.label
                : 'ESTADO'}
            </small>

            <strong className={
              ['elimination', 'custom'].includes(vod.result_type)
                ? 'vod-result-text'
                : ''
            }>
              {played
                ? result.value
                : vod.status ===
                    'upcoming'
                  ? 'PRÓXIMO'
                  : '—'}
            </strong>
          </aside>
        </section>

        {vod.description && (
          <section className="vod-description">
            <span>
              01 / MATCH INFO
            </span>

            <p>
              {
                vod.description
              }
            </p>
          </section>
        )}

        <section className="vod-section">
          <div className="vod-index">
            <span>02</span>
            <small>
              LINEUP
            </small>
          </div>

          <div>
            <h2>
              PLAYERS.
            </h2>

            <div className="vod-lineup">
              {lineup.length ? (
                lineup.map(
                  (
                    item,
                    index,
                  ) => (
                    <Link
                      key={
                        item.player_id
                      }
                      to={
                        item.player
                          ? `/players/${item.player.slug}`
                          : '#'
                      }
                    >
                      <span>
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      <strong>
                        {item.player
                          ?.nickname ||
                          'PLAYER'}
                      </strong>

                      <small>
                        {item.player
                          ?.player_role ||
                          'PLAYER'}
                      </small>
                    </Link>
                  ),
                )
              ) : (
                <p className="vod-empty">
                  LINEUP NO
                  CARGADO.
                </p>
              )}
            </div>
          </div>
        </section>

        {hasSeriesMaps && (
          <section className="vod-section">
            <div className="vod-index">
              <span>03</span>
              <small>MAPAS</small>
            </div>

            <div>
              <h2>SERIE.</h2>

              <div className="vod-series-maps">
                {maps.map((item, index) => {
                  const map = getCompetitiveMap(item.map_name)
                  const hasMapScore =
                    item.score_asteri != null &&
                    item.score_opponent != null

                  return (
                    <article key={item.id || `${item.map_name}-${index}`}>
                      <div className="vod-series-map-image">
                        {map.image ? (
                          <img
                            src={map.image}
                            alt={`Mapa ${map.name}`}
                            loading="lazy"
                          />
                        ) : null}

                        <span>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="vod-series-map-copy">
                        <small>MAPA {index + 1}</small>
                        <strong>{map.name}</strong>
                      </div>

                      <div className="vod-series-map-score">
                        <small>RESULTADO</small>
                        <strong>
                          {hasMapScore
                            ? `${item.score_asteri} — ${item.score_opponent}`
                            : '—'}
                        </strong>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <section className="vod-section">
          <div className="vod-index">
            <span>{watchIndex}</span>
            <small>
              WATCH
            </small>
          </div>

          <div>
            <h2>VOD.</h2>

            <div className="vod-actions">
              {vod.youtube_url && (
                <a
                  className="primary"
                  href={
                    vod.youtube_url
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  ABRIR VOD ↗
                </a>
              )}

              {vod.vod_download_url && (
                <a
                  href={
                    getVodDownloadHref(vod.vod_download_url)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  DESCARGAR VOD ↓
                </a>
              )}

              {!vod.youtube_url &&
                !vod.vod_download_url && (
                  <span>
                    SIN VOD
                    DISPONIBLE.
                  </span>
                )}
            </div>
          </div>
        </section>

        <section className="vod-section">
          <div className="vod-index">
            <span>{clipsIndex}</span>
            <small>
              CLIPS
            </small>
          </div>

          <div>
            <h2>
              HIGHLIGHTS.
            </h2>

            {clips.length ? (
              <div className="vod-clips">
                {clips.map(
                  (
                    clip,
                    index,
                  ) => (
                    <a
                      key={
                        clip.id
                      }
                      href={
                        clip.video_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div>
                        <span>
                          {String(
                            index +
                              1,
                          ).padStart(
                            2,
                            '0',
                          )}
                        </span>

                        <small>
                          {clip.player
                            ?.nickname ||
                            'ASTERI'}
                        </small>
                      </div>

                      <strong>
                        {
                          clip.title
                        }
                      </strong>

                      <p>
                        {[
                          clip.round_number !=
                          null
                            ? `ROUND ${clip.round_number}`
                            : '',
                          fmtStamp(
                            clip.timestamp_seconds,
                          ),
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            ' · ',
                          )}
                      </p>

                      <em>
                        VER CLIP ↗
                      </em>
                    </a>
                  ),
                )}
              </div>
            ) : (
              <p className="vod-empty">
                SIN CLIPS
                PUBLICADOS.
              </p>
            )}
          </div>
        </section>

        <section className="vod-back">
          <Link to="/#partidos">
            ← VOLVER A
            PARTIDOS
          </Link>

          <strong>
            ASTERI POLARIS
          </strong>
        </section>
      </main>

      <Footer />
    </div>
  )
}
