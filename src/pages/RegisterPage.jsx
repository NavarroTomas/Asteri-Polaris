import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const [form, setForm] =
    useState({
      displayName: '',
      email: '',
      password: '',
      repeatPassword: '',
    })

  const [error, setError] =
    useState('')

  const [sending, setSending] =
    useState(false)
  const [message, setMessage] = useState('')
  const [registrationReady, setRegistrationReady] = useState(null)
  useEffect(() => {
    let alive = true
    supabase.rpc('fan_accounts_ready').then(({ data, error }) => { if (alive) setRegistrationReady(!error && data === true) })
    return () => { alive = false }
  }, [])

  const {
    loading,
    isAuthenticated,
    isSuspended,
    isOwner,
    isAdmin,
  } = useAuth()

  const navigate = useNavigate()

  useEffect(() => {
    if (
      loading ||
      !isAuthenticated
    ) {
      return
    }

    if (isSuspended) {
      navigate(
        '/suspended',
        {
          replace: true,
        },
      )
      return
    }

    if (isOwner || isAdmin) {
      navigate(
        '/admin',
        {
          replace: true,
        },
      )
      return
    }

    navigate(
      '/account',
      {
        replace: true,
      },
    )
  }, [
    loading,
    isAuthenticated,
    isSuspended,
    isOwner,
    isAdmin,
    navigate,
  ])

  const set = (
    key,
    value,
  ) => {
    setError('')

    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )
  }

  const submit =
    async (event) => {
      event.preventDefault()

      setError('')
      setMessage('')
      if (!registrationReady) { setError('El registro de hinchas todavía no está habilitado.'); return }

      if (
        form.password.length < 8
      ) {
        setError(
          'La contraseña debe tener al menos 8 caracteres.',
        )
        return
      }

      if (
        form.password !==
        form.repeatPassword
      ) {
        setError(
          'Las contraseñas no coinciden.',
        )
        return
      }

      setSending(true)

      try {
        const {
          data: signUpData,
          error: signUpError,
        } =
          await supabase.auth.signUp({
            email:
              form.email.trim(),
            password:
              form.password,
            options: {
              data: {
                display_name:
                  form.displayName.trim(),
              },
            },
          })

        if (signUpError) {
          throw signUpError
        }
        if (!signUpData.session) setMessage('Solicitud creada. El owner debe aprobar tu cuenta antes de habilitar tu perfil.')
      } catch (err) {
        setError(
          err.message ||
          'No se pudo crear la cuenta.',
        )
      } finally {
        setSending(false)
      }
    }

  return (
    <main className="asteri-auth-page asteri-register-page">
      <Link
        className="asteri-auth-back"
        to="/"
      >
        Volver al inicio
      </Link>

      <section className="asteri-register-layout">
        <div className="asteri-register-copy">
          <h1>Sumate a la hinchada</h1>
          <p>Creá tu cuenta, elegí tu jugador favorito y acompañá al equipo.</p>
          <p>Tu cuenta queda pendiente hasta que el owner la apruebe. Después podés elegir tu jugador favorito y completar tu perfil de hincha.</p>
        </div>

        <form
          className="asteri-auth-form asteri-register-form"
          onSubmit={submit}
        >
          <div className="asteri-auth-form-head">
            <span>
              REGISTRO
            </span>

            <strong>
              NUEVA CUENTA
            </strong>
          </div>

          <label>
            <span>
              NOMBRE / NICKNAME
            </span>

            <input
              value={
                form.displayName
              }
              onChange={(event) =>
                set(
                  'displayName',
                  event.target.value,
                )
              }
              placeholder="Onlyfran"
              minLength="2"
              required
            />
          </label>

          <label>
            <span>
              EMAIL
            </span>

            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                set(
                  'email',
                  event.target.value,
                )
              }
              placeholder="player@email.com"
              required
            />
          </label>

          <div className="asteri-register-passwords">
            <label>
              <span>
                CONTRASEÑA
              </span>

              <input
                type="password"
                autoComplete="new-password"
                minLength="8"
                value={
                  form.password
                }
                onChange={(event) =>
                  set(
                    'password',
                    event.target.value,
                  )
                }
                placeholder="Mínimo 8 caracteres"
                required
              />
            </label>

            <label>
              <span>
                REPETIR CONTRASEÑA
              </span>

              <input
                type="password"
                autoComplete="new-password"
                minLength="8"
                value={
                  form.repeatPassword
                }
                onChange={(event) =>
                  set(
                    'repeatPassword',
                    event.target.value,
                  )
                }
                placeholder="Repetí la contraseña"
                required
              />
            </label>
          </div>

          {error && (
            <p className="asteri-auth-message error">
              {error}
            </p>
          )}

          {message && <p className="asteri-auth-message" role="status">{message}</p>}
          {registrationReady === null && <p className="asteri-auth-note" role="status">Comprobando disponibilidad del registro…</p>}{registrationReady === false && <p className="asteri-auth-note" role="status">El registro no está disponible en este momento. Intentá más tarde.</p>}
          <p className="asteri-auth-note">El owner revisa cada cuenta nueva. Por seguridad, se permite un registro cada 10 minutos desde la misma conexión. Se guarda una huella temporal de la IP, sin asociarla a tu perfil.</p>

          <button
            className="asteri-auth-submit"
            type="submit"
            disabled={sending || !registrationReady}
          >
            {sending
              ? 'CREANDO…'
              : 'CREAR CUENTA'}
          </button>

          <div className="asteri-auth-bottom">
            <span>
              ¿YA TENÉS CUENTA?
            </span>

            <Link to="/login">
              INICIAR SESIÓN
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
