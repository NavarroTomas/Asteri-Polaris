import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer, parseSync } from 'vite'
import react from '@vitejs/plugin-react'

function astNodes(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found
  if (predicate(node)) found.push(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => astNodes(child, predicate, found))
    else if (value && typeof value === 'object') astNodes(value, predicate, found)
  }
  return found
}

test('the map formation editor belongs to the match save form, independently of calendar filters', async () => {
  const source = await readFile(new URL('../src/pages/VodAdminPage.jsx', import.meta.url), 'utf8')
  const parsed = parseSync('VodAdminPage.jsx', source, { lang: 'jsx' })
  assert.equal(parsed.errors.length, 0)
  const editor = node => node.type === 'JSXElement' && node.openingElement.name.name === 'MapLineupEditor'
  const forms = astNodes(parsed.program, node => node.type === 'JSXElement' && node.openingElement.name.name === 'form')
  const handler = form => form.openingElement.attributes.find(attribute => attribute.name?.name === 'onSubmit')?.value?.expression?.name
  const matchForm = forms.find(form => handler(form) === 'submit')
  assert.ok(matchForm, 'match editor form exists')
  assert.equal(astNodes(parsed.program, editor).length, 1)
  assert.equal(astNodes(matchForm, editor).length, 1)
  for (const form of forms.filter(form => handler(form) !== 'submit')) assert.equal(astNodes(form, editor).length, 0)
})

function buttons(element, found = []) {
  if (!element || typeof element !== 'object') return found
  if (element.type === 'button') found.push(element)
  const children = element.props?.children
  if (Array.isArray(children)) children.flat(Infinity).forEach(child => buttons(child, found))
  else buttons(children, found)
  return found
}

test('map formation controls render and change the selected map without touching the others', async t => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, envDir: false, cacheDir: 'node_modules/.vite-qa-map-lineup', logLevel: 'error',
    plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
  })
  try {
    const { default: Editor } = await server.ssrLoadModule('/src/components/MapLineupEditor.jsx')
    const players = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + (i + 1), nickname: 'Player ' + (i + 1) }))
    const maps = [{ map_name: 'mirage', player_ids: ['p1'] }, { map_name: 'nuke', player_ids: ['p2'] }]
    const props = { maps, players, baseLineup: ['p1', 'p2'], disabled: false, onChange: () => {}, onError: () => {} }
    await t.test('each map has its own selected players and loading locks all map fields', () => {
      const html = renderToStaticMarkup(createElement(Editor, props))
      const fields = [...html.matchAll(/<fieldset[^>]*>([\s\S]*?)<\/fieldset>/g)].map(match => match[1])
      assert.equal(fields.length, 2)
      assert.match(fields[0], /<legend>Mirage<\/legend>/)
      assert.match(fields[1], /<legend>Nuke<\/legend>/)
      assert.match(fields[0], /aria-pressed="true"[^>]*>Player 1<\/button>/)
      assert.match(fields[0], /aria-pressed="false"[^>]*>Player 2<\/button>/)
      assert.match(fields[1], /aria-pressed="true"[^>]*>Player 2<\/button>/)
      const locked = renderToStaticMarkup(createElement(Editor, { ...props, disabled: true }))
      assert.equal((locked.match(/<fieldset disabled=""/g) || []).length, 2)
      assert.match(locked, /<button[^>]*disabled=""[^>]*>Aplicar formación base/)
    })
    await t.test('toggling one map preserves other formations and input data', () => {
      let changed
      const before = structuredClone(maps)
      const controls = buttons(Editor({ ...props, onChange: value => { changed = value } }))
      controls.find(control => control.props.children === 'Player 2').props.onClick()
      assert.deepEqual(changed[0].player_ids, ['p1', 'p2'])
      assert.deepEqual(changed[1].player_ids, ['p2'])
      assert.deepEqual(maps, before)
    })
    await t.test('a sixth player is rejected without changing the lineup', () => {
      let changed = false
      let error = ''
      const controls = buttons(Editor({ ...props, maps: [{ map_name: 'mirage', player_ids: players.slice(0, 5).map(player => player.id) }], onChange: () => { changed = true }, onError: message => { error = message } }))
      controls.find(control => control.props.children === 'Player 6').props.onClick()
      assert.equal(changed, false)
      assert.match(error, /cinco/)
    })
    await t.test('applying a base creates independent formations for each map', () => {
      let changed
      const controls = buttons(Editor({ ...props, onChange: value => { changed = value } }))
      controls[0].props.onClick()
      assert.deepEqual(changed.map(map => map.player_ids), [['p1', 'p2'], ['p1', 'p2']])
      assert.notEqual(changed[0].player_ids, changed[1].player_ids)
    })
  } finally { await server.close() }
})
