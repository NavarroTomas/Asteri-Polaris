import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser, updateUser } from '../lib/demoAuth'

export default function AccountPage() {
  const initial = getCurrentUser()
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  const set = (key, value) => { setSaved(false); setForm((f) => ({ ...f, [key]: value })) }
  const setConfig = (key, value) => { setSaved(false); setForm((f) => ({ ...f, config: { ...f.config, [key]: value } })) }
  const save = (e) => { e.preventDefault(); updateUser(form.id, form); setSaved(true) }
  const logout = () => { logoutUser(); navigate('/') }
  return (
    <main className="dashboard-page">
      <div className="dashboard-top"><Link to="/">← ASTERI</Link><button className="button ghost" onClick={logout}>CERRAR SESIÓN</button></div>
      <div className="dashboard-heading"><span className="section-kicker">PLAYER CONTROL</span><h1>EDITAR PERFIL</h1><p>Base funcional para personalización. En producción estos datos vivirán en una base real.</p></div>
      <form className="profile-editor" onSubmit={save}>
        <label>Nickname<input value={form.nickname} onChange={(e) => set('nickname', e.target.value)} /></label>
        <label>Rol<input value={form.role} onChange={(e) => set('role', e.target.value)} /></label>
        <label className="span-2">Bio<textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows="5" /></label>
        <label>Steam<input value={form.steam} onChange={(e) => set('steam', e.target.value)} placeholder="Steam URL / SteamID" /></label>
        <label>FACEIT<input value={form.faceit} onChange={(e) => set('faceit', e.target.value)} placeholder="Perfil FACEIT" /></label>
        <label>DPI<input value={form.config.dpi} onChange={(e) => setConfig('dpi', e.target.value)} /></label>
        <label>Sensitivity<input value={form.config.sensitivity} onChange={(e) => setConfig('sensitivity', e.target.value)} /></label>
        <label>Resolution<input value={form.config.resolution} onChange={(e) => setConfig('resolution', e.target.value)} /></label>
        <label>Crosshair<input value={form.config.crosshair} onChange={(e) => setConfig('crosshair', e.target.value)} /></label>
        <div className="span-2 editor-actions"><button className="button primary">GUARDAR CAMBIOS</button>{saved && <span className="form-success">Guardado.</span>}</div>
      </form>
    </main>
  )
}
