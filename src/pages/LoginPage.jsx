import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/demoAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('founder@asteri.gg')
  const [password, setPassword] = useState('ASTERI-DEMO')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault(); setError('')
    try {
      const user = loginUser(email, password)
      navigate(user.isFounder ? '/admin' : '/account')
    } catch (err) { setError(err.message) }
  }

  return (
    <main className="auth-page">
      <Link className="auth-back" to="/">← ASTERI</Link>
      <form className="auth-card" onSubmit={submit}>
        <span className="section-kicker">PLAYER AREA</span>
        <h1>INICIAR SESIÓN</h1>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit">ENTRAR</button>
        <p className="auth-note">Demo fundador: founder@asteri.gg / ASTERI-DEMO</p>
        <Link to="/register">Solicitar una cuenta →</Link>
      </form>
    </main>
  )
}
