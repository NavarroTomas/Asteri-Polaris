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
        ← ASTERI
      </Link>

      <section className="asteri-register-layout">
        <div className="asteri-register-copy">
          <span>
            PLAYER ACCESS
          </span>

          <h1>
            SOLICITÁ
            <br />
            ACCESO.
          </h1>

          <p>
            Creá tu cuenta para acceder al sistema privado
            de jugadores. El Owner revisará la solicitud y
            la vinculará con tu perfil de ASTERI.
          </p>

          <div className="asteri-register-steps">
            <article>
              <strong>01</strong>
              <div>
                <span>CREÁ TU CUENTA</span>
                <p>Usá tu nickname habitual y un email válido.</p>
              </div>
            </article>

            <article>
              <strong>02</strong>
              <div>
                <span>ESPERÁ LA APROBACIÓN</span>
                <p>La cuenta queda pendiente hasta ser vinculada.</p>
              </div>
            </article>

            <article>
              <strong>03</strong>
              <div>
                <span>GESTIONÁ TU PERFIL</span>
                <p>Una vez aprobado podés editar tus datos de jugador.</p>
              </div>
            </article>
          </div>
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

          <p className="asteri-auth-note">
            La cuenta se crea inmediatamente, pero el acceso
            de jugador permanece pendiente hasta que el Owner
            la apruebe.
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
