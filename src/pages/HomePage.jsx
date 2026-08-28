import { useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'motion/react'

import Header from '../components/Header'
import SideTimeline from '../components/SideTimeline'
import HeroVideo from '../components/HeroVideo'
import RosterShowcase from '../components/RosterShowcase'
import PlayersNumbersTransition from '../components/PlayersNumbersTransition'
import AsteriNumbers from '../components/AsteriNumbers'
import HistoryTimeline from '../components/HistoryTimeline'
import FounderSection from '../components/FounderSection'
import NextObjective from '../components/NextObjective'
import MatchesHub from '../components/MatchesHub'
import CommunitySection from '../components/CommunitySection'
import Footer from '../components/Footer'

function useElementWidth(ref) {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (ref.current) setWidth(ref.current.offsetWidth)
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [ref])

  return width
}

function wrap(min, max, value) {
  const range = max - min
  const mod = (((value - min) % range) + range) % range
  return mod + min
}

function VelocityText({
  children,
  baseVelocity,
  damping = 50,
  stiffness = 350,
  numCopies = 14,
  velocityMapping = { input: [0, 1000], output: [0, 4] },
  className = '',
}) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)

  const smoothVelocity = useSpring(scrollVelocity, {
    damping,
    stiffness,
  })

  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping.input,
    velocityMapping.output,
    { clamp: false },
  )

  const copyRef = useRef(null)
  const copyWidth = useElementWidth(copyRef)
  const directionFactor = useRef(1)

  const x = useTransform(baseX, value => {
    if (copyWidth === 0) return '0px'
    return `${wrap(-copyWidth, 0, value)}px`
  })

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

    if (velocityFactor.get() < 0) directionFactor.current = -1
    else if (velocityFactor.get() > 0) directionFactor.current = 1

    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div className="asteri-velocity-parallax">
      <motion.div className="asteri-velocity-scroller" style={{ x }}>
        {Array.from({ length: numCopies }, (_, index) => (
          <span
            className={className}
            key={index}
            ref={index === 0 ? copyRef : null}
          >
            {children}&nbsp;
          </span>
        ))}
      </motion.div>
    </div>
  )
}

function AsteriVelocityStrip() {
  return (
    <section className="asteri-velocity-strip" aria-label="Identidad ASTERI">
      <style>{`
        .asteri-velocity-strip {
          width: 100%;
          overflow: hidden;
          background: #01d069;
          padding: .62rem 0;
          border-top: 1px solid rgba(3, 17, 9, .18);
          border-bottom: 1px solid rgba(3, 17, 9, .18);
        }

        .asteri-velocity-parallax {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .asteri-velocity-parallax + .asteri-velocity-parallax {
          margin-top: .28rem;
        }

        .asteri-velocity-scroller {
          display: flex;
          width: max-content;
          min-width: 100%;
          white-space: nowrap;
          align-items: center;
          will-change: transform;
        }

        .asteri-velocity-text {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          padding-right: .7rem;
          font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
          font-size: clamp(.8rem, 1.05vw, 1.08rem);
          line-height: 1;
          font-weight: 800;
          letter-spacing: .01em;
          text-transform: uppercase;
        }

        .asteri-velocity-text--primary { color: #031109; }
        .asteri-velocity-text--secondary { color: rgba(3, 17, 9, .62); }

        .asteri-velocity-dot {
          display: inline-block;
          margin: 0 .44rem;
          color: #031109;
          opacity: .42;
        }

        @media (max-width: 768px) {
          .asteri-velocity-strip { padding: .52rem 0; }
          .asteri-velocity-text { font-size: .76rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .asteri-velocity-scroller { transform: none !important; }
        }
      `}</style>

      <VelocityText
        baseVelocity={32}
        damping={48}
        stiffness={320}
        numCopies={14}
        className="asteri-velocity-text asteri-velocity-text--primary"
      >
        ASTERI POLARIS <span className="asteri-velocity-dot">•</span>
        COUNTER-STRIKE 2 <span className="asteri-velocity-dot">•</span>
        ARGENTINA <span className="asteri-velocity-dot">•</span>
      </VelocityText>

      <VelocityText
        baseVelocity={-26}
        damping={52}
        stiffness={300}
        numCopies={16}
        className="asteri-velocity-text asteri-velocity-text--secondary"
      >
        DREAM <span className="asteri-velocity-dot">•</span>
        COMPETE <span className="asteri-velocity-dot">•</span>
        EVOLVE <span className="asteri-velocity-dot">•</span>
      </VelocityText>
    </section>
  )
}

export default function HomePage() {
  return (
    <div>
      <Header />
      <SideTimeline />

      <main>
        <HeroVideo />
        <AsteriVelocityStrip />

        {/* 01 — TEAM */}
        <div className="asteri-chapter asteri-chapter--team" data-chapter="team">
          <RosterShowcase />
          <PlayersNumbersTransition />
          <AsteriNumbers />
        </div>

        {/* 02 — COMPETE */}
        <div className="asteri-chapter asteri-chapter--compete" data-chapter="compete">
          <MatchesHub />
        </div>

        {/* 03 — STORY */}
        <div className="asteri-chapter asteri-chapter--story" data-chapter="story">
          <HistoryTimeline />
          <FounderSection />
        </div>

        {/* 04 — FUTURE */}
        <div className="asteri-chapter asteri-chapter--future" data-chapter="future">
          <NextObjective />
        </div>

        {/* 05 — COMMUNITY */}
        <div className="asteri-chapter asteri-chapter--community" data-chapter="community">
          <CommunitySection />
        </div>
      </main>

      <Footer />
    </div>
  )
}
