export const ACTIVE_DUTY_MAPS = [
  {
    id: 'ancient',
    name: 'Ancient',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_ancient_1_png.png',
  },
  {
    id: 'anubis',
    name: 'Anubis',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_anubis_1_png.png',
  },
  {
    id: 'cache',
    name: 'Cache',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_cache_1_png.png',
  },
  {
    id: 'dust2',
    name: 'Dust II',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_dust2_1_png.png',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_inferno_1_png.png',
  },
  {
    id: 'mirage',
    name: 'Mirage',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_mirage_1_png.png',
  },
  {
    id: 'nuke',
    name: 'Nuke',
    image:
      'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_nuke_1_png.png',
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
