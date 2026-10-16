import { useEffect, useState } from 'react'
import { getHomeMatches } from '../lib/homeMatches'

export function usePublishedMatches() {
  const [matches, setMatches] = useState([])
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setStatus('loading')
    getHomeMatches().then(data => { if (alive) { setMatches(data); setStatus('ready') } }).catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [attempt])
  return { matches, status, retry: () => setAttempt(value => value + 1) }
}

export function argentinaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function opponentLabel(value) {
  return String(value || '').replace(/^vs\.?\s+/i, '').trim() || 'Rival a confirmar'
}
