import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

function loginErrorCopy(error) {
  const message =
    error?.message || ''

  if (
    message ===
    'Invalid login credentials'
  ) {
    return 'Email o contraseña incorrectos.'
  }

  if (
    message
      .toLowerCase()
      .includes('rate limit')
  ) {
    return 'Demasiados intentos. Esperá un momento y volvé a probar.'
  }

  return (
    message ||
    'No se pudo iniciar sesión.'
  )
}

export default function LoginPage() {
  const [form, setForm] =
    useState({
      email: '',
      password: '',
    })

  const [error, setError] =
    useState('')

  const [sending, setSending] =
    useState(false)

  const {
    loading,
    isAuthenticated,
    isSuspended,
    isOwner,
    isAdmin,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const destination =
    location.state?.from ||
    '/account'

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
      destination,
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
    destination,
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
      setSending(true)

      try {
        const { error: loginError } =
          await supabase.auth
            .signInWithPassword({
              email:
                form.email.trim(),
              password:
                form.password,
            })

        if (loginError) {
          throw loginError
        }

        /*
          No navegamos acá.
          AuthContext carga la sesión + profile
          y el useEffect de arriba decide si:
          - OWNER/ADMIN -> /admin
          - suspended -> /suspended
          - player -> destination
        */
      } catch (err) {
        setError(
          loginErrorCopy(err),
        )
      } finally {
        setSending(false)
      }
    }

  return (
    <main className="asteri-auth-page">
      <Link
        className="asteri-auth-back"
        to="/"
      >
        ← ASTERI
      </Link>

      <section className="asteri-auth-layout">
        <div className="asteri-auth-copy">
          <span>
            PLAYER SYSTEM / 01
          </span>

          <h1>
            INICIAR
            <br />
            SESIÓN.
          </h1>

          <p>
            Acceso privado para
            jugadores y administración
            de ASTERI POLARIS.
          </p>
        </div>

        <form
          className="asteri-auth-form"
          onSubmit={submit}
        >
          <div className="asteri-auth-form-head">
            <span>
              ACCESS
            </span>

            <strong>
              ASTERI POLARIS
            </strong>
          </div>

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

          <label>
            <div className="asteri-auth-label-row">
              <span>
                CONTRASEÑA
              </span>

              <Link to="/forgot-password">
                ¿LA OLVIDASTE?
              </Link>
            </div>

            <input
              type="password"
              autoComplete="current-password"
              value={
                form.password
              }
              onChange={(event) =>
                set(
                  'password',
                  event.target.value,
                )
              }
              placeholder="••••••••"
              required
            />
          </label>

          {error && (
            <p className="asteri-auth-message error">
              {error}
            </p>
          )}

          <button
            className="asteri-auth-submit"
            type="submit"
            disabled={sending}
          >
            {sending
              ? 'ENTRANDO…'
              : 'ENTRAR'}
          </button>

          <div className="asteri-auth-bottom">
            <span>
              ¿NO TENÉS CUENTA?
            </span>

            <Link to="/register">
              SOLICITAR ACCESO →
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
