import { useEffect, useState } from 'react'
import SiteStatsManager from './SiteStatsManager'
import AnimationDiagnostics from './AnimationDiagnostics'
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  updateAnalyticsMeasurementId,
  updateHeroVideoUrl,
} from '../lib/siteSettings'

export default function HomeSettingsManager() {
  const [videoUrl, setVideoUrl] = useState(
    DEFAULT_SITE_SETTINGS.hero_video_url,
  )
  const [savedVideoUrl, setSavedVideoUrl] = useState(
    DEFAULT_SITE_SETTINGS.hero_video_url,
  )
  const [analyticsId, setAnalyticsId] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingVideo, setSavingVideo] = useState(false)
  const [savingAnalytics, setSavingAnalytics] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const settings = await getSiteSettings()

        if (!alive) return

        setVideoUrl(settings.hero_video_url)
        setSavedVideoUrl(settings.hero_video_url)
        setAnalyticsId(
          settings.ga_measurement_id || '',
        )
      } catch (err) {
        if (alive) {
          setError(
            err.message ||
              'No se pudo cargar la configuración del sitio.',
          )
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

  const saveVideo = async event => {
    event.preventDefault()
    setSavingVideo(true)
    setMessage('')
    setError('')

    try {
      const next = await updateHeroVideoUrl(videoUrl)
      setVideoUrl(next.hero_video_url)
      setSavedVideoUrl(next.hero_video_url)
      setMessage('Video actualizado.')
    } catch (err) {
      setError(
        err.message ||
          'No se pudo guardar el video.',
      )
    } finally {
      setSavingVideo(false)
    }
  }

  const saveAnalytics = async event => {
    event.preventDefault()
    setSavingAnalytics(true)
    setMessage('')
    setError('')

    try {
      const next =
        await updateAnalyticsMeasurementId(
          analyticsId,
        )

      setAnalyticsId(
        next.ga_measurement_id || '',
      )

      setMessage(
        next.ga_measurement_id
          ? 'Google Analytics vinculado.'
          : 'Google Analytics desactivado.',
      )
    } catch (err) {
      setError(
        err.message ||
          'No se pudo guardar Google Analytics.',
      )
    } finally {
      setSavingAnalytics(false)
    }
  }

  return (
    <div className="admin-home-settings">
      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Video principal</h2>
            <p>
              Video del Hero que aparece al abrir la Home.
            </p>
          </div>
        </div>

        <div className="admin-hero-editor">
          <div className="admin-hero-preview">
            {!loading && (
              <video
                key={savedVideoUrl}
                src={savedVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
          </div>

          <form
            className="admin-hero-form"
            onSubmit={saveVideo}
          >
            <label>
              <span>Ruta o URL</span>
              <input
                value={videoUrl}
                onChange={event => {
                  setVideoUrl(event.target.value)
                  setMessage('')
                  setError('')
                }}
                placeholder="/media/hero.mp4"
              />
            </label>

            <small>
              Ejemplo: /media/hero.mp4 o una URL
              directa a un archivo de video.
            </small>

            <div className="admin-hero-form-actions">
              <button
                type="submit"
                disabled={
                  savingVideo || loading
                }
              >
                {savingVideo
                  ? 'Guardando…'
                  : 'Guardar video'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setVideoUrl('/media/hero.mp4')
                }
              >
                Usar hero.mp4
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Números públicos</h2>
            <p>
              Players, matches, wins y team de la
              sección de cuadrados de la Home.
            </p>
          </div>
        </div>

        <div className="admin-numbers-layout">
          <div>
            <SiteStatsManager />
          </div>

          <div className="admin-numbers-reference">
            <span>
              Referencia visual de la sección que
              se está modificando.
            </span>

            <div className="admin-numbers-reference-preview">
              <article>
                <strong>06</strong>
                <small>PLAYERS</small>
              </article>

              <article>
                <strong>02</strong>
                <small>MATCHES</small>
              </article>

              <article>
                <strong>02</strong>
                <small>WINS</small>
              </article>

              <article>
                <strong>01</strong>
                <small>TEAM</small>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Google Analytics</h2>
            <p>
              Conectá GA4 usando el Measurement ID
              del flujo web. Ejemplo: G-XXXXXXXXXX.
            </p>
          </div>
        </div>

        <form
          className="admin-analytics-form"
          onSubmit={saveAnalytics}
        >
          <label>
            <span>Measurement ID</span>

            <input
              value={analyticsId}
              onChange={event => {
                setAnalyticsId(
                  event.target.value
                    .toUpperCase(),
                )
                setMessage('')
                setError('')
              }}
              placeholder="G-XXXXXXXXXX"
            />
          </label>

          <button
            type="submit"
            disabled={
              savingAnalytics || loading
            }
          >
            {savingAnalytics
              ? 'Guardando…'
              : 'Guardar Analytics'}
          </button>

          <small>
            Para evitar page_view duplicados, dejá
            desactivado en GA4 el seguimiento
            automático de cambios de historial si
            vas a usar el tracking manual de esta
            SPA.
          </small>
        </form>
      </section>

      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Animaciones</h2>
            <p>
              Diagnóstico rápido para comprobar por
              qué un navegador puede estar
              desactivándolas.
            </p>
          </div>
        </div>

        <div className="admin-diagnostics-wrap">
          <AnimationDiagnostics />
        </div>
      </section>

      {(message || error) && (
        <div
          className={`admin-settings-message ${
            error ? 'error' : ''
          }`}
        >
          {error || message}
        </div>
      )}
    </div>
  )
}
