import { supabase } from './supabase'

export async function getAuditLogData({
  limit = 250,
} = {}) {
  const [
    logsResult,
    profilesResult,
    playersResult,
    vodsResult,
  ] = await Promise.all([
    supabase
      .from('audit_logs')
      .select(`
        id,
        actor_user_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(limit),

    supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        role,
        status
      `),

    supabase
      .from('players')
      .select(`
        id,
        slug,
        nickname,
        user_id
      `),

    supabase
      .from('vods')
      .select(`
        id,
        slug,
        title,
        opponent
      `),
  ])

  const results = [
    logsResult,
    profilesResult,
    playersResult,
    vodsResult,
  ]

  const firstError =
    results.find(
      (result) => result.error,
    )?.error

  if (firstError) {
    throw firstError
  }

  const profiles =
    profilesResult.data ?? []

  const players =
    playersResult.data ?? []

  const vods =
    vodsResult.data ?? []

  const profileById =
    new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ]),
    )

  const playerById =
    new Map(
      players.map((player) => [
        player.id,
        player,
      ]),
    )

  const vodById =
    new Map(
      vods.map((vod) => [
        vod.id,
        vod,
      ]),
    )

  return {
    logs:
      (logsResult.data ?? []).map(
        (log) => ({
          ...log,
          actor:
            log.actor_user_id
              ? profileById.get(
                  log.actor_user_id,
                ) ?? null
              : null,
        }),
      ),

    profiles,
    players,
    vods,

    profileById,
    playerById,
    vodById,
  }
}

export function getAuditEntityLabel(
  log,
  context,
) {
  const payload =
    log.new_data ??
    log.old_data ??
    {}

  if (
    log.entity_type === 'players'
  ) {
    return (
      payload.nickname ||
      context.playerById.get(
        log.entity_id,
      )?.nickname ||
      'Jugador'
    )
  }

  if (
    log.entity_type ===
      'player_stats' ||
    log.entity_type ===
      'player_configs'
  ) {
    const playerId =
      payload.player_id ||
      log.entity_id

    return (
      context.playerById.get(
        playerId,
      )?.nickname ||
      'Jugador'
    )
  }

  if (
    log.entity_type === 'profiles'
  ) {
    return (
      payload.display_name ||
      payload.email ||
      context.profileById.get(
        log.entity_id,
      )?.display_name ||
      context.profileById.get(
        log.entity_id,
      )?.email ||
      'Cuenta'
    )
  }

  if (
    log.entity_type === 'vods'
  ) {
    return (
      payload.title ||
      context.vodById.get(
        log.entity_id,
      )?.title ||
      payload.opponent ||
      'VOD'
    )
  }

  if (
    log.entity_type === 'clips'
  ) {
    return (
      payload.title ||
      'Clip'
    )
  }

  if (
    log.entity_type ===
    'vod_players'
  ) {
    const playerId =
      payload.player_id ||
      log.entity_id

    const player =
      context.playerById.get(
        playerId,
      )

    return player
      ? `Lineup · ${player.nickname}`
      : 'Lineup'
  }

  return (
    log.entity_type ||
    'Entidad'
  )
}
