import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
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
import './AdminPage.css'

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function actionCopy(log) {
  const names = {
    PROFILES_INSERT: 'Cuenta creada',
    PROFILES_UPDATE: 'Cuenta actualizada',
    PLAYERS_INSERT: 'Jugador creado',
    PLAYERS_UPDATE: 'Jugador actualizado',
    PLAYER_STATS_UPDATE: 'Estadísticas actualizadas',
    PLAYER_CONFIGS_UPDATE: 'Configuración actualizada',
    VODS_INSERT: 'VOD creada',
    VODS_UPDATE: 'VOD actualizada',
    VODS_DELETE: 'VOD eliminada',
    VOD_MAPS_INSERT: 'Mapa añadido a una serie',
    VOD_MAPS_UPDATE: 'Resultado de mapa actualizado',
    VOD_MAPS_DELETE: 'Mapa eliminado de una serie',
    CLIPS_INSERT: 'Clip creado',
    CLIPS_UPDATE: 'Clip actualizado',
    CLIPS_DELETE: 'Clip eliminado',
    VOD_PLAYERS_INSERT: 'Jugador añadido a una VOD',
    VOD_PLAYERS_DELETE: 'Jugador eliminado de una VOD',
    CALENDAR_EVENTS_INSERT: 'Fecha añadida al calendario',
    CALENDAR_EVENTS_UPDATE: 'Fecha del calendario actualizada',
    CALENDAR_EVENTS_DELETE: 'Fecha eliminada del calendario',
    SITE_STATS_UPDATE: 'Números públicos actualizados',
    SITE_SETTINGS_UPDATE: 'Configuración de inicio actualizada',
  }

  return names[log.action] || String(log.action || '').replaceAll('_', ' ')
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

  const [view, setView] = useState('overview')
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

    try {
      const data = await getAdminSnapshot()
      setSnapshot(data)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
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

  const activePlayers = useMemo(
    () => snapshot.players.filter(player => player.is_active),
    [snapshot.players],
  )

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

  const goToPending = () => {
    requestAnimationFrame(() => {
      document
        .getElementById('pending-users')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  if (loading) {
    return (
      <main className="auth-loading">
        <span>Cargando panel de administración…</span>
      </main>
    )
  }

  const modules = [
    {
      id: 'users',
      title: 'Usuarios',
      description: 'Accesos, roles, estados y cuentas vinculadas.',
      value: snapshot.profiles.length,
      action: () => setView('users'),
    },
    {
      id: 'pending',
      title: 'Pendientes',
      description: 'Solicitudes que necesitan aprobación o rechazo.',
      value: pendingUsers.length,
      action: goToPending,
      warning: pendingUsers.length > 0,
    },
    {
      id: 'roster',
      title: 'Plantel',
      description: 'Jugadores, perfiles, estadísticas y configuración.',
      value: activePlayers.length,
      action: () => setView('roster'),
    },
    {
      id: 'vods',
      title: 'Partidos y VODs',
      description: 'Calendario, series, resultados, VODs y clips.',
      value: snapshot.vods.length,
      action: () => setView('vods'),
    },
    ...(isOwner
      ? [
          {
            id: 'home',
            title: 'Inicio',
            description: 'Video principal y números públicos de la Home.',
            value: 'WEB',
            action: () => setView('home'),
          },
        ]
      : []),
    {
      id: 'activity',
      title: 'Actividad',
      description: 'Historial completo de cambios administrativos.',
      value: snapshot.logs.length,
      action: () => setView('activity'),
    },
  ]

  return (
    <main className="asteri-admin">
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

          <button type="button" onClick={load}>
            Actualizar
          </button>

          <button type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {error && <div className="admin-global-error">{error}</div>}

      {view === 'overview' && (
        <div className="admin-dashboard">
          <section className="admin-dashboard-intro">
            <div>
              <h1>Panel de administración</h1>
              <p>
                Gestioná usuarios, contenido y configuración pública del sitio
                desde un solo lugar.
              </p>
            </div>

            <span className="admin-role-badge">
              {isOwner ? 'Owner' : 'Admin'}
            </span>
          </section>

          <section className="admin-module-grid" aria-label="Secciones administrativas">
            {modules.map(module => (
              <button
                type="button"
                className={`admin-module-card ${
                  module.warning ? 'has-warning' : ''
                }`}
                key={module.id}
                onClick={module.action}
              >
                <div className="admin-module-card-top">
                  <span>{module.title}</span>
                  <strong>{module.value}</strong>
                </div>

                <p>{module.description}</p>
              </button>
            ))}
          </section>

          <section className="admin-dashboard-section" id="pending-users">
            <div className="admin-dashboard-section-head">
              <div>
                <h2>Usuarios pendientes</h2>
                <p>
                  Aprobá una cuenta vinculándola con el jugador correspondiente.
                </p>
              </div>

              <span>{pendingUsers.length}</span>
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

          <section className="admin-dashboard-section">
            <div className="admin-dashboard-section-head">
              <div>
                <h2>Últimos movimientos administrativos</h2>
                <p>
                  Cambios recientes realizados sobre usuarios y contenido.
                </p>
              </div>

              <button type="button" onClick={() => setView('activity')}>
                Ver historial completo
              </button>
            </div>

            <div className="admin-recent-activity">
              {snapshot.logs.length === 0 ? (
                <div className="admin-empty-state">
                  Todavía no hay actividad registrada.
                </div>
              ) : (
                snapshot.logs.slice(0, 10).map(log => (
                  <article key={log.id}>
                    <div>
                      <strong>{actionCopy(log)}</strong>
                      <span>{log.entity_type}</span>
                    </div>

                    <time>{formatDate(log.created_at)}</time>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

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
                      <option value="player">Player</option>
                      <option value="admin">Admin</option>
                      {isOwner && <option value="owner">Owner</option>}
                    </select>
                  </div>

                  <div>
                    <span className={`admin-status ${user.status}`}>
                      {user.status}
                    </span>
                  </div>

                  <div className="admin-row-actions">
                    {user.status === 'active' && !isSelf && (
                      <button type="button" onClick={() => suspend(user)}>
                        Suspender
                      </button>
                    )}

                    {user.status === 'suspended' && (
                      <button type="button" onClick={() => reactivate(user)}>
                        Reactivar
                      </button>
                    )}

                    {linkedPlayer && !isSelf && (
                      <button type="button" onClick={() => unlink(user)}>
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
            title="Inicio"
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
