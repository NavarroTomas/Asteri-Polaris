import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))

      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          block: 'start',
          behavior: 'auto',
        })
      })

      return
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [pathname, hash])

  return null
}
