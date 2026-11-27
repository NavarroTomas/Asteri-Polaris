import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

function findButtons(node, result = []) {
  if (!node || typeof node !== 'object') return result
  if (node.type === 'button') result.push(node)
  const children = node.props?.children
  for (const child of (Array.isArray(children) ? children.flat(Infinity) : [children])) findButtons(child, result)
  return result
}

test('the owner can open Solicitudes and render pending users without a reference error', async t => {
  const previous = globalThis.__asteriQaPending
  const owner = { id: '11111111-1111-4111-8111-111111111111', display_name: 'QA owner', role: 'owner', status: 'active' }
  const fixture = { profile: owner, isOwner: true, target: '', snapshot: { profiles: [{ id: '22222222-2222-4222-8222-222222222222', display_name: 'QA pending fan', email: 'qa-pending@example.invalid', role: 'fan', status: 'pending', owner_approved_at: null, created_at: '2026-11-27T12:00:00Z' }], players: [], vods: [], clips: [], logs: [] } }
  globalThis.__asteriQaPending = fixture
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, envDir: false,
    cacheDir: 'node_modules/.vite-qa-admin-pending', logLevel: 'error',
    plugins: [{ name: 'qa-pending-loaded-state-without-network', enforce: 'pre',
      resolveId(source, importer = '') {
        if (source === 'virtual:qa-pending-react') return '\0qa-pending-react'
        if (source === 'virtual:qa-pending-navigation') return '\0qa-pending-navigation'
        if (source.endsWith('/context/AuthContext')) return '\0qa-pending-auth'
        if (source.endsWith('/supabase')) return '\0qa-pending-db'
      },
      transform(source, id) {
        if (id.endsWith('/src/pages/AdminPage.jsx')) return source.replace("from 'react'", "from 'virtual:qa-pending-react'")
        if (id.endsWith('/src/components/AdminSectionNav.jsx')) return source.replace("from 'react-router-dom'", "from 'virtual:qa-pending-navigation'")
      },
      load(id) {
        if (id === '\0qa-pending-react') return `export * from 'react'; export {default} from 'react'; import {useState as actualState} from 'react';
          export function useState(initial){
            const snapshot=initial&&typeof initial==='object'&&Array.isArray(initial.profiles)&&Array.isArray(initial.players);
            return actualState(snapshot?globalThis.__asteriQaPending.snapshot:initial===true?false:initial);
          }`
        if (id === '\0qa-pending-navigation') return `export * from 'react-router-dom'; export const useNavigate=()=>target=>{globalThis.__asteriQaPending.target=target}`
        if (id === '\0qa-pending-auth') return `export const useAuth=()=>({...globalThis.__asteriQaPending,signOut:async()=>{}})`
        if (id === '\0qa-pending-db') return 'export const supabase={}'
      },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
  })
  try {
    const { default: AdminPage } = await server.ssrLoadModule('/src/pages/AdminPage.jsx')
    const { default: Nav } = await server.ssrLoadModule('/src/components/AdminSectionNav.jsx')
    const render = path => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(AdminPage)))
    await t.test('the real navigation callback opens a page with approval, rejection and deletion controls', () => {
      const requests = findButtons(Nav({ activeSection: 'users', isOwner: true })).find(button => button.props.children === 'Solicitudes')
      assert.ok(requests)
      requests.props.onClick()
      assert.equal(fixture.target, '/admin?section=pending')
      const html = render(fixture.target)
      assert.match(html, /<h1>Solicitudes<\/h1>/)
      assert.match(html, /QA pending fan/)
      assert.match(html, /Aprobar como hincha/)
      assert.match(html, /Rechazar/)
      assert.match(html, /Eliminar cuenta/)
    })
    await t.test('an empty queue renders its empty state and a non-owner cannot view this section', () => {
      fixture.snapshot = { ...fixture.snapshot, profiles: [] }
      assert.match(render('/admin?section=pending'), /No hay usuarios pendientes/)
      fixture.isOwner = false
      fixture.profile = { ...owner, role: 'admin' }
      const html = render('/admin?section=pending')
      assert.doesNotMatch(html, /Usuarios pendientes|Aprobar como hincha/)
      assert.match(html, /Administración/)
    })
  } finally {
    await server.close()
    if (previous === undefined) delete globalThis.__asteriQaPending
    else globalThis.__asteriQaPending = previous
  }
})
