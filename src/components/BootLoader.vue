<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 工业风 boot 载入动画:进度条 + 技术标签 + 阶段读数,约 0.9s。
 * 每个浏览器会话首次进站出现;Esc 或点击可跳过;reduced-motion 下不出现。
 */
const emit = defineEmits<{
  done: []
}>()

const DURATION = 900

const percent = ref(0)
const stage = ref('INITIALIZING ///')
let rafId = 0
let start = 0
let finished = false

const STAGES: { at: number; label: string }[] = [
  { at: 0, label: 'INITIALIZING ///' },
  { at: 0.35, label: 'LOADING CONTENT ///' },
  { at: 0.7, label: 'RENDERING INTERFACE ///' },
  { at: 1, label: 'READY' },
]

function finish() {
  if (finished) return
  finished = true
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onKeyDown)
  emit('done')
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') finish()
}

function tick(now: number) {
  if (finished) return
  if (!start) start = now
  const linear = Math.min((now - start) / DURATION, 1)
  const eased = 1 - Math.pow(1 - linear, 3)
  percent.value = eased
  stage.value = (STAGES.find((item) => eased <= item.at) ?? STAGES[STAGES.length - 1]!).label
  if (linear < 1) {
    rafId = requestAnimationFrame(tick)
  } else {
    window.setTimeout(finish, 150)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="boot" role="status" aria-label="页面加载中" @click="finish()">
    <div class="boot-top">
      <span>[ SAKIBLOG ]</span>
      <span>REV 1.0</span>
    </div>

    <div class="boot-core">
      <p class="boot-brand">SAKIBLOG<sup>®</sup></p>
      <div class="boot-bar">
        <div class="boot-fill" :style="{ width: `${percent * 100}%` }"></div>
      </div>
      <p class="boot-readout">
        <span>{{ stage }}</span>
        <span>{{ String(Math.round(percent * 100)).padStart(3, '0') }}%</span>
      </p>
    </div>

    <div class="boot-bottom">
      <span>ESC / CLICK TO SKIP</span>
      <span aria-hidden="true">////////////////////////////////////</span>
    </div>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-6);
  background:
    repeating-linear-gradient(90deg, transparent, transparent 7.9vw, var(--color-border) 7.9vw, var(--color-border) calc(7.9vw + 1px)),
    var(--color-bg);
  cursor: pointer;
  font-family: var(--font-mono);
}

.boot-top,
.boot-bottom {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
}

.boot-core {
  width: min(32rem, 86vw);
  margin: 0 auto;
}

.boot-brand {
  margin: 0 0 var(--space-6);
  font-family: var(--font-sans);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.95;
  text-transform: uppercase;
}

.boot-brand sup {
  color: var(--color-accent);
  font-size: 0.4em;
}

.boot-bar {
  height: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.boot-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 80ms linear;
}

.boot-readout {
  display: flex;
  justify-content: space-between;
  margin: var(--space-3) 0 0;
  color: var(--color-text);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}
</style>
