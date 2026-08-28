import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../lib/demoAuth'

export default function RegisterPage() {
  const [data, setData] = useState({ email: '', password: '', nickname: '', role: 'Jugador' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const set = (key, value) => setData((d) => ({ ...d, [key]: value }))
  const submit = (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      registerUser(data)
      setMessage('Solicitud creada. El fundador debe aprobarla desde su panel.')
      setData({ email: '', password: '', nickname: '', role: 'Jugador' })
    } catch (err) { setError(err.message) }
  }
  return (
    <main className="auth-page">
      <Link className="auth-back" to="/">← ASTERI</Link>
      <form className="auth-card" onSubmit={submit}>
        <span className="section-kicker">PLAYER AREA</span><h1>SOLICITAR CUENTA</h1>
        <label>Nickname<input value={data.nickname} onChange={(e) => set('nickname', e.target.value)} required /></label>
        <label>Rol<select value={data.role} onChange={(e) => set('role', e.target.value)}><option>Jugador</option><option>Coach</option><option>Manager</option></select></label>
        <label>Email<input type="email" value={data.email} onChange={(e) => set('email', e.target.value)} required /></label>
        <label>Contraseña<input type="password" minLength="6" value={data.password} onChange={(e) => set('password', e.target.value)} required /></label>
        {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}
        <button className="button primary">ENVIAR SOLICITUD</button>
        <Link to="/login">Ya tengo cuenta →</Link>
      </form>
    </main>
  )
}
