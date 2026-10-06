<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 载入动画:居中 LOADING 细进度条 + 百分比,约 1.1s。
 * 每个浏览器会话首次进站出现;Esc 或点击可跳过;reduced-motion 下不出现。
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
    window.setTimeout(finish, 200)
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
      <p class="boot-label">LOADING . . .</p>
      <div class="boot-row">
        <div class="boot-bar">
          <div class="boot-fill" :style="{ width: `${percent * 100}%` }"></div>
        </div>
        <span class="boot-pct">{{ Math.round(percent * 100) }}%</span>
      </div>
    </div>
    <span class="boot-brand" aria-hidden="true">SAKIBLOG</span>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0a1120 0%, #14233a 62%, #1c2f4a 78%, #0d1626 100%);
  cursor: pointer;
}

.boot-core {
  width: min(24rem, 78vw);
  margin-top: 18vh;
  text-align: center;
}

.boot-label {
  margin: 0 0 var(--space-4);
  color: rgb(232 230 225 / 85%);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
}

.boot-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.boot-bar {
  flex: 1;
  height: 2px;
  background: rgb(255 255 255 / 18%);
  overflow: hidden;
}

.boot-fill {
  height: 100%;
  background: #f0e9dd;
  transition: width 80ms linear;
}

.boot-pct {
  min-width: 2.5rem;
  color: rgb(232 230 225 / 70%);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-align: right;
}

.boot-brand {
  position: absolute;
  right: var(--space-6);
  bottom: var(--space-6);
  color: rgb(232 230 225 / 35%);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.3em;
}
</style>
