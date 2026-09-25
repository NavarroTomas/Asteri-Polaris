import { supabase } from './supabase'
import { getVodDownloadHref } from './vodLinks'

export const MATCH_OUTCOME_COLORS = {
  win: '#00d96e',
  loss: '#e05252',
  draw: '#8a918d',
  upcoming: '#4a8dff',
}

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

function hasScore(vod) {
  return (
    vod.score_asteri !== null &&
    vod.score_asteri !== undefined &&
    vod.score_opponent !== null &&
    vod.score_opponent !== undefined
  )
}

function resolveOutcome(vod) {
  if (vod.status !== 'played') return 'upcoming'

  if (
    vod.match_outcome &&
    vod.match_outcome !== 'auto'
  ) {
    return vod.match_outcome
  }

  if (!hasScore(vod)) return 'draw'

  const a = Number(vod.score_asteri)
  const b = Number(vod.score_opponent)

  if (a > b) return 'win'
  if (a < b) return 'loss'
  return 'draw'
}

function resultMeta(vod) {
  const type = vod.result_type || 'rounds'
  const label = String(vod.result_label || '').trim()

  if (type === 'series') {
    return {
      label: vod.series_format
        ? `SERIE ${String(vod.series_format).toUpperCase()}`
        : 'SERIE',
      value: hasScore(vod)
        ? `${vod.score_asteri} — ${vod.score_opponent}`
        : label,
    }
  }

  if (type === 'elimination') {
    return {
      label: 'ELIMINACIÓN',
      value:
        label ||
        (hasScore(vod)
          ? `${vod.score_asteri} — ${vod.score_opponent}`
          : ''),
    }
  }

  if (type === 'custom') {
    return {
      label: 'RESULTADO',
      value:
        label ||
        (hasScore(vod)
          ? `${vod.score_asteri} — ${vod.score_opponent}`
          : ''),
    }
  }

  return {
    label: 'RESULTADO',
    value: hasScore(vod)
      ? `${vod.score_asteri} — ${vod.score_opponent}`
      : label,
  }
}

function mapVod(vod) {
  const result = resultMeta(vod)
  const outcome = resolveOutcome(vod)

  return {
    id: vod.id,
    slug: vod.slug,
    dateISO: vod.match_date,
    date: formatDateShort(vod.match_date),
    time: formatTime(vod.match_time),
    opponent: vod.opponent || 'RIVAL',
    competition: vod.competition || 'PARTIDO',
    status:
      vod.status === 'played'
        ? 'JUGADO'
        : vod.status === 'cancelled'
          ? 'CANCELADO'
          : 'PRÓXIMO',
    score: result.value,
    resultLabel: result.label,
    outcome,
    outcomeColor:
      MATCH_OUTCOME_COLORS[outcome] ||
      MATCH_OUTCOME_COLORS.upcoming,
    filter:
      vod.calendar_filter &&
      vod.calendar_filter.is_active !== false
        ? vod.calendar_filter
        : null,
    vod: vod.slug ? `/vods/${vod.slug}` : '',
    youtube: vod.youtube_url || '',
    downloadUrl: getVodDownloadHref(vod.vod_download_url),
  }
}

export async function getHomeCalendarData() {
  const { data, error } = await supabase
    .from('vods')
    .select(`
      id,
      slug,
      opponent,
      competition,
      match_date,
      match_time,
      score_asteri,
      score_opponent,
      status,
      result_type,
      result_label,
      series_format,
      match_outcome,
      youtube_url,
      vod_download_url,
      calendar_filter:calendar_filters(
        id,
        name,
        color,
        is_active,
        sort_order
      )
    `)
    .eq('is_published', true)
    .not('match_date', 'is', null)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })

  if (error) throw error

  const matches = (data ?? []).map(mapVod)

  const filters = [
    ...new Map(
      matches
        .map(match => match.filter)
        .filter(Boolean)
        .map(filter => [filter.id, filter]),
    ).values(),
  ].sort(
    (a, b) =>
      Number(a.sort_order || 0) -
        Number(b.sort_order || 0) ||
      String(a.name).localeCompare(String(b.name)),
  )

  return {
    matches,
    filters,
  }
}

export async function getHomeMatches() {
  const data = await getHomeCalendarData()
  return data.matches
}
