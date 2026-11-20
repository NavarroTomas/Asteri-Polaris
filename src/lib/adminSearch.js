export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim().replace(/\s+/g, ' ')
}

export function matchesPersonSearch(person, query) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean)
  const text = normalizeSearch([person?.display_name, person?.email, person?.nickname, person?.real_name].filter(Boolean).join(' '))
  return terms.every(term => text.includes(term))
}
