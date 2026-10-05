<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/** 返回顶部(FR-ARTICLE-007):滚动超过一个视口后出现。 */
const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > window.innerHeight
}

function toTop() {
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
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
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
}

.back-top:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
