export function matchOutcome(match) {
  if (match.status !== 'played') return null
  if (['win', 'loss', 'draw'].includes(match.match_outcome)) return match.match_outcome
  const a = match.score_asteri
  const b = match.score_opponent
  if (a === null || a === undefined || a === '' || b === null || b === undefined || b === '') return null
  if (!Number.isFinite(Number(a)) || !Number.isFinite(Number(b))) return null
  return Number(a) > Number(b) ? 'win' : Number(a) < Number(b) ? 'loss' : 'draw'
}

export function teamAnalytics(vods, maps, period = 'all', now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const start = new Date(`${today}T12:00:00Z`)
  if (period !== 'all') start.setUTCDate(start.getUTCDate() - Number(period) + 1)
  const cutoff = start.toISOString().slice(0, 10)
  const played = vods.filter(v => v.is_published && v.status === 'played' && (period === 'all' || (v.match_date >= cutoff && v.match_date <= today)))
  const results = { win: 0, loss: 0, draw: 0 }
  const monthly = new Map()
  for (const v of played) {
    const outcome = matchOutcome(v)
    if (outcome) results[outcome]++
    if (v.match_date) {
      const month = v.match_date.slice(0, 7)
      if (!monthly.has(month)) monthly.set(month, { month, played: 0, win: 0, loss: 0, draw: 0 })
      const row = monthly.get(month)
      row.played++
      if (outcome) row[outcome]++
    }
  }
  const ids = new Set(played.map(v => v.id))
  const byMap = new Map()
  for (const map of maps) {
    if (!ids.has(map.vod_id)) continue
    const outcome = matchOutcome({ ...map, status: 'played' })
    if (!outcome) continue
    const name = map.map_name || 'Sin mapa'
    if (!byMap.has(name)) byMap.set(name, { name, played: 0, win: 0, loss: 0, draw: 0 })
    const row = byMap.get(name)
    row.played++
    row[outcome]++
  }
  const known = results.win + results.loss + results.draw
  return {
    played, results, known, missing: played.length - known,
    winRate: known ? Math.round(results.win / known * 100) : null,
    monthly: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)),
    maps: [...byMap.values()].sort((a, b) => b.played - a.played || a.name.localeCompare(b.name)),
    recent: [...played].sort((a, b) => (b.match_date || '').localeCompare(a.match_date || '')).slice(0, 6),
  }
}
