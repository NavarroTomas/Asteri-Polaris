const paths = {
  analytics: <><path d="M4 4v16h16" /><path d="M8 15v-4m5 4V7m5 8V4" /></>,
  rosters: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="M8 12h8m-4-4v8" /></>,
  roster: <><path d="m8 4-5 3 3 5 2-1v9h8v-9l2 1 3-5-5-3" /><path d="M8 4a4 4 0 0 0 8 0M10 15h4" /></>,
  vods: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 10h18m-11 3 5 3-5 3v-6Z" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" /></>,
  pending: <><path d="M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3" /><rect x="8" y="2" width="8" height="5" rx="2" /><path d="m8 14 3 3 5-6" /></>,
  home: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 8h18M8 13h8m-8 4h8m-5-6v4m3 0v4" /></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>
}

export default function AdminModuleIcon({ name }) {
  return <svg className="admin-module-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
