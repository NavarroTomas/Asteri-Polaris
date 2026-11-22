import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Mascot from './Mascot'
import './CocolicheHelp.css'

const topics=[
 {title:'Dónde ver los torneos',pose:'tournaments',text:'En Torneos encontrás las competencias y sus partidos.',to:'/torneos',link:'Ver torneos'},
 {title:'Dónde ver próximas fechas',pose:'matches',text:'El calendario reúne los próximos partidos y torneos.',to:'/calendario',link:'Ver calendario'},
 {title:'Cómo postularme',pose:'application',text:'Elegí una convocatoria y abrí su formulario de Google.',to:'/postulaciones',link:'Ver postulaciones'},
 {title:'Cómo ser hincha',pose:'welcome',text:'Creá tu cuenta. El equipo la revisará para habilitar tu perfil de hincha.',to:'/register',link:'Crear cuenta'},
 {title:'¿Puedo ser partner?',pose:'contact',text:'Mandanos tu propuesta desde Contacto.',to:'/contacto',link:'Contactar al equipo'},
]
export default function CocolicheHelp(){
 const {pathname}=useLocation()
 const [open,setOpen]=useState(false),[active,setActive]=useState(null)
 const launcher=useRef(null),close=useRef(null)
 useEffect(()=>{if(!open)return;close.current?.focus();const onKey=e=>{if(e.key==='Escape'){setOpen(false);launcher.current?.focus()}};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[open])
 useEffect(()=>{setOpen(false)},[pathname])
 if(/^\/(admin|login|register|account|forgot-password|update-password|suspended)(?:\/|$)/.test(pathname))return null
 return <div className="cocoliche-help">
  <button ref={launcher} className="cocoliche-launcher" type="button" aria-label="Abrir ayuda de Cocoliche" aria-expanded={open} aria-controls="cocoliche-help-panel" onClick={()=>setOpen(value=>!value)}><Mascot pose={active?.pose||'welcome'}/></button>
  {open&&<section className="cocoliche-help-panel" role="dialog" aria-modal="false" aria-labelledby="cocoliche-help-title" id="cocoliche-help-panel"><header><h2 id="cocoliche-help-title">Cocoliche</h2><button ref={close} type="button" onClick={()=>{setOpen(false);launcher.current?.focus()}}>Cerrar</button></header><div className="cocoliche-answer" key={active?.title||'hello'}><p aria-live="polite">{active?.text||'¿Qué estás buscando?'}</p>{active&&<Link to={active.to}>{active.link}</Link>}</div><nav aria-label="Preguntas para Cocoliche">{topics.map(topic=><button key={topic.title} type="button" aria-pressed={active?.title===topic.title} onClick={()=>setActive(topic)}>{topic.title}</button>)}</nav></section>}
 </div>
}
