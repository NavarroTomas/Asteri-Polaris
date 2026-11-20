import { getCompetitiveMap } from '../config/competitiveMaps'

export default function MapLineupEditor({ maps, players, baseLineup, disabled, onChange, onError }) {
  const toggle = (index, playerId) => {
    const ids = maps[index].player_ids || []
    if (!ids.includes(playerId) && ids.length >= 5) { onError('Elegí hasta cinco jugadores por mapa.'); return }
    onChange(maps.map((map, i) => i === index ? { ...map, player_ids: ids.includes(playerId) ? ids.filter(id => id !== playerId) : [...ids, playerId] } : map))
  }
  return <section className="vod-map-lineups" aria-labelledby="map-lineups-title">
    <h2 id="map-lineups-title">Formación por mapa</h2>
    {!maps.length && <p>Elegí los mapas de la serie para asignar sus jugadores.</p>}
    {maps.length > 0 && <button type="button" disabled={disabled || baseLineup.length > 5} onClick={() => onChange(maps.map(map => ({ ...map, player_ids: [...baseLineup] })))}>Aplicar formación base a todos los mapas</button>}
    {maps.map((map, index) => <fieldset key={map.map_name} disabled={disabled}>
      <legend>{getCompetitiveMap(map.map_name)?.name || map.map_name}</legend>
      <div className="vod-admin-lineup">{players.map(player => <button type="button" key={player.id} aria-pressed={(map.player_ids || []).includes(player.id)} className={(map.player_ids || []).includes(player.id) ? 'selected' : ''} onClick={() => toggle(index, player.id)}>{player.nickname}</button>)}</div>
    </fieldset>)}
  </section>
}
