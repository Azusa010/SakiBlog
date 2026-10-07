<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 纸鸢微航标 (Origami Waypoint Insignia):
 * 收敛为精巧典雅的角落折纸微印记,随路由静默巡航至停机位;
 * 不侵扰视线,在暗夜中呈半透明微光伴随状态。
 */
const PERCHES: Record<string, { x: string; y: string; rotate: number }> = {
  home: { x: '82%', y: '16%', rotate: -6 },
  posts: { x: '92%', y: '12%', rotate: 8 },
  'post-detail': { x: '92%', y: '14%', rotate: -10 },
  categories: { x: '91%', y: '14%', rotate: 6 },
  tags: { x: '91%', y: '14%', rotate: 6 },
  search: { x: '90%', y: '14%', rotate: -8 },
  about: { x: '88%', y: '16%', rotate: 4 },
  'not-found': { x: '50%', y: '32%', rotate: -14 },
}

const route = useRoute()
const pos = ref({ left: '82%', top: '16%', transform: 'rotate(-6deg)' })
const noTrans = ref(false)
const visible = ref(false)

const onHome = computed(() => route.name === 'home')

watch(
  () => route.name,
  (name, prev) => {
    const perch = PERCHES[String(name)] ?? PERCHES.posts!
    visible.value = name !== 'home'

    if (prev === 'home') {
      noTrans.value = true
      pos.value = { left: '80%', top: '16%', transform: 'rotate(-6deg)' }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          noTrans.value = false
          pos.value = { left: perch.x, top: perch.y, transform: `rotate(${perch.rotate}deg)` }
        })
      })
      return
    }

    pos.value = { left: perch.x, top: perch.y, transform: `rotate(${perch.rotate}deg)` }
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="plane-sprite"
    :class="{ 'sprite-hidden': onHome, 'no-trans': noTrans, landed: visible }"
    :style="pos"
    aria-hidden="true"
  >
    <svg viewBox="0 0 120 70">
      <path
        class="sprite-trail"
        d="M6 56 C 40 46 72 28 100 16"
        fill="none"
        stroke-width="1"
        stroke-dasharray="2 6"
      />
      <path class="sprite-plane" d="M102 15 L118 8 L110 24 L105 18 Z" />
    </svg>
  </div>
</template>

<style scoped>
.plane-sprite {
  position: fixed;
  z-index: 40;
  width: clamp(48px, 6vmin, 76px);
  pointer-events: none;
  opacity: 0;
  transition:
    left 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    top 1.4s cubic-bezier(0.6, 0, 0.84, 0.4),
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s ease;
}

.plane-sprite.landed {
  opacity: 0.55;
}

.plane-sprite.sprite-hidden {
  opacity: 0;
}

.plane-sprite.no-trans {
  transition: opacity 0.4s ease;
}

.sprite-trail {
  stroke: var(--color-border-glow);
}

.sprite-plane {
  fill: var(--color-accent);
}

@media (prefers-reduced-motion: no-preference) {
  .plane-sprite svg {
    animation: sprite-bob 7s ease-in-out infinite alternate;
  }
}

@keyframes sprite-bob {
  from {
    transform: translate(0, 0) rotate(0deg);
  }

  to {
    transform: translate(4px, -6px) rotate(2deg);
  }
}
</style>
