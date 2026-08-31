import { supabase } from './supabase'

export async function getAdminSnapshot() {
  const [
    profilesResult,
    playersResult,
    vodsResult,
    clipsResult,
    logsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, display_name, role, status, created_at, updated_at')
      .order('created_at', { ascending: false }),

    supabase
      .from('players')
      .select('id, user_id, slug, nickname, player_role, image_url, is_active, sort_order')
      .order('sort_order', { ascending: true }),

    supabase
      .from('vods')
      .select('id, title, status, is_published'),

    supabase
      .from('clips')
      .select('id, title, is_published'),

    supabase
      .from('audit_logs')
      .select('id, actor_user_id, actor_role, action, entity_type, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(80),
  ])

  const results = [
    profilesResult,
    playersResult,
    vodsResult,
    clipsResult,
    logsResult,
  ]

  const firstError = results.find((result) => result.error)?.error

  if (firstError) throw firstError

  return {
    profiles: profilesResult.data ?? [],
    players: playersResult.data ?? [],
    vods: vodsResult.data ?? [],
    clips: clipsResult.data ?? [],
    logs: logsResult.data ?? [],
  }
}

export async function approveAndLinkPlayer({ userId, playerId }) {
  if (!userId || !playerId) {
    throw new Error('Falta usuario o jugador para vincular.')
  }

  const { error } = await supabase.rpc(
    'approve_player_account',
    {
      target_user_id: userId,
      target_player_id: playerId,
    },
  )

  if (error) throw error
}

export async function unlinkPlayerByUserId(userId) {
  const { error } = await supabase.rpc(
    'unlink_player_account',
    {
      target_user_id: userId,
    },
  )

  if (error) throw error
}

export async function setUserStatus(userId, status) {
  if (!['pending', 'active', 'suspended'].includes(status)) {
    throw new Error('Estado inválido.')
  }

  const { error } = await supabase.rpc(
    'set_member_status',
    {
      target_user_id: userId,
      new_status: status,
    },
  )

  if (error) throw error
}

export async function setUserRole(userId, role) {
  if (!['owner', 'admin', 'player'].includes(role)) {
    throw new Error('Rol inválido.')
  }

  const { error } = await supabase.rpc(
    'set_member_role',
    {
      target_user_id: userId,
      new_role: role,
    },
  )

  if (error) throw error
}

export async function rejectPendingUser(userId) {
  const { error } = await supabase.rpc(
    'reject_player_account',
    {
      target_user_id: userId,
    },
  )

  if (error) throw error
}
