import { normalizeSearch } from './adminSearch.js'
import { compareMatchesNewestFirst } from './matchOrdering.js'

export function getLegacyCompetitions(matches) {
  const groups = new Map()
  for (const match of matches) {
    const name = String(match.competition || '').trim()
    if (match.isEvent || match.tournamentId || match.status === 'CANCELADO' || !name || /amistos|scrim|^partido$|^match$/i.test(name)) continue
    const key = normalizeSearch(name)
    if (!groups.has(key)) groups.set(key, { name, games: [] })
    groups.get(key).games.push(match)
  }
  return [...groups.values()].map(group => ({ ...group, games: [...group.games].sort(compareMatchesNewestFirst) })).sort((a, b) => compareMatchesNewestFirst(a.games[0], b.games[0]))
}
