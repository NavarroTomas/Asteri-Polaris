export function getVodDownloadHref(value) {
  const url = String(value || '').trim()

  if (!url) return ''

  try {
    const parsed = new URL(url)

    if (
      parsed.hostname === 'drive.google.com' ||
      parsed.hostname.endsWith('.drive.google.com')
    ) {
      const pathMatch =
        parsed.pathname.match(/\/file\/d\/([^/]+)/)

      const id =
        pathMatch?.[1] ||
        parsed.searchParams.get('id')

      if (id) {
        return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`
      }
    }
  } catch {
    return url
  }

  return url
}
