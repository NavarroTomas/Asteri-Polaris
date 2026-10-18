import { useEffect, useRef, useState } from 'react'
import { slugifyPlayer } from '../lib/rosterAdmin'

export default function AdminPlayerAssignment({ user, players, busy, onSave, onCancel }) {
  const panel = useRef(null)
  useEffect(() => { panel.current?.focus(); panel.current?.scrollIntoView({ block: 'start', behavior: 'instant' }) }, [])
  const [mode, setMode] = useState('create')
  const [nickname, setNickname] = useState(user.display_name || '')
  const [slug, setSlug] = useState(slugifyPlayer(user.display_name || ''))
  const [playerId, setPlayerId] = useState('')
  return <section ref={panel} tabIndex={-1} className="admin-player-assignment" aria-labelledby="assignment-title">
    <h2 id="assignment-title">Ficha de jugador para {user.display_name || user.email}</h2>
    <form onSubmit={e => { e.preventDefault(); onSave({ userId: user.id, playerId: mode === 'link' ? playerId : null, nickname: mode === 'create' ? nickname.trim() : null, slug: mode === 'create' ? slug.trim() : null }) }}>
      <label>Ficha<select value={mode} disabled={busy} onChange={e => setMode(e.target.value)}><option value="create">Crear una ficha nueva</option><option value="link" disabled={!players.length}>Vincular una ficha existente</option></select></label>
      {mode === 'create' ? <><label>Nickname<input required minLength={2} maxLength={50} disabled={busy} value={nickname} onChange={e => { setNickname(e.target.value); setSlug(slugifyPlayer(e.target.value)) }} /></label><label>Dirección de la ficha<input required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={busy} value={slug} onChange={e => setSlug(e.target.value)} /></label><p>La ficha se crea fuera del plantel público. Podés completarla y activarla desde Plantel.</p></> : <label>Jugador<select required disabled={busy} value={playerId} onChange={e => setPlayerId(e.target.value)}><option value="">Seleccionar ficha</option>{players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>}
      <p>Al confirmar, la cuenta tendrá rol de jugador y podrá editar su ficha.</p>
      <div className="admin-player-assignment-actions"><button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Habilitar jugador'}</button><button type="button" onClick={onCancel} disabled={busy}>Cancelar</button></div>
    </form>
  </section>
}
