<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 纸飞机全站精灵:每个页面一个"停机位",路由切换时沿弧线巡航过去。
 * 首页不显示(hero 场景里有自己的飞机);离开首页时从场景飞机的位置起航。
 */
const PERCHES: Record<string, { x: string; y: string; rotate: number }> = {
  home: { x: '58%', y: '22%', rotate: -6 },
  posts: { x: '9%', y: '14%', rotate: 8 },
  'post-detail': { x: '85%', y: '17%', rotate: -12 },
  categories: { x: '87%', y: '15%', rotate: 6 },
  tags: { x: '87%', y: '15%', rotate: 6 },
  search: { x: '82%', y: '18%', rotate: -8 },
  about: { x: '76%', y: '22%', rotate: 5 },
  'not-found': { x: '50%', y: '34%', rotate: -16 },
}

// 弧线飞行的小技巧:left 用缓出、top 用缓入,两段不同步的插值自然弯出航迹
const route = useRoute()
const pos = ref({ left: '58%', top: '22%', transform: 'rotate(-6deg)' })
const noTrans = ref(false)
const visible = ref(false)

const onHome = computed(() => route.name === 'home')

watch(
  () => route.name,
  (name, prev) => {
    const perch = PERCHES[String(name)] ?? PERCHES.posts!
    visible.value = name !== 'home'

    if (prev === 'home') {
      // 从 hero 场景飞机的位置起航:先无过渡落位,再飞往停机位
      noTrans.value = true
      pos.value = { left: '58%', top: '20%', transform: 'rotate(-6deg)' }
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
    <svg viewBox="0 0 220 120">
      <path
        class="sprite-trail"
        d="M8 96 C 70 78 130 48 178 26"
        fill="none"
        stroke-width="1"
        stroke-dasharray="3 9"
      />
      <path class="sprite-plane" d="M182 24 L214 12 L196 40 L188 30 Z" />
    </svg>
  </div>
</template>

<style scoped>
.plane-sprite {
  position: fixed;
  z-index: 60;
  width: clamp(96px, 11vmin, 150px);
  pointer-events: none;
  opacity: 0;
  transition:
    left 1.15s cubic-bezier(0.16, 1, 0.3, 1),
    top 1.45s cubic-bezier(0.6, 0, 0.84, 0.4),
    transform 1.15s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s ease;
}

.plane-sprite.landed {
  opacity: 0.9;
}

.plane-sprite.sprite-hidden {
  opacity: 0;
}

.plane-sprite.no-trans {
  transition: opacity 0.4s ease;
}

.sprite-trail {
  stroke: var(--color-text-muted);
}

.sprite-plane {
  fill: var(--color-text);
}

@media (prefers-reduced-motion: no-preference) {
  .plane-sprite svg {
    animation: sprite-bob 6s ease-in-out infinite alternate;
  }
}

@keyframes sprite-bob {
  from {
    transform: translate(0, 0) rotate(0deg);
  }

  to {
    transform: translate(6px, -8px) rotate(2.5deg);
  }
}
</style>
