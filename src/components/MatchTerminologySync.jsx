import { useEffect } from 'react'

const SCOPES = [
  '.selected-player-stats span',
  '.public-player-primary-stats article span',
  '.player-form label > span',
  '.roster-manager-stat span',
]

function syncLabels() {
  document
    .querySelectorAll(SCOPES.join(','))
    .forEach(element => {
      if (
        element.textContent
          ?.trim()
          .toUpperCase() === 'MAPAS'
      ) {
        element.textContent = 'MATCHES'
      }
    })
}

export default function MatchTerminologySync() {
  useEffect(() => {
    syncLabels()

    const observer =
      new MutationObserver(syncLabels)

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      },
    )

    return () => observer.disconnect()
  }, [])

  return null
}
