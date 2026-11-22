import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

test('individual tournament content escapes text and restricts public tournament lookup', async t => {
  const publicId = '11111111-1111-4111-8111-111111111111'
  const draftId = '22222222-2222-4222-8222-222222222222'
  const records = [{ id: publicId, is_published: true }, { id: draftId, is_published: false }]
  let queries = 0
  const previous = globalThis.__asteriQATournamentDb
  globalThis.__asteriQATournamentDb = { from(table) {
    assert.equal(table, 'tournaments')
    queries++
    const filters = []
    const query = { select() { return query }, eq(key, value) { filters.push([key, value]); return query }, async maybeSingle() {
      return { data: records.find(row => filters.every(([key, value]) => row[key] === value)) || null, error: null }
    } }
    return query
  } }
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, envDir: false,
    cacheDir: 'node_modules/.vite-qa-tournament-page', logLevel: 'error',
    plugins: [{ name: 'qa-supabase-without-network', enforce: 'pre',
      resolveId(source) { if (source.endsWith('/supabase')) return '\0qa-supabase' },
      load(id) { if (id === '\0qa-supabase') return 'export const supabase = globalThis.__asteriQATournamentDb' },
    }, react()],
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
  })
  try {
    const { TournamentContent } = await server.ssrLoadModule('/src/pages/TournamentPage.jsx')
    const { getPublishedTournament } = await server.ssrLoadModule('/src/lib/contentAdmin.js')
    const item = { id: publicId, game: 'Counter-Strike 2', starts_on: '2026-11-22', ends_on: '2026-11-23', format: 'BO3', location: 'Online', description: 'Información pública', page_body: 'Primer párrafo\n\n<script>alert("QA")</script>', external_url: 'https://example.invalid/official', rules_url: 'https://example.invalid/rules' }
    const match = { id: 'match-1', tournamentId: publicId, vod: '/vods/qa-match', date: '22/11', time: '18:00', opponent: 'QA rival', score: '2 — 0' }
    const render = props => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TournamentContent, { item, ...props })))
    await t.test('body is plain text, metadata is shown, and only the tournament matches are linked', () => {
      const html = render({ matches: [match, { ...match, id: 'other', tournamentId: draftId, vod: '/vods/other' }, { ...match, id: 'event', isEvent: true, vod: '/torneos/event' }] })
      assert.match(html, /BO3/)
      assert.match(html, /Online/)
      assert.match(html, /Primer párrafo/)
      assert.match(html, /&lt;script&gt;/)
      assert.doesNotMatch(html, /<script>/)
      assert.match(html, /href="\/vods\/qa-match"/)
      assert.doesNotMatch(html, /href="\/vods\/other"|href="\/torneos\/event"/)
      assert.match(html, /rel="noopener noreferrer"/)
    })
    await t.test('unsafe official and rule links are omitted', () => {
      const html = render({ item: { ...item, rules_url: 'javascript:alert(1)', external_url: 'https://user:secret@example.invalid/private' } })
      assert.doesNotMatch(html, /javascript:|user:secret|Sitio oficial|Reglamento/)
    })
    await t.test('the match area distinguishes loading errors and empty schedules', () => {
      assert.match(render({ matchStatus: 'loading' }), /Cargando contenido/)
      assert.match(render({ matchStatus: 'error' }), /No pudimos cargar el contenido/)
      assert.match(render({ matches: [] }), /Los partidos se anunciarán próximamente/)
    })
    await t.test('published lookup hides draft and missing records and rejects malformed IDs before querying', async () => {
      assert.equal((await getPublishedTournament(publicId)).id, publicId)
      assert.equal(await getPublishedTournament(draftId), null)
      assert.equal(await getPublishedTournament('33333333-3333-4333-8333-333333333333'), null)
      const before = queries
      assert.equal(await getPublishedTournament('not-a-uuid'), null)
      assert.equal(queries, before)
    })
  } finally {
    await server.close()
    if (previous === undefined) delete globalThis.__asteriQATournamentDb
    else globalThis.__asteriQATournamentDb = previous
  }
})
