import Header from '../components/Header'
import PortalFooter from '../components/PortalFooter'
import MatchesHub from '../components/MatchesHub'
export default function CalendarPage() {
  return <div className="pp-page"><Header /><main id="contenido" tabIndex={-1}><h1 className="ap-page-title">CALENDARIO POR MES.</h1><MatchesHub /></main><PortalFooter /></div>
}
