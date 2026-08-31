import { supabase } from './supabase'

export const emptyVod = {
  slug: '', title: '', opponent: '', competition: '', match_date: '', match_time: '',
  map_name: '', score_asteri: '', score_opponent: '', status: 'upcoming',
  youtube_url: '', description: '', is_published: false,
}

export const slugifyVod = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export async function listVodsAndPlayers() {
  const [vods, players] = await Promise.all([
    supabase.from('vods').select('*').order('match_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('players').select('id,slug,nickname,player_role,is_active,sort_order').order('sort_order'),
  ])
  if (vods.error) throw vods.error
  if (players.error) throw players.error
  return { vods: vods.data || [], players: players.data || [] }
}

export async function getVodDetail(id) {
  const [vod, lineup, clips] = await Promise.all([
    supabase.from('vods').select('*').eq('id', id).single(),
    supabase.from('vod_players').select('*').eq('vod_id', id).order('lineup_order'),
    supabase.from('clips').select('*').eq('vod_id', id).order('created_at', { ascending: false }),
  ])
  if (vod.error) throw vod.error
  if (lineup.error) throw lineup.error
  if (clips.error) throw clips.error
  return { vod: vod.data, lineup: lineup.data || [], clips: clips.data || [] }
}

function numberOrNull(v) { return v === '' || v == null ? null : Number(v) }

export async function saveVod(id, form, userId) {
  const payload = {
    slug: form.slug || slugifyVod(`${form.opponent}-${form.match_date}`),
    title: form.title.trim(), opponent: form.opponent.trim(),
    competition: form.competition || null, match_date: form.match_date,
    match_time: form.match_time || null, map_name: form.map_name || null,
    score_asteri: numberOrNull(form.score_asteri), score_opponent: numberOrNull(form.score_opponent),
    status: form.status, youtube_url: form.youtube_url || null,
    description: form.description || null, is_published: !!form.is_published,
  }
  const query = id
    ? supabase.from('vods').update(payload).eq('id', id)
    : supabase.from('vods').insert({ ...payload, created_by: userId })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function saveLineup(vodId, playerIds) {
  const del = await supabase.from('vod_players').delete().eq('vod_id', vodId)
  if (del.error) throw del.error
  if (!playerIds.length) return
  const rows = playerIds.map((player_id, i) => ({ vod_id: vodId, player_id, lineup_order: i + 1 }))
  const ins = await supabase.from('vod_players').insert(rows)
  if (ins.error) throw ins.error
}

export async function addClip({ vodId, playerId, userId, form, file }) {
  let videoUrl = form.video_url || null, storagePath = null, sourceType = 'external'
  if (file) {
    if (!file.type.startsWith('video/')) throw new Error('El clip debe ser un video')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
    storagePath = `vods/${vodId}/clip-${Date.now()}.${ext.replace(/[^a-z0-9]/g,'')}`
    const up = await supabase.storage.from('vod-clips').upload(storagePath, file, { upsert: false })
    if (up.error) throw up.error
    videoUrl = supabase.storage.from('vod-clips').getPublicUrl(storagePath).data.publicUrl
    sourceType = 'upload'
  }
  if (!videoUrl) throw new Error('Ingresá una URL o subí un video')
  const q = await supabase.from('clips').insert({
    vod_id: vodId, player_id: playerId || null, title: form.title.trim(),
    description: form.description || null, round_number: numberOrNull(form.round_number),
    timestamp_seconds: numberOrNull(form.timestamp_seconds), source_type: sourceType,
    video_url: videoUrl, storage_path: storagePath, is_published: !!form.is_published,
    created_by: userId,
  }).select().single()
  if (q.error) { if (storagePath) await supabase.storage.from('vod-clips').remove([storagePath]); throw q.error }
  return q.data
}

export async function toggleClip(clip) {
  const q = await supabase.from('clips').update({ is_published: !clip.is_published }).eq('id', clip.id).select().single()
  if (q.error) throw q.error
  return q.data
}

export async function deleteClip(clip) {
  if (clip.storage_path) { const r = await supabase.storage.from('vod-clips').remove([clip.storage_path]); if (r.error) throw r.error }
  const q = await supabase.from('clips').delete().eq('id', clip.id)
  if (q.error) throw q.error
}

export async function deleteVod(vod) {
  const clips = await supabase.from('clips').select('storage_path').eq('vod_id', vod.id)
  if (clips.error) throw clips.error
  const paths = (clips.data || []).map(x => x.storage_path).filter(Boolean)
  if (paths.length) { const r = await supabase.storage.from('vod-clips').remove(paths); if (r.error) throw r.error }
  const q = await supabase.from('vods').delete().eq('id', vod.id)
  if (q.error) throw q.error
}

export async function getPublicVod(slug) {
  const vod = await supabase.from('vods').select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
  if (vod.error) throw vod.error
  if (!vod.data) return null
  const [lineup, clips] = await Promise.all([
    supabase.from('vod_players').select('*').eq('vod_id', vod.data.id).order('lineup_order'),
    supabase.from('clips').select('*').eq('vod_id', vod.data.id).eq('is_published', true).order('created_at'),
  ])
  if (lineup.error) throw lineup.error
  if (clips.error) throw clips.error
  const ids = [...new Set([...(lineup.data||[]).map(x=>x.player_id), ...(clips.data||[]).map(x=>x.player_id).filter(Boolean)])]
  let players=[]
  if (ids.length) {
    const p=await supabase.from('players').select('id,slug,nickname,player_role,jersey_number').in('id', ids)
    if (p.error) throw p.error
    players=p.data||[]
  }
  const byId=new Map(players.map(p=>[p.id,p]))
  return {
    vod: vod.data,
    lineup: (lineup.data||[]).map(x=>({...x,player:byId.get(x.player_id)||null})),
    clips: (clips.data||[]).map(x=>({...x,player:x.player_id?byId.get(x.player_id)||null:null})),
  }
}

