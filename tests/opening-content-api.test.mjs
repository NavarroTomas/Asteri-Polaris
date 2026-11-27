import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

test('saving openings sends clean data, distinguishes updates and rejects invalid input before any API call', async t => {
  const previous = globalThis.__asteriQaOpeningDb
  const calls = []
  const id = '11111111-1111-4111-8111-111111111111'
  let row = null
  let error = null
  globalThis.__asteriQaOpeningDb = { from(table) {
    assert.equal(table, 'application_openings')
    const call = { table, operation: '', payload: null, id: null }
    calls.push(call)
    const query = {
      insert(payload) { call.operation = 'insert'; call.payload = payload; return query },
      update(payload) { call.operation = 'update'; call.payload = payload; return query },
      eq(key, value) { assert.equal(key, 'id'); call.id = value; return query },
      select() { return query },
      async single() { if (error) return { data: null, error }; row = { ...(row || {}), ...call.payload, id }; return { data: row, error: null } },
    }
    return query
  } }
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, envDir: false,
    cacheDir: 'node_modules/.vite-qa-opening-api', logLevel: 'error',
    plugins: [{ name: 'qa-opening-api-without-network', enforce: 'pre',
      resolveId(source) { if (source.endsWith('/supabase')) return '\0qa-opening-db' },
      load(id) { if (id === '\0qa-opening-db') return 'export const supabase=globalThis.__asteriQaOpeningDb' },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
  })
  try {
    const { saveContent } = await server.ssrLoadModule('/src/lib/contentAdmin.js')
    const form = { title: ' QA opening ', area: ' CS2 ', description: ' QA text ', google_form_url: ' https://FORMS.GLE/QAForm123 ', is_open: true, questions: ['Old question'], created_at: 'read-only', unexpected_column: 'discard' }
    await t.test('create and update preserve legacy questions and omit read-only or unrelated fields', async () => {
      const saved = await saveContent('application_openings', form)
      assert.equal(saved.id, id)
      assert.equal(saved.title, 'QA opening')
      assert.equal(saved.google_form_url, 'https://forms.gle/QAForm123')
      assert.equal(calls[0].operation, 'insert')
      assert.equal('created_at' in calls[0].payload, false)
      assert.equal('unexpected_column' in calls[0].payload, false)
      const updated = await saveContent('application_openings', { ...saved, title: ' Updated ', is_open: false })
      assert.equal(updated.title, 'Updated')
      assert.equal(updated.is_open, false)
      assert.deepEqual(updated.questions, ['Old question'])
      assert.equal(calls[1].operation, 'update')
      assert.equal(calls[1].id, id)
      assert.equal('id' in calls[1].payload, false)
    })
    await t.test('one-character areas and Google editor URLs fail without issuing a database request', async () => {
      const before = calls.length
      await assert.rejects(saveContent('application_openings', { ...form, area: 'X' }), /área/)
      await assert.rejects(saveContent('application_openings', { ...form, google_form_url: 'https://docs.google.com/forms/d/QA/edit' }), /edición/)
      assert.equal(calls.length, before)
    })
    await t.test('permission and constraint failures produce actionable messages', async () => {
      error = { code: '42501', message: 'Raw RLS error' }
      await assert.rejects(saveContent('application_openings', form), /administradora activa/)
      error = { code: '23514', message: 'Raw constraint error' }
      await assert.rejects(saveContent('application_openings', form), /título, el juego o área/)
      error = null
    })
  } finally {
    await server.close()
    if (previous === undefined) delete globalThis.__asteriQaOpeningDb
    else globalThis.__asteriQaOpeningDb = previous
  }
})
