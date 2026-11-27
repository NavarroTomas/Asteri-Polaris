import { FaceitTournamentImport } from './FaceitConnection'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { deleteContent, listApplications, listOpenings, listTournaments, saveContent, uploadSiteMedia } from '../lib/contentAdmin'
import './ContentManager.css'
import { normalizeGoogleFormUrl } from '../lib/googleForms'
import { argentinaToday } from '../hooks/usePublishedMatches'
import { buildOpeningPayload, loadManagerContent, openingVisibility } from '../lib/openingForms'

const emptyTournament = { title:'', game:'Counter-Strike 2', description:'', starts_on:'', ends_on:'', cover_url:'', external_url:'', page_title:'', page_body:'', format:'', location:'', rules_url:'', is_published:false }
const emptyOpening = { title:'', area:'', description:'', questions:[], google_form_url:'', closes_on:'', is_open:false }

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
  const [historyError,setHistoryError]=useState('')
  const [warning,setWarning]=useState('')
  const [attempt,setAttempt] = useState(0)
  const feedback=useRef(null)
  useEffect(()=>{if(!error&&!message&&!warning)return;feedback.current?.focus({preventScroll:true});feedback.current?.scrollIntoView({behavior:'auto',block:'nearest'})},[error,message,warning])
  const services={listTournaments,listOpenings,listApplications}
  const applyData=data=>{setRows(data.items);setApplications(data.responses);setHistoryError(data.historyError)}
  const refresh=async()=>applyData(await loadManagerContent(type,services))
  useEffect(()=>{let alive=true;setLoading(true);setError('');setWarning('');loadManagerContent(type,{listTournaments,listOpenings,listApplications}).then(data=>{if(alive)applyData(data)}).catch(err=>{if(alive)setError(err.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[type,attempt])
  const set = (key,value) => {setForm(current=>({...current,[key]:value}));setMessage('')}
  const save = async event => {
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');setWarning('')
    try {
      const payload = tournament?{...form}:buildOpeningPayload(form)
      if(tournament) { payload.ends_on ||= null; payload.cover_url ||= null; payload.external_url ||= null; payload.rules_url ||= null }
      const saved = await saveContent(table,payload)
      setForm({...empty,...saved});setRows(current=>[saved,...current.filter(row=>row.id!==saved.id)]);setMessage(tournament?'Torneo guardado.':openingVisibility(saved,argentinaToday())==='Publicada'?'Convocatoria publicada.':'Convocatoria guardada: '+openingVisibility(saved,argentinaToday()).toLocaleLowerCase('es')+'.');try{await refresh()}catch{setWarning('El cambio se guardó, pero no pudimos actualizar la lista. Reintentá la carga.')}
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
    <div className="content-manager-feedback" ref={feedback} tabIndex={-1}>{error&&<p role="alert">{error} <button disabled={busy} onClick={()=>setAttempt(value=>value+1)}>Reintentar</button></p>}{message&&<p role="status">{message}</p>}{warning&&<p role="status">{warning}</p>}</div>
    {tournament&&<FaceitTournamentImport disabled={busy} onImport={draft=>{setForm({...emptyTournament,...draft});setMessage('Datos importados. Revisalos y guardá el torneo.')}}/>}
    {loading?<p role="status">Cargando…</p>:<div className="content-manager-grid"><aside><button disabled={busy} onClick={()=>{setForm({...empty});setMessage('');setError('')}}>{tournament?'Nuevo torneo':'Nueva convocatoria'}</button>{rows.map(row=><button key={row.id} disabled={busy} aria-pressed={row.id===form.id} onClick={()=>{setForm({...empty,...row});setMessage('');setError('')}}><strong>{row.title}</strong><small>{tournament?row.starts_on:row.area}</small>{!tournament&&<small>{openingVisibility(row,argentinaToday())}</small>}{!tournament&&!normalizeGoogleFormUrl(row.google_form_url)&&<small>Falta enlace de Google Forms</small>}</button>)}</aside>
      <form onSubmit={save} noValidate={!tournament}><h2>{form.id?'Editar':'Crear'} {tournament?'torneo':'convocatoria'}</h2><fieldset disabled={busy}>
        <label>Título<input required minLength={2} maxLength={140} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
        <label>{tournament?'Juego':'Juego o área'}<input required minLength={2} maxLength={100} value={tournament?form.game:form.area} onChange={e=>set(tournament?'game':'area',e.target.value)} placeholder="CS2, Valorant, contenido…"/></label>
        <label>Descripción<textarea rows={4} maxLength={tournament?3000:5000} value={form.description} onChange={e=>set('description',e.target.value)}/></label>
        {tournament?<><label>Fecha de inicio<input type="date" required value={form.starts_on} onChange={e=>set('starts_on',e.target.value)}/></label><label>Fecha de cierre<input type="date" min={form.starts_on} value={form.ends_on||''} onChange={e=>set('ends_on',e.target.value)}/></label><label>Imagen de la card y portada<input type="url" value={form.cover_url||''} onChange={e=>set('cover_url',e.target.value)} placeholder="https://…"/></label><label>Subir imagen<input type="file" accept="image/webp,image/png,image/jpeg" onChange={upload}/></label><h3>Página del torneo</h3><label>Título de la página (opcional)<input maxLength={180} value={form.page_title||''} onChange={e=>set('page_title',e.target.value)}/></label><label>Contenido de la página<textarea rows={8} maxLength={15000} value={form.page_body||''} onChange={e=>set('page_body',e.target.value)} placeholder="Presentación, etapas, premios y novedades. Separá los párrafos con una línea vacía."/></label><label>Formato<input maxLength={150} value={form.format||''} onChange={e=>set('format',e.target.value)} placeholder="Grupos y playoffs, BO3…"/></label><label>Modalidad o ubicación<input maxLength={150} value={form.location||''} onChange={e=>set('location',e.target.value)} placeholder="Online, Buenos Aires…"/></label><label>Reglamento<input type="url" pattern="https://.*" value={form.rules_url||''} onChange={e=>set('rules_url',e.target.value)}/></label><label>Enlace oficial<input type="url" value={form.external_url||''} onChange={e=>set('external_url',e.target.value)}/></label><label><input type="checkbox" checked={form.is_published} onChange={e=>set('is_published',e.target.checked)}/>Publicar en Torneos y calendario</label>{form.id&&form.is_published&&<p><Link to={'/torneos/'+form.id} target="_blank" rel="noopener noreferrer">Ver página del torneo</Link></p>}<p>Asigná los partidos y sus fechas desde <Link to="/admin/vods">Partidos y VODs</Link>.</p></>:<><label>Enlace para responder de Google Forms<input type="url" aria-describedby="opening-form-help" required={form.is_open} value={form.google_form_url||''} onChange={e=>set('google_form_url',e.target.value)} placeholder="https://forms.gle/…"/></label><p id="opening-form-help">Pegá el enlace que Google Forms ofrece para responder (Enviar o Publicar), no el enlace de edición. La tarjeta abre este formulario. Las respuestas nuevas se consultan en Google Forms.</p><label>Fecha límite (opcional)<input type="date" value={form.closes_on||''} onChange={e=>set('closes_on',e.target.value)}/></label><label><input type="checkbox" checked={form.is_open} onChange={e=>set('is_open',e.target.checked)}/>Publicar convocatoria</label><p>{form.is_open?'La tarjeta será visible cuando tenga un enlace válido y la fecha no esté vencida.':'Convocatoria cerrada: no aparece en la página pública.'}</p>{form.closes_on&&form.closes_on<argentinaToday()&&<p role="status">La fecha límite ya pasó. Actualizala para que la convocatoria pueda aparecer.</p>}{normalizeGoogleFormUrl(form.google_form_url)&&<a href={normalizeGoogleFormUrl(form.google_form_url)} target="_blank" rel="noopener noreferrer">Probar formulario de Google</a>}<Link to="/postulaciones" target="_blank" rel="noopener noreferrer">Abrir página de postulaciones</Link></>}
        <div className="content-manager-actions"><button type="submit">{busy?'Guardando…':tournament?'Guardar':form.is_open?'Guardar y publicar':'Guardar borrador'}</button>{form.id&&<button type="button" onClick={remove}>Eliminar</button>}</div>
      </fieldset></form>
    </div>}
    {!tournament&&<section className="content-responses"><h2>Postulaciones anteriores</h2>{historyError&&<p role="status">{historyError}</p>}<p>Estas respuestas se conservan. Las nuevas se reciben en el formulario de Google de cada convocatoria.</p>{!historyError&&!applications.length&&<p>Todavía no hay respuestas.</p>}{applications.map(item=><details key={item.id}><summary>{item.nickname} · {item.opening?.title} · {{pending:'Pendiente',reviewing:'En revisión',accepted:'Aceptada',rejected:'Rechazada'}[item.status]}</summary><p>Contacto: {item.contact}</p>{Object.entries(item.answers||{}).map(([question,answer])=><div key={question}><strong>{question}</strong><p>{String(answer)}</p></div>)}<label>Estado<select disabled={busy} value={item.status} onChange={e=>review(item.id,e.target.value)}><option value="pending">Pendiente</option><option value="reviewing">En revisión</option><option value="accepted">Aceptada</option><option value="rejected">Rechazada</option></select></label></details>)}</section>}
  </section>
}
