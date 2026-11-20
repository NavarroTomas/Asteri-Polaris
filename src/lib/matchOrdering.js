export function compareMatchesNewestFirst(a, b) {
  const dateA = a.dateISO || ''
  const dateB = b.dateISO || ''
  return dateB.localeCompare(dateA) || String(b.time === '—' ? '' : b.time || '').localeCompare(String(a.time === '—' ? '' : a.time || '')) || String(a.id || '').localeCompare(String(b.id || ''))
}
