<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 光标系统(项目定位"前端设计展示"的一部分,用户明确要求):
 * 光点即时跟随 + 光环惯性滞后;悬停可交互元素时光环放大。
 * 仅精细指针且允许动效时启用;输入框保留系统光标保证可用性。
 */
const dotEl = ref<HTMLElement | null>(null)
const ringEl = ref<HTMLElement | null>(null)

const active = ref(false)
let rafId = 0
let cleanupFns: (() => void)[] = []

function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

onMounted(() => {
  if (!finePointer() || reducedMotion()) return
  document.documentElement.classList.add('cursor-fx')
  active.value = true

  // 光点即时,光环 lerp 滞后;值直接写 transform,不进框架状态
  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let ringX = mouseX
  let ringY = mouseY
  let visible = false

  const onMove = (event: PointerEvent) => {
    mouseX = event.clientX
    mouseY = event.clientY
    if (!visible) {
      visible = true
      ringX = mouseX
      ringY = mouseY
      dotEl.value?.style.setProperty('opacity', '1')
      ringEl.value?.style.setProperty('opacity', '1')
    }
    dotEl.value?.style.setProperty('transform', `translate(${mouseX}px, ${mouseY}px)`)
  }

  const onLeave = () => {
    visible = false
    dotEl.value?.style.setProperty('opacity', '0')
    ringEl.value?.style.setProperty('opacity', '0')
  }

  const onOver = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    const interactive = target?.closest('a, button, input, textarea, select, [data-cursor]')
    ringEl.value?.style.setProperty('--ring-scale', interactive ? '1.9' : '1')
  }

  const loop = () => {
    ringX += (mouseX - ringX) * 0.14
    ringY += (mouseY - ringY) * 0.14
    ringEl.value?.style.setProperty('transform', `translate(${ringX}px, ${ringY}px)`)
    rafId = requestAnimationFrame(loop)
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  rafId = requestAnimationFrame(loop)

  cleanupFns = [
    () => document.removeEventListener('pointermove', onMove),
    () => document.removeEventListener('pointerover', onOver),
    () => document.documentElement.removeEventListener('pointerleave', onLeave),
    () => cancelAnimationFrame(rafId),
    () => document.documentElement.classList.remove('cursor-fx'),
  ]
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
})
</script>

<template>
  <div v-if="active" class="cursor-layer" aria-hidden="true">
    <div ref="dotEl" class="cursor-dot"></div>
    <div ref="ringEl" class="cursor-ring"></div>
  </div>
</template>

<style scoped>
.cursor-layer {
  position: fixed;
  inset: 0;
  z-index: 10001;
  pointer-events: none;
}

.cursor-dot,
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.cursor-dot {
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  background: var(--color-accent);
}

.cursor-ring {
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  opacity: 0.55;
}

/* 环的缩放走内层变量,避免与位移 transform 冲突 */
.cursor-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--color-accent);
  transform: scale(var(--ring-scale, 1));
  transition: transform 0.25s var(--ease-out);
}
</style>
