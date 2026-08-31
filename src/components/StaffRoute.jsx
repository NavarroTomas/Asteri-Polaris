import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function StaffRoute({
  children,
}) {
  const {
    loading,
    isAuthenticated,
    isOwner,
    isAdmin,
    isActive,
    isSuspended,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return (
      <main className="auth-loading">
        <span>
          ASTERI / VALIDANDO PERMISOS
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

  if (isSuspended) {
    return (
      <Navigate
        to="/suspended"
        replace
      />
    )
  }

  if (
    !isActive ||
    (!isOwner && !isAdmin)
  ) {
    return (
      <Navigate
        to="/account"
        replace
      />
    )
  }

  return children
}
