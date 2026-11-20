import test from 'node:test'
import assert from 'node:assert/strict'
import { getLegacyCompetitions } from '../src/lib/tournamentHistory.js'

test('historical unlinked competitions remain visible without duplicating new tournament cards', () => {
  const matches = [
    { id: 'historical', competition: 'ESEA League', status: 'JUGADO', dateISO: '2026-10-01', time: '20:00' },
    { id: 'linked', competition: 'ESEA League', tournamentId: 'tournament-id', status: 'JUGADO', dateISO: '2026-11-01' },
    { id: 'event', competition: 'Counter-Strike 2', isEvent: true, dateISO: '2026-11-01' },
    { id: 'cancelled', competition: 'Cancelled cup', status: 'CANCELADO', dateISO: '2026-10-02' },
  ]
  const groups = getLegacyCompetitions(matches)
  assert.deepEqual(groups.map(group => group.name), ['ESEA League'])
  assert.deepEqual(groups[0].games.map(match => match.id), ['historical'])
})

test('competition names are grouped across accents, case and spacing and results stay newest first', () => {
  const matches = [
    { id: 'early', competition: '  Torneo Regional  ', dateISO: '2026-10-01', time: '14:00' },
    { id: 'other', competition: 'Circuito Nacional', dateISO: '2026-10-15', time: '18:00' },
    { id: 'latest', competition: 'TORNEO   REGIONÁL', dateISO: '2026-11-01', time: '22:00' },
    { id: 'same-day', competition: 'torneo regional', dateISO: '2026-11-01', time: '16:00' },
  ]
  const before = structuredClone(matches)
  const groups = getLegacyCompetitions(matches)
  assert.equal(groups.length, 2)
  assert.deepEqual(groups[0].games.map(match => match.id), ['latest', 'same-day', 'early'])
  assert.equal(groups[1].name, 'Circuito Nacional')
  assert.deepEqual(matches, before)
})

test('friendlies, practice and generic match names do not become historical tournaments', () => {
  assert.deepEqual(getLegacyCompetitions(['Amistoso', 'Scrim', 'Partido', 'MATCH', '', null].map((competition, i) => ({ id: String(i), competition }))), [])
  assert.deepEqual(getLegacyCompetitions([]), [])
})
