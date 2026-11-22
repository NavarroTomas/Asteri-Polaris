import test from 'node:test'
import assert from 'node:assert/strict'
import { availableOpenings, isGoogleFormUrl, normalizeGoogleFormUrl } from '../src/lib/googleForms.js'

test('Google Forms links retain their form path and query while normalizing safe pasted URLs', () => {
  assert.equal(normalizeGoogleFormUrl('  https://FORMS.GLE/QAForm123  '), 'https://forms.gle/QAForm123')
  const direct = 'https://docs.google.com/forms/d/e/QAForm123/viewform?usp=pp_url&entry.123=QA#start'
  assert.equal(normalizeGoogleFormUrl(direct), direct)
  assert.equal(isGoogleFormUrl(direct), true)
})

test('lookalike domains, credentials, ports, unsafe protocols and non-form pages are rejected', () => {
  for (const value of [
    'http://forms.gle/QAForm123', 'javascript:alert(1)', '//forms.gle/QAForm123',
    'https://forms.gle.evil.invalid/QAForm123', 'https://docs.google.com.evil.invalid/forms/a',
    'https://evil.invalid/forms.gle/a', 'https://user:secret@docs.google.com/forms/a',
    'https://forms.gle:444/a', 'https://docs.google.com/document/d/a',
    'https://docs.google.com/forms/', 'https://forms.gle/', '', null, {},
  ]) {
    assert.equal(normalizeGoogleFormUrl(value), '')
    assert.equal(isGoogleFormUrl(value), false)
  }
})

test('only open, unexpired calls with a valid Google form appear publicly', () => {
  const valid = { is_open: true, google_form_url: 'https://forms.gle/QAForm123' }
  const items = [
    { ...valid, id: 'no-deadline', closes_on: null },
    { ...valid, id: 'today', closes_on: '2026-11-22' },
    { ...valid, id: 'future', closes_on: '2026-11-23' },
    { ...valid, id: 'expired', closes_on: '2026-11-21' },
    { ...valid, id: 'closed', is_open: false },
    { ...valid, id: 'legacy', google_form_url: null },
    { ...valid, id: 'invalid', google_form_url: 'https://example.invalid/forms/a' },
  ]
  const before = structuredClone(items)
  assert.deepEqual(availableOpenings(items, '2026-11-22').map(item => item.id), ['no-deadline', 'today', 'future'])
  assert.deepEqual(items, before)
})
