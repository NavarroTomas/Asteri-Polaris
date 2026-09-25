import { supabase } from './supabase'

export const DEFAULT_SITE_SETTINGS = {
  hero_video_url: '/media/hero.mp4',
  ga_measurement_id: '',
}

function normalize(row) {
  return {
    hero_video_url:
      row?.hero_video_url ||
      DEFAULT_SITE_SETTINGS.hero_video_url,
    ga_measurement_id:
      row?.ga_measurement_id ||
      DEFAULT_SITE_SETTINGS.ga_measurement_id,
  }
}

export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('hero_video_url, ga_measurement_id')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return normalize(data)
}

export async function updateHeroVideoUrl(value) {
  const heroVideoUrl =
    String(value || '').trim() ||
    DEFAULT_SITE_SETTINGS.hero_video_url

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      hero_video_url: heroVideoUrl,
    })
    .eq('id', 1)
    .select('hero_video_url, ga_measurement_id')
    .single()

  if (error) throw error
  return normalize(data)
}

export async function updateAnalyticsMeasurementId(value) {
  const id = String(value || '')
    .trim()
    .toUpperCase()

  if (id && !/^G-[A-Z0-9]+$/.test(id)) {
    throw new Error(
      'El Measurement ID debe tener formato G-XXXXXXXXXX.',
    )
  }

  const { data, error } = await supabase
    .from('site_settings')
    .update({
      ga_measurement_id: id || null,
    })
    .eq('id', 1)
    .select('hero_video_url, ga_measurement_id')
    .single()

  if (error) throw error
  return normalize(data)
}
