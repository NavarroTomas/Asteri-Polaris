import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import SuspendedPage from './pages/SuspendedPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import PlayerPage from './pages/PlayerPage'
import VodPage from './pages/VodPage'
import VodAdminPage from './pages/VodAdminPage'
import ProtectedRoute from './components/ProtectedRoute'
import StaffRoute from './components/StaffRoute'
import RouteScrollManager from './components/RouteScrollManager'

export default function App() {
  return (
    <>
      <RouteScrollManager />
      <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route
        path="/suspended"
        element={
          <ProtectedRoute allowSuspended>
            <SuspendedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <StaffRoute>
            <AdminPage />
          </StaffRoute>
        }
      />

      <Route path="/players/:slug" element={<PlayerPage />} />
      <Route path="/vods/:slug" element={<VodPage />} />

      <Route
        path="/admin/vods"
        element={
          <StaffRoute>
            <VodAdminPage />
          </StaffRoute>
        }
      />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
