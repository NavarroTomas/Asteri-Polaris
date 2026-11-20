import { FaceitTournamentImport } from './FaceitConnection'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { deleteContent, listApplications, listOpenings, listTournaments, saveContent, uploadSiteMedia } from '../lib/contentAdmin'
import './ContentManager.css'

const emptyTournament = { title:'', game:'Counter-Strike 2', description:'', starts_on:'', ends_on:'', cover_url:'', external_url:'', is_published:false }
const emptyOpening = { title:'', area:'', description:'', questions:[], closes_on:'', is_open:false }

export default function ContentManager({ type }) {
  const tournament = type === 'tournaments'
  const table = tournament ? 'tournaments' : 'application_openings'
  const empty = tournament ? emptyTournament : emptyOpening
  const [rows,setRows] = useState([])
  const [form,setForm] = useState({ ...empty })
  const [applications,setApplications] = useState([])
  const [busy,setBusy] = useState(false)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [attempt,setAttempt] = useState(0)
  const refresh = async () => {
    const [items, responses] = await Promise.all([tournament ? listTournaments() : listOpenings(), tournament ? [] : listApplications()])
    setRows(items); setApplications(responses)
  }
  useEffect(() => { let alive=true; setLoading(true); setError(''); Promise.all([tournament ? listTournaments() : listOpenings(), tournament ? [] : listApplications()]).then(([items,responses]) => { if(alive){setRows(items);setApplications(responses)} }).catch(err=>{if(alive)setError(err.message)}).finally(()=>{if(alive)setLoading(false)}); return()=>{alive=false} },[type,attempt])
  const set = (key,value) => {setForm(current=>({...current,[key]:value}));setMessage('')}
  const save = async event => {
    event.preventDefault();setBusy(true);setError('');setMessage('')
    try {
      const payload = {...form}
      if(tournament) { payload.ends_on ||= null; payload.cover_url ||= null; payload.external_url ||= null }
      else { payload.closes_on ||= null; payload.questions=[...new Set(payload.questions.map(question=>question.trim()).filter(Boolean))] }
      const saved = await saveContent(table,payload)
      setForm({...empty,...saved});await refresh();setMessage(tournament?'Torneo guardado.':'Convocatoria guardada.')
    } catch(err){setError(err.message)} finally{setBusy(false)}
  }
  const remove = async () => {
    if(!window.confirm(tournament?'¿Eliminar este torneo? Sus partidos se conservan.':'¿Eliminar esta convocatoria? Solo se puede eliminar si no tiene respuestas.')) return
    setBusy(true);setError('');setMessage('')
    try { await deleteContent(table,form.id);setForm({...empty});await refresh();setMessage('Eliminado.') }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const upload = async event => { const file=event.target.files?.[0];if(!file)return;setBusy(true);setError('');try{set('cover_url',await uploadSiteMedia(file))}catch(err){setError(err.message)}finally{setBusy(false);event.target.value=''} }
  const review = async (id,status) => {setBusy(true);setError('');try{const {error}=await supabase.from('applications').update({status}).eq('id',id).select('id').single();if(error)throw error;await refresh()}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <section className="content-manager">
    {error&&<p role="alert">{error} <button disabled={busy} onClick={()=>setAttempt(value=>value+1)}>Reintentar</button></p>}{message&&<p role="status">{message}</p>}
    {tournament&&<FaceitTournamentImport disabled={busy} onImport={draft=>{setForm(draft);setMessage('Datos importados. Revisalos y guardá el torneo.')}}/>}
    {loading?<p role="status">Cargando…</p>:<div className="content-manager-grid"><aside><button disabled={busy} onClick={()=>{setForm({...empty});setMessage('');setError('')}}>{tournament?'Nuevo torneo':'Nueva convocatoria'}</button>{rows.map(row=><button key={row.id} disabled={busy} aria-pressed={row.id===form.id} onClick={()=>{setForm({...empty,...row});setMessage('');setError('')}}><strong>{row.title}</strong><small>{tournament?row.starts_on:row.area}</small></button>)}</aside>
      <form onSubmit={save}><h2>{form.id?'Editar':'Crear'} {tournament?'torneo':'convocatoria'}</h2><fieldset disabled={busy}>
        <label>Título<input required minLength={2} maxLength={140} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
        <label>{tournament?'Juego':'Juego o área'}<input required maxLength={100} value={tournament?form.game:form.area} onChange={e=>set(tournament?'game':'area',e.target.value)} placeholder="CS2, Valorant, contenido…"/></label>
        <label>Descripción<textarea rows={4} maxLength={tournament?3000:5000} value={form.description} onChange={e=>set('description',e.target.value)}/></label>
        {tournament?<><label>Fecha de inicio<input type="date" required value={form.starts_on} onChange={e=>set('starts_on',e.target.value)}/></label><label>Fecha de cierre<input type="date" min={form.starts_on} value={form.ends_on||''} onChange={e=>set('ends_on',e.target.value)}/></label><label>Imagen de la card<input type="url" value={form.cover_url||''} onChange={e=>set('cover_url',e.target.value)} placeholder="https://…"/></label><label>Subir imagen<input type="file" accept="image/webp,image/png,image/jpeg" onChange={upload}/></label><label>Enlace oficial<input type="url" value={form.external_url||''} onChange={e=>set('external_url',e.target.value)}/></label><label><input type="checkbox" checked={form.is_published} onChange={e=>set('is_published',e.target.checked)}/>Publicar en Torneos y calendario</label><p>Asigná los partidos y sus fechas desde <Link to="/admin/vods">Partidos y VODs</Link>.</p></>:<><label>Preguntas (una por línea, hasta 12)<textarea rows={6} value={form.questions.join('\n')} onChange={e=>set('questions',e.target.value.split('\n').slice(0,12))}/></label><label>Fecha límite (opcional)<input type="date" value={form.closes_on||''} onChange={e=>set('closes_on',e.target.value)}/></label><label><input type="checkbox" checked={form.is_open} onChange={e=>set('is_open',e.target.checked)}/>Aceptar postulaciones</label></>}
        <div className="content-manager-actions"><button type="submit">{busy?'Guardando…':'Guardar'}</button>{form.id&&<button type="button" onClick={remove}>Eliminar</button>}</div>
      </fieldset></form>
    </div>}
    {!tournament&&<section className="content-responses"><h2>Postulaciones recibidas</h2>{!applications.length&&<p>Todavía no hay respuestas.</p>}{applications.map(item=><details key={item.id}><summary>{item.nickname} · {item.opening?.title} · {{pending:'Pendiente',reviewing:'En revisión',accepted:'Aceptada',rejected:'Rechazada'}[item.status]}</summary><p>Contacto: {item.contact}</p>{Object.entries(item.answers).map(([question,answer])=><div key={question}><strong>{question}</strong><p>{String(answer)}</p></div>)}<label>Estado<select disabled={busy} value={item.status} onChange={e=>review(item.id,e.target.value)}><option value="pending">Pendiente</option><option value="reviewing">En revisión</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option></select></label></details>)}</section>}
  </section>
}
