import { supabase } from './supabase'

function formatDateShort(dateISO) {
  if (!dateISO) return '—'

  const date = new Date(`${dateISO}T12:00:00`)

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function formatTime(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

function mapVodToMatch(vod) {
  const hasScore =
    vod.score_asteri !== null &&
    vod.score_asteri !== undefined &&
    vod.score_opponent !== null &&
    vod.score_opponent !== undefined

  return {
    id: vod.id,
    slug: vod.slug,
    dateISO: vod.match_date,
    date: formatDateShort(vod.match_date),
    time: formatTime(vod.match_time),
    opponent: vod.opponent || 'RIVAL',
    type: vod.competition || 'PARTIDO',
    map: vod.map_name || '',
    status:
      vod.status === 'played'
        ? 'JUGADO'
        : vod.status === 'cancelled'
          ? 'CANCELADO'
          : 'PRÓXIMO',
    score: hasScore
      ? `${vod.score_asteri} — ${vod.score_opponent}`
      : '',
    vod: vod.slug ? `/vods/${vod.slug}` : '',
    youtube: vod.youtube_url || '',
    isPublished: Boolean(vod.is_published),
  }
}

export async function getHomeMatches() {
  const { data, error } = await supabase
    .from('vods')
    .select(`
      id,
      slug,
      title,
      opponent,
      competition,
      match_date,
      match_time,
      map_name,
      score_asteri,
      score_opponent,
      status,
      youtube_url,
      is_published
    `)
    .eq('is_published', true)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })

  if (error) throw error

  return (data ?? [])
    .filter((vod) => Boolean(vod.match_date))
    .map(mapVodToMatch)
}
