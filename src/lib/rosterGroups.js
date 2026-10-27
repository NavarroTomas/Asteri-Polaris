import { supabase } from './supabase'

export const DEFAULT_ROSTER_ID = '10000000-0000-4000-8000-000000000001'

export async function getRosters(publishedOnly = false) {
  let query = supabase.from('rosters').select('id,name,game,description,is_active,sort_order').order('sort_order').order('created_at')
  if (publishedOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function saveRoster(form) {
  const payload = { name: form.name.trim(), game: form.game.trim(), description: form.description.trim(), is_active: Boolean(form.is_active), sort_order: Number(form.sort_order) }
  if (payload.name.length < 2 || payload.game.length < 2) throw new Error('Completá el nombre y el juego del plantel.')
  if (!Number.isInteger(payload.sort_order) || payload.sort_order < 0 || payload.sort_order > 100000) throw new Error('El orden debe ser un entero entre 0 y 100000.')
  const query = form.id ? supabase.from('rosters').update(payload).eq('id', form.id) : supabase.from('rosters').insert(payload)
  const { data, error } = await query.select('id,name,game,description,is_active,sort_order').single()
  if (error) throw error
  return data
}
