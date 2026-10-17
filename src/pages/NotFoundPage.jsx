import { Link } from 'react-router-dom'
import PortalPage from '../components/PortalPage'
export default function NotFoundPage() {
  return <PortalPage title="Página no encontrada" aside={false}><section className="pp-empty"><p>La página que buscás no existe o cambió de ubicación.</p><Link className="ap-button" to="/">VOLVER AL INICIO</Link></section></PortalPage>
}
