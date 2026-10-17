import PortalPage from '../components/PortalPage'
import MatchesHub from '../components/MatchesHub'
export default function CalendarPage() {
  return <PortalPage title="CALENDARIO" intro="Partidos publicados por mes." aside={false}><MatchesHub /></PortalPage>
}
