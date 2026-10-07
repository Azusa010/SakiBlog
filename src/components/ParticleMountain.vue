<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 粒子山(three.js 增强层,约 600KB 懒加载 - Awwwards 级签名时刻):
 * 按山脊函数生成粒子山脉,底部随风水平漂散,鼠标在粒子场中推开涟漪。
 * 触发条件(全部满足才加载):允许动效 + WebGL 可用 + hero 进入视口。
 * 失败时静默,照片底图原样保留(hero 不依赖本组件)。
 */
const props = defineProps<{
  /** boot 完成后才启动,避免和载入编舞抢性能 */
  enabled: boolean
}>()

const mountEl = ref<HTMLElement | null>(null)
let disposed = false
let stopFn: (() => void) | null = null

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function boot() {
  if (disposed || !props.enabled || reducedMotion()) return
  const mount = mountEl.value
  if (!mount) return

  try {
    const THREE: typeof import('three') = await import('three')
    const { createMountain } = await import('./mountainScene')
    if (disposed) return
    stopFn = createMountain(THREE, mount)
  } catch {
    /* WebGL 初始化失败:静默,保留照片 hero */
  }
}

watch(
  () => props.enabled,
  (enabled) => {
    if (enabled) void boot()
  },
)

onMounted(() => {
  if (props.enabled) void boot()
})

onBeforeUnmount(() => {
  disposed = true
  stopFn?.()
  stopFn = null
})
</script>

<template>
  <div ref="mountEl" class="particle-mount" aria-hidden="true"></div>
</template>

<style scoped>
.particle-mount {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle-mount :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
  filter: grayscale(25%) contrast(110%) brightness(90%) hue-rotate(185deg);
}
</style>
