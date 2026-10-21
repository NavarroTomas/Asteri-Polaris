import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSiteSettings } from '../lib/siteSettings'
import { publicAnalyticsPage, publicReferrer } from '../lib/analyticsPrivacy'

function ensureGoogleTag(id) {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
  if (!document.querySelector('script[data-asteri-ga]')) {
    window.gtag('js', new Date())
    window.gtag('config', id, { send_page_view: false, ...publicAnalyticsPage(window.location.href), page_referrer: publicReferrer(document.referrer), allow_google_signals: false, allow_ad_personalization_signals: false })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    script.dataset.asteriGa = 'true'
    document.head.appendChild(script)
  }
}
export default function AnalyticsTracker() {
  const location = useLocation()
  const [measurementId, setMeasurementId] = useState('')
  const previousPage = useRef(null)
  useEffect(() => {
    let alive = true
    getSiteSettings().then(settings => {
      const id = String(settings.ga_measurement_id || '').trim().toUpperCase()
      if (alive && /^G-[A-Z0-9]+$/.test(id)) setMeasurementId(id)
    }).catch(() => {})
    return () => { alive = false }
  }, [])
  useEffect(() => {
    const page = publicAnalyticsPage(window.location.href)
    if (!page || !measurementId || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return
    if (previousPage.current === page.page_location) return
    ensureGoogleTag(measurementId)
    window.gtag('event', 'page_view', { ...page, page_title: document.title, page_referrer: publicReferrer(document.referrer), send_to: measurementId })
    previousPage.current = page.page_location
  }, [measurementId, location.pathname])
  return null
}
