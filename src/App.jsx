import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <Routes>
      {/* Web pública temporal.
          Login, cuentas, admin y fichas individuales quedan deshabilitados. */}
      <Route path="/" element={<HomePage />} />

      {/* Cualquier ruta vieja vuelve al inicio mientras esas áreas estén deshabilitadas. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
