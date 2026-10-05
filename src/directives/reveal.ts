import type { Directive } from 'vue'

/**
 * v-reveal 入场揭幕指令:元素进入视口时加 .reveal-in。
 * 绑定值为 stagger 序号(每档 60ms,封顶 8 档)。
 * 仅在允许动效时隐藏(CSS 侧由 prefers-reduced-motion 门控);
 * 无 IntersectionObserver 的环境(如 jsdom)直接标记可见。
 */
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver !== 'function') return null
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in')
            observer?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.1 },
    )
  }
  return observer
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const delay = Math.min(binding.value ?? 0, 8) * 60
    el.classList.add('reveal')
    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`
    }
    const io = getObserver()
    if (io) {
      io.observe(el)
    } else {
      el.classList.add('reveal-in')
    }
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
