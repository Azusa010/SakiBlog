<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import { useBootStore } from '@/stores/boot'
import PostCard from '@/components/PostCard.vue'
import ParticleMountain from '@/components/ParticleMountain.vue'
import heroDusk from '@/assets/hero-dusk.jpg'

/**
 * 首页(FR-HOME-001 ~ 004):整屏电影感 hero + 最新文章列表。
 * 载入编舞 = hero 的"未完成态":光环只画一半(光点沿弧线行进至顶端闭合)
 * → 雾气散开山体呈现 → 纸飞机从弧线右端飞出 → 文案与导航淡入。
 * 场景底图为真实摄影(Unsplash photo-1483728642387,Unsplash License)。
 */
const boot = useBootStore()
const posts = ref<PostSummary[]>([])
const state = ref<'loading' | 'ready' | 'error'>('loading')
const heroEl = ref<HTMLElement | null>(null)

async function load() {
  state.value = 'loading'
  try {
    posts.value = (await fetchPosts(1, 5)).items
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

onMounted(load)

// ---------- 载入编舞进度机 ----------
const DURATION = 2200
const progress = ref(0)
let rafId = 0
let startAt = 0

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1)
}

// 弧线 0~0.5 闭合,雾气 0.5~0.8 消散,纸飞机 0.8~0.95 飞出,完成后文案与导航淡入
const arcPhase = computed(() => easeOutCubic(clamp01(progress.value / 0.5)))
const mistOpacity = computed(() => 1 - easeOutCubic(clamp01((progress.value - 0.5) / 0.3)))
const planePhase = computed(() => easeOutCubic(clamp01((progress.value - 0.8) / 0.15)))
const planeOpacity = computed(() => clamp01((progress.value - 0.8) / 0.05))
const ringOffset = computed(() => 50 - 50 * arcPhase.value)
const dotAngle = computed(() => (100 - ringOffset.value) * 3.6)
const dotOpacity = computed(() => 1 - clamp01((progress.value - 0.5) / 0.1))

function finishChoreography() {
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onBootEsc)
  boot.finish()
}

function onBootEsc(event: KeyboardEvent) {
  if (event.key === 'Escape') skipBoot()
}

function skipBoot() {
  if (boot.done) return
  progress.value = 1
  finishChoreography()
}

function tickBoot(now: number) {
  if (!startAt) startAt = now
  const linear = Math.min((now - startAt) / DURATION, 1)
  const eased = easeOutCubic(linear)
  // 真实资源(字体 + 首屏照片解码)就绪前,进度封顶 90%
  progress.value = Math.min(eased, boot.assetsReady ? 1 : 0.9)
  if (linear < 1 || !boot.assetsReady) {
    rafId = requestAnimationFrame(tickBoot)
  } else {
    window.setTimeout(() => {
      if (!boot.done) boot.finish()
    }, 250)
  }
}

// 鼠标视差(--mx/--my 写在 hero 上,照片/光环/纸飞机按深度取不同系数)
// 与磁吸 CTA;值直接写 CSS 变量,不进框架状态
let cleanupFns: (() => void)[] = []

// 浏览器不支持 CSS scroll-timeline 时的滚动退场回退:
// rAF 节流 + 被动监听 + 只写 transform/opacity,仅在该分支才挂 scroll 监听
function supportsScrollTimeline(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: scroll()')
}

function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
}

onMounted(() => {
  // 真实资源就绪信号:字体 + hero 照片解码
  const photo = new Image()
  photo.src = heroDusk
  const fontsReady = typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve()
  Promise.all([fontsReady, photo.decode().catch(() => {})])
    .then(() => boot.markAssetsReady())

  // 载入编舞:未完成则启动,Esc/点击可跳过
  if (!boot.done) {
    window.addEventListener('keydown', onBootEsc)
    rafId = requestAnimationFrame(tickBoot)
  }
  cleanupFns.push(() => {
    if (!boot.done) boot.finish() // 中途离开视作已看过,避免回切重播
  })

  const hero = heroEl.value
  if (!hero || prefersReducedMotion()) return

  if (!supportsScrollTimeline()) {
    const layers: [string, number, boolean][] = [
      ['.exit-photo', 12, false],
      ['.exit-ring', 30, true],
      ['.exit-craft', 46, true],
    ]
    const copy = hero.querySelector<HTMLElement>('.hero-copy')
    const water = hero.querySelector<HTMLElement>('.hero-water')
    let ticking = false
    const update = () => {
      ticking = false
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      for (const [selector, rate, fade] of layers) {
        const el = hero.querySelector<HTMLElement>(selector)
        if (!el) continue
        el.style.transform = `translateY(${(-rate * progress).toFixed(2)}vh)`
        if (fade) el.style.opacity = String(1 - progress)
      }
      if (copy) {
        const p = Math.min(Math.max(progress / 0.62, 0), 1)
        copy.style.transform = `translateY(${(-18 * p).toFixed(2)}vh)`
        copy.style.opacity = String(1 - p)
      }
      if (water) {
        water.style.opacity = String(1 - Math.min(Math.max((progress - 0.55) / 0.45, 0), 1))
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    cleanupFns.push(() => window.removeEventListener('scroll', onScroll))
  }

  if (!finePointer()) return

  const onMove = (event: PointerEvent) => {
    const rect = hero.getBoundingClientRect()
    const mx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const my = ((event.clientY - rect.top) / rect.height) * 2 - 1
    hero.style.setProperty('--mx', mx.toFixed(3))
    hero.style.setProperty('--my', my.toFixed(3))
  }
  hero.addEventListener('pointermove', onMove)
  cleanupFns.push(() => hero.removeEventListener('pointermove', onMove))

  const cta = hero.querySelector<HTMLElement>('.hero-cta')
  if (cta) {
    const onCtaMove = (event: PointerEvent) => {
      const rect = cta.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      cta.style.transform = `translate(${(dx * 0.12).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`
    }
    const onCtaLeave = () => {
      cta.style.transform = ''
    }
    cta.addEventListener('pointermove', onCtaMove)
    cta.addEventListener('pointerleave', onCtaLeave)
    cleanupFns.push(() => {
      cta.removeEventListener('pointermove', onCtaMove)
      cta.removeEventListener('pointerleave', onCtaLeave)
    })
  }
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onBootEsc)
  if (!boot.done) boot.finish()
})
</script>

<template>
  <div class="home">
    <section ref="heroEl" class="hero" @click="skipBoot">
      <!-- 退场包装层:滚动驱动的 keyframes 作用于包装层,不与内部元素的视差 transform 冲突 -->
      <div class="exit exit-photo">
        <!-- 真实摄影底图:山影与星空 -->
        <img class="hero-photo" :src="heroDusk" alt="" aria-hidden="true" fetchpriority="high" />
      </div>
      <!-- 粒子山增强层:boot 完成后懒加载 three.js;失败时照片 hero 原样 -->
      <ParticleMountain :enabled="boot.done" />

      <!-- 色彩分级与可读性叠层 -->
      <div class="hero-tint" aria-hidden="true"></div>

      <!-- 雾气:载入时遮住山体,只露峰顶;随进度消散 -->
      <div class="hero-mist" :style="{ opacity: mistOpacity }" aria-hidden="true"></div>

      <!-- 光环:载入时只画一半,光点(笔尖)沿弧线行进至顶端闭合 -->
      <div class="exit exit-ring">
        <svg class="hero-ring" viewBox="0 0 600 600" aria-hidden="true">
          <defs>
            <linearGradient id="ring-grad" x1="0.3" y1="1" x2="0.78" y2="0">
              <stop offset="0" stop-color="#f0c088" stop-opacity="0" />
              <stop offset="0.45" stop-color="#f0c088" stop-opacity="0" />
              <stop offset="0.68" stop-color="#f0c088" stop-opacity="0.5" />
              <stop offset="0.86" stop-color="#ffe9c4" stop-opacity="0.95" />
              <stop offset="1" stop-color="#fff3dd" />
            </linearGradient>
            <filter id="ring-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <!-- 旋转 -90°:路径起点移到 12 点方向,弧线顺时针生长 -->
          <g class="ring" transform="rotate(-90 300 300)">
            <circle
              pathLength="100"
              :stroke-dasharray="100"
              :stroke-dashoffset="ringOffset"
              cx="300" cy="300" r="282" fill="none" stroke="url(#ring-grad)" stroke-width="10" filter="url(#ring-soft)" opacity="0.5"
            />
            <circle
              pathLength="100"
              :stroke-dasharray="100"
              :stroke-dashoffset="ringOffset"
              cx="300" cy="300" r="282" fill="none" stroke="url(#ring-grad)" stroke-width="2.5"
            />
          </g>
          <g
            class="ring-dot"
            :transform="`rotate(${dotAngle} 300 300)`"
            :style="{ opacity: dotOpacity }"
          >
            <circle cx="300" cy="18" r="12" fill="#ffe9c4" opacity="0.4" filter="url(#ring-soft)" />
            <circle cx="300" cy="18" r="4.5" fill="#fff3dd" />
          </g>
        </svg>
      </div>

      <!-- 纸飞机与拖尾:闭合后从弧线右端飞出 -->
      <div class="exit exit-craft">
        <svg class="hero-craft" viewBox="0 0 220 120" aria-hidden="true">
          <g :style="{ opacity: planeOpacity, transform: `translate(${(1 - planePhase) * -90}px, ${(1 - planePhase) * 62}px)` }">
            <path
              class="trail"
              d="M8 96 C 70 78 130 48 178 26"
              fill="none"
              stroke="#e8e6e1"
              stroke-opacity="0.3"
              stroke-width="1"
              stroke-dasharray="3 9"
            />
            <path class="plane" d="M182 24 L214 12 L196 40 L188 30 Z" fill="#f2ece2" />
          </g>
        </svg>
      </div>

      <!-- 水面:沉入夜色 + 倒影光斑 + 微光 -->
      <div class="hero-water" aria-hidden="true">
        <div class="glow-reflection"></div>
        <span class="shimmer-line" style="left: 18%; width: 30%; top: 22%"></span>
        <span class="shimmer-line" style="left: 42%; width: 36%; top: 48%"></span>
        <span class="shimmer-line" style="left: 24%; width: 26%; top: 72%"></span>
      </div>

      <!-- 底部金线进度条,与弧线光点上下呼应 -->
      <div class="hero-progress" :style="{ opacity: boot.done ? 0 : 1 }" aria-hidden="true">
        <span class="hero-progress-fill" :style="{ width: `${progress * 100}%` }"></span>
      </div>

      <!-- 文案:编舞完成后挂载,v-reveal 依次入场 -->
      <div v-if="boot.done" class="hero-copy">
        <h1 class="hero-title" aria-label="在文字中,遇见更大的世界。"><span class="line" aria-hidden="true"><span class="line-inner" style="--line: 0">在文字中,</span></span><span class="line" aria-hidden="true"><span class="line-inner" style="--line: 1">遇见更大的世界。</span></span></h1>
        <p v-reveal="3" class="hero-sub" lang="en">
          <span v-scramble class="sub-line">In words,</span>
          <span v-scramble class="sub-line">meet a bigger world.</span>
        </p>
        <span v-reveal="4" class="hero-dash" aria-hidden="true"></span>
        <RouterLink v-reveal="5" class="hero-cta" to="/posts">阅读文章 →</RouterLink>
      </div>
    </section>

    <section class="latest" aria-label="最新文章">
      <h2 class="section-title">最新文章</h2>

      <p v-if="state === 'loading'" class="state-note">加载中…</p>
      <p v-else-if="state === 'error'" class="state-note">
        最新文章加载失败,<button type="button" class="retry" @click="load">重试</button>
      </p>
      <p v-else-if="posts.length === 0" class="state-note">还没有已发布的文章,敬请期待。</p>
      <PostCard v-for="(post, index) in posts" v-else :key="post.id" :post="post" :index="index" />
    </section>
  </div>
</template>

<style scoped>
/* 全出血:逃出 44rem 内容容器;向上抵消 main 顶距(首页头部悬浮) */
.hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  margin-inline: calc(50% - 50vw);
  margin-top: calc(-1 * var(--space-12));
  overflow: hidden;
}

/* 视差系数:照片最深、光环居中、纸飞机最浅 */
.hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 58%;
  transform: scale(1.08) translate(calc(var(--mx, 0) * -8px), calc(var(--my, 0) * -8px));
  transition: transform 0.45s var(--ease-out);
}

.hero-tint {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgb(10 17 32 / 55%), transparent 52%),
    radial-gradient(60% 40% at 66% 74%, rgb(232 184 119 / 18%), transparent 70%),
    linear-gradient(180deg, rgb(10 17 32 / 55%) 0%, transparent 30%),
    linear-gradient(180deg, transparent 56%, rgb(13 22 38 / 88%) 78%, #070d18 97%);
}

.hero-ring {
  position: absolute;
  left: 52%;
  top: 42%;
  width: clamp(320px, 54vmin, 640px);
  transform: translate(-50%, -50%) translate(calc(var(--mx, 0) * -14px), calc(var(--my, 0) * -14px));
  transition: transform 0.45s var(--ease-out);
}

.hero-craft {
  position: absolute;
  left: 58%;
  top: 20%;
  width: clamp(150px, 20vmin, 240px);
  transform: translate(calc(var(--mx, 0) * -24px), calc(var(--my, 0) * -24px));
  transition: transform 0.45s var(--ease-out);
}

.hero-water {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 30%;
}

/* 雾气:载入时遮住山体,只露峰顶 */
.hero-mist {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 58%;
  background:
    radial-gradient(90% 70% at 50% 100%, rgb(206 216 226 / 0.85), rgb(164 180 198 / 0.5) 48%, rgb(164 180 198 / 0) 78%),
    linear-gradient(180deg, rgb(173 189 205 / 0) 0%, rgb(196 208 220 / 0.38) 45%, rgb(228 233 239 / 0.85) 100%);
  pointer-events: none;
}

/* 底部金线进度条:与弧线光点上下呼应 */
.hero-progress {
  position: absolute;
  bottom: 8%;
  left: 50%;
  width: min(24rem, 60vw);
  height: 2px;
  transform: translateX(-50%);
  background: rgb(255 255 255 / 0.16);
  pointer-events: none;
  transition: opacity 0.6s ease;
}

.hero-progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgb(240 201 136 / 0.65), #fff3dd);
  transition: width 60ms linear;
}

.ring-dot {
  will-change: transform;
}

/* 滚动退场:hero 各层随滚动距离按不同速率上移淡出
   (CSS scroll-driven,显式 scroll(root)——祖先的 overflow: hidden 会
    捕获 view() 时间线,root 滚动容器不受影响;
    不支持的浏览器无动画,自然滚动) */
.exit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    .exit-photo,
    .exit-ring,
    .exit-craft,
    .hero-copy,
    .hero-water {
      animation-timeline: scroll(root);
      animation-fill-mode: both;
      animation-timing-function: linear;
    }

    /* 纸飞机跑得最快,光环次之,照片最慢——退场也保持纵深 */
    .exit-photo,
    .exit-ring,
    .exit-craft {
      animation-name: exit-layer;
      animation-range: 0vh 100vh;
    }

    .exit-craft {
      animation-name: exit-craft;
    }

    .exit-ring {
      animation-name: exit-ring;
    }

    .hero-copy {
      animation-name: exit-copy;
      animation-range: 18vh 62vh;
    }

    .hero-water {
      animation-name: exit-water;
      animation-range: 55vh 100vh;
    }
  }
}

@keyframes exit-layer {
  to {
    transform: translateY(-12vh);
  }
}

@keyframes exit-ring {
  to {
    transform: translateY(-30vh);
    opacity: 0;
  }
}

@keyframes exit-craft {
  to {
    transform: translateY(-46vh);
    opacity: 0;
  }
}

@keyframes exit-copy {
  to {
    transform: translateY(-18vh);
    opacity: 0;
  }
}

@keyframes exit-water {
  to {
    opacity: 0;
  }
}

.glow-reflection {
  position: absolute;
  left: 52%;
  top: 18%;
  width: 38vmin;
  height: 9vmin;
  transform: translateX(-50%);
  background: radial-gradient(50% 50% at 50% 50%, rgb(232 184 119 / 20%), transparent 72%);
  filter: blur(10px);
}

.shimmer-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(232 184 119 / 45%), transparent);
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 44rem;
  padding-inline: clamp(1.5rem, 9vw, 9rem);
  color: #e8e6e1;
  text-shadow: 0 2px 24px rgb(10 17 32 / 65%);
}

.hero-title {
  margin: 0;
  font-size: clamp(1.9rem, 3.4vw, 2.9rem);
  font-weight: 300;
  letter-spacing: 0.12em;
  line-height: 1.9;
  color: inherit;
}

.hero-title .line {
  display: block;
  overflow: hidden;
}

.hero-title .line-inner {
  display: block;
}

.hero-sub {
  margin: var(--space-4) 0 0;
  color: rgb(232 230 225 / 55%);
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  line-height: 2;
}

.hero-sub .sub-line {
  display: block;
}

.hero-dash {
  display: block;
  width: 2.5rem;
  height: 1px;
  margin: var(--space-6) 0 var(--space-4);
  background: rgb(232 230 225 / 60%);
}

.hero-cta {
  display: inline-block;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid rgb(232 230 225 / 30%);
  color: rgb(232 230 225 / 78%);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.28em;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.25s var(--ease-out);
}

.hero-cta:hover {
  color: #ffffff;
  border-color: rgb(240 233 221 / 70%);
  opacity: 1;
}

.latest {
  margin-top: var(--space-12);
}

.section-title {
  font-size: 1.125rem;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: var(--color-text-muted);
}

.state-note {
  color: var(--color-text-muted);
}

.retry {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-accent);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 场景动效:光环呼吸 / 拖尾行进 / 纸飞机漂浮 / 微光闪烁 */
@media (prefers-reduced-motion: no-preference) {
  .ring {
    animation: ring-breathe 6s ease-in-out infinite alternate;
  }

  .trail {
    animation: trail-march 2.2s linear infinite;
  }

  .plane {
    animation: plane-float 7s ease-in-out infinite alternate;
  }

  .shimmer-line {
    animation: shimmer 5s ease-in-out infinite alternate;
  }

  .shimmer-line:nth-of-type(2) {
    animation-delay: 1.6s;
  }

  .shimmer-line:nth-of-type(3) {
    animation-delay: 3.1s;
  }
}

@keyframes ring-breathe {
  from {
    opacity: 0.78;
  }

  to {
    opacity: 1;
  }
}

@keyframes trail-march {
  to {
    stroke-dashoffset: -48;
  }
}

@keyframes plane-float {
  from {
    transform: translate(0, 0) rotate(0deg);
  }

  to {
    transform: translate(8px, -10px) rotate(3deg);
  }
}

@keyframes shimmer {
  from {
    opacity: 0.25;
  }

  to {
    opacity: 0.9;
  }
}

/* 标题两行分别从遮罩内升起 */
@media (prefers-reduced-motion: no-preference) {
  .hero-title .line-inner {
    animation: line-up 0.9s var(--ease-out) both;
    animation-delay: calc(var(--line) * 0.18s);
  }
}

@keyframes line-up {
  from {
    transform: translateY(112%);
  }

  to {
    transform: none;
  }
}
</style>
