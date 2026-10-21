const privateRoutes = ['/admin', '/account', '/login', '/register', '/forgot-password', '/update-password', '/suspended']
export function publicAnalyticsPage(href) {
  let url
  try { url = new URL(href) } catch { return null }
  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null
  const path = url.pathname.replace(/\/+$/, '') || '/'
  if (privateRoutes.some(route => path === route || path.startsWith(`${route}/`))) return null
  return { page_path: path, page_location: `${url.origin}${path}` }
}
export function publicReferrer(href) {
  try { const url = new URL(href); return `${url.origin}${url.pathname}` } catch { return '' }
}
