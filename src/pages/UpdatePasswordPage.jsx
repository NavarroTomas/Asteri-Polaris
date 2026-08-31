import {
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function UpdatePasswordPage() {
  const [password, setPassword] =
    useState('')

  const [
    repeatPassword,
    setRepeatPassword,
  ] = useState('')

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const {
    loading,
    isAuthenticated,
    signOut,
  } = useAuth()

  const navigate = useNavigate()

  const submit =
    async (event) => {
      event.preventDefault()

      setError('')
      setMessage('')

      if (
        password.length < 8
      ) {
        setError(
          'La contraseña debe tener al menos 8 caracteres.',
        )
        return
      }

      if (
        password !==
        repeatPassword
      ) {
        setError(
          'Las contraseñas no coinciden.',
        )
        return
      }

      setSaving(true)

      try {
        const { error: updateError } =
          await supabase.auth
            .updateUser({
              password,
            })

        if (updateError) {
          throw updateError
        }

        setMessage(
          'Contraseña actualizada. Vas a volver al login.',
        )

        setPassword('')
        setRepeatPassword('')

        window.setTimeout(
          async () => {
            try {
              await signOut()
            } finally {
              navigate(
                '/login',
                {
                  replace: true,
                },
              )
            }
          },
          900,
        )
      } catch (err) {
        setError(
          err.message ||
          'No se pudo cambiar la contraseña.',
        )
      } finally {
        setSaving(false)
      }
    }

  if (loading) {
    return (
      <main className="auth-loading">
        <span>
          ASTERI / VALIDANDO RECUPERACIÓN
        </span>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="asteri-auth-page">
        <Link
          className="asteri-auth-back"
          to="/login"
        >
          ← LOGIN
        </Link>

        <section className="asteri-auth-layout">
          <div className="asteri-auth-copy">
            <span>
              ACCOUNT RECOVERY / 02
            </span>

            <h1>
              ENLACE
              <br />
              INVÁLIDO.
            </h1>

            <p>
              El enlace expiró, ya fue
              utilizado o la sesión de
              recuperación no pudo
              iniciarse.
            </p>
          </div>

          <div className="asteri-auth-form">
            <div className="asteri-auth-form-head">
              <span>
                RECOVERY
              </span>

              <strong>
                SIN SESIÓN
              </strong>
            </div>

            <Link
              className="asteri-auth-link-button"
              to="/forgot-password"
            >
              PEDIR OTRO ENLACE
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="asteri-auth-page">
      <Link
        className="asteri-auth-back"
        to="/account"
      >
        ← CUENTA
      </Link>

      <section className="asteri-auth-layout">
        <div className="asteri-auth-copy">
          <span>
            ACCOUNT SECURITY / 01
          </span>

          <h1>
            NUEVA
            <br />
            CONTRASEÑA.
          </h1>

          <p>
            Definí una contraseña nueva
            para tu cuenta ASTERI.
          </p>
        </div>

        <form
          className="asteri-auth-form"
          onSubmit={submit}
        >
          <div className="asteri-auth-form-head">
            <span>
              SECURITY
            </span>

            <strong>
              CHANGE PASSWORD
            </strong>
          </div>

          <label>
            <span>
              NUEVA CONTRASEÑA
            </span>

            <input
              type="password"
              autoComplete="new-password"
              minLength="8"
              value={password}
              onChange={(event) => {
                setError('')
                setMessage('')
                setPassword(
                  event.target.value,
                )
              }}
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
                repeatPassword
              }
              onChange={(event) => {
                setError('')
                setMessage('')
                setRepeatPassword(
                  event.target.value,
                )
              }}
              placeholder="Repetí la contraseña"
              required
            />
          </label>

          {error && (
            <p className="asteri-auth-message error">
              {error}
            </p>
          )}

          {message && (
            <p className="asteri-auth-message success">
              {message}
            </p>
          )}

          <button
            className="asteri-auth-submit"
            disabled={saving}
          >
            {saving
              ? 'ACTUALIZANDO…'
              : 'CAMBIAR CONTRASEÑA'}
          </button>
        </form>
      </section>
    </main>
  )
}
