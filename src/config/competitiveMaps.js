export const ACTIVE_DUTY_MAPS = [
  {
    id: 'ancient',
    name: 'Ancient',
    image:
      '/maps/de_ancient.webp',
  },
  {
    id: 'anubis',
    name: 'Anubis',
    image:
      '/maps/de_anubis.webp',
  },
  {
    id: 'cache',
    name: 'Cache',
    image:
      '/maps/de_cache.webp',
  },
  {
    id: 'dust2',
    name: 'Dust II',
    image:
      '/maps/de_dust2.webp',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    image:
      '/maps/de_inferno.webp',
  },
  {
    id: 'mirage',
    name: 'Mirage',
    image:
      '/maps/de_mirage.webp',
  },
  {
    id: 'nuke',
    name: 'Nuke',
    image:
      '/maps/de_nuke.webp',
  },
]

export function getCompetitiveMap(id) {
  return (
    ACTIVE_DUTY_MAPS.find((map) => map.id === id) || {
      id,
      name: String(id || 'Mapa')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      image: '',
    }
  )
}

export const SERIES_MAP_LIMITS = {
  bo1: 1,
  bo2: 2,
  bo3: 3,
  bo5: 5,
}
