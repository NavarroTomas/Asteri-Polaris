import { useEffect } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function canAncestorScroll(target, deltaY) {
  let element =
    target instanceof Element
      ? target
      : null

  while (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
    const styles =
      window.getComputedStyle(element)

    const overflowY =
      styles.overflowY

    const scrollable =
      (overflowY === 'auto' ||
        overflowY === 'scroll') &&
      element.scrollHeight >
        element.clientHeight + 1

    if (scrollable) {
      const canScrollDown =
        deltaY > 0 &&
        element.scrollTop +
          element.clientHeight <
          element.scrollHeight - 1

      const canScrollUp =
        deltaY < 0 &&
        element.scrollTop > 1

      if (
        canScrollDown ||
        canScrollUp
      ) {
        return true
      }
    }

    element =
      element.parentElement
  }

  return false
}

export default function SmoothScrollController() {
  useEffect(() => {
    const reducedMotion =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

    const finePointer =
      window.matchMedia(
        '(hover: hover) and (pointer: fine)',
      ).matches

    if (
      reducedMotion ||
      !finePointer
    ) {
      return undefined
    }

    let current =
      window.scrollY

    let target =
      window.scrollY

    let frame = 0
    let running = false

    const maxScroll = () =>
      Math.max(
        0,
        document.documentElement.scrollHeight -
          window.innerHeight,
      )

    const tick = () => {
      current +=
        (target - current) *
        0.14

      if (
        Math.abs(
          target - current,
        ) < 0.45
      ) {
        current = target

        window.scrollTo(
          0,
          current,
        )

        running = false
        frame = 0
        return
      }

      window.scrollTo(
        0,
        current,
      )

      frame =
        window.requestAnimationFrame(
          tick,
        )
    }

    const start = () => {
      if (running) return

      running = true
      current = window.scrollY

      frame =
        window.requestAnimationFrame(
          tick,
        )
    }

    const onWheel = event => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        Math.abs(event.deltaX) >
          Math.abs(event.deltaY) ||
        canAncestorScroll(
          event.target,
          event.deltaY,
        )
      ) {
        return
      }

      event.preventDefault()

      const multiplier =
        event.deltaMode === 1
          ? 18
          : event.deltaMode === 2
            ? window.innerHeight
            : 1

      target = clamp(
        target +
          event.deltaY *
            multiplier,
        0,
        maxScroll(),
      )

      start()
    }

    const onNativeScroll = () => {
      if (running) return

      current = window.scrollY
      target = window.scrollY
    }

    const onResize = () => {
      target = clamp(
        target,
        0,
        maxScroll(),
      )
    }

    window.addEventListener(
      'wheel',
      onWheel,
      {
        passive: false,
      },
    )

    window.addEventListener(
      'scroll',
      onNativeScroll,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'resize',
      onResize,
    )

    return () => {
      window.removeEventListener(
        'wheel',
        onWheel,
      )

      window.removeEventListener(
        'scroll',
        onNativeScroll,
      )

      window.removeEventListener(
        'resize',
        onResize,
      )

      if (frame) {
        window.cancelAnimationFrame(
          frame,
        )
      }
    }
  }, [])

  return null
}
