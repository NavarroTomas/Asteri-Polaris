import { matchRosterLabel } from '../lib/matchRosters'
import './MatchRosterBadge.css'
export default function MatchRosterBadge({match}) {
 if(match.isEvent)return null
 return <span className="match-roster-badge" data-unassigned={!match.rosterId||undefined}>{matchRosterLabel(match)}</span>
}
