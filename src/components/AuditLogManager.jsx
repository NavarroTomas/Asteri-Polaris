import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getAuditEntityLabel,
  getAuditLogData,
} from '../lib/auditAdmin'
import './AuditLogManager.css'

const ACTION_LABELS = {
  PROFILES_INSERT: 'Cuenta creada',
  PROFILES_UPDATE: 'Cuenta actualizada',
  PROFILES_DELETE: 'Cuenta eliminada',

  PLAYERS_INSERT: 'Jugador creado',
  PLAYERS_UPDATE: 'Jugador actualizado',
  PLAYERS_DELETE: 'Jugador eliminado',

  PLAYER_STATS_INSERT: 'Stats creadas',
  PLAYER_STATS_UPDATE: 'Stats actualizadas',
  PLAYER_STATS_DELETE: 'Stats eliminadas',

  PLAYER_CONFIGS_INSERT: 'Config creada',
  PLAYER_CONFIGS_UPDATE: 'Config actualizada',
  PLAYER_CONFIGS_DELETE: 'Config eliminada',

  VODS_INSERT: 'VOD creada',
  VODS_UPDATE: 'VOD actualizada',
  VODS_DELETE: 'VOD eliminada',

  CLIPS_INSERT: 'Clip creado',
  CLIPS_UPDATE: 'Clip actualizado',
  CLIPS_DELETE: 'Clip eliminado',

  VOD_PLAYERS_INSERT: 'Jugador añadido a VOD',
  VOD_PLAYERS_UPDATE: 'Lineup actualizado',
  VOD_PLAYERS_DELETE: 'Jugador quitado de VOD',
}

const ENTITY_LABELS = {
  profiles: 'USUARIOS',
  players: 'JUGADORES',
  player_stats: 'STATS',
  player_configs: 'CONFIG',
  vods: 'VODS',
  clips: 'CLIPS',
  vod_players: 'LINEUP',
}

const HIDDEN_DIFF_KEYS =
  new Set([
    'updated_at',
    'created_at',
  ])

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(
    'es-AR',
    {
      dateStyle: 'short',
      timeStyle: 'medium',
    },
  ).format(new Date(value))
}

function operationFromAction(
  action = '',
) {
  if (action.endsWith('_INSERT')) {
    return 'INSERT'
  }

  if (action.endsWith('_DELETE')) {
    return 'DELETE'
  }

  return 'UPDATE'
}

function actionLabel(action) {
  return (
    ACTION_LABELS[action] ||
    String(action || '')
      .replaceAll('_', ' ')
  )
}

function valueCopy(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  if (
    typeof value === 'object'
  ) {
    return JSON.stringify(
      value,
      null,
      2,
    )
  }

  if (
    typeof value === 'boolean'
  ) {
    return value
      ? 'true'
      : 'false'
  }

  return String(value)
}

function changedFields(log) {
  const oldData =
    log.old_data ?? {}

  const newData =
    log.new_data ?? {}

  const operation =
    operationFromAction(
      log.action,
    )

  const keys =
    new Set([
      ...Object.keys(oldData),
      ...Object.keys(newData),
    ])

  return [...keys]
    .filter(
      (key) =>
        !HIDDEN_DIFF_KEYS.has(
          key,
        ),
    )
    .filter((key) => {
      if (
        operation !== 'UPDATE'
      ) {
        return true
      }

      return (
        JSON.stringify(
          oldData[key],
        ) !==
        JSON.stringify(
          newData[key],
        )
      )
    })
    .sort()
    .map((key) => ({
      key,
      oldValue:
        oldData[key],
      newValue:
        newData[key],
    }))
}

function actorCopy(log) {
  if (log.actor) {
    return (
      log.actor.display_name ||
      log.actor.email ||
      'USUARIO'
    )
  }

  if (
    log.actor_user_id
  ) {
    return log.actor_user_id
  }

  return 'SYSTEM'
}

export default function AuditLogManager() {
  const [data, setData] =
    useState({
      logs: [],
      profiles: [],
      players: [],
      vods: [],
      profileById:
        new Map(),
      playerById:
        new Map(),
      vodById:
        new Map(),
    })

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [entityFilter, setEntityFilter] =
    useState('all')

  const [
    operationFilter,
    setOperationFilter,
  ] = useState('all')

  const [roleFilter, setRoleFilter] =
    useState('all')

  const [expanded, setExpanded] =
    useState(null)

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const next =
        await getAuditLogData({
          limit: 300,
        })

      setData(next)
    } catch (err) {
      setError(
        err.message ||
        'No se pudo cargar la auditoría.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const entityOptions =
    useMemo(() => {
      return [
        ...new Set(
          data.logs.map(
            (log) =>
              log.entity_type,
          ),
        ),
      ].sort()
    }, [data.logs])

  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return data.logs.filter(
        (log) => {
          const operation =
            operationFromAction(
              log.action,
            )

          const entityName =
            getAuditEntityLabel(
              log,
              data,
            )

          const actor =
            actorCopy(log)

          const haystack = [
            log.action,
            log.entity_type,
            log.entity_id,
            entityName,
            actor,
            log.actor?.email,
            log.actor_role,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          if (
            entityFilter !==
              'all' &&
            log.entity_type !==
              entityFilter
          ) {
            return false
          }

          if (
            operationFilter !==
              'all' &&
            operation !==
              operationFilter
          ) {
            return false
          }

          if (
            roleFilter !==
              'all' &&
            (
              log.actor_role ||
              'system'
            ) !== roleFilter
          ) {
            return false
          }

          if (
            query &&
            !haystack.includes(
              query,
            )
          ) {
            return false
          }

          return true
        },
      )
    }, [
      data,
      search,
      entityFilter,
      operationFilter,
      roleFilter,
    ])

  const metrics = useMemo(() => {
    const inserts =
      data.logs.filter(
        (log) =>
          operationFromAction(
            log.action,
          ) === 'INSERT',
      ).length

    const updates =
      data.logs.filter(
        (log) =>
          operationFromAction(
            log.action,
          ) === 'UPDATE',
      ).length

    const deletes =
      data.logs.filter(
        (log) =>
          operationFromAction(
            log.action,
          ) === 'DELETE',
      ).length

    return {
      total:
        data.logs.length,
      inserts,
      updates,
      deletes,
    }
  }, [data.logs])

  if (loading) {
    return (
      <div className="audit-state">
        CARGANDO AUDITORÍA…
      </div>
    )
  }

  return (
    <div className="audit-manager">
      <div className="audit-heading">
        <div>
          <span>
            CONTROL / 05
          </span>

          <h1>
            ACTIVIDAD.
          </h1>

          <p>
            Registro detallado de
            cambios realizados sobre
            usuarios, jugadores,
            estadísticas, VODs y clips.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
        >
          ACTUALIZAR
        </button>
      </div>

      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}

      <div className="audit-metrics">
        <article>
          <span>TOTAL</span>
          <strong>
            {metrics.total}
          </strong>
        </article>

        <article>
          <span>CREACIONES</span>
          <strong>
            {metrics.inserts}
          </strong>
        </article>

        <article>
          <span>CAMBIOS</span>
          <strong>
            {metrics.updates}
          </strong>
        </article>

        <article>
          <span>ELIMINACIONES</span>
          <strong>
            {metrics.deletes}
          </strong>
        </article>
      </div>

      <div className="audit-toolbar">
        <label className="audit-search">
          <span>BUSCAR</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Jugador, usuario, VOD, acción..."
          />
        </label>

        <label>
          <span>ENTIDAD</span>

          <select
            value={entityFilter}
            onChange={(event) =>
              setEntityFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              TODAS
            </option>

            {entityOptions.map(
              (entity) => (
                <option
                  key={entity}
                  value={entity}
                >
                  {ENTITY_LABELS[
                    entity
                  ] ||
                    entity.toUpperCase()}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>OPERACIÓN</span>

          <select
            value={
              operationFilter
            }
            onChange={(event) =>
              setOperationFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              TODAS
            </option>
            <option value="INSERT">
              CREAR
            </option>
            <option value="UPDATE">
              EDITAR
            </option>
            <option value="DELETE">
              ELIMINAR
            </option>
          </select>
        </label>

        <label>
          <span>ACTOR</span>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              TODOS
            </option>
            <option value="owner">
              OWNER
            </option>
            <option value="admin">
              ADMIN
            </option>
            <option value="player">
              PLAYER
            </option>
            <option value="system">
              SYSTEM
            </option>
          </select>
        </label>
      </div>

      <div className="audit-results-head">
        <span>
          REGISTROS
        </span>

        <strong>
          {filteredLogs.length}
          {' / '}
          {data.logs.length}
        </strong>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="audit-state">
          NO HAY REGISTROS PARA
          ESTOS FILTROS.
        </div>
      ) : (
        <div className="audit-list">
          {filteredLogs.map(
            (log) => {
              const operation =
                operationFromAction(
                  log.action,
                )

              const entityName =
                getAuditEntityLabel(
                  log,
                  data,
                )

              const changes =
                changedFields(log)

              const isOpen =
                expanded === log.id

              return (
                <article
                  key={log.id}
                  className={`audit-row ${
                    isOpen
                      ? 'open'
                      : ''
                  }`}
                >
                  <button
                    type="button"
                    className="audit-row-main"
                    onClick={() =>
                      setExpanded(
                        isOpen
                          ? null
                          : log.id,
                      )
                    }
                  >
                    <time>
                      {formatDate(
                        log.created_at,
                      )}
                    </time>

                    <div className="audit-operation">
                      <span
                        className={
                          operation.toLowerCase()
                        }
                      >
                        {operation}
                      </span>
                    </div>

                    <div className="audit-row-copy">
                      <strong>
                        {actionLabel(
                          log.action,
                        )}
                      </strong>

                      <small>
                        {entityName}
                      </small>
                    </div>

                    <div className="audit-actor">
                      <strong>
                        {actorCopy(
                          log,
                        )}
                      </strong>

                      <small>
                        {(
                          log.actor_role ||
                          'system'
                        ).toUpperCase()}
                      </small>
                    </div>

                    <div className="audit-row-entity">
                      <span>
                        {ENTITY_LABELS[
                          log.entity_type
                        ] ||
                          log.entity_type.toUpperCase()}
                      </span>

                      <small>
                        #{log.id}
                      </small>
                    </div>

                    <i>
                      {isOpen
                        ? '−'
                        : '+'}
                    </i>
                  </button>

                  {isOpen && (
                    <div className="audit-details">
                      <div className="audit-detail-meta">
                        <div>
                          <span>
                            LOG ID
                          </span>
                          <strong>
                            #{log.id}
                          </strong>
                        </div>

                        <div>
                          <span>
                            ENTITY ID
                          </span>
                          <strong>
                            {log.entity_id ||
                              '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            ACTOR ID
                          </span>
                          <strong>
                            {log.actor_user_id ||
                              'SYSTEM'}
                          </strong>
                        </div>
                      </div>

                      <div className="audit-changes-head">
                        <span>
                          {operation ===
                          'UPDATE'
                            ? 'CAMPOS MODIFICADOS'
                            : operation ===
                                'INSERT'
                              ? 'DATOS CREADOS'
                              : 'DATOS ELIMINADOS'}
                        </span>

                        <strong>
                          {changes.length}
                        </strong>
                      </div>

                      {changes.length ===
                      0 ? (
                        <div className="audit-no-changes">
                          SIN CAMBIOS
                          RELEVANTES.
                        </div>
                      ) : (
                        <div className="audit-changes">
                          {changes.map(
                            (change) => (
                              <div
                                key={
                                  change.key
                                }
                                className="audit-change-row"
                              >
                                <strong>
                                  {
                                    change.key
                                  }
                                </strong>

                                <div>
                                  <span>
                                    ANTES
                                  </span>
                                  <pre>
                                    {valueCopy(
                                      change.oldValue,
                                    )}
                                  </pre>
                                </div>

                                <div>
                                  <span>
                                    DESPUÉS
                                  </span>
                                  <pre>
                                    {valueCopy(
                                      change.newValue,
                                    )}
                                  </pre>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            },
          )}
        </div>
      )}
    </div>
  )
}
