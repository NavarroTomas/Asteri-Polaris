export function normalizeGoogleFormUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return ''
    const valid = url.hostname === 'docs.google.com' ? /^\/forms\/.+/.test(url.pathname) : url.hostname === 'forms.gle' && /^\/[^/]+/.test(url.pathname)
    return valid ? url.href : ''
  } catch { return '' }
}
export const isGoogleFormUrl = value => !!normalizeGoogleFormUrl(value)
export function availableOpenings(items, today) {
  return items.filter(item => item.is_open && (!item.closes_on || item.closes_on >= today) && isGoogleFormUrl(item.google_form_url))
}
