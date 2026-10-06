<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

/**
 * 首页(FR-HOME-001 ~ 004):整屏电影感 hero + 最新文章列表。
 * 场景(星空、光环、山影、纸飞机、水面)为内联 SVG 程序化绘制;
 * 精细指针下四层视差,纸飞机有拖尾与漂浮。
 */
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

function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 鼠标视差(--mx/--my 写在 hero 上,各层按深度取不同系数)与磁吸 CTA;
// 值直接写 CSS 变量,不进框架状态
let cleanupFns: (() => void)[] = []

onMounted(() => {
  const hero = heroEl.value
  if (!hero || !finePointer() || prefersReducedMotion()) return

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
})
</script>

<template>
  <div class="home">
    <section ref="heroEl" class="hero">
      <svg class="scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0a1120" />
            <stop offset="0.55" stop-color="#14233a" />
            <stop offset="1" stop-color="#31435e" />
          </linearGradient>
          <radialGradient id="dawn" cx="0.66" cy="1" r="0.9">
            <stop offset="0" stop-color="#e8b877" stop-opacity="0.5" />
            <stop offset="0.45" stop-color="#a97f52" stop-opacity="0.2" />
            <stop offset="1" stop-color="#a97f52" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1b2c44" />
            <stop offset="0.35" stop-color="#101c2e" />
            <stop offset="1" stop-color="#070d18" />
          </linearGradient>
          <linearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0.35" stop-color="#f0c088" stop-opacity="0" />
            <stop offset="0.62" stop-color="#f0c088" stop-opacity="0.55" />
            <stop offset="0.82" stop-color="#ffe9c4" stop-opacity="0.95" />
            <stop offset="1" stop-color="#fff3dd" />
          </linearGradient>
          <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <rect width="1440" height="580" fill="url(#sky)" />
        <rect width="1440" height="580" fill="url(#dawn)" />

        <g class="layer layer-stars">
          <g class="stars stars-a">
            <circle cx="120" cy="90" r="1.1" fill="#d8e4ff" />
            <circle cx="340" cy="150" r="0.9" fill="#d8e4ff" />
            <circle cx="520" cy="60" r="1.3" fill="#d8e4ff" />
            <circle cx="700" cy="120" r="0.8" fill="#d8e4ff" />
            <circle cx="1080" cy="80" r="1.2" fill="#d8e4ff" />
            <circle cx="1260" cy="180" r="0.9" fill="#d8e4ff" />
            <circle cx="1360" cy="60" r="1" fill="#d8e4ff" />
            <circle cx="220" cy="250" r="0.8" fill="#d8e4ff" />
          </g>
          <g class="stars stars-b">
            <circle cx="60" cy="180" r="1.4" fill="#cfe0ff" />
            <circle cx="430" cy="230" r="1" fill="#cfe0ff" />
            <circle cx="620" cy="40" r="1.1" fill="#cfe0ff" />
            <circle cx="930" cy="60" r="0.9" fill="#cfe0ff" />
            <circle cx="1180" cy="120" r="1.3" fill="#cfe0ff" />
            <circle cx="1320" cy="260" r="0.8" fill="#cfe0ff" />
            <circle cx="300" cy="40" r="1" fill="#cfe0ff" />
            <circle cx="820" cy="150" r="0.9" fill="#cfe0ff" />
          </g>
        </g>

        <g class="layer layer-ring">
          <g class="ring">
            <circle cx="780" cy="360" r="215" fill="none" stroke="url(#ring)" stroke-width="10" filter="url(#soft)" opacity="0.45" />
            <circle cx="780" cy="360" r="215" fill="none" stroke="url(#ring)" stroke-width="2.5" />
          </g>
        </g>

        <g class="layer layer-plane">
          <path
            class="trail"
            d="M690 330 C 790 305 880 262 946 226"
            fill="none"
            stroke="#e8e6e1"
            stroke-opacity="0.25"
            stroke-width="1"
            stroke-dasharray="3 9"
          />
          <path class="plane" d="M952 226 L996 208 L970 248 L958 234 Z" fill="#f2ece2" />
        </g>

        <g class="layer layer-mountain">
          <path d="M180 580 L400 468 L520 505 L640 400 L720 345 L800 430 L860 400 L950 480 L1020 458 L1140 580 Z" fill="#0a0f1a" />
          <path d="M720 345 L800 430 L860 400 L950 480" fill="none" stroke="#e8b877" stroke-opacity="0.3" stroke-width="1.5" />
        </g>

        <rect y="580" width="1440" height="320" fill="url(#water)" />
        <ellipse cx="800" cy="645" rx="430" ry="62" fill="#e8b877" opacity="0.13" filter="url(#soft)" />
        <g class="shimmer" opacity="0.12">
          <rect x="300" y="648" width="860" height="1" fill="#e8b877" />
          <rect x="380" y="706" width="640" height="1" fill="#e8b877" />
          <rect x="320" y="768" width="760" height="1" fill="#e8b877" />
        </g>
      </svg>

      <div class="hero-copy">
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

.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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

/* 场景动效:视差层 / 光环呼吸 / 星点闪烁 / 拖尾行进 / 纸飞机漂浮 / 水面微光 */
@media (prefers-reduced-motion: no-preference) {
  .scene .layer {
    transition: transform 0.45s var(--ease-out);
  }

  .layer-stars {
    transform: translate(calc(var(--mx, 0) * -5px), calc(var(--my, 0) * -5px));
  }

  .layer-ring {
    transform: translate(calc(var(--mx, 0) * -12px), calc(var(--my, 0) * -12px));
  }

  .layer-mountain {
    transform: translate(calc(var(--mx, 0) * 6px), calc(var(--my, 0) * 6px));
  }

  .layer-plane {
    transform: translate(calc(var(--mx, 0) * -20px), calc(var(--my, 0) * -20px));
  }

  .ring {
    animation: ring-breathe 6s ease-in-out infinite alternate;
  }

  .stars-a {
    animation: twinkle 4s ease-in-out infinite alternate;
  }

  .stars-b {
    animation: twinkle 6.5s ease-in-out 1.2s infinite alternate;
  }

  .trail {
    animation: trail-march 2.2s linear infinite;
  }

  .plane {
    animation: plane-float 7s ease-in-out infinite alternate;
  }

  .shimmer {
    animation: shimmer 5s ease-in-out infinite alternate;
  }
}

@keyframes ring-breathe {
  from {
    opacity: 0.75;
  }

  to {
    opacity: 1;
  }
}

@keyframes twinkle {
  from {
    opacity: 0.2;
  }

  to {
    opacity: 0.85;
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
    transform: translate(10px, -12px) rotate(3deg);
  }
}

@keyframes shimmer {
  from {
    opacity: 0.06;
  }

  to {
    opacity: 0.16;
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
