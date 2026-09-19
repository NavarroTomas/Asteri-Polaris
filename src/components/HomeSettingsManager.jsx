import { useEffect, useState } from 'react'
import SiteStatsManager from './SiteStatsManager'
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  updateHeroVideoUrl,
} from '../lib/siteSettings'

export default function HomeSettingsManager() {
  const [videoUrl, setVideoUrl] = useState(
    DEFAULT_SITE_SETTINGS.hero_video_url,
  )
  const [savedVideoUrl, setSavedVideoUrl] = useState(
    DEFAULT_SITE_SETTINGS.hero_video_url,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      } catch (err) {
        if (alive) {
          setError(
            err.message ||
              'No se pudo cargar la configuración del inicio.',
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
    setSaving(true)
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
          'No se pudo guardar el video del inicio.',
      )
    } finally {
      setSaving(false)
    }
  }

  const restoreDefault = () => {
    setVideoUrl('/media/hero.mp4')
    setMessage('')
    setError('')
  }

  return (
    <div className="admin-home-settings">
      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Video principal</h2>
            <p>
              Este es el video que aparece al abrir la página, detrás del
              nombre ASTERI POLARIS.
            </p>
          </div>

          <span>Hero</span>
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

          <form className="admin-hero-form" onSubmit={saveVideo}>
            <label>
              <span>Ruta o URL del video</span>

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
              Podés usar una ruta del proyecto, por ejemplo
              {' '}
              <strong>/media/hero.mp4</strong>,
              {' '}
              o una URL directa a un archivo de video reproducible por el navegador.
            </small>

            <div className="admin-hero-form-actions">
              <button type="submit" disabled={saving || loading}>
                {saving ? 'Guardando…' : 'Guardar video'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={restoreDefault}
              >
                Usar hero.mp4
              </button>

              {message && (
                <span className="admin-settings-message">
                  {message}
                </span>
              )}

              {error && (
                <span className="admin-settings-message error">
                  {error}
                </span>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="admin-settings-card">
        <div className="admin-settings-card-head">
          <div>
            <h2>Números públicos</h2>
            <p>
              Modifica los cuatro contadores de la sección de números de la
              página principal.
            </p>
          </div>

          <span>Home</span>
        </div>

        <div className="admin-numbers-layout">
          <div>
            <SiteStatsManager />
          </div>

          <div className="admin-numbers-reference">
            <span>
              Referencia: estos son los cuadrados que se modifican en la Home.
            </span>

            <div
              className="admin-numbers-reference-preview"
              aria-label="Vista de referencia de la sección de números públicos"
            >
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
    </div>
  )
}
