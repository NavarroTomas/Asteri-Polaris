import { useEffect, useState } from 'react'
import { resolveSiteMediaUrl } from '../lib/contentAdmin'
function useMediaUrl(src){
 const [resolved,setResolved]=useState(''),[failed,setFailed]=useState(false)
 useEffect(()=>{let alive=true;setResolved('');setFailed(false);resolveSiteMediaUrl(src).then(url=>{if(alive)setResolved(url)}).catch(()=>{if(alive)setFailed(true)});return()=>{alive=false}},[src])
 return {resolved,failed}
}
export function SiteImage({src,alt='',...props}){const {resolved,failed}=useMediaUrl(src);if(failed)return <span>Imagen no disponible</span>;return <img {...props} src={resolved||undefined} alt={alt}/>}
export function SiteVideo({src,onError,...props}){const {resolved,failed}=useMediaUrl(src);if(failed)return <p role="status">Video no disponible.</p>;return <video {...props} src={resolved||undefined} onError={onError}/>}
