import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOpeningPayload, loadManagerContent } from '../src/lib/openingForms.js'

const valid = { title: '  Plantel CS2  ', area: '  Counter-Strike 2 ', description: ' Datos ', google_form_url: ' https://FORMS.GLE/QAForm123 ', is_open: true, closes_on: '', questions: ['Pregunta anterior'] }

test('opening payload trims user input and preserves legacy questions without sending read-only metadata', () => {
  const before = structuredClone(valid)
  assert.deepEqual(buildOpeningPayload({ ...valid, id: 'opening-id', created_at: 'read-only', unexpected_column: 'discard' }), {
    id: 'opening-id', title: 'Plantel CS2', area: 'Counter-Strike 2', description: 'Datos',
    google_form_url: 'https://forms.gle/QAForm123', is_open: true, closes_on: null, questions: ['Pregunta anterior'],
  })
  assert.deepEqual(valid, before)
})

test('invalid names and editor URLs fail before saving, while closed legacy calls can omit a form', () => {
  for (const patch of [{ title: ' ' }, { title: 'a' }, { title: 'a'.repeat(141) }, { area: 'X' }, { area: ' ' }, { area: 'a'.repeat(101) }, { description: 'a'.repeat(5001) }]) {
    assert.throws(() => buildOpeningPayload({ ...valid, ...patch }))
  }
  assert.throws(() => buildOpeningPayload({ ...valid, google_form_url: 'https://docs.google.com/forms/d/QAForm123/edit' }), /edición/)
  assert.throws(() => buildOpeningPayload({ ...valid, google_form_url: '' }), /antes de abrir/)
  const closed = buildOpeningPayload({ ...valid, is_open: false, google_form_url: '', questions: null })
  assert.equal(closed.google_form_url, null)
  assert.deepEqual(closed.questions, [])
})

test('failure of historical responses does not hide or reject successfully loaded openings', async () => {
  const items = [{ id: 'opening-id', title: 'Convocatoria' }]
  const loaded = await loadManagerContent('applications', {
    listOpenings: async () => items,
    listApplications: async () => { throw new Error('Legacy endpoint failed') },
  })
  assert.equal(loaded.items, items)
  assert.deepEqual(loaded.responses, [])
  assert.match(loaded.historyError, /convocatorias se pueden editar/)
})

test('primary opening errors remain visible and tournaments do not depend on legacy applications', async () => {
  const error = new Error('Openings unavailable')
  await assert.rejects(loadManagerContent('applications', { listOpenings: async () => { throw error }, listApplications: async () => [] }), failure => failure === error)
  const loaded = await loadManagerContent('tournaments', {
    listTournaments: async () => [{ id: 'tournament' }],
    listApplications: async () => { throw new Error('Must not run') },
  })
  assert.deepEqual(loaded, { items: [{ id: 'tournament' }], responses: [], historyError: '' })
})
