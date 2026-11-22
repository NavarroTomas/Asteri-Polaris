import { useEffect, useState } from 'react'
import PortalPage, { PageState } from '../components/PortalPage'
import { listOpenings } from '../lib/contentAdmin'
import { availableOpenings, normalizeGoogleFormUrl } from '../lib/googleForms'
import { argentinaToday } from '../hooks/usePublishedMatches'
import './ApplicationsPage.css'

export default function ApplicationsPage() {
  const [items,setItems]=useState([]), [status,setStatus]=useState('loading'), [attempt,setAttempt]=useState(0)
  useEffect(()=>{let alive=true;setStatus('loading');listOpenings(true).then(data=>{if(alive){setItems(availableOpenings(data,argentinaToday()));setStatus('ready')}}).catch(()=>{if(alive)setStatus('error')});return()=>{alive=false}},[attempt])
  return <PortalPage title="POSTULACIONES" intro="Elegí una convocatoria y completá su formulario de Google.">
    <PageState status={status} retry={()=>setAttempt(value=>value+1)} empty={!items.length?'Por ahora no hay convocatorias abiertas.':null}>
      <div className="openings-grid">{items.map(item=><a className="opening-card" key={item.id} href={normalizeGoogleFormUrl(item.google_form_url)} target="_blank" rel="noopener noreferrer" aria-label={item.title+' · Abrir formulario de Google en otra pestaña'}><p>{item.area}</p><h2>{item.title}</h2>{item.description&&<p className="opening-description">{item.description}</p>}{item.closes_on&&<p>Cierra el {new Intl.DateTimeFormat('es-AR',{dateStyle:'long'}).format(new Date(item.closes_on+'T12:00:00'))}</p>}<span className="ap-button">Completar formulario</span></a>)}</div>
    </PageState>
  </PortalPage>
}
