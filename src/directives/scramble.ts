import type { Directive } from 'vue'

/**
 * v-scramble:悬停时字符滚动解码,从乱码逐位还原为原文。
 * 只用于纯文本元素;reduced-motion / 触屏不启用。
 */
const POOL = '01<>[]{}/+=*#'

interface ScrambleState {
  timer: number | null
  original: string
}

const states = new WeakMap<HTMLElement, ScrambleState>()

export const vScramble: Directive<HTMLElement> = {
  mounted(el) {
    if (typeof matchMedia !== 'function') return
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const state: ScrambleState = { timer: null, original: el.textContent ?? '' }
    states.set(el, state)

    el.addEventListener('pointerenter', () => {
      if (state.timer !== null) return
      const total = 22
      let frame = 0
      state.timer = window.setInterval(() => {
        frame += 1
        const revealed = Math.floor((frame / total) * state.original.length)
        el.textContent = state.original
          .split('')
          .map((char, index) =>
            index < revealed || char === ' ' ? char : POOL[Math.floor(Math.random() * POOL.length)],
          )
          .join('')
        if (frame >= total) {
          el.textContent = state.original
          if (state.timer !== null) {
            window.clearInterval(state.timer)
            state.timer = null
          }
        }
      }, 26)
    })
  },
  unmounted(el) {
    const state = states.get(el)
    if (state?.timer !== null && state?.timer !== undefined) {
      window.clearInterval(state.timer)
    }
    states.delete(el)
  },
}
