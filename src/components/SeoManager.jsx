import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'ASTERI POLARIS'
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  'https://asteri-polaris.vercel.app'
).replace(/\/+$/, '')

const DEFAULT_TITLE =
  'ASTERI POLARIS — Counter-Strike 2'

const DEFAULT_DESCRIPTION =
  'ASTERI POLARIS es un equipo argentino de Counter-Strike 2. Plantel, partidos, VODs, estadísticas, configuraciones e historia del equipo.'

const OG_IMAGE =
  'https://raw.githubusercontent.com/NavarroTomas/Asteri-Polaris/main/src/assets/brand/asteri-wordmark-wide.png'

const STATIC_META = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    index: true,
    type: 'website',
  },
  '/login': {
    title: `Login — ${SITE_NAME}`,
    description: 'Acceso privado de ASTERI POLARIS.',
    index: false,
  },
  '/register': {
    title: `Registro — ${SITE_NAME}`,
    description: 'Registro de cuenta de ASTERI POLARIS.',
    index: false,
  },
  '/forgot-password': {
    title: `Recuperar contraseña — ${SITE_NAME}`,
    description: 'Recuperación de acceso a ASTERI POLARIS.',
    index: false,
  },
  '/update-password': {
    title: `Nueva contraseña — ${SITE_NAME}`,
    description: 'Actualización de contraseña de ASTERI POLARIS.',
    index: false,
  },
  '/suspended': {
    title: `Cuenta suspendida — ${SITE_NAME}`,
    description: 'Estado de cuenta de ASTERI POLARIS.',
    index: false,
  },
  '/account': {
    title: `Mi cuenta — ${SITE_NAME}`,
    description: 'Panel privado de jugador de ASTERI POLARIS.',
    index: false,
  },
  '/admin': {
    title: `Administración — ${SITE_NAME}`,
    description: 'Panel privado de administración de ASTERI POLARIS.',
    index: false,
  },
  '/admin/vods': {
    title: `Partidos y VODs — ${SITE_NAME}`,
    description: 'Panel privado de partidos y VODs de ASTERI POLARIS.',
    index: false,
  },
}

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')

    if (selector.includes('property=')) {
      const property =
        selector.match(
          /property="([^"]+)"/,
        )?.[1]

      if (property) {
        element.setAttribute(
          'property',
          property,
        )
      }
    } else {
      const name =
        selector.match(
          /name="([^"]+)"/,
        )?.[1]

      if (name) {
        element.setAttribute(
          'name',
          name,
        )
      }
    }

    document.head.appendChild(element)
  }

  element.setAttribute(attribute, value)
}

function setCanonical(url) {
  let canonical =
    document.head.querySelector(
      'link[rel="canonical"]',
    )

  if (!canonical) {
    canonical =
      document.createElement('link')

    canonical.setAttribute(
      'rel',
      'canonical',
    )

    document.head.appendChild(
      canonical,
    )
  }

  canonical.setAttribute('href', url)
}

function setStructuredData(data) {
  let script =
    document.head.querySelector(
      '#asteri-structured-data',
    )

  if (!script) {
    script =
      document.createElement('script')

    script.id =
      'asteri-structured-data'

    script.type =
      'application/ld+json'

    document.head.appendChild(script)
  }

  script.textContent =
    JSON.stringify(data)
}

function humanizeSlug(slug = '') {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function resolveMeta(pathname) {
  if (STATIC_META[pathname]) {
    return STATIC_META[pathname]
  }

  if (pathname.startsWith('/admin/')) {
    return {
      title:
        `Administración — ${SITE_NAME}`,
      description:
        'Panel privado de administración de ASTERI POLARIS.',
      index: false,
    }
  }

  const playerMatch =
    pathname.match(
      /^\/players\/([^/]+)$/,
    )

  if (playerMatch) {
    const player =
      humanizeSlug(
        playerMatch[1],
      )

    return {
      title:
        `${player} — ${SITE_NAME}`,
      description:
        `Perfil de ${player} en ASTERI POLARIS: matches, estadísticas, configuración CS2, clips y VODs.`,
      index: true,
      type: 'profile',
      structured: {
        '@context':
          'https://schema.org',
        '@type': 'Person',
        name: player,
        memberOf: {
          '@type': 'SportsTeam',
          name: SITE_NAME,
          sport:
            'Counter-Strike 2',
        },
        url:
          `${SITE_URL}${pathname}`,
      },
    }
  }

  const vodMatch =
    pathname.match(
      /^\/vods\/([^/]+)$/,
    )

  if (vodMatch) {
    const vod =
      humanizeSlug(
        vodMatch[1],
      )

    return {
      title:
        `${vod} — VOD — ${SITE_NAME}`,
      description:
        `VOD, resultado, lineup y detalles del match ${vod} de ASTERI POLARIS.`,
      index: true,
      type: 'article',
      structured: {
        '@context':
          'https://schema.org',
        '@type': 'SportsEvent',
        name: vod,
        url:
          `${SITE_URL}${pathname}`,
        competitor: {
          '@type': 'SportsTeam',
          name: SITE_NAME,
        },
      },
    }
  }

  return {
    title:
      `404 — ${SITE_NAME}`,
    description:
      'La página solicitada no existe.',
    index: false,
  }
}

export default function SeoManager() {
  const location = useLocation()

  useEffect(() => {
    const pathname =
      location.pathname

    const meta =
      resolveMeta(pathname)

    const canonicalUrl =
      `${SITE_URL}${
        pathname === '/'
          ? '/'
          : pathname
      }`

    document.documentElement.lang =
      'es-AR'

    document.title =
      meta.title

    setMeta(
      'meta[name="description"]',
      'content',
      meta.description,
    )

    setMeta(
      'meta[name="robots"]',
      'content',
      meta.index
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow',
    )

    setMeta(
      'meta[property="og:type"]',
      'content',
      meta.type || 'website',
    )

    setMeta(
      'meta[property="og:title"]',
      'content',
      meta.title,
    )

    setMeta(
      'meta[property="og:description"]',
      'content',
      meta.description,
    )

    setMeta(
      'meta[property="og:url"]',
      'content',
      canonicalUrl,
    )

    setMeta(
      'meta[property="og:image"]',
      'content',
      OG_IMAGE,
    )

    setMeta(
      'meta[name="twitter:title"]',
      'content',
      meta.title,
    )

    setMeta(
      'meta[name="twitter:description"]',
      'content',
      meta.description,
    )

    setMeta(
      'meta[name="twitter:image"]',
      'content',
      OG_IMAGE,
    )

    setCanonical(canonicalUrl)

    setStructuredData(
      meta.structured || {
        '@context':
          'https://schema.org',
        '@type': 'SportsTeam',
        name: SITE_NAME,
        sport:
          'Esports / Counter-Strike 2',
        url: SITE_URL,
        description:
          DEFAULT_DESCRIPTION,
      },
    )
  }, [location.pathname])

  return null
}
