import { mkdir, writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'

const mode = process.env.NODE_ENV || 'production'
const env = loadEnv(mode, process.cwd(), '')

const siteUrl = (
  process.env.VITE_SITE_URL ||
  env.VITE_SITE_URL ||
  'https://asteri-polaris.vercel.app'
).replace(/\/+$/, '')

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  env.VITE_SUPABASE_URL

const publishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY

const today = new Date().toISOString().slice(0, 10)

function xmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function encodePathSegment(value = '') {
  return encodeURIComponent(String(value))
}

async function supabasePublicQuery(path) {
  if (!supabaseUrl || !publishableKey) {
    return []
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    const message = await response.text()

    throw new Error(
      `Supabase sitemap query failed (${response.status}): ${message}`,
    )
  }

  return response.json()
}

const urls = [
  {
    loc: `${siteUrl}/`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '1.0',
  },
]

try {
  const [players, vods] = await Promise.all([
    supabasePublicQuery(
      'players?select=slug,updated_at&is_active=eq.true&order=sort_order.asc',
    ),
    supabasePublicQuery(
      'vods?select=slug,updated_at&is_published=eq.true&order=match_date.desc',
    ),
  ])

  for (const player of players) {
    if (!player?.slug) continue

    urls.push({
      loc: `${siteUrl}/players/${encodePathSegment(player.slug)}`,
      lastmod:
        player.updated_at?.slice?.(0, 10) ||
        today,
      changefreq: 'weekly',
      priority: '0.8',
    })
  }

  for (const vod of vods) {
    if (!vod?.slug) continue

    urls.push({
      loc: `${siteUrl}/vods/${encodePathSegment(vod.slug)}`,
      lastmod:
        vod.updated_at?.slice?.(0, 10) ||
        today,
      changefreq: 'monthly',
      priority: '0.7',
    })
  }
} catch (error) {
  console.warn(
    '[sitemap] No se pudo leer contenido dinámico. Se generará el sitemap base.',
  )
  console.warn(error.message)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${xmlEscape(changefreq)}</changefreq>
    <priority>${xmlEscape(priority)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

await mkdir('public', { recursive: true })
await writeFile('public/sitemap.xml', xml, 'utf8')

console.log(
  `[sitemap] ${urls.length} URL(s) -> public/sitemap.xml`,
)
