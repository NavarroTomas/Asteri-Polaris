import test from 'node:test'
import assert from 'node:assert/strict'
import { compareMatchesNewestFirst } from '../src/lib/matchOrdering.js'

test('results place the newest date and then latest time first', () => {
  const matches = [
    { id: 'older', dateISO: '2026-10-31', time: '23:30' },
    { id: 'early', dateISO: '2026-11-20', time: '14:00' },
    { id: 'late', dateISO: '2026-11-20', time: '20:15' },
    { id: 'next-month', dateISO: '2026-12-01', time: '09:00' },
  ]
  const originalOrder = matches.map(match => match.id)
  assert.deepEqual([...matches].sort(compareMatchesNewestFirst).map(match => match.id), ['next-month', 'late', 'early', 'older'])
  assert.deepEqual(matches.map(match => match.id), originalOrder)
})

test('results without dates are last and equal timestamps have a stable ID order', () => {
  const matches = [
    { id: 'unknown', dateISO: null, time: '22:00' },
    { id: 'b', dateISO: '2026-11-20', time: '15:00' },
    { id: 'empty', dateISO: '', time: '' },
    { id: 'a', dateISO: '2026-11-20', time: '15:00' },
  ]
  const sorted = [...matches].sort(compareMatchesNewestFirst)
  assert.deepEqual(sorted.slice(0, 2).map(match => match.id), ['a', 'b'])
  assert.deepEqual(new Set(sorted.slice(2).map(match => match.id)), new Set(['empty', 'unknown']))
  assert.equal(compareMatchesNewestFirst(matches[1], matches[1]), 0)
})

test('a known time precedes unknown times on the same date', () => {
  const matches = [
    { id: 'unknown', dateISO: '2026-11-20', time: '—' },
    { id: 'midnight', dateISO: '2026-11-20', time: '00:00' },
    { id: 'empty', dateISO: '2026-11-20', time: null },
  ]
  assert.equal([...matches].sort(compareMatchesNewestFirst)[0].id, 'midnight')
})
