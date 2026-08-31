import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({
  children,
  allowSuspended = false,
}) {
  const {
    loading,
    isAuthenticated,
    isSuspended,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return (
      <main className="auth-loading">
        <span>
          ASTERI / VALIDANDO SESIÓN
        </span>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (
    isSuspended &&
    !allowSuspended
  ) {
    return (
      <Navigate
        to="/suspended"
        replace
      />
    )
  }

  return children
}
