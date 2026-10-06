import Lenis from 'lenis'

/**
 * 惯性平滑滚动(Awwwards 手感基建,约 4KB)。
 * lenis 以 rAF 驱动原生滚动位置,因此 CSS scroll-timeline /
 * IntersectionObserver / position: fixed 均不受影响。
 * prefers-reduced-motion 时不启用,保持原生滚动。
 */
let lenis: Lenis | null = null

export function initSmoothScroll(): void {
  if (lenis) return
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  lenis = new Lenis({ autoRaf: true })
}

export function scrollToTop(): void {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2 })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export function scrollToElement(el: HTMLElement): void {
  if (lenis) {
    lenis.scrollTo(el, { offset: -80, duration: 1.1 })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
