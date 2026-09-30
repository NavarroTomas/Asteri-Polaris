import { supabase } from './supabase'

export async function getMyPlayerData(userId) {
  if (!userId) {
    throw new Error('No hay un usuario autenticado.')
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select(`
      id,
      user_id,
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
    .eq('user_id', userId)
    .maybeSingle()

  if (playerError) throw playerError

  if (!player) {
    return {
      player: null,
      stats: null,
      config: null,
      clips: [],
    }
  }

  const [
    statsResult,
    configResult,
    clipsResult,
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
        player_id,
        title,
        description,
        round_number,
        timestamp_seconds,
        source_type,
        video_url,
        storage_path,
        is_published,
        created_at,
        updated_at
      `)
      .eq('player_id', player.id)
      .order('created_at', { ascending: false }),
  ])

  if (statsResult.error) throw statsResult.error
  if (configResult.error) throw configResult.error
  if (clipsResult.error) throw clipsResult.error

  return {
    player,
    stats: statsResult.data,
    config: configResult.data,
    clips: clipsResult.data ?? [],
  }
}

export async function updateMyPlayer(playerId, values) {
  const { data, error } = await supabase
    .from('players')
    .update(values)
    .eq('id', playerId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveMyStats(playerId, values) {
  const payload = {
    player_id: playerId,
    ...values,
  }

  const { data, error } = await supabase
    .from('player_stats')
    .upsert(payload, { onConflict: 'player_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveMyConfig(playerId, values) {
  const payload = {
    player_id: playerId,
    ...values,
  }

  const { data, error } = await supabase
    .from('player_configs')
    .upsert(payload, { onConflict: 'player_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadPlayerImage(playerId, file) {
  if (!file) throw new Error('Elegí una imagen.')

  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 5 MB.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp'
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'webp'
  const path = `${playerId}/profile-${Date.now()}.${safeExt}`

  const { error: uploadError } = await supabase.storage
    .from('player-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('player-images')
    .getPublicUrl(path)

  const { data: player, error: updateError } = await supabase
    .from('players')
    .update({ image_url: publicUrl })
    .eq('id', playerId)
    .select()
    .single()

  if (updateError) throw updateError

  return {
    path,
    publicUrl,
    player,
  }
}

export async function createExternalClip({
  playerId,
  userId,
  title,
  description,
  videoUrl,
  roundNumber,
  isPublished,
}) {
  if (!title.trim()) {
    throw new Error('El clip necesita un título.')
  }

  if (!videoUrl.trim()) {
    throw new Error('Ingresá una URL para el clip.')
  }

  const { data, error } = await supabase
    .from('clips')
    .insert({
      player_id: playerId,
      title: title.trim(),
      description: description.trim() || null,
      round_number: roundNumber ? Number(roundNumber) : null,
      source_type: 'external',
      video_url: videoUrl.trim(),
      is_published: Boolean(isPublished),
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadPlayerClip({
  playerId,
  userId,
  title,
  description,
  file,
  roundNumber,
  isPublished,
}) {
  if (!file) throw new Error('Elegí un archivo de video.')

  if (!file.type.startsWith('video/')) {
    throw new Error('El archivo debe ser un video.')
  }

  // Límite de interfaz. Supabase puede imponer además su propio límite.
  if (file.size > 250 * 1024 * 1024) {
    throw new Error('El clip no puede superar los 250 MB.')
  }

  if (!title.trim()) {
    throw new Error('El clip necesita un título.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'mp4'
  const path = `${playerId}/clip-${Date.now()}.${safeExt}`

  const { error: uploadError } = await supabase.storage
    .from('vod-clips')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage
    .from('vod-clips')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('clips')
    .insert({
      player_id: playerId,
      title: title.trim(),
      description: description.trim() || null,
      round_number: roundNumber ? Number(roundNumber) : null,
      source_type: 'upload',
      video_url: publicUrl,
      storage_path: path,
      is_published: Boolean(isPublished),
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage
      .from('vod-clips')
      .remove([path])

    throw error
  }

  return data
}

export async function deleteMyClip(clip) {
  if (clip.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('vod-clips')
      .remove([clip.storage_path])

    if (storageError) throw storageError
  }

  const { error } = await supabase
    .from('clips')
    .delete()
    .eq('id', clip.id)

  if (error) throw error
}
