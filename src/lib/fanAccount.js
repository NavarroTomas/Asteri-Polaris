import { supabase } from './supabase'

function databaseError(error) {
  if (['PGRST202', 'PGRST205', '42P01'].includes(error.code)) return new Error('Los perfiles de hinchas todavía no están activados. Intentá más tarde.')
  return new Error(error.message || 'No pudimos guardar tu perfil.')
}
export async function getFanAccount() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Iniciá sesión para ver tu perfil.')
  const [preferences, players] = await Promise.all([
    supabase.from('fan_preferences').select('favorite_player_id, bio').eq('user_id', user.id).maybeSingle(),
    supabase.from('players').select('id, nickname, slug, image_url, is_active').eq('is_active', true).order('sort_order'),
  ])
  if (preferences.error) throw databaseError(preferences.error)
  if (players.error) throw databaseError(players.error)
  const list = players.data || []
  if (preferences.data?.favorite_player_id && !list.some(p => p.id === preferences.data.favorite_player_id)) {
    const { data, error } = await supabase.from('players').select('id, nickname, slug, image_url, is_active').eq('id', preferences.data.favorite_player_id).maybeSingle()
    if (error) throw databaseError(error)
    if (data) list.push(data)
  }
  return { preferences: preferences.data, players: list }
}
export async function saveFanAccount(form) {
  const { error } = await supabase.rpc('save_fan_preferences', { new_display_name: form.displayName.trim(), new_favorite_player_id: form.favoritePlayerId || null, new_bio: form.bio.trim() })
  if (error) throw databaseError(error)
}
