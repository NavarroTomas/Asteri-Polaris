import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function SuspendedPage() {
  const {
    profile,
    signOut,
  } = useAuth()

  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error(
        'No se pudo cerrar la sesión:',
        error,
      )
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
            ACCOUNT STATUS / SUSPENDED
          </span>

          <h1>
            ACCESO
            <br />
            SUSPENDIDO.
          </h1>

          <p>
            Esta cuenta no tiene acceso
            al sistema privado de ASTERI
            en este momento.
          </p>
        </div>

        <div className="asteri-auth-form">
          <div className="asteri-auth-form-head">
            <span>
              STATUS
            </span>

            <strong>
              SUSPENDED
            </strong>
          </div>

          <div className="asteri-auth-result">
            <small>
              CUENTA
            </small>

            <strong>
              {profile?.display_name ||
                profile?.email ||
                'USUARIO'}
            </strong>

            {profile?.email && (
              <p>
                {profile.email}
              </p>
            )}
          </div>

          <p className="asteri-auth-note">
            Si creés que se trata de un
            error, contactá a la
            administración de ASTERI.
          </p>

          <button
            type="button"
            className="asteri-auth-secondary-button"
            onClick={logout}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </section>
    </main>
  )
}
