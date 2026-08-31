import { supabase } from './supabase'

export const DEFAULT_SITE_STATS = {
  players: 6,
  matches: 2,
  wins: 2,
  teams: 1,
}

function normalizeStats(row) {
  return {
    players: Number(row?.players ?? DEFAULT_SITE_STATS.players),
    matches: Number(row?.matches ?? DEFAULT_SITE_STATS.matches),
    wins: Number(row?.wins ?? DEFAULT_SITE_STATS.wins),
    teams: Number(row?.teams ?? DEFAULT_SITE_STATS.teams),
  }
}

export async function getSiteStats() {
  const { data, error } = await supabase
    .from('site_stats')
    .select('players, matches, wins, teams')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error

  return normalizeStats(data)
}

export async function updateSiteStats(values) {
  const payload = {
    players: Math.max(0, Number.parseInt(values.players, 10) || 0),
    matches: Math.max(0, Number.parseInt(values.matches, 10) || 0),
    wins: Math.max(0, Number.parseInt(values.wins, 10) || 0),
    teams: Math.max(0, Number.parseInt(values.teams, 10) || 0),
    updated_at: new Date().toISOString(),
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError

  payload.updated_by = user?.id ?? null

  const { data, error } = await supabase
    .from('site_stats')
    .update(payload)
    .eq('id', 1)
    .select('players, matches, wins, teams')
    .single()

  if (error) throw error

  return normalizeStats(data)
}
