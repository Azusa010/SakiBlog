<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useScenicStore } from '@/stores/scenic'
import heroLandscape from '@/assets/peaceful-landscape.jpg'
import valleyLandscape from '@/assets/highland-valley.jpg'
import lochLandscape from '@/assets/highland-loch.jpg'
import duskLandscape from '@/assets/hero-dusk.jpg'

import ParticleMountain from '@/components/ParticleMountain.vue'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
    showParticles?: boolean
  }>(),
  {
    embedded: false,
    showParticles: true,
  },
)

const scenic = useScenicStore()

const scenes = [
  { id: 'fairyglen', src: heroLandscape, alt: 'Fairy Glen, Isle of Skye - Photography by Guillaume.R-B' },
  { id: 'storr', src: valleyLandscape, alt: 'Old Man of Storr, Isle of Skye - Landscape Photography' },
  { id: 'glencoe', src: lochLandscape, alt: 'Glen Coe Valley, Scottish Highlands - Photography by Gil Cavalcanti' },
  { id: 'bierstadt', src: duskLandscape, alt: 'Among the Sierra Nevada, California (1868) - Albert Bierstadt' },
]

const stageClass = computed(() => {
  return {
    'is-dimmed': scenic.isDimmed,
    'scenic-stage--embedded': props.embedded,
    'scenic-stage--fullscreen': !props.embedded,
  }
})

// 纯正物理景深滚动视差 + 柔和体感微平移 (彻底废弃突兀扭曲的 3D 纸片倾斜)
const stageTransform = ref('scale(1.04)')
let rafId = 0
let cleanupFns: (() => void)[] = []

function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 四重画卷切景垂直流速差 (入场自下而上浮现，退场向上一缕轻烟升腾)
function getSceneTransform(idx: number): string {
  const w = scenic.weights[idx] ?? 0
  const activeIdx = scenic.activeIndex
  let yOffset = 0
  if (idx > activeIdx) {
    yOffset = (1 - w) * 40
  } else if (idx < activeIdx) {
    yOffset = (1 - w) * -40
  }
  const scale = 1.02 + (1 - w) * 0.03
  return `scale(${scale.toFixed(3)}) translateY(${yOffset.toFixed(1)}px)`
}

onMounted(() => {
  if (reducedMotion()) return

  let targetScrollY = window.scrollY
  let currentScrollY = window.scrollY

  let targetMouseX = 0
  let targetMouseY = 0
  let currentMouseX = 0
  let currentMouseY = 0

  const onScroll = () => {
    targetScrollY = window.scrollY
  }

  const onPointerMove = (event: PointerEvent) => {
    const ww = window.innerWidth
    const wh = window.innerHeight
    const nx = (event.clientX / ww) * 2 - 1
    const ny = (event.clientY / wh) * 2 - 1

    targetMouseX = nx * 14
    targetMouseY = ny * 10
  }

  const onPointerLeave = () => {
    targetMouseX = 0
    targetMouseY = 0
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  cleanupFns.push(() => window.removeEventListener('scroll', onScroll))

  if (finePointer()) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    cleanupFns.push(() => window.removeEventListener('pointermove', onPointerMove))
    cleanupFns.push(() => document.documentElement.removeEventListener('pointerleave', onPointerLeave))
  }

  const renderLoop = () => {
    // 纵向滚动阻尼追踪 (平滑跟手)
    currentScrollY += (targetScrollY - currentScrollY) * 0.08
    const maxDocScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1200)
    const scrollRatio = Math.min(Math.max(currentScrollY, 0) / maxDocScroll, 1)

    // 真实高空远景差速视差: 背景随整页滚动产生清晰可感的垂直差速平移 (-140px)
    const scrollParallaxY = -(scrollRatio * 140)
    const depthScale = 1.04 + scrollRatio * 0.05

    // 鼠标体感仅保留极微妙的柔和 2D 平移，彻底废弃破坏画质的 3D 纸片倾斜 (rotateX/rotateY)
    currentMouseX += (targetMouseX - currentMouseX) * 0.06
    currentMouseY += (targetMouseY - currentMouseY) * 0.06
    const mousePanX = currentMouseX * 0.6
    const mousePanY = currentMouseY * 0.4

    stageTransform.value = `scale(${depthScale.toFixed(3)}) translate3d(${mousePanX.toFixed(2)}px, ${(scrollParallaxY + mousePanY).toFixed(2)}px, 0)`

    rafId = requestAnimationFrame(renderLoop)
  }

  rafId = requestAnimationFrame(renderLoop)
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- Background Scenic Stage (Full-bleed or Embedded) -->
  <div class="scenic-stage" :class="stageClass" aria-hidden="true">
    <div class="scenic-viewport" :style="{ transform: stageTransform }">
      <div
        v-for="(scene, idx) in scenes"
        :key="scene.id"
        class="scenic-layer"
        :style="{
          opacity: scenic.weights[idx] ?? 0,
          transform: getSceneTransform(idx),
        }"
      >
        <img
          class="scenic-img hero-img-pan"
          :src="scene.src"
          :alt="scene.alt"
          :fetchpriority="idx === 0 ? 'high' : 'auto'"
          decoding="async"
        />
      </div>

      <!-- WebGL Interactive Particle Mountain Layer -->
      <ParticleMountain v-if="showParticles" :enabled="true" />

      <div class="scenic-tint"></div>
      <div class="scenic-mist"></div>
      <div class="melancholy-overlay"></div>
    </div>
  </div>

  <!-- Minimal Info Text Wrapper (Z-Index 35) -->
  <div v-if="!embedded" class="minimal-info-wrapper">
    <Transition name="alpine-text-swap" mode="out-in">
      <div 
        :key="scenic.currentScenic.title" 
        class="minimal-info-text"
        role="button"
        tabindex="0"
        title="点击切换画卷 / Switch Background"
        @click="scenic.nextScene"
        @keydown.enter="scenic.nextScene"
      >
        <h4 class="info-title">{{ scenic.currentScenic.title }}</h4>
        <div class="info-location">Location: {{ scenic.currentScenic.artistLine }}</div>
        <div class="info-elevation">Elevation: {{ scenic.currentScenic.elevation }}</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scenic-stage {
  pointer-events: none;
  overflow: hidden;
  user-select: none;
}

.scenic-stage--fullscreen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background-color: var(--color-bg, #03070d);
}

.scenic-stage--embedded {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: transparent;
  border-radius: inherit;
}

.scenic-stage--fullscreen .scenic-viewport {
  position: absolute;
  top: -16vh;
  left: -5vw;
  width: 110vw;
  height: 132vh;
  transform-origin: 50% 50%;
  will-change: transform;
}

.scenic-stage--embedded .scenic-viewport {
  position: absolute;
  inset: -4%;
  width: 108%;
  height: 108%;
  transform-origin: 50% 50%;
  will-change: transform;
}

.scenic-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition:
    opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.scenic-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 36%;
  filter: grayscale(35%) contrast(110%) brightness(85%) sepia(15%) hue-rotate(185deg);
}

:root[data-theme='light'] .scenic-img {
  filter: grayscale(20%) contrast(105%) brightness(95%) sepia(10%) hue-rotate(185deg);
}

/* Cinematic slow pan from demo */
.hero-img-pan {
  animation: slowPan 30s ease-in-out infinite alternate;
  transform-origin: 50% 50%;
}

@keyframes slowPan {
  0% { transform: scale(1.03) translate(0, 0); }
  100% { transform: scale(1.08) translate(-1.5%, -1%); }
}

.melancholy-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(3, 7, 13, 0.2) 0%, rgba(3, 7, 13, 0.9) 100%), rgba(15, 30, 50, 0.35);
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 2;
}

.scenic-tint {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      rgba(3, 7, 13, 0.44) 0%,
      rgba(3, 7, 13, 0.16) 28%,
      rgba(3, 7, 13, 0.32) 70%,
      rgba(3, 7, 13, 0.72) 100%
    ),
    radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.04) 0%, rgba(3, 7, 13, 0.42) 100%);
  transition: opacity 0.5s ease;
}

:root[data-theme='light'] .scenic-tint {
  background:
    linear-gradient(180deg,
      rgba(240, 244, 250, 0.48) 0%,
      rgba(240, 244, 250, 0.18) 28%,
      rgba(240, 244, 250, 0.52) 70%,
      rgba(240, 244, 250, 0.88) 100%
    );
}

.scenic-mist {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 36%;
  background: radial-gradient(85% 65% at 50% 100%, rgba(147, 197, 253, 0.16), transparent 75%);
  pointer-events: none;
}

.scenic-stage.is-dimmed .scenic-tint {
  opacity: 0.85;
  background-color: rgba(3, 7, 13, 0.6);
}

/* ========================================================
   Minimalist Info Text HUD (Bottom Right)
   ======================================================== */

.minimal-info-wrapper {
  position: fixed;
  right: max(2.5rem, 4.5vw);
  bottom: max(2.5rem, 4.5vh);
  z-index: 35;
  pointer-events: none;
}

.minimal-info-text {
  pointer-events: auto;
  cursor: pointer;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  opacity: 0.85;
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  user-select: none;
  animation: info-enter 1.2s cubic-bezier(0.23, 1, 0.32, 1) backwards;
  will-change: transform, opacity;
}

.minimal-info-text:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.minimal-info-text:active {
  transform: translateY(1px);
}

.info-title {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--color-text, #e2e8f0);
  margin: 0;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
}

.info-location {
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.55);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.info-elevation {
  font-family: var(--font-accent, 'EB Garamond', serif);
  font-size: 0.85rem;
  font-style: italic;
  color: rgba(147, 197, 253, 0.75);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

:root[data-theme='light'] .info-title {
  color: #1e293b;
  text-shadow: 0 1px 4px rgba(255, 255, 255, 0.8);
}
:root[data-theme='light'] .info-location {
  color: #64748b;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}
:root[data-theme='light'] .info-elevation {
  color: #3b82f6;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

@keyframes info-enter {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  100% {
    opacity: 0.85;
    transform: translateY(0);
  }
}

/* Transition Swap for Text */
.alpine-text-swap-enter-active,
.alpine-text-swap-leave-active {
  transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1), transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.alpine-text-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.alpine-text-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 640px) {
  .minimal-info-wrapper {
    right: 1.5rem;
    bottom: 1.5rem;
  }
  .info-title {
    font-size: 1.2rem;
  }
  .info-location,
  .info-elevation {
    font-size: 0.7rem;
  }
}
</style>

