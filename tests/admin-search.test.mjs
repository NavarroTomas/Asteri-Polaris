import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSearch, matchesPersonSearch } from '../src/lib/adminSearch.js'

test('person search ignores case and accents and accepts partial names', () => {
  assert.equal(normalizeSearch('  TOMÁS  '), 'tomas')
  assert.equal(matchesPersonSearch({ display_name: 'Tomás Navarro' }, 'tomas'), true)
  assert.equal(matchesPersonSearch({ nickname: 'Náchó' }, 'NACH'), true)
  assert.equal(matchesPersonSearch({ real_name: 'Facundo García' }, 'garcia'), true)
})

test('person search includes email and handles blank fields and empty queries', () => {
  assert.equal(matchesPersonSearch({ email: 'Hincha@Example.com' }, 'hincha@'), true)
  assert.equal(matchesPersonSearch({ display_name: null, nickname: undefined }, ''), true)
  assert.equal(matchesPersonSearch({ display_name: 'Tomás' }, 'ausente'), false)
})

test('all search terms must match even when the name order changes', () => {
  const person = { display_name: 'Tomás Navarro', email: 'tomas@example.com' }
  assert.equal(matchesPersonSearch(person, '  NAVARRO   tomas  '), true)
  assert.equal(matchesPersonSearch(person, 'navarro ausente'), false)
  assert.equal(matchesPersonSearch(null, 'nombre'), false)
})
