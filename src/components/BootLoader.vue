<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 禅意终端引导启动层 (Zen Bootloader):
 * 极简居中终端装载进度条 + 百分比, 约 1.1s。
 * 纯设计令牌驱动, 杜绝硬编码色值。
 */
const emit = defineEmits<{
  done: []
}>()

const DURATION = 1100

const percent = ref(0)
let rafId = 0
let start = 0
let finished = false

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
  if (linear < 1) {
    rafId = requestAnimationFrame(tick)
  } else {
    window.setTimeout(finish, 180)
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
    <div class="boot-core">
      <p class="boot-label">INITIALIZING ZEN WORKSPACE . . .</p>
      <div class="boot-row">
        <div class="boot-bar">
          <div class="boot-fill" :style="{ width: `${percent * 100}%` }"></div>
        </div>
        <span class="boot-pct">{{ Math.round(percent * 100) }}%</span>
      </div>
    </div>
    <span class="boot-brand" aria-hidden="true">SAKIBLOG · ZEN TERMINAL</span>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 100);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  cursor: pointer;
}

.boot-core {
  width: min(24rem, 78vw);
  margin-top: 14vh;
  text-align: center;
}

.boot-label {
  margin: 0 0 var(--space-4);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
}

.boot-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.boot-bar {
  flex: 1;
  height: 2px;
  background: var(--color-border);
  overflow: hidden;
  border-radius: var(--radius-pill);
}

.boot-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-high));
  transition: width 80ms linear;
}

.boot-pct {
  min-width: 2.5rem;
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-align: right;
  font-weight: 500;
}

.boot-brand {
  position: absolute;
  right: var(--space-6);
  bottom: var(--space-6);
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.24em;
}
</style>
