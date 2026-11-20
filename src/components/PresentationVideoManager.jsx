import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadSiteMedia } from '../lib/contentAdmin'
export default function PresentationVideoManager(){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 useEffect(()=>{let alive=true;supabase.from('site_settings').select('presentation_video_url').eq('id',1).single().then(({data,error})=>{if(alive){if(error)setError(error.message);else setUrl(data?.presentation_video_url||'')}});return()=>{alive=false}},[])
 const upload=async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{setUrl(await uploadSiteMedia(file));setMessage('Archivo subido. Guardá el video para publicarlo.')}catch(err){setError(err.message)}finally{setBusy(false);e.target.value=''}}
 const save=async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{const {error}=await supabase.from('site_settings').update({presentation_video_url:url.trim()||null}).eq('id',1).select('id').single();if(error)throw error;setMessage('Presentación actualizada en Inicio y Media.')}catch(err){setError(err.message)}finally{setBusy(false)}}
 return <section className="admin-settings-card"><h2>Video de presentación de Facu</h2><p>Se muestra en «Qué es ASTERI Polaris», en Inicio y Media.</p>{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}<form className="admin-hero-form" onSubmit={save}><label>Subir MP4 o WebM (hasta 50 MB)<input type="file" accept="video/mp4,video/webm" disabled={busy} onChange={upload}/></label><label>O pegar una URL directa al video<input type="url" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy} placeholder="https://…"/></label><button disabled={busy}>{busy?'Guardando…':'Guardar presentación'}</button></form></section>
}
