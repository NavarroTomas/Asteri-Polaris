import { useNavigate } from 'react-router-dom'

export function getAdminModules(isOwner) {
  return [
    { id: 'analytics', title: 'Analítica' },
    { id: 'rosters', title: 'Planteles' },
    { id: 'roster', title: 'Jugadores' },
    { id: 'vods', title: 'Partidos y VODs' },
    { id: 'users', title: 'Usuarios' },
    ...(isOwner ? [{ id: 'pending', title: 'Solicitudes' }, { id: 'home', title: 'Configuración web' }] : []),
    { id: 'activity', title: 'Actividad' },
  ]
}

export default function AdminSectionNav({ activeSection, isOwner }) {
  const navigate = useNavigate()
  if (activeSection === 'overview') return null

  const sections = [{ id: 'overview', title: 'Panel' }, ...getAdminModules(isOwner)]
  return <nav className="admin-section-nav" aria-label="Secciones del panel">
    {sections.map(section => <button
      key={section.id}
      type="button"
      aria-current={activeSection === section.id ? 'page' : undefined}
      onClick={() => navigate(section.id === 'overview' ? '/admin' : section.id === 'vods' ? '/admin/vods' : '/admin?section=' + section.id)}
    >{section.title}</button>)}
  </nav>
}
