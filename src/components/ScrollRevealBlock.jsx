import { useLayoutEffect, useRef, useState } from 'react'
import './ScrollRevealBlock.css'

export default function ScrollRevealBlock({
  children,
  className = '',
  distance = 72,
}) {
  const ref = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) {
      setEnabled(false)
      setVisible(true)
      return undefined
    }

    setEnabled(true)

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true)
            return
          }

          setVisible(false)
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -7% 0px',
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={[
        'asteri-scroll-reveal',
        enabled ? 'is-reveal-enabled' : '',
        visible ? 'is-visible' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        '--asteri-reveal-distance': `${distance}px`,
      }}
    >
      {children}
    </div>
  )
}
