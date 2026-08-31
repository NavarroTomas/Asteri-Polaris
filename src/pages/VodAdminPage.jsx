import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addClip,
  deleteClip,
  deleteVod,
  emptyVod,
  getVodDetail,
  listVodsAndPlayers,
  saveLineup,
  saveVod,
  slugifyVod,
  toggleClip,
} from '../lib/vods'
import './VodAdminPage.css'

const emptyClip={title:'',description:'',player_id:'',round_number:'',timestamp_seconds:'',video_url:'',is_published:true}

export default function VodAdminPage(){
  const { user }=useAuth()
  const [vods,setVods]=useState([]),[players,setPlayers]=useState([]),[selected,setSelected]=useState(null)
  const [form,setForm]=useState(emptyVod),[lineup,setLineup]=useState([]),[clips,setClips]=useState([])
  const [clipFile,setClipFile]=useState(null),[clip,setClip]=useState(emptyClip)
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[err,setErr]=useState('')
  const current=useMemo(()=>vods.find(v=>v.id===selected)||null,[vods,selected])

  async function refresh(){
    try{const d=await listVodsAndPlayers();setVods(d.vods);setPlayers(d.players)}catch(e){setErr(e.message)}
  }
  useEffect(()=>{refresh()},[])
  useEffect(()=>{
    if(!selected){setForm(emptyVod);setLineup([]);setClips([]);return}
    getVodDetail(selected).then(d=>{setForm({...emptyVod,...d.vod});setLineup(d.lineup.map(x=>x.player_id));setClips(d.clips)}).catch(e=>setErr(e.message))
  },[selected])

  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setMsg('');setErr('')}
  const togglePlayer=id=>setLineup(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])
  const newVod=()=>{setSelected(null);setForm(emptyVod);setLineup([]);setClips([]);setMsg('');setErr('')}

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    setErr('')
    setMsg('')

    const wasEditing=Boolean(selected)

    try{
      if(!form.title.trim()||!form.opponent.trim()||!form.match_date){
        throw new Error('Completá título, rival y fecha')
      }

      const payload={
        ...form,
        slug:
          form.slug ||
          slugifyVod(
            `${form.opponent}-${form.match_date}`,
          ),
      }

      const saved=await saveVod(
        selected,
        payload,
        user.id,
      )

      await saveLineup(
        saved.id,
        lineup,
      )

      await refresh()
      setSelected(saved.id)

      setMsg(
        wasEditing
          ? 'VOD actualizada.'
          : 'VOD creada.',
      )
    }catch(e){
      setErr(e.message)
    }finally{
      setBusy(false)
    }
  }

  async function addNewClip(e){
    e.preventDefault();if(!selected)return setErr('Guardá el VOD primero')
    setBusy(true);setErr('');setMsg('')
    try{
      const c=await addClip({vodId:selected,playerId:clip.player_id,userId:user.id,form:clip,file:clipFile})
      setClips(x=>[c,...x]);setClip(emptyClip);setClipFile(null);setMsg('Clip agregado.')
    }catch(e){setErr(e.message)}finally{setBusy(false)}
  }

  return <main className="vod-admin-page">
    <header className="vod-admin-top"><Link to="/admin">← CONTROL</Link><button onClick={newVod}>+ NUEVO VOD</button></header>
    <section className="vod-admin-heading"><span>ASTERI / VOD MANAGER</span><h1>VODS.</h1><p>Partidos, lineup, VOD externo y clips desde un solo lugar.</p></section>
    {(msg||err)&&<div className={`vod-admin-message ${err?'error':''}`}>{err||msg}</div>}

    <div className="vod-admin-layout">
      <aside className="vod-admin-list">
        {vods.length===0?<p>SIN VODS</p>:vods.map(v=><button key={v.id} className={selected===v.id?'active':''} onClick={()=>setSelected(v.id)}>
          <small>{v.match_date} · {v.is_published?'PUBLICADO':'BORRADOR'}</small><strong>{v.title}</strong><span>vs {v.opponent}</span>
        </button>)}
      </aside>

      <section className="vod-admin-editor">
        <form onSubmit={submit}>
          <div className="vod-admin-editorbar"><strong>{selected?'EDITAR VOD':'NUEVO VOD'}</strong>{selected&&form.is_published&&<Link to={`/vods/${form.slug}`} target="_blank">VER PÚBLICO ↗</Link>}</div>
          <div className="vod-admin-grid">
            <label className="wide"><span>TÍTULO</span><input value={form.title} onChange={e=>set('title',e.target.value)} required/></label>
            <label><span>RIVAL</span><input value={form.opponent} onChange={e=>set('opponent',e.target.value)} required/></label>
            <label><span>COMPETICIÓN</span><input value={form.competition} onChange={e=>set('competition',e.target.value)}/></label>
            <label><span>FECHA</span><input type="date" value={form.match_date} onChange={e=>set('match_date',e.target.value)} required/></label>
            <label><span>HORA</span><input type="time" value={form.match_time||''} onChange={e=>set('match_time',e.target.value)}/></label>
            <label><span>MAPA</span><input value={form.map_name||''} onChange={e=>set('map_name',e.target.value)}/></label>
            <label><span>ESTADO</span><select value={form.status} onChange={e=>set('status',e.target.value)}><option value="upcoming">PRÓXIMO</option><option value="played">JUGADO</option><option value="cancelled">CANCELADO</option></select></label>
            <label><span>ASTERI SCORE</span><input type="number" min="0" value={form.score_asteri??''} onChange={e=>set('score_asteri',e.target.value)}/></label>
            <label><span>RIVAL SCORE</span><input type="number" min="0" value={form.score_opponent??''} onChange={e=>set('score_opponent',e.target.value)}/></label>
            <label className="wide"><span>VOD / YOUTUBE / DRIVE</span><input type="url" value={form.youtube_url||''} onChange={e=>set('youtube_url',e.target.value)} placeholder="https://youtube.com/... o https://drive.google.com/..."/></label>
            <label className="wide"><span>SLUG</span><input value={form.slug||''} onChange={e=>set('slug',slugifyVod(e.target.value))} placeholder="se genera automático"/></label>
            <label className="wide"><span>DESCRIPCIÓN</span><textarea rows="4" value={form.description||''} onChange={e=>set('description',e.target.value)}/></label>
            <label className="check wide"><input type="checkbox" checked={!!form.is_published} onChange={e=>set('is_published',e.target.checked)}/><span>PUBLICAR VOD</span></label>
          </div>

          <div className="vod-admin-section"><div className="vod-admin-section-head"><span>LINEUP</span><strong>{lineup.length}</strong></div><div className="vod-admin-lineup">
            {players.map(p=><button type="button" key={p.id} className={lineup.includes(p.id)?'selected':''} onClick={()=>togglePlayer(p.id)}><strong>{p.nickname}</strong><small>{p.player_role||'PLAYER'}</small></button>)}
          </div></div>

          <div className="vod-admin-actions"><button className="save" disabled={busy}>{busy?'GUARDANDO…':selected?'GUARDAR CAMBIOS':'CREAR VOD'}</button>{selected&&<button type="button" className="delete" disabled={busy} onClick={async()=>{if(!confirm(`¿Eliminar ${current?.title}?`))return;setBusy(true);try{await deleteVod(current);newVod();await refresh();setMsg('VOD eliminado.')}catch(e){setErr(e.message)}finally{setBusy(false)}}}>ELIMINAR VOD</button>}</div>
        </form>

        <div className="vod-admin-section"><div className="vod-admin-section-head"><span>CLIPS DEL VOD</span><strong>{clips.length}</strong></div>
          {!selected?<p className="vod-admin-empty">GUARDÁ EL VOD PARA AGREGAR CLIPS.</p>:<>
            <form className="vod-admin-clipform" onSubmit={addNewClip}><div className="vod-admin-grid">
              <label><span>TÍTULO</span><input value={clip.title} onChange={e=>setClip(c=>({...c,title:e.target.value}))} required/></label>
              <label><span>JUGADOR</span><select value={clip.player_id} onChange={e=>setClip(c=>({...c,player_id:e.target.value}))}><option value="">SIN JUGADOR</option>{players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>
              <label><span>ROUND</span><input type="number" min="0" value={clip.round_number} onChange={e=>setClip(c=>({...c,round_number:e.target.value}))}/></label>
              <label><span>TIMESTAMP SEG.</span><input type="number" min="0" value={clip.timestamp_seconds} onChange={e=>setClip(c=>({...c,timestamp_seconds:e.target.value}))}/></label>
              <label className="wide"><span>URL (opcional si subís archivo)</span><input type="url" value={clip.video_url} onChange={e=>setClip(c=>({...c,video_url:e.target.value}))}/></label>
              <label className="wide file"><input type="file" accept="video/*" onChange={e=>setClipFile(e.target.files?.[0]||null)}/><span>{clipFile?.name||'O SUBIR VIDEO'}</span></label>
              <label className="wide"><span>DESCRIPCIÓN</span><textarea rows="3" value={clip.description} onChange={e=>setClip(c=>({...c,description:e.target.value}))}/></label>
              <label className="check wide"><input type="checkbox" checked={clip.is_published} onChange={e=>setClip(c=>({...c,is_published:e.target.checked}))}/><span>PUBLICAR CLIP</span></label>
            </div><button className="vod-admin-addclip" disabled={busy}>+ AGREGAR CLIP</button></form>
            <div className="vod-admin-clips">{clips.map(c=>{const p=players.find(x=>x.id===c.player_id);return <article key={c.id}><div><small>{p?.nickname||'ASTERI'}{c.round_number!=null?` · R${c.round_number}`:''}</small><strong>{c.title}</strong></div><span className={c.is_published?'on':''}>{c.is_published?'PUBLICADO':'PRIVADO'}</span><div>{c.video_url&&<a href={c.video_url} target="_blank" rel="noreferrer">VER ↗</a>}<button onClick={async()=>{try{const u=await toggleClip(c);setClips(x=>x.map(v=>v.id===u.id?u:v))}catch(e){setErr(e.message)}}}>{c.is_published?'OCULTAR':'PUBLICAR'}</button><button onClick={async()=>{if(!confirm('¿Eliminar clip?'))return;try{await deleteClip(c);setClips(x=>x.filter(v=>v.id!==c.id))}catch(e){setErr(e.message)}}}>ELIMINAR</button></div></article>})}</div>
          </>}
        </div>
      </section>
    </div>
  </main>
}
