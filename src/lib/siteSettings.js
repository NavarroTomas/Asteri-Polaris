import { supabase } from './supabase'

export const DEFAULT_SITE_SETTINGS = {
  hero_video_url: '/media/hero.mp4',
}

export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('hero_video_url')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error

  return {
    hero_video_url:
      data?.hero_video_url ||
      DEFAULT_SITE_SETTINGS.hero_video_url,
  }
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
    .select('hero_video_url')
    .single()

  if (error) throw error

  return {
    hero_video_url:
      data?.hero_video_url ||
      DEFAULT_SITE_SETTINGS.hero_video_url,
  }
}
