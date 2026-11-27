// Move only the match list, leaving the page and the focused day in place.
export function scrollMatchListToDate(list, dateISO, { reducedMotion = false } = {}) {
  if (!list || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO || '')) return false
  const row = list.querySelector('[data-match-date="' + dateISO + '"]')
  if (!row) return false
  const offset = list.scrollTop + row.getBoundingClientRect().top - list.getBoundingClientRect().top - (list.clientTop || 0)
  const top = Math.max(0, Math.min(offset, Math.max(0, list.scrollHeight - list.clientHeight)))
  list.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
  return true
}
