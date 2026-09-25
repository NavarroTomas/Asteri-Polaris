import { useEffect } from 'react'
import './RosterInteractionEnhancer.css'

export default function RosterInteractionEnhancer() {
  useEffect(() => {
    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

    if (reducedMotion) {
      return undefined
    }

    let timer = 0

    const onClick = event => {
      const card = event.target.closest('.player-card')

      if (!card) return

      const shell =
        document.querySelector(
          '.selected-player-shell',
        )

      if (!shell) return

      window.clearTimeout(timer)

      shell.classList.remove(
        'is-player-light-flash',
      )

      // Fuerza reflow para reiniciar la animación
      // incluso al cambiar de jugador muy rápido.
      void shell.offsetWidth

      shell.classList.add(
        'is-player-light-flash',
      )

      timer = window.setTimeout(() => {
        shell.classList.remove(
          'is-player-light-flash',
        )
      }, 520)
    }

    document.addEventListener('click', onClick)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
