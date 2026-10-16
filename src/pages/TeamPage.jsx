import Header from '../components/Header'
import PortalFooter from '../components/PortalFooter'
import RosterShowcase from '../components/RosterShowcase'
import AsteriNumbers from '../components/AsteriNumbers'
import HistoryTimeline from '../components/HistoryTimeline'
import FounderSection from '../components/FounderSection'
import NextObjective from '../components/NextObjective'
export default function TeamPage() {
  return <div className="ap-team-page"><Header /><main id="contenido" tabIndex={-1}><h1 className="ap-page-title">EL EQUIPO. NUESTRA HISTORIA.</h1><RosterShowcase /><AsteriNumbers /><HistoryTimeline /><FounderSection /><NextObjective /></main><PortalFooter /></div>
}
