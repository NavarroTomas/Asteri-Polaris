import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Mascot from './Mascot'
import './CocolicheHelp.css'

const topics=[
 {title:'Cómo postularme',pose:'application',text:'En Postulaciones encontrás las convocatorias que abrió el staff. Elegí una, ingresá con tu cuenta y completá las preguntas.',to:'/postulaciones',link:'Ver convocatorias'},
 {title:'Próximos partidos',pose:'matches',text:'El calendario muestra partidos y torneos. Tocá una fecha para ver el rival, el horario y la ficha del encuentro.',to:'/partidos',link:'Abrir calendario'},
 {title:'Conocer a los equipos',pose:'team',text:'En Equipo podés recorrer cada plantel y abrir las fichas de sus jugadores. Ahí están sus redes y estadísticas.',to:'/equipo',link:'Ver equipos'},
 {title:'Mi cuenta está pendiente',pose:'contact',text:'El owner revisa las solicitudes de cuentas nuevas. Cuando la apruebe, vas a poder usar tu perfil y enviar postulaciones.',to:'/account',link:'Ir a mi cuenta'},
 {title:'Dónde está la comunidad',pose:'community',text:'En Comunidad están los canales oficiales para hablar con el equipo y compartir partidas.',to:'/comunidad',link:'Ver comunidad'},
]
export default function CocolicheHelp(){
 const {pathname}=useLocation()
 const [open,setOpen]=useState(false),[active,setActive]=useState(null)
 const launcher=useRef(null),close=useRef(null)
 useEffect(()=>{if(!open)return;close.current?.focus();const onKey=e=>{if(e.key==='Escape'){setOpen(false);launcher.current?.focus()}};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[open])
 useEffect(()=>{setOpen(false)},[pathname])
 if(/^\/(admin|login|register|account|forgot-password|update-password|suspended)(?:\/|$)/.test(pathname))return null
 return <div className="cocoliche-help">
  <button ref={launcher} className="cocoliche-launcher" type="button" aria-label="Abrir ayuda de Cocoliche" aria-expanded={open} aria-controls="cocoliche-help-panel" onClick={()=>setOpen(value=>!value)}><Mascot pose="welcome"/></button>
  {open&&<section className="cocoliche-help-panel" role="dialog" aria-modal="false" aria-labelledby="cocoliche-help-title" id="cocoliche-help-panel"><header><h2 id="cocoliche-help-title">Cocoliche</h2><button ref={close} type="button" onClick={()=>{setOpen(false);launcher.current?.focus()}}>Cerrar</button></header><div className="cocoliche-answer" key={active?.title||'hello'}><Mascot pose={active?.pose||'welcome'}/><p aria-live="polite">{active?.text||'¡Hola! Te acompaño a encontrar lo que buscás en ASTERI. Elegí una pregunta.'}</p>{active&&<Link to={active.to}>{active.link}</Link>}</div><nav aria-label="Preguntas para Cocoliche">{topics.map(topic=><button key={topic.title} type="button" aria-pressed={active?.title===topic.title} onClick={()=>setActive(topic)}>{topic.title}</button>)}</nav><small>Ayuda con respuestas preparadas por el equipo.</small></section>}
 </div>
}
