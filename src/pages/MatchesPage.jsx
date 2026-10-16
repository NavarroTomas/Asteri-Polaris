import Header from '../components/Header'
import PortalFooter from '../components/PortalFooter'
import MatchesHub from '../components/MatchesHub'

export default function MatchesPage() {
  return <div className="ap-team-page"><Header /><main id="contenido" tabIndex={-1}><h1 className="ap-page-title">CALENDARIO Y RESULTADOS.</h1><MatchesHub /></main><PortalFooter /></div>
}
