import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PortalPage from './PortalPage'
import { getFanAccount, saveFanAccount } from '../lib/fanAccount'
import { optimizedPlayerImage } from '../lib/optimizedPlayerImage'
import './FanAccount.css'

export default function FanAccount() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [form, setForm] = useState({ displayName: profile?.display_name || '', favoritePlayerId: '', bio: '' })
  const [players, setPlayers] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let alive = true
    setState('loading')
    getFanAccount().then(data => {
      if (!alive) return
      setPlayers(data.players)
      setForm({ displayName: profile?.display_name || '', favoritePlayerId: data.preferences?.favorite_player_id || '', bio: data.preferences?.bio || '' })
      setState('ready')
    }).catch(err => { if (alive) { setError(err.message); setState('error') } })
    return () => { alive = false }
  }, [attempt, profile?.id])
  const update = (key, value) => { setForm(current => ({ ...current, [key]: value })); setMessage(''); setError('') }
  const save = async event => {
    event.preventDefault()
    setSaving(true); setMessage(''); setError('')
    try { await saveFanAccount(form); await refreshProfile(); setMessage('Tu perfil está actualizado.') }
    catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  const favorite = players.find(player => player.id === form.favoritePlayerId)
  return <PortalPage title="Mi cuenta" intro="Tu lugar en la comunidad." aside={false}>
    <div className="fan-account">
      <section className="fan-account-card"><h2>Perfil de hincha</h2><p>Elegí a quién alentás y contanos un poco de vos. Tus preferencias son privadas.</p>
        {state === 'loading' ? <p role="status">Cargando tu perfil…</p> : state === 'error' ? <div role="alert"><p>{error}</p><button type="button" className="ap-button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div> : <form onSubmit={save}>
          <label>Nombre o nickname<input required minLength={2} maxLength={50} autoComplete="nickname" value={form.displayName} onChange={e => update('displayName', e.target.value)} /></label>
          <label>Jugador favorito<select value={form.favoritePlayerId} onChange={e => update('favoritePlayerId', e.target.value)}><option value="">Todavía no elegí</option>{players.map(player => <option key={player.id} value={player.id}>{player.nickname}{!player.is_active ? ' · fuera del plantel actual' : ''}</option>)}</select></label>
          <label>Sobre vos<textarea maxLength={160} rows={3} value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Cómo conociste al equipo, de dónde sos…" /></label>
          {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
          <button className="ap-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar perfil'}</button>
        </form>}
      </section>
      <div className="fan-account-side">
        <section className="fan-account-card"><h2>{favorite ? 'Tu jugador favorito' : 'Seguí al equipo'}</h2>{favorite ? <>{favorite.image_url && <img className="fan-favorite-image" src={optimizedPlayerImage(favorite.image_url)} alt={favorite.nickname} loading="lazy" />}<h3>{favorite.nickname}</h3><Link className="ap-button" to={`/players/${favorite.slug}`}>Ver ficha</Link></> : <><p>Conocé al plantel y elegí tu favorito cuando quieras.</p><Link className="ap-button" to="/equipo">Ver plantel</Link></>}</section>
        <section className="fan-account-card"><h2>Tu cuenta</h2><p>Si pasás a formar parte del equipo, el administrador habilitará tu ficha de jugador.</p><div className="fan-account-actions"><Link to="/update-password">Cambiar contraseña</Link><button type="button" onClick={async () => { try { await signOut() } catch (err) { setError(err.message) } }}>Cerrar sesión</button></div></section>
      </div>
    </div>
  </PortalPage>
}
