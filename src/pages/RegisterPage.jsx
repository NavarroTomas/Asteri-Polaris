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

        /*
          Email confirmation está desactivado
          en ASTERI.

          El trigger crea:
          role = player
          status = pending

          AuthContext detecta la nueva sesión
          y la página redirige a /account.
        */
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
            PLAYER SYSTEM / 02
          </span>

          <h1>
            CREAR
            <br />
            CUENTA.
          </h1>

          <p>
            El registro crea una
            solicitud de acceso. El
            Owner deberá aprobarla y
            vincularla con el jugador
            correspondiente.
          </p>
        </div>

        <form
          className="asteri-auth-form"
          onSubmit={submit}
        >
          <div className="asteri-auth-form-head">
            <span>
              REGISTER
            </span>

            <strong>
              SOLICITAR ACCESO
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

          {error && (
            <p className="asteri-auth-message error">
              {error}
            </p>
          )}

          <p className="asteri-auth-note">
            Después del registro podés
            iniciar sesión normalmente,
            pero el perfil permanecerá
            PENDIENTE hasta que el Owner
            lo apruebe.
          </p>

          <button
            className="asteri-auth-submit"
            type="submit"
            disabled={sending}
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
              INICIAR SESIÓN →
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
