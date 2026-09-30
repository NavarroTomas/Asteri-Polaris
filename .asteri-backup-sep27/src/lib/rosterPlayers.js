import { supabase } from './supabase'

export const rosterFallback = [
  {
    slug: 'pma',
    nickname: 'PMA',
    name: 'PMA',
    role: 'Rifler',
    image: '/players/character1.png',
    number: '01',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.18',
      kd: '1.22',
      hs: '53%',
      maps: '128',
    },
    config: {
      dpi: '800',
      sensitivity: '1.05',
      resolution: '1280x960',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
  {
    slug: 'onlyfran',
    nickname: 'Onlyfran',
    name: 'Onlyfran',
    role: 'AWPer',
    image: '/players/character2.png',
    number: '02',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.14',
      kd: '1.19',
      hs: '31%',
      maps: '119',
    },
    config: {
      dpi: '400',
      sensitivity: '2.10',
      resolution: '1280x960',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
  {
    slug: 'nacho',
    nickname: 'Nacho',
    name: 'Nacho',
    role: 'IGL',
    image: '/players/character3.png',
    number: '03',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.08',
      kd: '1.07',
      hs: '47%',
      maps: '140',
    },
    config: {
      dpi: '800',
      sensitivity: '0.92',
      resolution: '1920x1080',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
  {
    slug: 'darking',
    nickname: 'Darking',
    name: 'Darking',
    role: 'Rifler',
    image: '/players/character4.png',
    number: '04',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.12',
      kd: '1.11',
      hs: '58%',
      maps: '102',
    },
    config: {
      dpi: '800',
      sensitivity: '1.18',
      resolution: '1440x1080',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
  {
    slug: 'genal',
    nickname: 'Genal',
    name: 'Genal',
    role: 'Rifler',
    image: '/players/character5.png',
    number: '05',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.06',
      kd: '1.02',
      hs: '49%',
      maps: '97',
    },
    config: {
      dpi: '400',
      sensitivity: '2.30',
      resolution: '1280x1024',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
  {
    slug: 'dczek',
    nickname: 'dczek',
    name: 'dczek',
    role: 'Rifler',
    image: '/players/character6.png',
    number: '06',
    country: 'AR',
    bio: 'Historia jugador.',
    stats: {
      rating: '1.06',
      kd: '1.02',
      hs: '49%',
      maps: '97',
    },
    config: {
      dpi: '400',
      sensitivity: '2.30',
      resolution: '1280x1024',
      crosshair: 'CSGO-XXXXX-XXXXX',
    },
  },
]

function displayNumber(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function displayDecimal(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return String(value)
  }

  return numeric.toFixed(2)
}

function fallbackForSlug(slug) {
  return rosterFallback.find((player) => player.slug === slug)
}

export async function getRosterPlayers() {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      id,
      slug,
      nickname,
      real_name,
      player_role,
      country_code,
      jersey_number,
      biography,
      image_url,
      sort_order,
      is_active
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (playersError) throw playersError

  if (!players?.length) {
    return []
  }

  const ids = players.map((player) => player.id)

  const [statsResult, configResult] = await Promise.all([
    supabase
      .from('player_stats')
      .select(`
        player_id,
        rating,
        kd,
        hs_percentage,
        maps
      `)
      .in('player_id', ids),

    supabase
      .from('player_configs')
      .select(`
        player_id,
        dpi,
        sensitivity,
        resolution,
        crosshair_code
      `)
      .in('player_id', ids),
  ])

  if (statsResult.error) throw statsResult.error
  if (configResult.error) throw configResult.error

  const statsByPlayer = new Map(
    (statsResult.data ?? []).map((row) => [row.player_id, row]),
  )

  const configByPlayer = new Map(
    (configResult.data ?? []).map((row) => [row.player_id, row]),
  )

  return players.map((player) => {
    const stats = statsByPlayer.get(player.id)
    const config = configByPlayer.get(player.id)
    const fallback = fallbackForSlug(player.slug)

    return {
      slug: player.slug,
      nickname: player.nickname || fallback?.nickname || 'PLAYER',
      name:
        player.real_name ||
        fallback?.name ||
        player.nickname ||
        'ASTERI PLAYER',
      role: player.player_role || fallback?.role || 'PLAYER',
      image: player.image_url || fallback?.image || '',
      number:
        player.jersey_number ||
        fallback?.number ||
        String(player.sort_order || '').padStart(2, '0'),
      country: player.country_code || fallback?.country || 'AR',
      bio: player.biography || fallback?.bio || 'Historia jugador.',

      stats: {
        rating:
          stats?.rating !== null && stats?.rating !== undefined
            ? displayDecimal(stats.rating)
            : fallback?.stats.rating || '—',

        kd:
          stats?.kd !== null && stats?.kd !== undefined
            ? displayDecimal(stats.kd)
            : fallback?.stats.kd || '—',

        hs:
          stats?.hs_percentage !== null &&
          stats?.hs_percentage !== undefined
            ? `${displayNumber(stats.hs_percentage)}%`
            : fallback?.stats.hs || '—',

        maps:
          stats?.maps !== null && stats?.maps !== undefined
            ? displayNumber(stats.maps)
            : fallback?.stats.maps || '—',
      },

      config: {
        dpi:
          config?.dpi !== null && config?.dpi !== undefined
            ? displayNumber(config.dpi)
            : fallback?.config.dpi || '—',

        sensitivity:
          config?.sensitivity !== null &&
          config?.sensitivity !== undefined
            ? displayNumber(config.sensitivity)
            : fallback?.config.sensitivity || '—',

        resolution:
          config?.resolution ||
          fallback?.config.resolution ||
          '—',

        crosshair:
          config?.crosshair_code ||
          fallback?.config.crosshair ||
          '—',
      },
    }
  })
}
