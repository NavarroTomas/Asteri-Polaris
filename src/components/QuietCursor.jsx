import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function QuietCursor() {
  const cursor = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => {
    const element = cursor.current
    if (!element || pathname.startsWith('/admin')) return undefined
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    const hide = () => {
      element.hidden = true
      cancelAnimationFrame(frame)
      frame = 0
    }
    const draw = () => {
      x += (targetX - x) * .22
      y += (targetY - y) * .22
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .2 ? requestAnimationFrame(draw) : 0
    }
    const move = event => {
      if (!preference.matches || event.pointerType !== 'mouse' || !(event.target instanceof Element) || event.target.closest('input, textarea, select, [contenteditable="true"]')) {
        hide()
        return
      }
      targetX = event.clientX
      targetY = event.clientY
      if (element.hidden) { x = targetX; y = targetY }
      element.hidden = false
      element.dataset.active = event.target.closest('a[href], button, [role="button"]') ? 'true' : 'false'
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const leave = event => { if (!event.relatedTarget) hide() }
    const keyboard = event => { if (event.key === 'Tab') hide() }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerout', leave)
    window.addEventListener('blur', hide)
    window.addEventListener('scroll', hide, { passive: true, capture: true })
    window.addEventListener('keydown', keyboard)
    preference.addEventListener('change', hide)
    return () => {
      hide()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerout', leave)
      window.removeEventListener('blur', hide)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('keydown', keyboard)
      preference.removeEventListener('change', hide)
    }
  }, [pathname])
  return <div ref={cursor} className="ap-quiet-cursor" aria-hidden="true" hidden><span /></div>
}
