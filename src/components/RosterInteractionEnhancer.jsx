import { useEffect } from 'react'
import './RosterInteractionEnhancer.css'

export default function RosterInteractionEnhancer() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) {
      return undefined
    }

    let activeCard = null
    let timer = 0

    const onClick = event => {
      const card = event.target.closest('.player-card')

      if (!card) return

      const media = card.querySelector('.player-card-media')
      if (!media) return

      window.clearTimeout(timer)

      if (activeCard && activeCard !== card) {
        activeCard.classList.remove('is-image-light-flash')
      }

      activeCard = card

      card.classList.remove('is-image-light-flash')
      void card.offsetWidth
      card.classList.add('is-image-light-flash')

      timer = window.setTimeout(() => {
        card.classList.remove('is-image-light-flash')

        if (activeCard === card) {
          activeCard = null
        }
      }, 520)
    }

    document.addEventListener('click', onClick)

    return () => {
      window.clearTimeout(timer)

      if (activeCard) {
        activeCard.classList.remove('is-image-light-flash')
      }

      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
