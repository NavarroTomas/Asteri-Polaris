import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRosterPlayers, rosterFallback } from '../lib/rosterPlayers'
import './AsteriTypography.css'

const MAX_LAYERS = 64

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getLayerColor = (faceColor, depthColor, index, total) => {
  const progress = total <= 1 ? 1 : index / total
  const eased = progress * progress
  const faceMix = Math.round((1 - eased) * 72 + 4)
  return `color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor})`
}

const getTransform = (rotateX, rotateY) =>
  `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`

function DepthText({
  text,
  layers = 12,
  depth = 1.1,
  faceColor = '#173225',
  depthColor = '#01D069',
  tilt = 3.2,
  pointerTracking = true,
  smoothing = 0.12,
  perspective = 1100,
  autoOrbit = false,
  orbitSpeed = 0.2,
  fontSize = 'clamp(3rem, 5.2vw, 5.5rem)',
  fontWeight = 800,
  shadow = false,
  className = '',
  style = {},
}) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS)
  const safeDepth = clamp(Number(depth) || 0, 0, 12)
  const safeTilt = clamp(Number(tilt) || 0, 0, 12)
  const safeSmoothing = clamp(Number(smoothing) || 0.12, 0.02, 0.35)
  const safePerspective = clamp(Number(perspective) || 1100, 300, 2000)
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2)

  const baseRotation = useMemo(
    () => ({ x: -safeTilt * 0.22, y: safeTilt * 0.28 }),
    [safeTilt],
  )

  const depthLayers = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, layerIndex) => {
        const index = safeLayers - layerIndex
        return {
          index,
          color: getLayerColor(faceColor, depthColor, index, safeLayers),
          transform: `translateZ(${-index * safeDepth}px)`,
        }
      }),
    [safeLayers, safeDepth, faceColor, depthColor],
  )

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage || typeof window === 'undefined') return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion

    let frameId = 0
    let activePointer = false
    let startTime = performance.now()

    const current = { ...baseRotation }
    const target = { ...baseRotation }

    const applyTransform = () => {
      stage.style.transform = getTransform(current.x, current.y)
    }

    if (reducedMotion) {
      applyTransform()
      return undefined
    }

    const handlePointerMove = (event) => {
      const rect = root.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!inside) {
        activePointer = false
        target.x = baseRotation.x
        target.y = baseRotation.y
        return
      }

      activePointer = true

      const x = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8),
        -1,
        1,
      )
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8),
        -1,
        1,
      )

      target.x = baseRotation.x - y * safeTilt
      target.y = baseRotation.y + x * safeTilt
    }

    const handlePointerLeave = () => {
      activePointer = false
      target.x = baseRotation.x
      target.y = baseRotation.y
    }

    if (canTrackPointer) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('blur', handlePointerLeave)
    }

    const tick = (now) => {
      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const elapsed = (now - startTime) / 1000
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2
        const amount = canTrackPointer ? 0.16 : 0.42

        target.x = baseRotation.x + Math.sin(orbit) * safeTilt * amount
        target.y = baseRotation.y + Math.cos(orbit * 0.85) * safeTilt * amount
      }

      current.x += (target.x - current.x) * safeSmoothing
      current.y += (target.y - current.y) * safeSmoothing
      applyTransform()
      frameId = requestAnimationFrame(tick)
    }

    applyTransform()
    frameId = requestAnimationFrame(tick)

    return () => {
      if (canTrackPointer) {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('blur', handlePointerLeave)
      }

      cancelAnimationFrame(frameId)
      startTime = 0
    }
  }, [
    autoOrbit,
    baseRotation,
    pointerTracking,
    safeOrbitSpeed,
    safeSmoothing,
    safeTilt,
  ])

  const rootStyle = {
    ...style,
    '--depth-text-perspective': `${safePerspective}px`,
    '--depth-text-font-size': fontSize,
    '--depth-text-font-weight': fontWeight,
    '--depth-text-face-color': faceColor,
    '--depth-text-depth-color': depthColor,
    '--depth-text-shadow': shadow
      ? `0 18px 28px color-mix(in srgb, ${depthColor} 24%, transparent)`
      : 'none',
  }

  return (
    <span
      ref={rootRef}
      className={`depth-text ${className}`.trim()}
      style={rootStyle}
      aria-hidden="true"
    >
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map((layer) => (
          <span
            className="depth-text__layer"
            key={layer.index}
            style={{ color: layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}

        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  )
}

export default function RosterShowcase() {
  const [players, setPlayers] = useState(rosterFallback)
  const [active, setActive] = useState(0)
  const scrollerRef = useRef(null)
  const dragRef = useRef({ down: false, startX: 0, startScroll: 0, moved: false })
  const player = players[active] ?? players[0]

  useEffect(() => {
    let alive = true

    const loadRoster = async () => {
      try {
        const nextPlayers = await getRosterPlayers()

        if (!alive || nextPlayers.length === 0) return

        setPlayers(nextPlayers)
        setActive((current) =>
          Math.min(current, Math.max(0, nextPlayers.length - 1)),
        )
      } catch (error) {
        console.error('No se pudo cargar el roster desde Supabase:', error)
      }
    }

    loadRoster()

    return () => {
      alive = false
    }
  }, [])

  const onPointerDown = (event) => {
    const scroller = scrollerRef.current
    if (!scroller) return

    dragRef.current = {
      down: true,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
      moved: false,
    }

    scroller.classList.add('is-dragging')
  }

  const onPointerMove = (event) => {
    const scroller = scrollerRef.current
    const drag = dragRef.current
    if (!scroller || !drag.down) return

    const delta = event.clientX - drag.startX
    if (Math.abs(delta) > 7) drag.moved = true
    scroller.scrollLeft = drag.startScroll - delta
  }

  const endDrag = () => {
    dragRef.current.down = false
    scrollerRef.current?.classList.remove('is-dragging')
  }

  const selectPlayer = (index) => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false
      return
    }

    setActive(index)
  }

  const movePlayer = (direction) => {
    setActive((current) => (current + direction + players.length) % players.length)
  }

  return (
    <section className="roster" id="plantel">
      {/* Estilos locales del efecto DepthText del jugador seleccionado. */}
      <style>{`
        /*
          TIPOGRAFÍA ASTERI
          - Anton: títulos agresivos / competitivos.
          - Allura: firma únicamente en la ficha abierta.
          - Barlow Condensed: tarjetas y etiquetas técnicas.
        */

        .roster-heading h2 {
          font-family: var(--font-impact) !important;
          font-weight: 400 !important;
          letter-spacing: -.035em !important;
          line-height: .84 !important;
        }

        /*
          En el carrusel el nickname NO es firma: se mantiene compacto,
          técnico y legible, como una etiqueta de jugador.
        */
        .player-card-name strong {
          font-family: var(--font-tactical) !important;
          font-size: clamp(1.35rem, 1.65vw, 2rem) !important;
          font-weight: 700 !important;
          line-height: .9 !important;
          letter-spacing: .015em !important;
          text-transform: none !important;
          color: rgba(242, 244, 240, .82);
          transform: none;
          transition: color .18s ease, transform .18s ease;
        }

        .player-card:hover .player-card-name strong,
        .player-card.active .player-card-name strong {
          color: #00e875;
          transform: translateY(-2px);
        }

        .player-card-name small,
        .selected-player-copy .micro-label,
        .selected-player-stats span {
          font-family: var(--font-tactical) !important;
          font-weight: 700 !important;
          letter-spacing: .16em !important;
        }

        /*
          La firma aparece solamente cuando el jugador está abierto.
          Nombre y apellido quedan como microdetalle editorial.
        */
        .selected-player-name {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 7px !important;
        }

        .selected-player-name > span {
          order: 2;
          color: rgba(242, 244, 240, .42) !important;
          font-family: var(--font-tactical) !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          line-height: 1 !important;
          letter-spacing: .18em !important;
          text-transform: uppercase !important;
        }

        .selected-player-name strong {
          order: 1;
          font-family: var(--font-signature) !important;
          font-size: clamp(3.4rem, 5.2vw, 6.25rem) !important;
          font-weight: 400 !important;
          line-height: .68 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          color: #00e875 !important;
        }

        /* =========================
           ROSTER / FONDO PLANO
           ========================= */

        .roster,
        .selected-player-shell,
        .selected-player {
          background: #050706 !important;
          background-image: none !important;
        }

        .selected-player-shell {
          box-shadow: none !important;
        }

        /*
          Sin línea divisoria vertical entre stats y personaje.
        */
        .selected-player::before {
          display: none !important;
        }

        /*
          Stats completamente limpias:
          sin cruz, sin bordes entre celdas y sin paneles internos.
        */
        .selected-player-stats {
          gap: clamp(18px, 2vw, 34px) !important;
          border: 0 !important;
          background: transparent !important;
        }

        .selected-player-stats > div,
        .selected-player-stats > div:nth-child(even),
        .selected-player-stats > div:nth-last-child(-n+2) {
          min-height: clamp(74px, 9vh, 102px) !important;
          padding: 10px 0 !important;
          border: 0 !important;
          background: transparent !important;
        }

        .selected-player-stats strong {
          color: #f2f4f0;
        }

        .selected-player-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .selected-player-profile-link {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          padding: 0 13px;
          margin-left: 4px;
          border: 1px solid #29312c;
          background: #0d100e;
          color: #aeb7b1;
          text-decoration: none;
          font: 700 8px/1 'Inter', sans-serif;
          letter-spacing: .11em;
          transition: border-color .18s ease, color .18s ease, background .18s ease;
        }

        .selected-player-profile-link:hover {
          border-color: #00e875;
          color: #00e875;
          background: #0d100e;
        }

        /*
          Sin iluminación o halo artificial sobre los PNG.
        */
        .selected-player-figure img,
        .player-card-media img {
          filter: none !important;
        }

        .selected-player-depth-name {
          position: absolute;
          z-index: 0;
          left: 50%;
          top: 22%;
          width: 100%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          opacity: .42;
          pointer-events: none;
        }

        .depth-text {
          display: inline-block;
          perspective: var(--depth-text-perspective);
          perspective-origin: 50% 48%;
          isolation: isolate;
        }

        .depth-text__stage {
          position: relative;
          display: inline-grid;
          place-items: center;
          transform-style: preserve-3d;
          transform-origin: 50% 50%;
          will-change: transform;
        }

        .depth-text__layer,
        .depth-text__face {
          grid-area: 1 / 1;
          display: inline-block;
          font-family: var(--font-impact);
          font-size: var(--depth-text-font-size);
          font-weight: var(--depth-text-font-weight);
          line-height: .86;
          letter-spacing: -.055em;
          white-space: nowrap;
          user-select: none;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          font-kerning: normal;
          text-rendering: geometricPrecision;
        }

        .depth-text__layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          filter: saturate(.88) brightness(.82);
          pointer-events: none;
        }

        .depth-text__face {
          position: relative;
          z-index: 1;
          color: var(--depth-text-face-color);
          text-shadow: var(--depth-text-shadow);
          transform: translateZ(.6px);
        }

        @media (max-width: 820px) {
          .selected-player-depth-name {
            top: 18%;
            opacity: .38;
          }
        }

        @media (max-width: 580px) {
          .roster {
            min-height: 0 !important;
            padding-top: 76px !important;
            padding-bottom: 0 !important;
          }

          .roster-heading {
            padding: 28px 0 18px !important;
            margin-bottom: 0 !important;
          }

          .roster-heading h2 {
            font-size: clamp(52px, 17vw, 70px) !important;
          }

          .roster-carousel {
            flex-basis: 214px !important;
          }

          .roster-carousel-track {
            padding-left: 18px !important;
            padding-right: 18px !important;
            gap: 10px !important;
          }

          .player-card {
            flex-basis: 126px !important;
            width: 126px !important;
          }

          .selected-player-shell {
            min-height: 0 !important;
          }

          .selected-player {
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0 !important;
            padding: 18px 0 58px !important;
          }

          .selected-player-figure {
            order: 1 !important;
            width: 100%;
            min-height: 300px !important;
            max-height: 360px;
          }

          .selected-player-figure img {
            max-height: 360px;
          }

          .selected-player-copy {
            order: 2 !important;
            width: 100%;
            padding: 24px 0 18px !important;
          }

          .selected-player-name strong {
            font-size: clamp(3rem, 15vw, 4.5rem) !important;
          }

          .selected-player-bio {
            max-width: 100% !important;
            font-size: 13px !important;
            line-height: 1.55 !important;
          }

          .selected-player-actions {
            gap: 7px;
          }

          .selected-player-profile-link {
            min-height: 42px;
            flex: 1 1 auto;
            justify-content: center;
            margin-left: 0;
          }

          .selected-player-stats {
            order: 3 !important;
            width: 100%;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .selected-player-stats > div,
          .selected-player-stats > div:nth-child(even),
          .selected-player-stats > div:nth-last-child(-n+2) {
            min-height: 86px !important;
            padding: 10px 0 !important;
          }

          .selected-player-stats strong {
            font-size: clamp(28px, 10vw, 40px) !important;
          }

          .selected-player-depth-name {
            top: 8%;
            opacity: .28;
          }
        }

        @media (max-width: 380px) {
          .player-card {
            flex-basis: 116px !important;
            width: 116px !important;
          }

          .selected-player-figure {
            min-height: 280px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .depth-text__stage {
            will-change: auto;
          }
        }
      `}</style>

      <div className="section-shell roster-heading">
        <div>
          <span className="micro-label">ROSTER ACTUAL</span>
          <h2>PLANTEL.</h2>
        </div>

        <p>
          Arrastrá para recorrer el equipo. Hacé click sobre cualquier jugador para seleccionarlo.
        </p>
      </div>

      <div
        className="roster-carousel"
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => dragRef.current.down && endDrag()}
      >
        <div className="roster-carousel-track">
          {players.map((item, index) => (
            <button
              type="button"
              key={item.slug}
              className={`player-card ${index === active ? 'active' : ''}`}
              onClick={() => selectPlayer(index)}
              aria-pressed={index === active}
              aria-label={`Seleccionar a ${item.nickname}`}
            >
              <div className="player-card-media">
                {item.image ? (
                  <img src={item.image} alt={item.nickname} draggable="false" />
                ) : (
                  <div className="player-image-placeholder" aria-hidden="true">
                    <span>PNG</span>
                  </div>
                )}
              </div>

              <div className="player-card-name">
                <small>{item.role}</small>
                <strong>{item.nickname}</strong>
              </div>
            </button>
          ))}

          <div className="carousel-end-space" aria-hidden="true" />
        </div>
      </div>

      <div className="selected-player-shell">
        <div className="section-shell selected-player">
          <div className="selected-player-copy">
            <span className="micro-label">{player.role}</span>

            <p className="selected-player-name">
              <span>{player.name}</span>
              <strong>{player.nickname}</strong>
            </p>

            <p className="selected-player-bio">{player.bio}</p>

            <div className="selected-player-actions">
              <button
                type="button"
                className="roster-arrow"
                aria-label="Jugador anterior"
                onClick={() => movePlayer(-1)}
              >
                ←
              </button>

              <button
                type="button"
                className="roster-arrow"
                aria-label="Jugador siguiente"
                onClick={() => movePlayer(1)}
              >
                →
              </button>

              <Link
                className="selected-player-profile-link"
                to={`/players/${player.slug}`}
              >
                FICHA DEL JUGADOR →
              </Link>
            </div>
          </div>

          <div className="selected-player-stats">
            <div>
              <strong>{player.stats.rating}</strong>
              <span>RATING</span>
            </div>
            <div>
              <strong>{player.stats.kd}</strong>
              <span>K/D</span>
            </div>
            <div>
              <strong>{player.stats.hs}</strong>
              <span>HS%</span>
            </div>
            <div>
              <strong>{player.stats.maps}</strong>
              <span>MAPAS</span>
            </div>
          </div>

          <div className="selected-player-figure" aria-label={`Imagen destacada de ${player.nickname}`}>
            <DepthText
              key={player.slug}
              text={player.nickname}
              layers={12}
              depth={1.1}
              faceColor="#173225"
              depthColor="#01D069"
              tilt={3.2}
              pointerTracking
              smoothing={0.12}
              perspective={1100}
              autoOrbit={false}
              fontSize="clamp(3rem, 5.2vw, 5.5rem)"
              fontWeight={800}
              shadow={false}
              className="selected-player-depth-name"
            />

            {player.image ? (
              <img src={player.image} alt={player.nickname} />
            ) : (
              <div className="selected-player-placeholder">
                <span>PNG DEL JUGADOR</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
