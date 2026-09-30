import { supabase } from './supabase'

export const DEFAULT_SITE_STATS = {
  players: 0,
  matches: 0,
  wins: 0,
  teams: 1,
}

function resolveWin(vod) {
  if (vod.match_outcome === 'win') return true
  if (vod.match_outcome === 'loss') return false
  if (vod.match_outcome === 'draw') return false

  if (
    vod.score_asteri === null ||
    vod.score_asteri === undefined ||
    vod.score_opponent === null ||
    vod.score_opponent === undefined
  ) {
    return false
  }

  return Number(vod.score_asteri) > Number(vod.score_opponent)
}

export async function getSiteStats() {
  const [
    playersResult,
    matchesResult,
  ] = await Promise.all([
    supabase
      .from('players')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_active', true),

    supabase
      .from('vods')
      .select(`
        id,
        status,
        match_outcome,
        score_asteri,
        score_opponent
      `)
      .eq('is_published', true)
      .eq('status', 'played'),
  ])

  if (playersResult.error) {
    throw playersResult.error
  }

  if (matchesResult.error) {
    throw matchesResult.error
  }

  const matches =
    matchesResult.data || []

  return {
    players:
      Number(playersResult.count) || 0,
    matches:
      matches.length,
    wins:
      matches.filter(resolveWin).length,
    teams:
      1,
  }
}

/*
  Compatibilidad: el dashboard anterior importaba esta función.
  Los números ya no se guardan manualmente porque ahora se calculan
  desde Plantel + VODs/Calendario.
*/
export async function updateSiteStats() {
  return getSiteStats()
}
