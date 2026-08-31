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
import './AdminPage.css'
import RosterManager from '../components/RosterManager'
import AuditLogManager from '../components/AuditLogManager'
import SiteStatsManager from '../components/SiteStatsManager'

const TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'users', label: 'USUARIOS' },
  { id: 'roster', label: 'PLANTEL' },
  { id: 'vods', label: 'VODS' },
  { id: 'activity', label: 'ACTIVIDAD' },
]

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
    PLAYERS_UPDATE: 'Jugador actualizado',
    PLAYER_STATS_UPDATE: 'Stats actualizadas',
    PLAYER_CONFIGS_UPDATE: 'Config actualizada',
    VODS_INSERT: 'VOD creado',
    VODS_UPDATE: 'VOD actualizado',
    VODS_DELETE: 'VOD eliminado',
    CLIPS_INSERT: 'Clip creado',
    CLIPS_UPDATE: 'Clip actualizado',
    CLIPS_DELETE: 'Clip eliminado',
    VOD_PLAYERS_INSERT: 'Jugador añadido a VOD',
    VOD_PLAYERS_DELETE: 'Jugador eliminado de VOD',
  }

  return names[log.action] || log.action.replaceAll('_', ' ')
}

export default function AdminPage() {
  const { profile, signOut, isOwner } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('overview')
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

  const activeUsers = useMemo(
    () => snapshot.profiles.filter(user => user.status === 'active'),
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
    runAction(user.id, async () => {
      await setUserStatus(user.id, 'suspended')
    })
  }

  const reactivate = user => {
    runAction(user.id, async () => {
      await setUserStatus(user.id, 'active')
    })
  }

  const unlink = user => {
    runAction(`unlink-${user.id}`, async () => {
      await unlinkPlayerByUserId(user.id)
      await setUserStatus(user.id, 'pending')
    })
  }

  const changeRole = (user, role) => {
    runAction(`role-${user.id}`, () =>
      setUserRole(user.id, role),
    )
  }

  const logout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <main className="auth-loading">
        <span>ASTERI / CARGANDO CONTROL PANEL</span>
      </main>
    )
  }

  return (
    <main className="asteri-admin">
      <aside className="asteri-admin-sidebar">
        <div>
          <Link className="asteri-admin-brand" to="/">
            ASTERI
            <span>POLARIS</span>
          </Link>

          <nav className="asteri-admin-nav">
            {TABS.map(item => (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? 'active' : ''}
                onClick={() => setTab(item.id)}
              >
                <span>{item.label}</span>
                <i>→</i>
              </button>
            ))}
          </nav>
        </div>

        <div className="asteri-admin-user">
          <small>{isOwner ? 'OWNER' : 'ADMIN'}</small>
          <strong>{profile?.display_name || profile?.email}</strong>
          <button type="button" onClick={logout}>
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      <section className="asteri-admin-main">
        <header className="asteri-admin-top">
          <span>ASTERI / CONTROL PANEL</span>
          <button type="button" onClick={load}>
            ACTUALIZAR
          </button>
        </header>

        {error && (
          <div className="asteri-admin-error">
            {error}
          </div>
        )}

        {tab === 'overview' && (
          <div className="asteri-admin-view">
            <div className="asteri-admin-heading">
              <span>CONTROL / 01</span>
              <h1>OVERVIEW.</h1>
              <p>
                Estado general de usuarios y contenido privado de ASTERI.
              </p>
            </div>

            <div className="asteri-admin-metrics">
              <article>
                <small>USUARIOS</small>
                <strong>{snapshot.profiles.length.toString().padStart(2, '0')}</strong>
              </article>

              <article>
                <small>PENDIENTES</small>
                <strong>{pendingUsers.length.toString().padStart(2, '0')}</strong>
              </article>

              <article>
                <small>VODS</small>
                <strong>{snapshot.vods.length.toString().padStart(2, '0')}</strong>
              </article>

              <article>
                <small>CLIPS</small>
                <strong>{snapshot.clips.length.toString().padStart(2, '0')}</strong>
              </article>
            </div>

            {isOwner && (
              <div className="asteri-admin-block">
                <div className="asteri-admin-block-head">
                  <div>
                    <small>HOME / NUMBERS</small>
                    <h2>NÚMEROS PÚBLICOS</h2>
                  </div>
                  <span>OWNER</span>
                </div>

                <SiteStatsManager />
              </div>
            )}

            <div className="asteri-admin-block">
              <div className="asteri-admin-block-head">
                <div>
                  <small>REQUESTS</small>
                  <h2>CUENTAS PENDIENTES</h2>
                </div>
                <span>{pendingUsers.length}</span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="asteri-admin-empty">
                  NO HAY SOLICITUDES PENDIENTES
                </div>
              ) : (
                <div className="asteri-admin-requests">
                  {pendingUsers.map(user => (
                    <article key={user.id} className="asteri-request-row">
                      <div className="asteri-request-person">
                        <span>{user.display_name || 'PLAYER'}</span>
                        <small>{user.email}</small>
                      </div>

                      <select
                        value={linkSelections[user.id] || ''}
                        onChange={event =>
                          setLinkSelections(current => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">VINCULAR JUGADOR</option>
                        {freePlayers.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.nickname}
                          </option>
                        ))}
                      </select>

                      <div className="asteri-request-actions">
                        <button
                          type="button"
                          className="approve"
                          disabled={workingId === user.id}
                          onClick={() => approve(user)}
                        >
                          APROBAR
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
                          RECHAZAR
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="asteri-admin-block">
              <div className="asteri-admin-block-head">
                <div>
                  <small>RECENT</small>
                  <h2>ÚLTIMA ACTIVIDAD</h2>
                </div>
              </div>

              <div className="asteri-activity-list">
                {snapshot.logs.slice(0, 8).map(log => (
                  <article key={log.id}>
                    <time>{formatDate(log.created_at)}</time>
                    <strong>{actionCopy(log)}</strong>
                    <span>{log.entity_type}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="asteri-admin-view">
            <div className="asteri-admin-heading">
              <span>CONTROL / 02</span>
              <h1>USUARIOS.</h1>
              <p>
                Administrá acceso, rol y vínculo entre cuentas y jugadores.
              </p>
            </div>

            <div className="asteri-users-table">
              <div className="asteri-users-table-head">
                <span>USUARIO</span>
                <span>JUGADOR</span>
                <span>ROL</span>
                <span>ESTADO</span>
                <span>ACCIONES</span>
              </div>

              {snapshot.profiles.map(user => {
                const linkedPlayer = playerByUserId.get(user.id)
                const isSelf = user.id === profile?.id

                return (
                  <article key={user.id} className="asteri-users-row">
                    <div>
                      <strong>{user.display_name || 'SIN NOMBRE'}</strong>
                      <small>{user.email}</small>
                    </div>

                    <div>
                      <strong>{linkedPlayer?.nickname || '—'}</strong>
                    </div>

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
                        <option value="player">PLAYER</option>
                        <option value="admin">ADMIN</option>
                        {isOwner && <option value="owner">OWNER</option>}
                      </select>
                    </div>

                    <div>
                      <span className={`user-status ${user.status}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="asteri-user-actions">
                      {user.status === 'active' && !isSelf && (
                        <button type="button" onClick={() => suspend(user)}>
                          SUSPENDER
                        </button>
                      )}

                      {user.status === 'suspended' && (
                        <button type="button" onClick={() => reactivate(user)}>
                          REACTIVAR
                        </button>
                      )}

                      {linkedPlayer && !isSelf && (
                        <button type="button" onClick={() => unlink(user)}>
                          DESVINCULAR
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'roster' && (
          <div className="asteri-admin-view">
            <RosterManager />
          </div>
        )}

        {tab === 'vods' && <Navigate to="/admin/vods" replace />}

        {tab === 'activity' && (
          <div className="asteri-admin-view">
            <AuditLogManager />
          </div>
        )}
      </section>
    </main>
  )
}
