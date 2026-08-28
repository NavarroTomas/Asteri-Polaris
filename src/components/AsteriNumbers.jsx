import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'

function GridMotion({ items }) {
  const rowRefs = useRef([])
  const mouseXRef = useRef(
    typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  )

  useEffect(() => {
    const handleMouseMove = event => {
      mouseXRef.current = event.clientX
    }

    const updateMotion = () => {
      const screenWidth = window.innerWidth || 1
      const normalized = mouseXRef.current / screenWidth

      const maxMove = 190
      const inertia = [1.05, 0.88, 0.72, 0.62]

      rowRefs.current.forEach((row, index) => {
        if (!row) return

        const direction = index % 2 === 0 ? 1 : -1
        const moveAmount =
          (normalized * maxMove - maxMove / 2) * direction

        gsap.to(row, {
          x: moveAmount,
          duration: inertia[index],
          ease: 'power3.out',
          overwrite: 'auto',
        })
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    gsap.ticker.add(updateMotion)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      gsap.ticker.remove(updateMotion)
      gsap.killTweensOf(rowRefs.current)
    }
  }, [])

  return (
    <div className="asteri-grid-motion">
      <div className="asteri-grid-motion-container">
        {Array.from({ length: 4 }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="asteri-grid-motion-row"
            ref={element => {
              rowRefs.current[rowIndex] = element
            }}
          >
            {Array.from({ length: 7 }, (_, itemIndex) => {
              const index = rowIndex * 7 + itemIndex

              return (
                <div
                  className="asteri-grid-motion-item"
                  key={index}
                >
                  <div className="asteri-grid-motion-item-inner">
                    {items[index]}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function TextCell({
  children,
  green = false,
  muted = false,
  statement = false,
}) {
  return (
    <span
      className={[
        'asteri-grid-text',
        green ? 'asteri-grid-text--green' : '',
        muted ? 'asteri-grid-text--muted' : '',
        statement ? 'asteri-grid-text--statement' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}

function NumberCell({ value, label }) {
  return (
    <div className="asteri-grid-number">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function AsteriNumbers() {
  const items = useMemo(
    () => [
      // ========================================
      // FILA SUPERIOR
      // ========================================
      <TextCell green key="1">ASTERI</TextCell>,
      <TextCell key="2">POLARIS</TextCell>,
      <TextCell muted key="3">COUNTER-STRIKE 2</TextCell>,
      <TextCell key="4">ARGENTINA</TextCell>,
      <TextCell green key="5">SEASON 01</TextCell>,
      <TextCell key="6">NEW ERA</TextCell>,
      <TextCell muted key="7">CS2</TextCell>,

      // ========================================
      // FILA CENTRAL — LA MÁS VISIBLE
      // ========================================
      <TextCell statement key="8">
        THE COUNT
        <br />
        STARTS NOW
      </TextCell>,

      <NumberCell
        key="9"
        value="06"
        label="PLAYERS"
      />,

      <NumberCell
        key="10"
        value="02"
        label="MATCHES"
      />,

      <NumberCell
        key="11"
        value="02"
        label="WINS"
      />,

      <NumberCell
        key="12"
        value="01"
        label="TEAM"
      />,

      <TextCell green key="13">ASTERI</TextCell>,
      <TextCell key="14">POLARIS</TextCell>,

      // ========================================
      // FILA INFERIOR
      // ========================================
      <TextCell muted key="15">FIRST MATCH</TextCell>,
      <TextCell key="16">THE</TextCell>,
      <TextCell green key="17">COUNT</TextCell>,
      <TextCell key="18">STARTS</TextCell>,
      <TextCell muted key="19">NOW</TextCell>,
      <TextCell key="20">LEGACY</TextCell>,
      <TextCell green key="21">TOGETHER</TextCell>,

      // ========================================
      // FILA INFERIOR 2
      // ========================================
      <TextCell key="22">ASTERI</TextCell>,
      <TextCell green key="23">POLARIS</TextCell>,
      <TextCell muted statement key="24">
        THE STORY
        <br />
        STARTS HERE
      </TextCell>,
      <TextCell key="25">ARGENTINA</TextCell>,
      <TextCell green key="26">CS2</TextCell>,
      <TextCell key="27">SEASON 01</TextCell>,
      <TextCell muted key="28">NEW ERA</TextCell>,
    ],
    []
  )

  return (
    <section
      id="numbers"
      className="asteri-numbers"
    >
      {/* ÚNICA CAPA DE LA SECCIÓN */}
      <GridMotion items={items} />

      <style>{`
        .asteri-numbers {
          position: relative;

          width: 100%;
          height: 100vh;
          min-height: 780px;

          overflow: hidden;

          background: #040605;
        }


        /* ========================================
           GRID MOTION
        ======================================== */

        .asteri-grid-motion {
          position: absolute;
          inset: 0;

          overflow: hidden;
        }

        .asteri-grid-motion-container {
          position: absolute;

          left: 50%;
          top: 50%;

          width: 158vw;
          height: 148vh;

          transform:
            translate(-50%, -50%)
            rotate(-11deg);

          display: grid;
          grid-template-rows:
            repeat(4, 1fr);

          gap: 14px;
        }

        .asteri-grid-motion-row {
          display: grid;

          grid-template-columns:
            repeat(7, 1fr);

          gap: 14px;

          will-change:
            transform;
        }

        .asteri-grid-motion-item {
          min-width: 0;
        }

        .asteri-grid-motion-item-inner {
          width: 100%;
          height: 100%;

          min-height: 170px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 22px;

          overflow: hidden;

          text-align: center;

          background: #090d0b;

          border:
            1px solid
            rgba(255,255,255,.055);
        }


        /* ========================================
           COLORES DE LAS CELDAS
           Sin glow, sin gradientes.
        ======================================== */

        .asteri-grid-motion-row:nth-child(1)
        .asteri-grid-motion-item:nth-child(1)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(1)
        .asteri-grid-motion-item:nth-child(5)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(3)
        .asteri-grid-motion-item:nth-child(3)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(3)
        .asteri-grid-motion-item:nth-child(7)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(4)
        .asteri-grid-motion-item:nth-child(2)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(4)
        .asteri-grid-motion-item:nth-child(5)
        .asteri-grid-motion-item-inner {
          background: #00d96e;
          border-color: transparent;
        }


        /* ========================================
           FILA CENTRAL — STATS
        ======================================== */

        .asteri-grid-motion-row:nth-child(2)
        .asteri-grid-motion-item:nth-child(2)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(2)
        .asteri-grid-motion-item:nth-child(4)
        .asteri-grid-motion-item-inner {
          background: #e8e5dc;
          border-color: transparent;
        }

        .asteri-grid-motion-row:nth-child(2)
        .asteri-grid-motion-item:nth-child(3)
        .asteri-grid-motion-item-inner,

        .asteri-grid-motion-row:nth-child(2)
        .asteri-grid-motion-item:nth-child(5)
        .asteri-grid-motion-item-inner {
          background: #00d96e;
          border-color: transparent;
        }


        /* ========================================
           TEXTOS
        ======================================== */

        .asteri-grid-text {
          display: inline-block;

          color:
            rgba(242,244,240,.9);

          font:
            850
            clamp(
              28px,
              2.15vw,
              48px
            )/.9
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing:
            -.055em;

          text-transform:
            uppercase;
        }

        .asteri-grid-text--green {
          color: #061009;
        }

        .asteri-grid-text--muted {
          color:
            rgba(242,244,240,.36);
        }

        .asteri-grid-text--statement {
          font-size:
            clamp(
              32px,
              2.7vw,
              60px
            );

          line-height:
            .82;

          letter-spacing:
            -.065em;
        }


        /* ========================================
           NÚMEROS
        ======================================== */

        .asteri-grid-number {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 12px;

          color: #07110b;
        }

        .asteri-grid-number strong {
          display: block;

          font:
            900
            clamp(
              90px,
              8vw,
              154px
            )/.75
            'Bricolage Grotesque',
            sans-serif;

          letter-spacing:
            -.09em;

          font-variant-numeric:
            tabular-nums;
        }

        .asteri-grid-number span {
          font:
            850
            clamp(
              10px,
              .82vw,
              14px
            )/1
            'Inter',
            sans-serif;

          letter-spacing:
            .18em;

          text-transform:
            uppercase;
        }


        /* ========================================
           MOBILE
        ======================================== */

        @media (
          max-width: 1100px
        ) {

          .asteri-grid-motion-container {
            width:
              205vw;

            height:
              150vh;
          }

          .asteri-grid-motion-item-inner {
            min-height:
              150px;
          }

        }


        @media (
          max-width: 768px
        ) {

          .asteri-numbers {
            min-height:
              680px;
          }

          .asteri-grid-motion-container {
            width:
              290vw;

            height:
              145vh;

            gap:
              11px;
          }

          .asteri-grid-motion-row {
            gap:
              11px;
          }

          .asteri-grid-motion-item-inner {
            min-height:
              125px;

            padding:
              14px;
          }

          .asteri-grid-text {
            font-size:
              clamp(
                19px,
                4.5vw,
                28px
              );
          }

          .asteri-grid-number strong {
            font-size:
              clamp(
                70px,
                15vw,
                110px
              );
          }

        }


        @media (
          prefers-reduced-motion:
          reduce
        ) {

          .asteri-grid-motion-row {
            transform:
              none !important;
          }

        }
      `}</style>
    </section>
  )
}
