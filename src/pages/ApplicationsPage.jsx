import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalPage, { PageState } from '../components/PortalPage'
import { listOpenings } from '../lib/contentAdmin'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { argentinaToday } from '../hooks/usePublishedMatches'
import './ApplicationsPage.css'

export default function ApplicationsPage() {
  const { user, profile } = useAuth()
  const [items,setItems]=useState([])
  const [status,setStatus]=useState('loading')
  const [attempt,setAttempt]=useState(0)
  const [selected,setSelected]=useState('')
  const formSection=useRef(null)
  useEffect(()=>{if(!selected)return;formSection.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});formSection.current?.querySelector('h2')?.focus({preventScroll:true})},[selected])
  const [answers,setAnswers]=useState({})
  const [nickname,setNickname]=useState('')
  const [contact,setContact]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  useEffect(()=>{let alive=true;setStatus('loading');listOpenings(true).then(data=>{if(alive){setItems(data.filter(row=>!row.closes_on||row.closes_on>=argentinaToday()));setStatus('ready')}}).catch(()=>{if(alive)setStatus('error')});return()=>{alive=false}},[attempt])
  const opening=items.find(item=>item.id===selected)
  const submit=async event=>{
    event.preventDefault();if(busy||!user||!opening)return
    setBusy(true);setError('');setMessage('')
    try{
      const {error}=await supabase.from('applications').insert({opening_id:opening.id,user_id:user.id,nickname:nickname.trim(),contact:contact.trim(),answers})
      if(error)throw error
      setMessage('Recibimos tu postulación. El equipo va a revisarla.');setSelected('');setAnswers({})
    }catch(err){setError(err.code==='23505'?'Ya enviaste una postulación para esta convocatoria.':err.message||'No pudimos enviar tu postulación.')}
    finally{setBusy(false)}
  }
  return <PortalPage title="POSTULACIONES" intro="Convocatorias abiertas para los equipos y las áreas de ASTERI.">
    {message&&<p className="applications-feedback" role="status">{message}</p>}{error&&<p className="applications-feedback" role="alert">{error}</p>}
    <PageState status={status} retry={()=>setAttempt(value=>value+1)} empty={!items.length?'Por ahora no hay convocatorias abiertas.':null}>
      <div className="openings-grid">{items.map(item=><article key={item.id}><p>{item.area}</p><h2>{item.title}</h2><p className="opening-description">{item.description}</p>{item.closes_on&&<p>Cierra el {new Intl.DateTimeFormat('es-AR',{dateStyle:'long'}).format(new Date(item.closes_on+'T12:00:00'))}</p>}<button className="ap-button" disabled={busy} onClick={()=>{if(busy)return;setSelected(item.id);setAnswers({});setError('');setMessage('')}}>Postularme</button></article>)}</div>
      {opening&&<section ref={formSection} className="opening-form"><h2 tabIndex={-1}>{opening.title}</h2>{!user?<p><Link to="/login">Ingresá</Link> o <Link to="/register">creá tu cuenta</Link> para enviar una postulación.</p>:profile?.status!=='active'?<p>Tu cuenta debe estar aprobada para postularte.</p>:<form onSubmit={submit}><fieldset disabled={busy}><label>Nickname o nombre<input required minLength={2} maxLength={80} value={nickname} onChange={e=>setNickname(e.target.value)}/></label><label>Usuario de Discord o contacto<input required minLength={2} maxLength={150} value={contact} onChange={e=>setContact(e.target.value)}/></label>{opening.questions.filter(question=>question.trim()).map((question,index)=><label key={index}>{question}<textarea required rows={3} maxLength={1200} value={answers[question]||''} onChange={e=>setAnswers(current=>({...current,[question]:e.target.value}))}/></label>)}<p>El staff de ASTERI recibirá tus respuestas y tu contacto para revisar esta postulación.</p><button className="ap-button" type="submit">{busy?'Enviando…':'Enviar postulación'}</button><button type="button" onClick={()=>setSelected('')}>Cancelar</button></fieldset></form>}</section>}
    </PageState>
  </PortalPage>
}
