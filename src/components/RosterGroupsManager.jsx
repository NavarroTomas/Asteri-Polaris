import { useEffect, useState } from 'react'
import { getRosters, saveRoster, deleteRoster, DEFAULT_ROSTER_ID } from '../lib/rosterGroups'
import './RosterGroupsManager.css'

const empty = { name: '', game: 'Counter-Strike 2', description: '', sort_order: 0, is_active: false }

export default function RosterGroupsManager() {
  const [rosters, setRosters] = useState([])
  const [form, setForm] = useState({ ...empty })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    getRosters().then(data => { if (alive) { setRosters(data); setError('') } }).catch(err => { if (alive) setError(err.message || 'No pudimos cargar los planteles.') }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [attempt])
  const set = (field, value) => { setForm(current => ({ ...current, [field]: value })); setMessage(''); setError('') }
  const submit = async event => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      const saved = await saveRoster(form)
      setForm(saved)
      setRosters(await getRosters())
      setMessage(saved.is_active ? 'Plantel guardado y visible en Equipo.' : 'Plantel guardado como borrador. No aparece en Equipo.')
    } catch (err) { setError(err.code === '23505' ? 'Ya existe un plantel con ese nombre y juego.' : err.message || 'No se pudo guardar el plantel.') }
    finally { setSaving(false) }
  }
  const remove = async () => {
    if (!form.id || saving) return
    if (!window.confirm('¿Eliminar definitivamente el plantel ' + form.name + '? Debe estar vacío. Esta acción no se puede deshacer.')) return
    setSaving(true); setError(''); setMessage('')
    try {
      await deleteRoster(form.id)
      setForm({ ...empty })
      setRosters(await getRosters())
      setMessage('Plantel eliminado.')
    } catch (err) { setError(err.message || 'No se pudo eliminar el plantel.') }
    finally { setSaving(false) }
  }
  return <section className="admin-roster-groups">
    <div className="admin-roster-groups-head"><p>Creá planteles por juego o categoría. Después asigná sus jugadores desde la sección Jugadores.</p><button type="button" disabled={saving} onClick={() => { setForm({ ...empty, sort_order: Math.max(0, ...rosters.map(roster => roster.sort_order)) + 1 }); setMessage(''); setError('') }}>Nuevo plantel</button></div>
    {error && <p role="alert">{error} <button type="button" disabled={loading || saving} onClick={() => setAttempt(value => value + 1)}>Reintentar</button></p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p role="status">Cargando planteles…</p> : <div className="admin-roster-groups-layout">
      <nav aria-label="Planteles">{rosters.map(roster => <button type="button" key={roster.id} disabled={saving} aria-pressed={form.id === roster.id} onClick={() => { setForm({ ...roster }); setError(''); setMessage('') }}><strong>{roster.name}</strong><span>{roster.game} · {roster.is_active ? 'Publicado' : 'Borrador'}</span></button>)}</nav>
      <form onSubmit={submit}><h2>{form.id ? 'Editar plantel' : 'Nuevo plantel'}</h2>
        <label>Nombre<input required minLength={2} maxLength={80} disabled={saving} value={form.name} onChange={event => set('name', event.target.value)} placeholder="Academia" /></label>
        <label>Juego<input required minLength={2} maxLength={80} disabled={saving} value={form.game} onChange={event => set('game', event.target.value)} /></label>
        <label>Descripción<textarea maxLength={500} rows={3} disabled={saving} value={form.description} onChange={event => set('description', event.target.value)} /></label>
        <label>Orden en Equipo<input type="number" required min={0} max={100000} step={1} disabled={saving} value={form.sort_order} onChange={event => set('sort_order', event.target.value)} /></label>
        <label className="admin-roster-published"><input type="checkbox" disabled={saving} checked={form.is_active} onChange={event => set('is_active', event.target.checked)} />Mostrar en Equipo</label>
        <p>Al ocultar un plantel, sus jugadores conservan sus fichas y enlaces.</p>
        <button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar plantel'}</button>
        {form.id && form.id !== DEFAULT_ROSTER_ID && <button type="button" disabled={saving} onClick={remove}>Eliminar plantel</button>}
        {form.id === DEFAULT_ROSTER_ID && <p>El plantel principal se conserva como destino predeterminado. Podés ocultarlo de Equipo.</p>}
      </form>
    </div>}
  </section>
}
