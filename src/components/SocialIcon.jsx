export default function SocialIcon({ name, size = 24 }) {
  const key = name.toLowerCase().replace(/[^a-z]/g, '')
  const paths = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>,
    x: <><path d="m4 3 16 18M20 3 4 21M4 3h5l11 18h-5Z"/></>,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3Z" fill="currentColor" stroke="none"/></>,
    twitch: <><path d="M4 2h18v13l-6 6h-5l-4 3v-3H2V6Z"/><path d="M10 7v6m6-6v6"/></>,
    steam: <><circle cx="16" cy="7" r="5"/><circle cx="16" cy="7" r="2"/><circle cx="7" cy="17" r="4"/><path d="m10 19 8-7M8 13l4-7M1 13l6 4"/></>,
    faceit: <path d="M3 12h12l6-9v18Z" fill="currentColor" stroke="none"/>,
    discord: <><path d="m7 5-3 1C2 10 1 14 2 18l5 2 1-2m9-13 3 1c2 4 3 8 2 12l-5 2-1-2M7 6c3-1 7-1 10 0M6 16c3 2 9 2 12 0"/><circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[key === 'xtwitter' ? 'x' : key] || <circle cx="12" cy="12" r="8"/>}</svg>
}
