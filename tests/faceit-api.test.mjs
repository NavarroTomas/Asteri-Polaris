import test from 'node:test'
import assert from 'node:assert/strict'

const ENV_NAMES = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'FACEIT_API_KEY']
const USER_ID = '11111111-1111-4111-8111-111111111111'
const PLAYER_ID = '22222222-2222-4222-8222-222222222222'
const API_KEY = 'qa-faceit-secret-disposable'

test('FACEIT endpoint authorizes staff and contains failures without external requests', async t => {
  const originalEnv = Object.fromEntries(ENV_NAMES.map(name => [name, process.env[name]]))
  const originalFetch = globalThis.fetch
  const calls = []
  let profile = { role: 'owner', status: 'active' }
  let upstream = 'success'
  process.env.SUPABASE_URL = 'https://qa-supabase.invalid'
  process.env.SUPABASE_PUBLISHABLE_KEY = 'qa-publishable-key-disposable'
  delete process.env.VITE_SUPABASE_URL
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  delete process.env.FACEIT_API_KEY
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url)
    calls.push(url)
    if (url.origin === 'https://qa-supabase.invalid' && url.pathname === '/auth/v1/user') {
      return Response.json({ id: USER_ID, aud: 'authenticated', role: 'authenticated' })
    }
    if (url.origin === 'https://qa-supabase.invalid' && url.pathname === '/rest/v1/profiles') return Response.json(profile)
    if (url.origin === 'https://open.faceit.com') {
      assert.equal(new Headers(options.headers).get('authorization'), 'Bearer ' + API_KEY)
      if (upstream === 'http-error') return Response.json({ error: 'FACEIT ' + API_KEY }, { status: 500 })
      if (upstream === 'network-error') throw new Error('FACEIT transport error: ' + API_KEY)
      if (url.pathname === '/data/v4/players') return Response.json({ player_id: PLAYER_ID, nickname: 'QA-player', games: { cs2: { faceit_elo: 1500, skill_level: 7 } } })
      if (url.pathname === '/data/v4/players/' + PLAYER_ID + '/stats/cs2') return Response.json({ lifetime: { Matches: '20' } })
      throw new Error('Unexpected FACEIT path in isolated test')
    }
    throw new Error('Unexpected origin in isolated test')
  }
  const request = (query = '', auth = 'Bearer qa-session-disposable') => new Request('https://qa-asteri.invalid/api/faceit' + query, { headers: auth ? { authorization: auth } : {} })
  try {
    const { GET } = await import('../api/faceit.js')
    await t.test('missing authorization returns 401 before any request', async () => {
      calls.length = 0
      const response = await GET(request('?type=player&nickname=test', ''))
      assert.equal(response.status, 401)
      assert.equal(calls.length, 0)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
    })
    await t.test('active fans and suspended staff return 403', async () => {
      for (const denied of [{ role: 'fan', status: 'active' }, { role: 'owner', status: 'suspended' }]) {
        profile = denied
        calls.length = 0
        const response = await GET(request('?type=player&nickname=test'))
        assert.equal(response.status, 403)
        assert.ok(calls.every(url => url.origin === 'https://qa-supabase.invalid'))
      }
      profile = { role: 'owner', status: 'active' }
    })
    await t.test('staff without FACEIT key receive a controlled 503', async () => {
      calls.length = 0
      const response = await GET(request('?type=player&nickname=test'))
      assert.equal(response.status, 503)
      assert.ok(calls.every(url => url.origin === 'https://qa-supabase.invalid'))
    })
    process.env.FACEIT_API_KEY = API_KEY
    await t.test('invalid input and arbitrary URL parameters never reach FACEIT', async () => {
      for (const query of ['?type=player&nickname=https://untrusted.invalid/file', '?type=player&nickname=x', '?type=championship&id=https://untrusted.invalid', '?type=unknown&url=https://untrusted.invalid']) {
        calls.length = 0
        const response = await GET(request(query))
        assert.equal(response.status, 400)
        assert.ok(calls.every(url => url.origin === 'https://qa-supabase.invalid'))
      }
    })
    await t.test('valid request uses fixed FACEIT paths and does not return API credentials', async () => {
      calls.length = 0
      const response = await GET(request('?type=player&nickname=QA-player'))
      assert.equal(response.status, 200)
      const body = await response.text()
      assert.equal(body.includes(API_KEY), false)
      assert.equal(JSON.parse(body).elo, 1500)
      assert.deepEqual(calls.filter(url => url.origin === 'https://open.faceit.com').map(url => url.pathname), ['/data/v4/players', '/data/v4/players/' + PLAYER_ID + '/stats/cs2'])
    })
    await t.test('upstream error bodies and thrown errors never disclose the server key', async () => {
      for (const mode of ['http-error', 'network-error']) {
        upstream = mode
        const response = await GET(request('?type=player&nickname=QA-player'))
        assert.equal(response.status, 502)
        assert.equal((await response.text()).includes(API_KEY), false)
      }
    })
  } finally {
    globalThis.fetch = originalFetch
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})

test('SPA rewrites leave API function routes intact', async () => {
  const { readFile } = await import('node:fs/promises')
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  const spa = config.rewrites.filter(rule => rule.destination === '/index.html')
  assert.ok(spa.length > 0)
  for (const rule of spa) {
    const matches = new RegExp('^' + rule.source + '$')
    assert.equal(matches.test('/api/faceit'), false)
    assert.equal(matches.test('/api/another-endpoint'), false)
    assert.equal(matches.test('/players/qa-player'), true)
  }
})
