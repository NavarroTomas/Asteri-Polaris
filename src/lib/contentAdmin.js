import { supabase } from './supabase'

export async function listTournaments(publicOnly = false) {
  let query = supabase.from('tournaments').select('*').order('starts_on', { ascending: false })
  if (publicOnly) query = query.eq('is_published', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}
export async function listOpenings(publicOnly = false) {
  let query = supabase.from('application_openings').select('*').order('created_at', { ascending: false })
  if (publicOnly) query = query.eq('is_open', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}
export async function saveContent(table, form) {
  const { id, created_at, ...payload } = form
  const query = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}
export async function deleteContent(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id).select('id').single()
  if (error?.code === '23503') throw new Error('Esta convocatoria tiene respuestas. Cerrala para conservarlas.')
  if (error) throw error
}
export async function uploadSiteMedia(file) {
  const allowed = { 'image/webp':'webp', 'image/png':'png', 'image/jpeg':'jpg', 'video/mp4':'mp4', 'video/webm':'webm' }
  const ext = allowed[file?.type]
  if (!ext) throw new Error('Usá una imagen WebP, PNG o JPG, o un video MP4 o WebM.')
  if (file.size > 50 * 1024 * 1024) throw new Error('El archivo supera los 50 MB. Usá una URL directa para videos más grandes.')
  const path = crypto.randomUUID() + '.' + ext
  const { error } = await supabase.storage.from('site-media').upload(path, file, { contentType: file.type, upsert:false })
  if (error) throw error
  return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
}
export async function listApplications() {
  const { data, error } = await supabase.from('applications').select('*,opening:application_openings(title,area)').order('created_at', { ascending:false })
  if (error) throw error
  return data || []
}

export async function resolveSiteMediaUrl(value) {
  if (!value) return ''
  let url
  try { url = new URL(value, window.location.origin) } catch { return '' }
  if (!['http:', 'https:'].includes(url.protocol)) return ''
  const base = new URL(import.meta.env.VITE_SUPABASE_URL)
  const prefix='/storage/v1/object/public/site-media/'
  if(url.origin!==base.origin||!url.pathname.startsWith(prefix)) return url.href
  const path=decodeURIComponent(url.pathname.slice(prefix.length))
  const {data,error}=await supabase.storage.from('site-media').createSignedUrl(path,3600)
  if(error) throw error
  return data.signedUrl
}
