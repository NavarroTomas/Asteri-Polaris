import test from 'node:test'
import assert from 'node:assert/strict'
import { filterCalendarMatches, matchRosterKey, matchRosterLabel, rosterOptions, UNASSIGNED_ROSTER } from '../src/lib/matchRosters.js'

const matches = [
  { id: 'main-cup', rosterId: 'main', rosterLabel: 'Principal', filter: { id: 'cup' } },
  { id: 'academy-cup', rosterId: 'academy', rosterLabel: 'Academia', filter: { id: 'cup' } },
  { id: 'main-friendly', rosterId: 'main', rosterLabel: 'Principal', filter: null },
  { id: 'legacy', rosterId: null, rosterLabel: '', filter: { id: 'league' } },
  { id: 'event', isEvent: true, tournamentId: 'cup-id', filter: { id: 'cup' } },
]

test('category and roster filters compose without mixing teams or altering the source list', () => {
  const before = structuredClone(matches)
  assert.deepEqual(filterCalendarMatches(matches, 'cup', 'main').map(row => row.id), ['main-cup'])
  assert.deepEqual(filterCalendarMatches(matches, 'none', 'main').map(row => row.id), ['main-friendly'])
  assert.deepEqual(filterCalendarMatches(matches, 'all', 'academy').map(row => row.id), ['academy-cup'])
  assert.deepEqual(filterCalendarMatches(matches, 'all', 'none').map(row => row.id), ['legacy'])
  assert.deepEqual(filterCalendarMatches(matches, 'cup', 'all').map(row => row.id), ['main-cup', 'academy-cup', 'event'])
  assert.deepEqual(filterCalendarMatches(matches).map(row => row.id), matches.map(row => row.id))
  assert.deepEqual(matches, before)
})

test('events do not invent a roster and historic unassigned matches stay explicit', () => {
  assert.equal(matchRosterKey(matches[4]), 'event')
  assert.equal(matchRosterKey(matches[3]), 'none')
  assert.equal(matchRosterLabel(matches[3]), UNASSIGNED_ROSTER)
  assert.equal(matchRosterLabel({ rosterId: 'archived', rosterLabel: 'Nombre al jugar' }), 'Nombre al jugar')
})

test('roster options are unique by ID, include legacy matches and exclude tournament-only events', () => {
  assert.deepEqual(rosterOptions(matches), [
    { id: 'academy', name: 'Academia' },
    { id: 'none', name: UNASSIGNED_ROSTER },
    { id: 'main', name: 'Principal' },
  ])
  assert.deepEqual(rosterOptions([{ isEvent: true }]), [])
})
