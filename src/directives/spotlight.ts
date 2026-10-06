import type { Directive } from 'vue'

/**
 * v-spotlight:跟随光标的光斑边框。
 * 指令只负责把光标位置写入 --px/--py,发光层由组件样式绘制。
 * 触屏/无精细指针的环境不挂监听。
 */
interface SpotlightElement extends HTMLElement {
  __spotlightOff?: () => void
}

export const vSpotlight: Directive<SpotlightElement> = {
  mounted(el) {
    if (typeof matchMedia !== 'function' || !matchMedia('(pointer: fine)').matches) return

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--px', `${event.clientX - rect.left}px`)
      el.style.setProperty('--py', `${event.clientY - rect.top}px`)
    }
    el.addEventListener('pointermove', onMove)
    el.__spotlightOff = () => el.removeEventListener('pointermove', onMove)
  },
  unmounted(el) {
    el.__spotlightOff?.()
    delete el.__spotlightOff
  },
}
