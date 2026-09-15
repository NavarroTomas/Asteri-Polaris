import { supabase } from './supabase'
import { getVodDownloadHref } from './vodLinks'

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

function hasNumericScore(vod) {
  return (
    vod.score_asteri !== null &&
    vod.score_asteri !== undefined &&
    vod.score_opponent !== null &&
    vod.score_opponent !== undefined
  )
}

function resultMeta(vod) {
  const type = vod.result_type || 'rounds'
  const hasScore = hasNumericScore(vod)
  const label = String(vod.result_label || '').trim()

  if (type === 'series') {
    return {
      type,
      label: vod.series_format
        ? `SERIE ${String(vod.series_format).toUpperCase()}`
        : 'SERIE',
      value: hasScore
        ? `${vod.score_asteri} — ${vod.score_opponent}`
        : label,
    }
  }

  if (type === 'elimination') {
    return {
      type,
      label: 'ELIMINACIÓN',
      value: label || (hasScore
        ? `${vod.score_asteri} — ${vod.score_opponent}`
        : ''),
    }
  }

  if (type === 'custom') {
    return {
      type,
      label: 'RESULTADO',
      value: label || (hasScore
        ? `${vod.score_asteri} — ${vod.score_opponent}`
        : ''),
    }
  }

  return {
    type: 'rounds',
    label: 'RONDAS',
    value: hasScore
      ? `${vod.score_asteri} — ${vod.score_opponent}`
      : label,
  }
}

function mapVodToMatch(vod) {
  const result = resultMeta(vod)

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
    score: result.value,
    resultType: result.type,
    resultLabel: result.label,
    resultFormat: vod.series_format || '',
    vod: vod.slug ? `/vods/${vod.slug}` : '',
    youtube: vod.youtube_url || '',
    downloadUrl: getVodDownloadHref(vod.vod_download_url),
    isPublished: Boolean(vod.is_published),
  }
}

function mapCalendarEvent(event) {
  return {
    id: event.id,
    dateISO: event.event_date,
    time: formatTime(event.event_time),
    title: event.title,
    type: event.event_type || 'event',
    description: event.description || '',
    isPublished: Boolean(event.is_published),
  }
}

export async function getHomeCalendarData() {
  const [vodsQuery, eventsQuery] = await Promise.all([
    supabase
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
        vod_download_url,
        result_type,
        result_label,
        series_format,
        is_published
      `)
      .eq('is_published', true)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true }),

    supabase
      .from('calendar_events')
      .select(`
        id,
        event_date,
        event_time,
        title,
        event_type,
        description,
        is_published
      `)
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true }),
  ])

  if (vodsQuery.error) throw vodsQuery.error
  if (eventsQuery.error) throw eventsQuery.error

  return {
    matches: (vodsQuery.data ?? [])
      .filter((vod) => Boolean(vod.match_date))
      .map(mapVodToMatch),

    events: (eventsQuery.data ?? [])
      .filter((event) => Boolean(event.event_date))
      .map(mapCalendarEvent),
  }
}

export async function getHomeMatches() {
  const data = await getHomeCalendarData()
  return data.matches
}
