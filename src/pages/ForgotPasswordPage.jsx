import {
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState('')

  const [sending, setSending] =
    useState(false)

  const [error, setError] =
    useState('')

  const [sent, setSent] =
    useState(false)

  const submit =
    async (event) => {
      event.preventDefault()

      setError('')
      setSending(true)

      try {
        const redirectTo =
          `${window.location.origin}/update-password`

        const { error: resetError } =
          await supabase.auth
            .resetPasswordForEmail(
              email.trim(),
              {
                redirectTo,
              },
            )

        if (resetError) {
          throw resetError
        }

        /*
          Siempre mostramos el mismo
          resultado. No revelamos si el
          email existe o no.
        */
        setSent(true)
      } catch (err) {
        const message =
          err?.message || ''

        if (
          message
            .toLowerCase()
            .includes('rate limit')
        ) {
          setError(
            'Se hicieron demasiadas solicitudes. Esperá un momento y volvé a probar.',
          )
        } else {
          setError(
            message ||
            'No se pudo enviar el enlace.',
          )
        }
      } finally {
        setSending(false)
      }
    }

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
            ACCOUNT RECOVERY / 01
          </span>

          <h1>
            RECUPERAR
            <br />
            ACCESO.
          </h1>

          <p>
            Ingresá el email de tu
            cuenta. Si existe, vas a
            recibir un enlace para
            definir una contraseña
            nueva.
          </p>
        </div>

        {sent ? (
          <div className="asteri-auth-form">
            <div className="asteri-auth-form-head">
              <span>
                RECOVERY
              </span>

              <strong>
                EMAIL ENVIADO
              </strong>
            </div>

            <div className="asteri-auth-result">
              <strong>
                REVISÁ TU CORREO.
              </strong>

              <p>
                Si existe una cuenta
                asociada a{' '}
                <b>{email}</b>, vas a
                recibir un enlace de
                recuperación.
              </p>
            </div>

            <Link
              className="asteri-auth-link-button"
              to="/login"
            >
              VOLVER AL LOGIN
            </Link>
          </div>
        ) : (
          <form
            className="asteri-auth-form"
            onSubmit={submit}
          >
            <div className="asteri-auth-form-head">
              <span>
                RECOVERY
              </span>

              <strong>
                RESET PASSWORD
              </strong>
            </div>

            <label>
              <span>
                EMAIL
              </span>

              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setError('')
                  setEmail(
                    event.target.value,
                  )
                }}
                placeholder="player@email.com"
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
              disabled={sending}
            >
              {sending
                ? 'ENVIANDO…'
                : 'ENVIAR ENLACE'}
            </button>

            <div className="asteri-auth-bottom">
              <span>
                ¿RECORDÁS TU CLAVE?
              </span>

              <Link to="/login">
                INICIAR SESIÓN →
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}
