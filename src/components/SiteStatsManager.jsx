import { useEffect, useState } from 'react'
import {
  DEFAULT_SITE_STATS,
  getSiteStats,
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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = async ({
    refresh = false,
  } = {}) => {
    if (refresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      const data = await getSiteStats()
      setValues(data)
    } catch (err) {
      setError(
        err.message ||
          'No se pudieron cargar los números.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="asteri-admin-empty">
        CARGANDO NÚMEROS DE HOME…
      </div>
    )
  }

  return (
    <div className="asteri-site-stats-editor asteri-site-stats-auto">
      <div className="asteri-site-stats-grid">
        {FIELDS.map(field => (
          <div
            className="asteri-site-stat-readonly"
            key={field.key}
          >
            <span>{field.label}</span>
            <strong>
              {String(values[field.key]).padStart(2, '0')}
            </strong>
          </div>
        ))}
      </div>

      <div className="asteri-site-stats-actions">
        <button
          type="button"
          onClick={() => load({ refresh: true })}
          disabled={refreshing}
        >
          {refreshing
            ? 'ACTUALIZANDO…'
            : 'ACTUALIZAR DATOS'}
        </button>

        <span className="asteri-site-stats-sync-copy">
          SINCRONIZADO CON PLANTEL + PARTIDOS
        </span>

        {error && (
          <span className="error">
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
