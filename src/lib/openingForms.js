import { normalizeGoogleFormUrl } from './googleForms.js'
export function buildOpeningPayload(form) {
 const title=String(form.title||'').trim(),area=String(form.area||'').trim()
 if(title.length<2||title.length>140)throw new Error('El título debe tener entre 2 y 140 caracteres.')
 if(area.length<2||area.length>100)throw new Error('El juego o área debe tener entre 2 y 100 caracteres.')
 const description=String(form.description||'').trim()
 if(description.length>5000)throw new Error('La descripción supera los 5000 caracteres.')
 const raw=String(form.google_form_url||'').trim(),google_form_url=normalizeGoogleFormUrl(raw)||null
 if(raw&&!google_form_url)throw new Error('Pegá el enlace para responder de Google Forms: forms.gle/… o docs.google.com/forms/…/viewform. No uses el enlace de edición.')
 if(form.is_open&&!google_form_url)throw new Error('Agregá el enlace para responder antes de abrir la convocatoria.')
 const questions=Array.isArray(form.questions)?form.questions:[]
 return {title,area,description,google_form_url,closes_on:form.closes_on||null,is_open:!!form.is_open,questions,...(form.id?{id:form.id}:{})}
}
export async function loadManagerContent(type,services) {
 if(type==='tournaments')return {items:await services.listTournaments(),responses:[],historyError:''}
 const [items,history]=await Promise.allSettled([services.listOpenings(),services.listApplications()])
 if(items.status==='rejected')throw items.reason
 return {items:items.value,responses:history.status==='fulfilled'?history.value:[],historyError:history.status==='rejected'?'No pudimos cargar las respuestas anteriores. Las convocatorias se pueden editar igualmente.':''}
}

export function openingVisibility(form,today) {
 if(!form.is_open)return 'Borrador / cerrada'
 if(!normalizeGoogleFormUrl(form.google_form_url))return 'Falta enlace para responder'
 if(form.closes_on&&form.closes_on<today)return 'Vencida'
 return 'Publicada'
}
