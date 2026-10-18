const poses = {
  welcome: ['01-saludando.webp', 'Cocoliche saludando'],
  contact: ['02-pulgar-arriba.webp', 'Cocoliche con el pulgar arriba'],
  team: ['03-brazos-cruzados.webp', 'Cocoliche con los brazos cruzados'],
  community: ['04-celebrando.webp', 'Cocoliche celebrando'],
  application: ['05-senalando.webp', 'Cocoliche señalando'],
  tournaments: ['06-corriendo.webp', 'Cocoliche corriendo'],
  history: ['07-sentado.webp', 'Cocoliche sentado'],
  media: ['08-sorprendido.webp', 'Cocoliche sorprendido'],
  about: ['09-saltando.webp', 'Cocoliche saltando'],
  matches: ['10-jugando-pc.webp', 'Cocoliche jugando en la computadora'],
}
const images = import.meta.glob('../assets/mascot/*.webp', { eager: true, query: '?url', import: 'default' })

export default function Mascot({ pose, priority = false }) {
  const selected = poses[pose]
  if (!selected) return null
  const [file, description] = selected
  return <div className="ap-mascot-portrait"><img className="ap-mascot" src={images[`../assets/mascot/${file}`]} alt={description} width="1254" height="1254" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" /></div>
}
