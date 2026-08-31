import { useEffect, useState } from 'react'
import {
  DEFAULT_SITE_STATS,
  getSiteStats,
  updateSiteStats,
} from '../lib/siteStats'

const FIELDS = [
  { key: 'players', label: 'PLAYERS' },
  { key: 'matches', label: 'MATCHES' },
  { key: 'wins', label: 'WINS' },
  { key: 'teams', label: 'TEAM' },
]

export default function SiteStatsManager() {
  const [values, setValues] = useState(DEFAULT_SITE_STATS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const data = await getSiteStats()
        if (alive) setValues(data)
      } catch (err) {
        if (alive) setError(err.message || 'No se pudieron cargar los números.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  const change = (key, value) => {
    setValues(current => ({
      ...current,
      [key]: value.replace(/[^0-9]/g, ''),
    }))
    setMessage('')
    setError('')
  }

  const save = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const next = await updateSiteStats(values)
      setValues(next)
      setMessage('NÚMEROS ACTUALIZADOS')
    } catch (err) {
      setError(err.message || 'No se pudieron guardar los números.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="asteri-admin-empty">
        CARGANDO NÚMEROS DE HOME…
      </div>
    )
  }

  return (
    <form
      className="asteri-site-stats-editor"
      onSubmit={save}
    >
      <div className="asteri-site-stats-grid">
        {FIELDS.map(field => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values[field.key]}
              onChange={event =>
                change(field.key, event.target.value)
              }
            />
          </label>
        ))}
      </div>

      <div className="asteri-site-stats-actions">
        <button
          type="submit"
          disabled={saving}
        >
          {saving ? 'GUARDANDO…' : 'GUARDAR NÚMEROS'}
        </button>

        {message && <span>{message}</span>}
        {error && <span className="error">{error}</span>}
      </div>
    </form>
  )
}
