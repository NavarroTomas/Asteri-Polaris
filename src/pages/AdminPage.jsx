import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  approveAndLinkPlayer,
  getAdminSnapshot,
  rejectPendingUser,
  setUserRole,
  setUserStatus,
  unlinkPlayerByUserId,
} from '../lib/admin'
import RosterManager from '../components/RosterManager'
import AuditLogManager from '../components/AuditLogManager'
import HomeSettingsManager from '../components/HomeSettingsManager'
import AdminAnalytics from '../components/AdminAnalytics'
import './AdminPage.css'

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function AdminSectionHeader({ title, description, onBack }) {
  return (
    <div className="admin-section-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      <button type="button" onClick={onBack}>
        Volver al panel
      </button>
    </div>
  )
}

export default function AdminPage() {
  const { profile, signOut, isOwner } = useAuth()
  const navigate = useNavigate()

  const [params, setParams] = useSearchParams()
  const requestedView = params.get('section') || 'overview'
  const allowedViews = ['overview', 'users', 'pending', 'roster', 'vods', 'activity', 'analytics', ...(isOwner ? ['home'] : [])]
  const view = allowedViews.includes(requestedView) ? requestedView : 'overview'
  const setView = section => setParams(section === 'overview' ? {} : { section })
  const heading = useRef(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }) }, [view])
  const [snapshot, setSnapshot] = useState({
    profiles: [],
    players: [],
    vods: [],
    clips: [],
    logs: [],
  })
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState(null)
  const [error, setError] = useState('')
  const [linkSelections, setLinkSelections] = useState({})

  const load = async () => {
    setError('')
    setRefreshing(true)

    try {
      const data = await getAdminSnapshot()
      setSnapshot(data)
      setLoaded(true)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const pendingUsers = useMemo(
    () => snapshot.profiles.filter(user => user.status === 'pending'),
    [snapshot.profiles],
  )

  const freePlayers = useMemo(
    () => snapshot.players.filter(player => !player.user_id),
    [snapshot.players],
  )

  const playerByUserId = useMemo(() => {
    return new Map(
      snapshot.players
        .filter(player => player.user_id)
        .map(player => [player.user_id, player]),
    )
  }, [snapshot.players])

  const runAction = async (key, action) => {
    setWorkingId(key)
    setError('')

    try {
      await action()
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.')
    } finally {
      setWorkingId(null)
    }
  }

  const approve = user => {
    const playerId = linkSelections[user.id]

    if (!playerId) {
      setError('Elegí qué jugador corresponde a esta cuenta.')
      return
    }

    runAction(user.id, () =>
      approveAndLinkPlayer({
        userId: user.id,
        playerId,
      }),
    )
  }

  const suspend = user => {
    runAction(user.id, () => setUserStatus(user.id, 'suspended'))
  }

  const reactivate = user => {
    runAction(user.id, () => setUserStatus(user.id, 'active'))
  }

  const unlink = user => {
    runAction(`unlink-${user.id}`, async () => {
      await unlinkPlayerByUserId(user.id)
      await setUserStatus(user.id, 'pending')
    })
  }

  const changeRole = (user, role) => {
    runAction(`role-${user.id}`, () => setUserRole(user.id, role))
  }

  const logout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <main className="auth-loading">
        <span>Cargando panel de administración…</span>
      </main>
    )
  }

  const modules = [
    { id: 'analytics', title: 'Analítica' },
    { id: 'roster', title: 'Plantel' },
    { id: 'vods', title: 'Partidos y VODs' },
    { id: 'users', title: 'Usuarios' },
    { id: 'pending', title: 'Solicitudes' },
    ...(isOwner ? [{ id: 'home', title: 'Configuración web' }] : []),
    { id: 'activity', title: 'Actividad' },
  ]

  return (
    <main className="asteri-admin" ref={heading} tabIndex={-1}>
      <header className="admin-topbar">
        <Link className="admin-brand" to="/">
          <span>ASTERI</span>
          <strong>POLARIS</strong>
        </Link>

        <div className="admin-topbar-center">
          <strong>Panel de administración</strong>
          <span>{profile?.display_name || profile?.email}</span>
        </div>

        <div className="admin-topbar-actions">
          <Link to="/" target="_blank">
            Ver sitio
          </Link>

          <button type="button" onClick={load} disabled={refreshing} aria-busy={refreshing}>
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>

          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {error && <div className="admin-global-error" role="alert">{error}<button type="button" onClick={load} disabled={refreshing}>Reintentar</button></div>}

      {view !== 'overview' && <nav className="admin-section-nav" aria-label="Secciones del panel">
        <button type="button" onClick={() => setView('overview')}>Panel</button>
        {modules.map(module => <button key={module.id} type="button" aria-current={view === module.id ? 'page' : undefined} onClick={() => setView(module.id)}>{module.title}</button>)}
      </nav>}
      {view === 'overview' && (
        <div className="admin-dashboard">
          <section className="admin-dashboard-intro"><h1>Administración</h1></section>
          <section className="admin-module-grid" aria-label="Secciones administrativas">
            {modules.map(module => <button type="button" className="admin-module-card" key={module.id} onClick={() => setView(module.id)}><span>{module.title}</span></button>)}
          </section>
        </div>
      )}
      {view === 'analytics' && <div className="admin-content-view">
        <AdminSectionHeader title="Analítica" description="Estado de la web y rendimiento del equipo." onBack={() => setView('overview')} />
        {loaded ? <AdminAnalytics snapshot={snapshot} isOwner={isOwner} onSettings={() => setView('home')} /> : <p role="status">No se pudieron cargar los datos. Usá Reintentar para volver a consultar.</p>}
      </div>}
      {view === 'pending' && <div className="admin-content-view">
        <AdminSectionHeader title="Solicitudes" onBack={() => setView('overview')} />
          <section className="admin-dashboard-section" id="pending-users">
            <div className="admin-dashboard-section-head">
              <div>
                <h2>Usuarios pendientes</h2>
                <p>
                  Aprobá una cuenta vinculándola con el jugador correspondiente.
                </p>
              </div>


            </div>

            {pendingUsers.length === 0 ? (
              <div className="admin-empty-state">
                No hay usuarios pendientes.
              </div>
            ) : (
              <div className="admin-pending-list">
                {pendingUsers.map(user => (
                  <article key={user.id} className="admin-pending-row">
                    <div className="admin-person">
                      <strong>{user.display_name || 'Sin nombre'}</strong>
                      <span>{user.email}</span>
                      <small>Registrado: {formatDate(user.created_at)}</small>
                    </div>

                    <label>
                      <span>Jugador</span>
                      <select
                        value={linkSelections[user.id] || ''}
                        onChange={event =>
                          setLinkSelections(current => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Seleccionar jugador</option>
                        {freePlayers.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.nickname}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="primary"
                        disabled={workingId === user.id}
                        onClick={() => approve(user)}
                      >
                        Aprobar
                      </button>

                      <button
                        type="button"
                        disabled={workingId === user.id}
                        onClick={() =>
                          runAction(user.id, () =>
                            rejectPendingUser(user.id),
                          )
                        }
                      >
                        Rechazar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
      </div>}

      {view === 'users' && (
        <div className="admin-content-view">
          <AdminSectionHeader
            title="Usuarios"
            description="Administrá acceso, rol, estado y vínculo entre cuentas y jugadores."
            onBack={() => setView('overview')}
          />

          <div className="admin-users-table">
            <div className="admin-users-head">
              <span>Usuario</span>
              <span>Jugador</span>
              <span>Rol</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            {snapshot.profiles.map(user => {
              const linkedPlayer = playerByUserId.get(user.id)
              const isSelf = user.id === profile?.id

              return (
                <article key={user.id} className="admin-user-row">
                  <div className="admin-person">
                    <strong>{user.display_name || 'Sin nombre'}</strong>
                    <span>{user.email}</span>
                  </div>

                  <div>{linkedPlayer?.nickname || '—'}</div>

                  <div>
                    <select
                      value={user.role}
                      disabled={
                        isSelf ||
                        workingId === `role-${user.id}` ||
                        (!isOwner && user.role === 'owner')
                      }
                      onChange={event =>
                        changeRole(user, event.target.value)
                      }
                    >
                      <option value="player">Jugador</option>
                      <option value="admin">Administrador</option>
                      {isOwner && <option value="owner">Propietario</option>}
                    </select>
                  </div>

                  <div>
                    <span className={`admin-status ${{ active: 'Activa', pending: 'Pendiente', suspended: 'Suspendida' }[user.status] || user.status}`}>
                      {{ active: 'Activa', pending: 'Pendiente', suspended: 'Suspendida' }[user.status] || user.status}
                    </span>
                  </div>

                  <div className="admin-row-actions">
                    {user.status === 'active' && !isSelf && (
                      <button type="button" disabled={workingId === user.id} onClick={() => suspend(user)}>
                        Suspender
                      </button>
                    )}

                    {user.status === 'suspended' && (
                      <button type="button" disabled={workingId === user.id} onClick={() => reactivate(user)}>
                        Reactivar
                      </button>
                    )}

                    {linkedPlayer && !isSelf && (
                      <button type="button" disabled={workingId === `unlink-${user.id}`} onClick={() => unlink(user)}>
                        Desvincular
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {view === 'roster' && (
        <div className="admin-content-view">
          <AdminSectionHeader
            title="Plantel"
            description="Jugadores, perfiles públicos, estadísticas y configuración."
            onBack={() => setView('overview')}
          />

          <RosterManager />
        </div>
      )}

      {view === 'home' && isOwner && (
        <div className="admin-content-view">
          <AdminSectionHeader
            title="Configuración web"
            description="Configuración de los elementos principales de la página pública."
            onBack={() => setView('overview')}
          />

          <HomeSettingsManager />
        </div>
      )}

      {view === 'vods' && <Navigate to="/admin/vods" replace />}

      {view === 'activity' && (
        <div className="admin-content-view">
          <AdminSectionHeader
            title="Actividad"
            description="Registro detallado de los cambios realizados en la plataforma."
            onBack={() => setView('overview')}
          />

          <AuditLogManager />
        </div>
      )}
    </main>
  )
}
