import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSiteSettings } from '../lib/siteSettings'

function ensureGoogleTag(measurementId) {
  if (!measurementId || typeof window === 'undefined') {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments)
    }

  if (!document.querySelector('script[data-asteri-ga]')) {
    const script = document.createElement('script')
    script.async = true
    script.src =
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId,
      )}`
    script.dataset.asteriGa = 'true'
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    send_page_view: false,
  })
}

export default function AnalyticsTracker() {
  const location = useLocation()
  const [measurementId, setMeasurementId] = useState('')
  const initialized = useRef(false)

  useEffect(() => {
    let alive = true

    getSiteSettings()
      .then(settings => {
        if (!alive) return

        const id =
          String(settings.ga_measurement_id || '')
            .trim()
            .toUpperCase()

        setMeasurementId(id)

        if (id) {
          ensureGoogleTag(id)
          initialized.current = true
        }
      })
      .catch(error => {
        console.error(
          'No se pudo cargar Google Analytics:',
          error,
        )
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (
      !measurementId ||
      !initialized.current ||
      typeof window.gtag !== 'function'
    ) {
      return
    }

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path:
        `${location.pathname}${location.search}`,
    })
  }, [
    measurementId,
    location.pathname,
    location.search,
  ])

  return null
}
