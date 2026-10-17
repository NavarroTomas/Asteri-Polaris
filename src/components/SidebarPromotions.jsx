import Mascot from './Mascot'

export default function SidebarPromotions() {
  return <div className="ap-promotions" aria-label="Espacios promocionales">
    <article className="ap-promo ap-promo-dev" aria-label="NavarroDev">
      <h2>NavarroDev</h2>
      <Mascot pose="history" />
    </article>
    <article className="ap-promo ap-promo-cocoliche" aria-label="Cocoliche, la mascota del equipo">
      <h2>Cocoliche</h2>
      <Mascot pose="media" />
    </article>
  </div>
}
