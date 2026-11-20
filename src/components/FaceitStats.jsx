import { useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
export default function FaceitStats({playerId}){
 const [data,setData]=useState(null)
 useEffect(()=>{let alive=true;setData(null);supabase.from('player_faceit_stats').select('nickname,elo,level,lifetime,synced_at').eq('player_id',playerId).maybeSingle().then(({data})=>{if(alive)setData(data)});return()=>{alive=false}},[playerId])
 if(!data)return null
 return <section className="public-player-section faceit-public-stats"><h2>FACEIT</h2><p>{data.nickname} · Actualizado el {new Intl.DateTimeFormat('es-AR',{dateStyle:'medium'}).format(new Date(data.synced_at))}</p><div className="public-player-stat-grid">{[['ELO',data.elo],['Nivel',data.level],['K/D',data.lifetime['Average K/D Ratio']],['Headshots',data.lifetime['Average Headshots %']],['Partidos',data.lifetime.Matches]].filter(([,value])=>value!=null).map(([label,value])=><article key={label}><span>{label}</span><strong>{String(value)}</strong></article>)}</div></section>
}
