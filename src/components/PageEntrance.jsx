import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TARGETS = [
  '.ap-logo', '.ap-nav > a', '.ap-about', '.ap-nav-actions > *',
  '.ap-recruit-copy', '.ap-mascot', '.ap-section-heading', '.ap-update-card', '.ap-match-panel', '.ap-media-card',
  '.ap-channels h2', '.ap-channel', '.pp-channels h2', '.pp-channel',
  '.pp-heading', '.pp-filter-bar', '.pp-section-title', '.pp-match-row', '.pp-empty',
  '.pp-team-heading', '.pp-team-socials', '.pp-player', '.pp-video-feature', '.pp-vod-card',
  '.pp-history-card', '.pp-quote', '.pp-link-card', '.pp-community-hero', '.pp-contact-card', '.pp-application',
  '.public-player-hero-copy', '.public-player-hero-visual', '.public-player-primary-stats', '.public-player-section',
  '.vod-hero > div', '.vod-hero > aside', '.vod-section', '.ap-footer-grid > *',
].join(',')

export default function PageEntrance() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    if (pathname.startsWith('/admin') || !window.IntersectionObserver) return undefined
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const registered = new WeakSet()
    const running = new Set()
    const pending = new Set()
    let scanFrame = 0
    const reveal = (element, index) => {
      element.classList.remove('ap-enter-pending')
      pending.delete(element)
      if (preference.matches || !element.animate) return
      element.classList.add('ap-entering')
      const mascot = element.classList.contains('ap-mascot')
      const animation = element.animate([
        { opacity: 0, transform: `translate3d(0, ${mascot ? 140 : 72}px, 0) rotate(${mascot ? 5 : .5}deg)`, offset: 0 },
        { opacity: 1, transform: `translate3d(0, ${mascot ? -18 : -9}px, 0) rotate(${mascot ? -2 : -.15}deg)`, offset: .67 },
        { opacity: 1, transform: 'translate3d(0, 3px, 0) rotate(0deg)', offset: .86 },
        { opacity: 1, transform: 'translate3d(0, 0, 0) rotate(0deg)', offset: 1 },
      ], { duration: mascot ? 1150 : 850, delay: Math.min(index * 48, 900), easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'backwards' })
      running.add(animation)
      animation.finished.catch(() => {}).finally(() => {
        running.delete(animation)
        element.classList.remove('ap-entering')
      })
    }
    const observer = new IntersectionObserver(entries => {
      let order = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        reveal(entry.target, order++)
      }
    }, { threshold: .01, rootMargin: '0px 0px -15px 0px' })
    const scan = () => {
      scanFrame = 0
      document.querySelectorAll(TARGETS).forEach(element => {
        if (registered.has(element)) return
        registered.add(element)
        if (!preference.matches && element.animate) {
          element.classList.add('ap-enter-pending')
          pending.add(element)
        }
        observer.observe(element)
      })
    }
    scan()
    // Register cards arriving from the published roster and match requests as well.
    const mutations = new MutationObserver(() => {
      if (!scanFrame) scanFrame = requestAnimationFrame(scan)
    })
    mutations.observe(document.getElementById('root'), { childList: true, subtree: true })
    const stopMotion = () => {
      if (!preference.matches) return
      running.forEach(animation => animation.cancel())
      pending.forEach(element => element.classList.remove('ap-enter-pending'))
      pending.clear()
    }
    preference.addEventListener('change', stopMotion)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      cancelAnimationFrame(scanFrame)
      running.forEach(animation => animation.cancel())
      pending.forEach(element => element.classList.remove('ap-enter-pending'))
      preference.removeEventListener('change', stopMotion)
    }
  }, [pathname])
  return null
}
