import { createClient } from '@supabase/supabase-js'
const reply=(status,payload)=>Response.json(payload,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
class FaceitRequestError extends Error { constructor(status,message){super(message);this.status=status} }
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
async function faceit(path,key){
 const response=await fetch('https://open.faceit.com/data/v4'+path,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)})
 if(!response.ok){throw new FaceitRequestError(response.status===404?404:502,response.status===404?'No se encontró en FACEIT.':'FACEIT no pudo responder. Intentá más tarde.')}
 return response.json()
}
async function handleRequest(request){
 const auth=request.headers.get('authorization')||''
 if(!/^Bearer [^ ]+$/.test(auth))return reply(401,{error:'Ingresá a administración.'})
 const dbUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL
 const dbKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY
 if(!dbUrl||!dbKey)return reply(503,{error:'La conexión del servidor todavía no está configurada.'})
 const client=createClient(dbUrl,dbKey,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error}=await client.auth.getUser(auth.slice(7))
 if(error||!user)return reply(401,{error:'La sesión venció.'})
 const {data:profile}=await client.from('profiles').select('role,status').eq('id',user.id).single()
 if(!profile||!['owner','admin'].includes(profile.role)||profile.status!=='active')return reply(403,{error:'Solo administración puede importar datos.'})
 const key=process.env.FACEIT_API_KEY
 if(!key)return reply(503,{error:'FACEIT está preparado. Falta configurar FACEIT_API_KEY en el servidor.'})
 const params=new URL(request.url).searchParams
 try{
  if(params.get('type')==='player'){
   const nickname=(params.get('nickname')||'').trim()
   if(!/^[A-Za-z0-9_-]{2,32}$/.test(nickname))return reply(400,{error:'Indicá el nickname de FACEIT.'})
   const player=await faceit('/players?nickname='+encodeURIComponent(nickname),key)
   if(!uuid.test(player.player_id))return reply(502,{error:'FACEIT devolvió un jugador inválido.'})
   const stats=await faceit('/players/'+player.player_id+'/stats/cs2',key)
   return reply(200,{player_id:player.player_id,nickname:player.nickname,elo:player.games?.cs2?.faceit_elo??null,level:player.games?.cs2?.skill_level??null,lifetime:stats.lifetime||{},synced_at:new Date().toISOString()})
  }
  if(params.get('type')==='championship'){
   const id=params.get('id')||'';if(!uuid.test(id))return reply(400,{error:'Indicá el ID del campeonato.'})
   const championship=await faceit('/championships/'+id,key)
   return reply(200,{id,name:championship.name,description:championship.description,starts_at:championship.championship_start||null,game:championship.game_id,cover_url:championship.cover_image||null,url:championship.faceit_url?.replace('{lang}','es')||null})
  }
  return reply(400,{error:'Tipo de consulta no válido.'})
 }catch(error){return reply(error instanceof FaceitRequestError?error.status:502,{error:error instanceof FaceitRequestError?error.message:'No pudimos conectar con FACEIT.'})}
}

export async function GET(request){try{return await handleRequest(request)}catch{return reply(503,{error:'No pudimos conectar con el servidor. Intentá nuevamente.'})}}
