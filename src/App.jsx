import { Route, Routes } from 'react-router-dom'
import ThemeToggle from './components/ThemeToggle'
import QuietCursor from './components/QuietCursor'
import PageEntrance from './components/PageEntrance'
import HomePage from './pages/HomePage'
import TeamPage from './pages/TeamPage'
import MatchesPage from './pages/MatchesPage'
import CalendarPage from './pages/CalendarPage'
import TournamentsPage from './pages/TournamentsPage'
import MediaPage from './pages/MediaPage'
import { AboutPage, HistoryPage, CommunityPage, ContactPage, ApplicationPage } from './pages/OrganizationPages'
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
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import StaffRoute from './components/StaffRoute'
import RouteScrollManager from './components/RouteScrollManager'
import SeoManager from './components/SeoManager'
import AnalyticsTracker from './components/AnalyticsTracker'
import RosterInteractionEnhancer from './components/RosterInteractionEnhancer'
import MatchTerminologySync from './components/MatchTerminologySync'

export default function App() {
  return (
    <>
      <SeoManager />
      <AnalyticsTracker />
      <RouteScrollManager />
      <PageEntrance />
      <ThemeToggle />
      <QuietCursor />

      <RosterInteractionEnhancer />
      <MatchTerminologySync />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/equipo" element={<TeamPage />} />
        <Route path="/partidos" element={<MatchesPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/torneos" element={<TournamentsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/historia" element={<HistoryPage />} />
        <Route path="/comunidad" element={<CommunityPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/inscripcion" element={<ApplicationPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/update-password"
          element={<UpdatePasswordPage />}
        />

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

        <Route
          path="/players/:slug"
          element={<PlayerPage />}
        />

        <Route
          path="/vods/:slug"
          element={<VodPage />}
        />

        <Route
          path="/admin/vods"
          element={
            <StaffRoute>
              <VodAdminPage />
            </StaffRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
