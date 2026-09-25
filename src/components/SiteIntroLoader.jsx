import { useEffect, useState } from 'react'
import logo from '../assets/brand/asteri-a.png'
import './SiteIntroLoader.css'

const INTRO_DURATION = 2350

export default function SiteIntroLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) {
      setVisible(false)
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('asteri-intro-running')

    const timer = window.setTimeout(() => {
      setVisible(false)
      document.body.style.overflow = previousOverflow
      document.documentElement.classList.remove('asteri-intro-running')
    }, INTRO_DURATION)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = previousOverflow
      document.documentElement.classList.remove('asteri-intro-running')
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="asteri-intro"
      aria-label="Cargando ASTERI POLARIS"
      role="status"
    >
      <div className="asteri-intro-logo-stage">
        <span className="asteri-intro-light" aria-hidden="true" />

        <img
          className="asteri-intro-logo"
          src={logo}
          alt="ASTERI POLARIS"
        />
      </div>

      <span className="asteri-intro-status" aria-hidden="true">
        SYSTEM / ONLINE
      </span>
    </div>
  )
}
