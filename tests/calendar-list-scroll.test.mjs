import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseSync } from 'vite'
import { scrollMatchListToDate } from '../src/lib/calendarListScroll.js'

function scrollFixture({ top = 100, border = 2, scrollTop = 120, height = 300, scrollHeight = 1000, rows = [{ date: '2026-11-27', offset: 350 }] } = {}) {
  const calls = []
  const selectors = []
  const list = {
    scrollTop, clientTop: border, clientHeight: height, scrollHeight,
    getBoundingClientRect: () => ({ top }),
    querySelector(selector) {
      selectors.push(selector)
      const date = selector.match(/^\[data-match-date="(\d{4}-\d{2}-\d{2})"\]$/)?.[1]
      const row = rows.find(row => row.date === date)
      return row ? {
        getBoundingClientRect: () => ({ top: top + border + row.offset - list.scrollTop }),
        scrollIntoView: () => { throw new Error('Scrolling a row could move the whole page') },
      } : null
    },
    scrollTo(options) { calls.push(options); list.scrollTop = options.top },
  }
  return { list, calls, selectors, rows }
}

test('day selection scrolls only the list to the first rendered match and accounts for its border', () => {
  const fixture = scrollFixture({ rows: [
    { date: '2026-11-28', offset: 0 },
    { date: '2026-11-27', offset: 350, id: 'latest-time' },
    { date: '2026-11-27', offset: 480, id: 'earlier-time' },
  ] })
  assert.equal(scrollMatchListToDate(fixture.list, '2026-11-27'), true)
  assert.deepEqual(fixture.calls, [{ top: 350, behavior: 'smooth' }])
})

test('relative geometry is independent of the page scroll position and preserves fractional offsets', () => {
  const fixture = scrollFixture({ top: -740.25, scrollTop: 203.5, rows: [{ date: '2026-11-27', offset: 430.75 }] })
  assert.equal(scrollMatchListToDate(fixture.list, '2026-11-27'), true)
  assert.equal(fixture.calls[0].top, 430.75)
})

test('targets are clamped to the list bounds, including lists without overflow', () => {
  for (const [options, expected] of [
    [{ rows: [{ date: '2026-11-27', offset: 950 }] }, 700],
    [{ rows: [{ date: '2026-11-27', offset: -20 }] }, 0],
    [{ height: 400, scrollHeight: 200 }, 0],
  ]) {
    const fixture = scrollFixture(options)
    assert.equal(scrollMatchListToDate(fixture.list, '2026-11-27'), true)
    assert.equal(fixture.calls[0].top, expected)
  }
})

test('repeated day selection measures current geometry again and honors reduced motion', () => {
  const fixture = scrollFixture()
  scrollMatchListToDate(fixture.list, '2026-11-27')
  scrollMatchListToDate(fixture.list, '2026-11-27')
  fixture.rows[0].offset = 450
  scrollMatchListToDate(fixture.list, '2026-11-27', { reducedMotion: true })
  assert.deepEqual(fixture.calls, [
    { top: 350, behavior: 'smooth' },
    { top: 350, behavior: 'smooth' },
    { top: 450, behavior: 'auto' },
  ])
})

test('absent dates and malformed targets leave the list untouched', () => {
  const fixture = scrollFixture()
  assert.equal(scrollMatchListToDate(null, '2026-11-27'), false)
  for (const value of ['', null, '2026-11', 'invalid', '2026-11-27"] button']) assert.equal(scrollMatchListToDate(fixture.list, value), false)
  assert.equal(fixture.selectors.length, 0)
  assert.equal(scrollMatchListToDate(fixture.list, '2026-11-26'), false)
  assert.equal(fixture.calls.length, 0)
})

function findNodes(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found
  if (predicate(node)) found.push(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => findNodes(child, predicate, found))
    else if (value && typeof value === 'object') findNodes(value, predicate, found)
  }
  return found
}

test('calendar wiring reserves internal scrolling for day selection and associates list rows with their dates', async () => {
  const source = await readFile(new URL('../src/components/MatchesHub.jsx', import.meta.url), 'utf8')
  const { program, errors } = parseSync('MatchesHub.jsx', source, { lang: 'jsx' })
  assert.equal(errors.length, 0)
  const scrollCall = node => node.type === 'CallExpression' && node.callee.name === 'scrollMatchListToDate'
  const day = findNodes(program, node => node.type === 'VariableDeclarator' && node.id.name === 'selectDay')[0]
  const row = findNodes(program, node => node.type === 'VariableDeclarator' && node.id.name === 'selectMatch')[0]
  assert.ok(day)
  assert.ok(row)
  assert.equal(findNodes(day, scrollCall).length, 1)
  assert.equal(findNodes(row, scrollCall).length, 0)
  assert.equal(findNodes(program, scrollCall).length, 1, 'no automatic initial page or list jump')
  const lists = findNodes(program, node => node.type === 'JSXOpeningElement' && node.attributes.some(attribute => attribute.name?.name === 'className' && attribute.value?.value === 'match-list'))
  assert.equal(lists.length, 1)
  assert.equal(lists[0].attributes.find(attribute => attribute.name?.name === 'ref')?.value?.expression?.name, 'matchList')
  const rowDate = findNodes(program, node => node.type === 'JSXAttribute' && node.name.name === 'data-match-date')
  assert.equal(rowDate.length, 1)
  assert.equal(rowDate[0].value.expression.property.name, 'dateISO')
})
