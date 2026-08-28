import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { approveUser, getUsers, logoutUser } from '../lib/demoAuth'

export default function AdminPage() {
  const [users, setUsers] = useState(getUsers())
  const navigate = useNavigate()
  const approve = (id) => { approveUser(id); setUsers(getUsers()) }
  const logout = () => { logoutUser(); navigate('/') }
  return (
    <main className="dashboard-page">
      <div className="dashboard-top"><Link to="/">← ASTERI</Link><button className="button ghost" onClick={logout}>CERRAR SESIÓN</button></div>
      <div className="dashboard-heading"><span className="section-kicker">FOUNDER CONTROL</span><h1>GESTIÓN DE USUARIOS</h1><p>Prototipo local. Acá se valida el flujo de aprobación antes de integrar Supabase.</p></div>
      <div className="user-table">
        {users.map((user) => (
          <div className="user-row" key={user.id}>
            <div><strong>{user.nickname}</strong><span>{user.email}</span></div>
            <div>{user.role}</div><div><span className={`status ${user.status}`}>{user.status}</span></div>
            <div>{!user.isFounder && user.status === 'pending' ? <button className="button primary small" onClick={() => approve(user.id)}>APROBAR</button> : <span>—</span>}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
