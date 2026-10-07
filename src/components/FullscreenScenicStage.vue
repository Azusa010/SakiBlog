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

  <!-- HUD Alpine Gallery Plaque Wrapper (Z-Index 35, Unblocked) -->
  <div v-if="!embedded" class="alpine-plaque-wrapper">
    <div
      class="alpine-plaque-card"
      role="button"
      tabindex="0"
      data-cursor
      title="点击切换画卷 / Alpine Gallery"
      @click="scenic.nextScene"
      @keydown.enter="scenic.nextScene"
    >
      <!-- Left Golden Vertical Accent Line -->
      <div class="alpine-gold-bar" aria-hidden="true"></div>

      <!-- Animated Text Content Wrapper -->
      <Transition name="alpine-text-swap" mode="out-in">
        <div :key="scenic.currentScenic.title" class="alpine-content-body">
          <div class="alpine-title-row">
            <h4 class="alpine-title">{{ scenic.currentScenic.title }}</h4>
            <span v-if="scenic.currentScenic.chineseTitle" class="alpine-title-cn">{{ scenic.currentScenic.chineseTitle }}</span>
          </div>

          <div class="alpine-meta-block">
            <div class="alpine-artist">{{ scenic.currentScenic.artistLine }}</div>
            <div class="alpine-elevation">Elevation: {{ scenic.currentScenic.elevation }}</div>
          </div>

          <div class="alpine-collection">{{ scenic.currentScenic.collection }}</div>
        </div>
      </Transition>

      <!-- Micro Interactive Page Cue (Fades in on hover) -->
      <div class="alpine-hover-cue" aria-hidden="true">
        <span>0{{ scenic.currentScenic.index + 1 }} / 04</span>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>
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
   Alpine Gallery Exhibition Plaque (Curated Fine Art)
   - Matches the authentic Alpine Gallery museum plaque layout
   - 3px solid warm gold vertical bar on the left edge
   - Deep smoky petrol/obsidian frosted glass (or warm parchment in light)
   - Classical Roman uppercase serif title
   - Italic artist provenance & crisp elevation telemetry
   - Collection attribution with generous vertical breathing
   ======================================================== */

.alpine-plaque-wrapper {
  position: fixed;
  right: max(1.5rem, 3.5vw);
  bottom: max(1.5rem, 3.5vh);
  z-index: 35;
  pointer-events: none;
}

.alpine-plaque-card {
  position: relative;
  pointer-events: auto;
  cursor: pointer;
  display: flex;
  overflow: hidden;
  min-width: 290px;
  max-width: 380px;
  padding: 22px 28px 22px 24px;
  border-radius: 2px 6px 6px 2px;
  
  /* High-transparency misty frosted glass (Authentic Alpine ethereal aesthetic) */
  background: linear-gradient(135deg, rgba(10, 22, 28, 0.38) 0%, rgba(14, 28, 34, 0.22) 55%, rgba(20, 36, 42, 0.12) 100%);
  backdrop-filter: blur(14px) saturate(135%);
  -webkit-backdrop-filter: blur(14px) saturate(135%);
  
  border: 1px solid rgba(202, 161, 96, 0.16);
  border-left: none; /* Managed by .alpine-gold-bar */
  box-shadow: 
    0 20px 48px -10px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.10);

  user-select: none;
  transition:
    transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1),
    background-color 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  animation: alpine-enter 0.8s cubic-bezier(0.23, 1, 0.32, 1) backwards;
  will-change: transform, opacity;
}

:root[data-theme='light'] .alpine-plaque-card {
  background: linear-gradient(135deg, rgba(250, 250, 247, 0.42) 0%, rgba(242, 245, 242, 0.22) 100%);
  border-color: rgba(180, 130, 60, 0.20);
  box-shadow: 
    0 16px 40px -10px rgba(59, 130, 246, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.65);
}

@keyframes alpine-enter {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Left Vertical Gold Bar */
.alpine-gold-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: #caa160;
  box-shadow: 0 0 8px rgba(202, 161, 96, 0.3);
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
}

:root[data-theme='light'] .alpine-gold-bar {
  background: #b4823c;
}

.alpine-plaque-card:hover .alpine-gold-bar {
  background: #deb878;
  box-shadow: 0 0 16px rgba(222, 184, 120, 0.65), 0 0 4px #caa160;
}

:root[data-theme='light'] .alpine-plaque-card:hover .alpine-gold-bar {
  background: #c99347;
  box-shadow: 0 0 14px rgba(180, 130, 60, 0.5);
}

.alpine-plaque-card:hover {
  background: linear-gradient(135deg, rgba(10, 22, 28, 0.48) 0%, rgba(14, 28, 34, 0.32) 55%, rgba(20, 36, 42, 0.20) 100%);
  transform: translateY(-2px);
  box-shadow: 
    0 24px 56px -8px rgba(0, 0, 0, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.16),
    0 0 20px rgba(202, 161, 96, 0.15);
}

:root[data-theme='light'] .alpine-plaque-card:hover {
  background: linear-gradient(135deg, rgba(250, 250, 247, 0.55) 0%, rgba(242, 245, 242, 0.35) 100%);
  box-shadow: 
    0 20px 48px -8px rgba(59, 130, 246, 0.18),
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    0 0 16px rgba(180, 130, 60, 0.15);
}

.alpine-plaque-card:active {
  transform: scale(0.985);
}

/* Content Body */
.alpine-content-body {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Title */
.alpine-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.alpine-title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #caa160;
  line-height: 1.25;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
}

:root[data-theme='light'] .alpine-title {
  color: #9a6b28;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

.alpine-title-cn {
  font-family: var(--font-sans);
  font-size: 0.80rem;
  color: #caa160;
  opacity: 0.72;
  letter-spacing: 0.05em;
  font-weight: 400;
  flex-shrink: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

:root[data-theme='light'] .alpine-title-cn {
  color: #9a6b28;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

/* Middle Meta Block (Artist italic & Elevation) */
.alpine-meta-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.alpine-artist {
  font-family: var(--font-serif-body);
  font-style: italic;
  font-size: 0.96rem;
  color: rgba(245, 250, 255, 0.95);
  line-height: 1.35;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

:root[data-theme='light'] .alpine-artist {
  color: #1e293b;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

.alpine-elevation {
  font-family: var(--font-serif-body);
  font-style: normal;
  font-size: 0.94rem;
  color: rgba(245, 250, 255, 0.92);
  line-height: 1.35;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

:root[data-theme='light'] .alpine-elevation {
  color: #334155;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

/* Bottom Collection */
.alpine-collection {
  margin-top: 15px;
  font-family: var(--font-serif-body);
  font-style: normal;
  font-size: 0.92rem;
  color: rgba(235, 242, 248, 0.88);
  line-height: 1.35;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

:root[data-theme='light'] .alpine-collection {
  color: #475569;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

/* Micro Hover Cue */
.alpine-hover-cue {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: #caa160;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.alpine-plaque-card:hover .alpine-hover-cue {
  opacity: 0.75;
  transform: translateX(0);
}

:root[data-theme='light'] .alpine-hover-cue {
  color: #9a6b28;
}

/* Transition Swap for Text */
.alpine-text-swap-enter-active,
.alpine-text-swap-leave-active {
  transition: opacity 0.32s cubic-bezier(0.23, 1, 0.32, 1), transform 0.32s cubic-bezier(0.23, 1, 0.32, 1);
}

.alpine-text-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.alpine-text-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Responsive */
@media (max-width: 640px) {
  .alpine-plaque-wrapper {
    right: 1rem;
    bottom: 1rem;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .alpine-plaque-card {
    min-width: unset;
    max-width: calc(100vw - 2rem);
    padding: 18px 22px 18px 20px;
  }
  .alpine-title {
    font-size: 1.05rem;
  }
  .alpine-artist,
  .alpine-elevation,
  .alpine-collection {
    font-size: 0.88rem;
  }
  .alpine-collection {
    margin-top: 10px;
  }
}
</style>

