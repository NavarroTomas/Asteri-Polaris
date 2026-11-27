export const UNASSIGNED_ROSTER = 'Plantel sin asignar'
export const matchRosterLabel = match => match.rosterLabel || UNASSIGNED_ROSTER
export const matchRosterKey = match => match.isEvent ? 'event' : match.rosterId || 'none'
export function rosterOptions(matches) {
 const options=new Map()
 for(const match of matches) if(!match.isEvent) options.set(matchRosterKey(match),matchRosterLabel(match))
 return [...options].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'es'))
}
export function filterCalendarMatches(matches, category='all', roster='all') {
 return matches.filter(match=>(category==='all'||(category==='none'?!match.filter:match.filter?.id===category))&&(roster==='all'||matchRosterKey(match)===roster))
}
