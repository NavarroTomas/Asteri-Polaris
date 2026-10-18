const poses = {
  welcome: ['01-saludando.png', 'Cocoliche saludando'],
  contact: ['02-pulgar-arriba.png', 'Cocoliche con el pulgar arriba'],
  team: ['03-brazos-cruzados.png', 'Cocoliche con los brazos cruzados'],
  community: ['04-celebrando.png', 'Cocoliche celebrando'],
  application: ['05-senalando.png', 'Cocoliche señalando'],
  tournaments: ['06-corriendo.png', 'Cocoliche corriendo'],
  history: ['07-sentado.png', 'Cocoliche sentado'],
  media: ['08-sorprendido.png', 'Cocoliche sorprendido'],
  about: ['09-saltando.png', 'Cocoliche saltando'],
  matches: ['10-jugando-pc.png', 'Cocoliche jugando en la computadora'],
}
const images = import.meta.glob('../assets/mascot/*.png', { eager: true, query: '?url', import: 'default' })

export default function Mascot({ pose, priority = false }) {
  const selected = poses[pose]
  if (!selected) return null
  const [file, description] = selected
  return <div className="ap-mascot-portrait"><img className="ap-mascot" src={images[`../assets/mascot/${file}`]} alt={description} width="1254" height="1254" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" /></div>
}
