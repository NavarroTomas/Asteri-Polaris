import { supabase } from './supabase'

export function slugifyPlayer(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function nullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  return number
}

function nullableInteger(value) {
  const number = nullableNumber(value)

  if (number === null) return null

  return Math.trunc(number)
}

function cleanText(value) {
  const text = String(value ?? '').trim()
  return text || null
}

export async function getRosterAdminData() {
  const [
    playersResult,
    statsResult,
    configsResult,
    profilesResult,
  ] = await Promise.all([
    supabase
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
        sort_order,
        created_at,
        updated_at
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),

    supabase
      .from('player_stats')
      .select('*'),

    supabase
      .from('player_configs')
      .select('*'),

    supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        role,
        status
      `),
  ])

  const results = [
    playersResult,
    statsResult,
    configsResult,
    profilesResult,
  ]

  const firstError =
    results.find((result) => result.error)?.error

  if (firstError) throw firstError

  const statsByPlayer = new Map(
    (statsResult.data ?? []).map((row) => [
      row.player_id,
      row,
    ]),
  )

  const configsByPlayer = new Map(
    (configsResult.data ?? []).map((row) => [
      row.player_id,
      row,
    ]),
  )

  const profilesById = new Map(
    (profilesResult.data ?? []).map((row) => [
      row.id,
      row,
    ]),
  )

  return (playersResult.data ?? []).map((player) => ({
    ...player,
    stats: statsByPlayer.get(player.id) ?? null,
    config: configsByPlayer.get(player.id) ?? null,
    linked_profile: player.user_id
      ? profilesById.get(player.user_id) ?? null
      : null,
  }))
}

export async function createRosterPlayer(values) {
  const corePayload = {
    slug: slugifyPlayer(values.slug || values.nickname),
    nickname: String(values.nickname || '').trim(),
    real_name: cleanText(values.real_name),
    player_role: cleanText(values.player_role),
    country_code:
      String(values.country_code || 'AR')
        .trim()
        .toUpperCase() || 'AR',
    jersey_number: cleanText(values.jersey_number),
    biography:
      String(values.biography || '').trim() ||
      'Historia jugador.',
    image_url: cleanText(values.image_url),
    instagram_url: cleanText(values.instagram_url),
    twitch_url: cleanText(values.twitch_url),
    youtube_url: cleanText(values.youtube_url),
    steam_url: cleanText(values.steam_url),
    faceit_url: cleanText(values.faceit_url),
    is_active:
      values.is_active === undefined
        ? true
        : Boolean(values.is_active),
    sort_order:
      nullableInteger(values.sort_order) ?? 0,
  }

  if (!corePayload.nickname) {
    throw new Error('El jugador necesita un nickname.')
  }

  if (!corePayload.slug) {
    throw new Error('El jugador necesita un slug.')
  }

  const { data: player, error: playerError } =
    await supabase
      .from('players')
      .insert(corePayload)
      .select()
      .single()

  if (playerError) throw playerError

  try {
    const [
      statsResult,
      configResult,
    ] = await Promise.all([
      supabase
        .from('player_stats')
        .insert({
          player_id: player.id,
        }),

      supabase
        .from('player_configs')
        .insert({
          player_id: player.id,
        }),
    ])

    if (statsResult.error) {
      throw statsResult.error
    }

    if (configResult.error) {
      throw configResult.error
    }
  } catch (error) {
    await supabase
      .from('players')
      .delete()
      .eq('id', player.id)

    throw error
  }

  return player
}

export async function saveRosterPlayer(
  playerId,
  values,
) {
  const playerPayload = {
    slug: slugifyPlayer(values.slug),
    nickname: String(values.nickname || '').trim(),
    real_name: cleanText(values.real_name),
    player_role: cleanText(values.player_role),
    country_code:
      String(values.country_code || 'AR')
        .trim()
        .toUpperCase() || 'AR',
    jersey_number: cleanText(values.jersey_number),
    biography:
      String(values.biography || '').trim() ||
      'Historia jugador.',
    image_url: cleanText(values.image_url),
    instagram_url: cleanText(values.instagram_url),
    twitch_url: cleanText(values.twitch_url),
    youtube_url: cleanText(values.youtube_url),
    steam_url: cleanText(values.steam_url),
    faceit_url: cleanText(values.faceit_url),
    is_active: Boolean(values.is_active),
    sort_order:
      nullableInteger(values.sort_order) ?? 0,
  }

  if (!playerPayload.nickname) {
    throw new Error('El jugador necesita un nickname.')
  }

  if (!playerPayload.slug) {
    throw new Error('El jugador necesita un slug.')
  }

  const statsPayload = {
    player_id: playerId,
    rating: nullableNumber(values.stats?.rating),
    kd: nullableNumber(values.stats?.kd),
    hs_percentage:
      nullableNumber(values.stats?.hs_percentage),
    maps: nullableInteger(values.stats?.maps),
    adr: nullableNumber(values.stats?.adr),
    kast: nullableNumber(values.stats?.kast),
    impact: nullableNumber(values.stats?.impact),
    kills: nullableInteger(values.stats?.kills),
    deaths: nullableInteger(values.stats?.deaths),
    assists: nullableInteger(values.stats?.assists),
    opening_kills:
      nullableInteger(values.stats?.opening_kills),
    clutches:
      nullableInteger(values.stats?.clutches),
  }

  const configPayload = {
    player_id: playerId,
    dpi: nullableInteger(values.config?.dpi),
    sensitivity:
      nullableNumber(values.config?.sensitivity),
    zoom_sensitivity:
      nullableNumber(
        values.config?.zoom_sensitivity,
      ),
    edpi: nullableNumber(values.config?.edpi),
    polling_rate:
      nullableInteger(values.config?.polling_rate),
    resolution:
      cleanText(values.config?.resolution),
    aspect_ratio:
      cleanText(values.config?.aspect_ratio),
    display_mode:
      cleanText(values.config?.display_mode),
    refresh_rate:
      nullableInteger(values.config?.refresh_rate),
    crosshair_code:
      cleanText(values.config?.crosshair_code),
    viewmodel_fov:
      nullableNumber(values.config?.viewmodel_fov),
    viewmodel_offset_x:
      nullableNumber(
        values.config?.viewmodel_offset_x,
      ),
    viewmodel_offset_y:
      nullableNumber(
        values.config?.viewmodel_offset_y,
      ),
    viewmodel_offset_z:
      nullableNumber(
        values.config?.viewmodel_offset_z,
      ),
    mouse: cleanText(values.config?.mouse),
    keyboard:
      cleanText(values.config?.keyboard),
    headset:
      cleanText(values.config?.headset),
    monitor:
      cleanText(values.config?.monitor),
    mousepad:
      cleanText(values.config?.mousepad),
    launch_options:
      cleanText(values.config?.launch_options),
  }

  const [
    playerResult,
    statsResult,
    configResult,
  ] = await Promise.all([
    supabase
      .from('players')
      .update(playerPayload)
      .eq('id', playerId)
      .select()
      .single(),

    supabase
      .from('player_stats')
      .upsert(statsPayload, {
        onConflict: 'player_id',
      }),

    supabase
      .from('player_configs')
      .upsert(configPayload, {
        onConflict: 'player_id',
      }),
  ])

  if (playerResult.error) {
    throw playerResult.error
  }

  if (statsResult.error) {
    throw statsResult.error
  }

  if (configResult.error) {
    throw configResult.error
  }

  return playerResult.data
}

function extractPlayerImagePath(url) {
  if (!url) return null

  const marker =
    '/storage/v1/object/public/player-images/'

  const index = url.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(
    url.slice(index + marker.length),
  )
}

export async function uploadRosterPlayerImage(
  playerId,
  file,
  previousUrl = null,
) {
  if (!file) {
    throw new Error('Elegí una imagen.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(
      'El archivo seleccionado no es una imagen.',
    )
  }

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'png'

  const path =
    `${playerId}/profile-${Date.now()}.${extension}`

  const { error: uploadError } =
    await supabase.storage
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

  const { data, error: updateError } =
    await supabase
      .from('players')
      .update({
        image_url: publicUrl,
      })
      .eq('id', playerId)
      .select()
      .single()

  if (updateError) {
    await supabase.storage
      .from('player-images')
      .remove([path])

    throw updateError
  }

  const previousPath =
    extractPlayerImagePath(previousUrl)

  if (
    previousPath &&
    previousPath !== path
  ) {
    const removal =
      await supabase.storage
        .from('player-images')
        .remove([previousPath])

    if (removal.error) {
      console.warn(
        'No se pudo eliminar la imagen anterior:',
        removal.error,
      )
    }
  }

  return data
}

export async function setRosterPlayerActive(
  playerId,
  active,
) {
  const { data, error } = await supabase
    .from('players')
    .update({
      is_active: Boolean(active),
    })
    .eq('id', playerId)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function swapRosterOrder(
  currentPlayer,
  otherPlayer,
) {
  if (!currentPlayer || !otherPlayer) {
    return
  }

  const currentOrder =
    Number(currentPlayer.sort_order) || 0

  const otherOrder =
    Number(otherPlayer.sort_order) || 0

  const first = await supabase
    .from('players')
    .update({
      sort_order: otherOrder,
    })
    .eq('id', currentPlayer.id)

  if (first.error) {
    throw first.error
  }

  const second = await supabase
    .from('players')
    .update({
      sort_order: currentOrder,
    })
    .eq('id', otherPlayer.id)

  if (second.error) {
    await supabase
      .from('players')
      .update({
        sort_order: currentOrder,
      })
      .eq('id', currentPlayer.id)

    throw second.error
  }
}

export async function unlinkRosterAccount(
  userId,
) {
  if (!userId) return

  const { error } = await supabase.rpc(
    'unlink_player_account',
    {
      target_user_id: userId,
    },
  )

  if (error) throw error
}
