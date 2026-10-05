<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 返回顶部(FR-ARTICLE-007):滚动超过一个视口后出现。
 * 用 IntersectionObserver 观察视口下缘外的哨兵元素,不挂 scroll 监听。
 */
const visible = ref(false)

function toTop() {
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

let observer: IntersectionObserver | null = null
let marker: HTMLElement | null = null

onMounted(() => {
  if (typeof IntersectionObserver !== 'function') return
  marker = document.createElement('div')
  marker.style.cssText = 'position:absolute;top:calc(100vh + 1px);left:0;width:0;height:0;'
  document.body.appendChild(marker)
  observer = new IntersectionObserver((entries) => {
    visible.value = entries[0]?.isIntersecting ?? false
  })
  observer.observe(marker)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  marker?.remove()
  marker = null
})
</script>

<template>
  <button v-if="visible" type="button" class="back-top" aria-label="返回顶部" @click="toTop">↑</button>
</template>

<style scoped>
.back-top {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 1.1rem;
  cursor: pointer;
}

.back-top:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-bg);
}
</style>
