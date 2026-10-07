<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 禅意高精流体磁吸浮标 (Zen Dual-Core Magnetic Cursor):
 * 1. 焦点准心与外环双核物理磁吸 (Dual-Core Magnetic Snapping):
 *    - 外环 (.cursor-ring) 磁吸自适应形变包裹交互组件边框；
 *    - 中心高亮点 (.cursor-dot) 同步受磁力吸入组件重心核心区，并伴随弹性张力；
 * 2. 释放平滑回弹 (Elastic Snap-Back):
 *    - 离开磁吸范围时，准心点与外环如被释放的弹簧般无缝回弹至鼠标指针，无卡顿无跳变；
 * 3. 矢量级像素保真 (Pixel-Perfect Vector Sizing):
 *    - 彻底杜绝 GPU transform: scale 导致的边缘毛糙发虚；
 * 4. 自由态零延迟追踪 (Zero-Lag in Free Space):
 *    - 在非磁吸空旷区域，准心点保持 1:1 绝对零延迟跟手精度。
 */

const dotEl = ref<HTMLElement | null>(null)
const ringEl = ref<HTMLElement | null>(null)

const active = ref(false)
let cleanupFns: (() => void)[] = []
let rafId = 0

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'label',
  'summary',
  'select',
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[data-cursor]',
  '[tabindex="0"]',
  '.project-stream-row',
  '.project-stream-item',
  '.post-stream-row',
  '.stream-row',
  '.capsule',
  '.inline-cmd',
  '.filter-pill',
  '.telemetry-btn',
  '.traffic-dot',
  '.dot',
  '.light',
  '.terminal-restore-pill',
  '.post-card',
  '.category-card',
  '.tag-chip',
  '.contact-item',
  '.toc-link',
  '.back-to-top',
  '.back-top',
  '.stream-all-link',
  '.stream-retry-btn',
  '.manifesto-cli-btn',
  '.item-link',
  '.nav-link',
  '.search-btn',
  '.theme-toggle-btn',
  '.alpine-plaque-card',
  '.museum-plaque-card',
  '.channel-stream-row.interactive',
].join(', ')

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

  let visible = false
  let mouseX = -100
  let mouseY = -100
  let ringX = -100
  let ringY = -100
  let dotX = -100
  let dotY = -100
  let isPressed = false
  let inTextInput = false
  let magneticEl: HTMLElement | null = null

  const BASE_SIZE = 32
  let currentTargetW = BASE_SIZE
  let currentTargetH = BASE_SIZE
  let currentTargetRadius = '50%'

  const checkTextInput = (target: HTMLElement | null): boolean => {
    return Boolean(
      target?.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
      )
    )
  }

  const updateInteractiveState = (target: HTMLElement | null) => {
    inTextInput = checkTextInput(target)

    if (inTextInput) {
      magneticEl = null
      if (dotEl.value) {
        dotEl.value.style.opacity = '0'
        dotEl.value.classList.remove('is-magnetic')
      }
      if (ringEl.value) ringEl.value.style.opacity = '0'
      return
    }

    if (visible) {
      if (dotEl.value) dotEl.value.style.opacity = '1'
      if (ringEl.value) ringEl.value.style.opacity = '1'
    }

    const interactive = target?.closest(INTERACTIVE_SELECTOR) as HTMLElement | null

    if (interactive && interactive.isConnected) {
      const rect = interactive.getBoundingClientRect()
      // 判断是否为紧凑型可吸附目标（按钮、胶囊、药丸、图标、标签）
      const isCompact = rect.width > 0 && rect.height > 0 && rect.width <= 360 && rect.height <= 86

      if (isCompact) {
        magneticEl = interactive
        const comp = window.getComputedStyle(interactive)
        currentTargetW = Math.round(rect.width + 12)
        currentTargetH = Math.round(rect.height + 8)
        currentTargetRadius = comp.borderRadius || '9999px'

        if (ringEl.value) {
          ringEl.value.style.width = `${currentTargetW}px`
          ringEl.value.style.height = `${currentTargetH}px`
          ringEl.value.style.borderRadius = currentTargetRadius
          ringEl.value.classList.add('is-magnetic')
          ringEl.value.classList.remove('is-large')
        }
        if (dotEl.value) {
          dotEl.value.classList.add('is-magnetic')
        }
      } else {
        // 大面积交互容器（如全宽列表项、作品行）
        magneticEl = null
        currentTargetW = 54
        currentTargetH = 54
        currentTargetRadius = '50%'

        if (ringEl.value) {
          ringEl.value.style.width = `${currentTargetW}px`
          ringEl.value.style.height = `${currentTargetH}px`
          ringEl.value.style.borderRadius = '50%'
          ringEl.value.classList.remove('is-magnetic')
          ringEl.value.classList.add('is-large')
        }
        if (dotEl.value) {
          dotEl.value.classList.remove('is-magnetic')
        }
      }
    } else {
      magneticEl = null
      currentTargetW = BASE_SIZE
      currentTargetH = BASE_SIZE
      currentTargetRadius = '50%'

      if (ringEl.value) {
        ringEl.value.style.width = `${BASE_SIZE}px`
        ringEl.value.style.height = `${BASE_SIZE}px`
        ringEl.value.style.borderRadius = '50%'
        ringEl.value.classList.remove('is-magnetic', 'is-large')
      }
      if (dotEl.value) {
        dotEl.value.classList.remove('is-magnetic')
      }
    }
  }

  const onMove = (event: PointerEvent) => {
    mouseX = event.clientX
    mouseY = event.clientY

    if (!visible) {
      visible = true
      ringX = mouseX
      ringY = mouseY
      dotX = mouseX
      dotY = mouseY
      if (dotEl.value) dotEl.value.style.opacity = '1'
      if (ringEl.value) ringEl.value.style.opacity = '1'
    }

    // 在非吸附自由空间且无弹簧过渡时，准心点保持绝对零延迟同步
    if (!magneticEl && !inTextInput) {
      const dist = Math.hypot(mouseX - dotX, mouseY - dotY)
      if (dist < 1.5) {
        dotX = mouseX
        dotY = mouseY
      }
    }
  }

  const onOver = (event: PointerEvent) => {
    updateInteractiveState(event.target as HTMLElement | null)
  }

  const onLeave = () => {
    visible = false
    magneticEl = null
    if (dotEl.value) {
      dotEl.value.style.opacity = '0'
      dotEl.value.classList.remove('is-magnetic')
    }
    if (ringEl.value) ringEl.value.style.opacity = '0'
  }

  const onDown = () => {
    if (inTextInput) return
    isPressed = true
  }

  const onUp = () => {
    isPressed = false
  }

  // RAF 双核动力学物理循环
  const render = () => {
    if (!active.value) return

    let targetRingX = mouseX
    let targetRingY = mouseY
    let targetDotX = mouseX
    let targetDotY = mouseY

    if (magneticEl && magneticEl.isConnected) {
      const rect = magneticEl.getBoundingClientRect()
      // 若指针已经飞出元素边缘超过 36px，释放磁吸回退到自由模式
      const isOutside =
        mouseX < rect.left - 36 ||
        mouseX > rect.right + 36 ||
        mouseY < rect.top - 36 ||
        mouseY > rect.bottom + 36

      if (isOutside) {
        magneticEl = null
        if (dotEl.value) dotEl.value.classList.remove('is-magnetic')
        updateInteractiveState(document.elementFromPoint(mouseX, mouseY) as HTMLElement | null)
      } else {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // 外环磁吸：吸向几何中心，保留 24% 鼠标弹性偏移
        targetRingX = centerX + (mouseX - centerX) * 0.24
        targetRingY = centerY + (mouseY - centerY) * 0.24

        // 准心高亮点磁吸：更深地沉入组件几何重心，保留 18% 鼠标弹性张力
        targetDotX = centerX + (mouseX - centerX) * 0.18
        targetDotY = centerY + (mouseY - centerY) * 0.18
      }
    }

    // 外环阻尼运动 (0.24 兼顾跟手与惯性)
    ringX += (targetRingX - ringX) * 0.24
    ringY += (targetRingY - ringY) * 0.24

    // 中心高亮点物理动力学
    if (magneticEl) {
      // 磁吸时点被强力吸引进入重心 (阻尼系数 0.38)
      dotX += (targetDotX - dotX) * 0.38
      dotY += (targetDotY - dotY) * 0.38
    } else {
      // 释放磁吸后迅速弹回硬件鼠标位置，距离极近时无缝吻合
      const dist = Math.hypot(mouseX - dotX, mouseY - dotY)
      if (dist < 0.6) {
        dotX = mouseX
        dotY = mouseY
      } else {
        dotX += (mouseX - dotX) * 0.48
        dotY += (mouseY - dotY) * 0.48
      }
    }

    // 渲染外环
    if (ringEl.value && visible && !inTextInput) {
      const rx = ringX.toFixed(2)
      const ry = ringY.toFixed(2)
      const ringScale = isPressed ? 'scale(0.94)' : 'scale(1)'
      ringEl.value.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) ${ringScale}`
    }

    // 渲染准心高亮点
    if (dotEl.value && visible && !inTextInput) {
      const dx = dotX.toFixed(2)
      const dy = dotY.toFixed(2)
      const dotScale = isPressed ? 'scale(0.78)' : 'scale(1)'
      dotEl.value.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) ${dotScale}`
    }

    rafId = requestAnimationFrame(render)
  }

  rafId = requestAnimationFrame(render)

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver, { passive: true })
  document.addEventListener('pointerdown', onDown, { passive: true })
  document.addEventListener('pointerup', onUp, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  cleanupFns = [
    () => cancelAnimationFrame(rafId),
    () => document.removeEventListener('pointermove', onMove),
    () => document.removeEventListener('pointerover', onOver),
    () => document.removeEventListener('pointerdown', onDown),
    () => document.removeEventListener('pointerup', onUp),
    () => document.documentElement.removeEventListener('pointerleave', onLeave),
    () => document.documentElement.classList.remove('cursor-fx'),
  ]
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  if (rafId) cancelAnimationFrame(rafId)
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
  z-index: var(--z-cursor, 90);
  pointer-events: none;
}

.cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent-high);
  opacity: 0;
  will-change: transform, width, height, box-shadow;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(147, 197, 253, 0.85);
  box-sizing: border-box;
  transition:
    opacity var(--dur-fast) ease,
    width 200ms cubic-bezier(0.16, 1, 0.3, 1),
    height 200ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 200ms ease,
    box-shadow 200ms ease;
}

/* 准心点磁吸吸附状态：沉入核心并绽放翡翠微芒 */
.cursor-dot.is-magnetic {
  width: 6.5px;
  height: 6.5px;
  background: #bfdbfe;
  box-shadow:
    0 0 12px #60a5fa,
    0 0 22px rgba(147, 197, 253, 0.95);
}

.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid rgba(147, 197, 253, 0.45);
  background: radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%);
  opacity: 0;
  will-change: transform, width, height, border-radius;
  pointer-events: none;
  box-sizing: border-box;
  /* Emil Kowalski 弹簧缓动过渡曲线: 消除卡顿, 真实矢量宽高形变 */
  transition:
    opacity var(--dur-fast) ease,
    width 260ms cubic-bezier(0.16, 1, 0.3, 1),
    height 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-radius 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 220ms ease,
    background-color 220ms ease,
    box-shadow 220ms ease;
}

/* 磁吸状态 (紧凑型按钮、胶囊、药丸、图标吸附包裹) */
.cursor-ring.is-magnetic {
  border-color: rgba(147, 197, 253, 0.85);
  background: rgba(96, 165, 250, 0.16);
  box-shadow:
    0 0 20px rgba(96, 165, 250, 0.28),
    inset 0 0 10px rgba(147, 197, 253, 0.15);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* 大尺寸条目悬浮 (如精选作品流、文章行) */
.cursor-ring.is-large {
  border-color: var(--color-accent-high);
  background: radial-gradient(circle, rgba(96, 165, 250, 0.22) 0%, transparent 75%);
  box-shadow: 0 0 28px rgba(96, 165, 250, 0.3);
}
</style>
