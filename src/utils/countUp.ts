import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * 数字滚动:源数值变化时,展示值在 duration 内缓动跟随。
 * reduced-motion 或首次取值时直接跳到目标。
 */
export function useCountUp(source: Ref<number>, duration = 400): Ref<number> {
  const display = ref(source.value)
  let rafId = 0

  function reduced(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  watch(source, (target) => {
    cancelAnimationFrame(rafId)
    if (reduced()) {
      display.value = target
      return
    }
    const from = display.value
    const start = performance.now()
    const step = (now: number) => {
      const linear = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - linear, 3)
      display.value = Math.round(from + (target - from) * eased)
      if (linear < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
  })

  onBeforeUnmount(() => cancelAnimationFrame(rafId))
  return display
}
