import { supabase } from './supabase'

export async function getPublicPlayerBySlug(slug) {
  if (!slug) {
    throw new Error('Jugador inválido.')
  }

  const { data: player, error: playerError } = await supabase
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
      instagram_url,
      twitch_url,
      youtube_url,
      steam_url,
      faceit_url,
      is_active,
      sort_order
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (playerError) throw playerError
  if (!player) return null

  const [
    statsResult,
    configResult,
    clipsResult,
    lineupResult,
  ] = await Promise.all([
    supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', player.id)
      .maybeSingle(),

    supabase
      .from('player_configs')
      .select('*')
      .eq('player_id', player.id)
      .maybeSingle(),

    supabase
      .from('clips')
      .select(`
        id,
        vod_id,
        title,
        description,
        round_number,
        timestamp_seconds,
        source_type,
        video_url,
        storage_path,
        is_published,
        created_at
      `)
      .eq('player_id', player.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('vod_players')
      .select('vod_id, role_at_match, lineup_order')
      .eq('player_id', player.id),
  ])

  if (statsResult.error) throw statsResult.error
  if (configResult.error) throw configResult.error
  if (clipsResult.error) throw clipsResult.error
  if (lineupResult.error) throw lineupResult.error

  const vodIds = [...new Set(
    (lineupResult.data ?? [])
      .map(item => item.vod_id)
      .filter(Boolean),
  )]

  let vods = []

  if (vodIds.length > 0) {
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
      .in('id', vodIds)
      .eq('is_published', true)
      .order('match_date', { ascending: false })
      .limit(8)

    if (error) throw error
    vods = data ?? []
  }

  return {
    player,
    stats: statsResult.data,
    config: configResult.data,
    clips: clipsResult.data ?? [],
    vods,
  }
}
