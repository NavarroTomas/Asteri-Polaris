const poses = {
  welcome: ['01-saludando.png', 'La mascota saludando'],
  contact: ['02-pulgar-arriba.png', 'La mascota con el pulgar arriba'],
  team: ['03-brazos-cruzados.png', 'La mascota con los brazos cruzados'],
  community: ['04-celebrando.png', 'La mascota celebrando'],
  application: ['05-senalando.png', 'La mascota señalando'],
  tournaments: ['06-corriendo.png', 'La mascota corriendo'],
  history: ['07-sentado.png', 'La mascota sentada'],
  media: ['08-sorprendido.png', 'La mascota sorprendida'],
  about: ['09-saltando.png', 'La mascota saltando'],
  matches: ['10-jugando-pc.png', 'La mascota jugando en la computadora'],
}
const images = import.meta.glob('../assets/mascot/*.png', { eager: true, query: '?url', import: 'default' })

export default function Mascot({ pose, priority = false }) {
  const selected = poses[pose]
  if (!selected) return null
  const [file, description] = selected
  return <div className="ap-mascot-portrait"><img className="ap-mascot" src={images[`../assets/mascot/${file}`]} alt={description} width="1254" height="1254" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" /></div>
}
