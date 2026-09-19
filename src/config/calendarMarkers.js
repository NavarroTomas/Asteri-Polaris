export const CALENDAR_MARKERS = {
  match: {
    key: 'match',
    label: 'PARTIDO',
    symbol: '★',
    color: '#4a8dff',
  },
  tournament: {
    key: 'tournament',
    label: 'TORNEO',
    symbol: '★',
    color: '#a978ff',
  },
  scrim: {
    key: 'scrim',
    label: 'SCRIM',
    symbol: '★',
    color: '#f0a24e',
  },
  matchday: {
    key: 'matchday',
    label: 'FECHA',
    symbol: '★',
    color: '#00d96e',
  },
  event: {
    key: 'event',
    label: 'EVENTO',
    symbol: '★',
    color: '#d6dbd7',
  },
  other: {
    key: 'other',
    label: 'OTRO',
    symbol: '★',
    color: '#d8c45b',
  },
}

export const CALENDAR_MARKER_ORDER = [
  'match',
  'tournament',
  'scrim',
  'matchday',
  'event',
  'other',
]

export const CALENDAR_EVENT_OPTIONS = CALENDAR_MARKER_ORDER
  .filter((key) => key !== 'match')
  .map((key) => CALENDAR_MARKERS[key])
