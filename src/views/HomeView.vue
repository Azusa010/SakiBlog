<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import { useBootStore } from '@/stores/boot'
import { useTerminalStore } from '@/stores/terminal'
import { useScenicStore } from '@/stores/scenic'
import ParticleMountain from '@/components/ParticleMountain.vue'
import heroLandscape from '@/assets/peaceful-landscape.jpg'
import { PROJECTS_DATA, type ProjectItem } from '@/data/projects'

const router = useRouter()
const terminal = useTerminalStore()
const boot = useBootStore()
const scenic = useScenicStore()
const posts = ref<PostSummary[]>([])
const state = ref<'loading' | 'ready' | 'error'>('loading')
const heroEl = ref<HTMLElement | null>(null)

const featuredProjects = computed<ProjectItem[]>(() =>
  PROJECTS_DATA.filter((p) => p.featured)
)

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
const DURATION = 1200
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

const frameOpacity = computed(() => easeOutCubic(clamp01((progress.value - 0.3) / 0.5)))
const frameTranslate = computed(() => (1 - frameOpacity.value) * 16)

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
  progress.value = Math.min(eased, boot.assetsReady ? 1 : 0.9)
  if (linear < 1 || !boot.assetsReady) {
    rafId = requestAnimationFrame(tickBoot)
  } else {
    window.setTimeout(() => {
      if (!boot.done) boot.finish()
    }, 150)
  }
}

let cleanupFns: (() => void)[] = []

// ---------- 滚动视差引擎 ----------
const heroScrollProgress = ref(0)

function finePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches
}

onMounted(() => {
  const photo = new Image()
  photo.src = heroLandscape
  const fontsReady = typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve()
  const photoDecode = typeof photo.decode === 'function' ? photo.decode().catch(() => {}) : Promise.resolve()
  Promise.all([fontsReady, photoDecode])
    .then(() => boot.markAssetsReady())

  if (!boot.done) {
    window.addEventListener('keydown', onBootEsc)
    rafId = requestAnimationFrame(tickBoot)
  }
  cleanupFns.push(() => {
    if (!boot.done) boot.finish()
  })

  const hero = heroEl.value
  if (!hero || prefersReducedMotion()) return

  // 滚动视差与板块风景联动
  let ticking = false
  const updateScroll = () => {
    ticking = false
    const scrollY = window.scrollY
    const vh = window.innerHeight

    // Hero 深度视差追踪 (由 Vue 响应式驱动)
    heroScrollProgress.value = Math.min(Math.max(scrollY / vh, 0), 1.5)

    // 动态驱动全局全屏沉浸高地画布在 4 大仙境画卷之间的 Cross-Fade 融合
    const secProjects = document.getElementById('stream-projects')
    const secPosts = document.getElementById('stream-posts')
    const secManifesto = document.getElementById('stream-manifesto')

    const top1 = secProjects ? secProjects.getBoundingClientRect().top : vh * 2
    const top2 = secPosts ? secPosts.getBoundingClientRect().top : vh * 3
    const top3 = secManifesto ? secManifesto.getBoundingClientRect().top : vh * 4

    const mid = vh * 0.5
    let w0 = 0, w1 = 0, w2 = 0, w3 = 0

    if (top1 > mid) {
      // 首屏至作品集: Scene 0 (Fairy Glen) -> Scene 1 (Old Man of Storr)
      const p = Math.max(0, Math.min(1, (vh - top1) / (vh * 0.55)))
      w0 = 1 - p
      w1 = p
    } else if (top2 > mid) {
      // 作品集至文章卷轴: Scene 1 (Old Man of Storr) -> Scene 2 (Glen Coe Valley)
      const p = Math.max(0, Math.min(1, (mid - (top2 - mid)) / (vh * 0.75)))
      w1 = 1 - p
      w2 = p
    } else if (top3 > mid) {
      // 文章至工坊信条: Scene 2 (Glen Coe Valley) -> Scene 3 (Among the Sierra Nevada)
      const p = Math.max(0, Math.min(1, (mid - (top3 - mid)) / (vh * 0.75)))
      w2 = 1 - p
      w3 = p
    } else {
      // 工坊信条及底部: Scene 3 (Among the Sierra Nevada)
      w3 = 1
    }

    scenic.setWeights([w0, w1, w2, w3])
  }
  const onScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(updateScroll)
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  updateScroll()
  cleanupFns.push(() => window.removeEventListener('scroll', onScroll))

  // 鼠标微视差
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

})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onBootEsc)
  if (!boot.done) boot.finish()
})

function onHeroDblClick() {
  terminal.open()
}

function navigateTo(path: string) {
  if (path.startsWith('http')) {
    window.open(path, '_blank', 'noopener,noreferrer')
  } else {
    router.push(path)
  }
}
</script>

<template>
  <div class="home">
    <section ref="heroEl" class="hero" @click="skipBoot" @dblclick="onHeroDblClick">
      <!-- 流体粒子山脉交互增强层 (背景由全局 FullscreenScenicStage 铺满) -->
      <div
        class="hero-backdrop"
        aria-hidden="true"
        :style="{
          transform: `translateY(${(-heroScrollProgress * 45).toFixed(1)}px)`,
        }"
      >
        <ParticleMountain :enabled="boot.done" />
      </div>

      <!-- 个人工坊 Hero 主视觉与标语体系 (去除嵌入式终端，保留极简高地意境与核心导航) -->
      <div
        class="hero-content"
        :style="{
          transform: `translateY(${(-heroScrollProgress * 80).toFixed(1)}px)`,
          opacity: Math.max(0, 1 - heroScrollProgress * 1.4),
        }"
      >
        <div class="hero-badge" v-reveal="0">
          <span class="badge-dot" aria-hidden="true"></span>
          <span class="badge-brand">SAKI · DIGITAL ATELIER</span>
          <span class="badge-sep">/</span>
          <span class="badge-role">FULL-STACK &amp; CREATIVE</span>
        </div>

        <h1 class="hero-title" v-reveal="1">
          <span class="title-line title-cn">在文字与代码中，<br />遇见更大的世界。</span>
          <span class="title-line title-en">in words and code, meet a bigger world.</span>
        </h1>

        <p class="hero-subtitle" v-reveal="2">
          Full-Stack Engineering · Generative Visuals · Minimalist Zen Aesthetics
        </p>

        <div class="hero-actions" v-reveal="3">
          <RouterLink class="hero-btn cta-primary" to="/projects">
            <span>探索作品集</span>
            <svg class="btn-arrow" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
          <button
            type="button"
            class="hero-btn cta-terminal"
            title="唤出交互控制台 (双击页面 / 点击顶栏 >_ / 按 Ctrl+K)"
            @click.stop="terminal.open()"
          >
            <span class="cli-icon" aria-hidden="true">&gt;_</span>
            <span>交互控制台</span>
            <kbd class="kbd-hint">Ctrl+K</kbd>
          </button>
        </div>

        <div
          class="hero-hint"
          v-reveal="4"
          role="button"
          tabindex="0"
          title="点击唤出交互终端"
          @click.stop="terminal.open()"
          @keydown.enter.stop="terminal.open()"
        >
          <span class="hint-dot" aria-hidden="true"></span>
          <span>双击页面任意空白处 · 点击顶栏 &gt;_ 图标 · 按 Ctrl+K 即可唤出禅意终端</span>
        </div>
      </div>
    </section>

    <!-- ========================================================
         以下全部摒弃卡片式设计 (Banish Card-based UI)，
         采用纯粹高密度的 Unix File Stream / Chronicle Buffer /
         Editorial Manifesto 极客排版体系。
         ======================================================== -->

    <!-- 01: 精选作品集 (TERMINAL DIRECTORY STREAM ~/projects/) -->
    <section id="stream-projects" class="home-stream-section" aria-label="精选作品集">
      <div class="stream-content-wrap">
        <header class="stream-section-head" v-reveal="0">
          <div class="stream-head-meta">
            <span class="meta-prompt">01 //</span>
            <h2 class="meta-title">精选作品集</h2>
            <span class="meta-path">~/peaceful-mind/projects</span>
            <span class="meta-status">[STREAM: 3 ACTIVE]</span>
          </div>
          <div class="stream-head-action">
            <RouterLink to="/projects" class="stream-all-link">
              全部作品 ({{ PROJECTS_DATA.length }}) →
            </RouterLink>
          </div>
        </header>

        <div class="directory-stream" role="feed" aria-label="精选作品文件流">
          <article
            v-for="(project, idx) in featuredProjects"
            :key="project.id"
            v-reveal="idx + 1"
            class="project-stream-row"
            role="article"
            tabindex="0"
            @click="navigateTo(project.demoUrl || '/projects')"
            @keydown.enter="navigateTo(project.demoUrl || '/projects')"
          >
            <!-- 顶栏: 序号 + 分类徽章 + 标题 + 状态与年份 -->
            <div class="project-row-head">
              <div class="project-id-block">
                <span class="project-idx">0{{ idx + 1 }}</span>
                <span class="project-cat" :class="project.category">{{ project.category.toUpperCase() }}</span>
                <h3 class="project-title">{{ project.title }}</h3>
              </div>
              <div class="project-meta-block">
                <span class="project-status">{{ project.statusLabel }}</span>
                <span class="project-year">{{ project.year }}</span>
              </div>
            </div>

            <!-- 主体: 副标题与描述 -->
            <div class="project-row-body">
              <p class="project-subtitle">{{ project.subtitle }}</p>
              <p class="project-desc">{{ project.description }}</p>
            </div>

            <!-- 底栏: 技术栈标签群 + 动作引导 -->
            <div class="project-row-foot">
              <div class="project-tags-cluster">
                <span v-for="tag in project.tags" :key="tag" class="stream-tech-pill">
                  {{ tag }}
                </span>
              </div>
              <div class="project-action-link">
                <span>进入工坊</span>
                <span class="action-arrow" aria-hidden="true">↗</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 02: 最新思考卷轴 (CHRONICLE BUFFER ~/writings/) -->
    <section id="stream-posts" class="home-stream-section" aria-label="最新文章">
      <div class="stream-content-wrap">
        <header class="stream-section-head" v-reveal="0">
          <div class="stream-head-meta">
            <span class="meta-prompt">02 //</span>
            <h2 class="meta-title">最新卷轴</h2>
            <span class="meta-path">~/peaceful-mind/writings</span>
            <span class="meta-status">[BUFFER: RECENT CHRONICLES]</span>
          </div>
          <div class="stream-head-action">
            <RouterLink to="/posts" class="stream-all-link">
              全部卷轴 →
            </RouterLink>
          </div>
        </header>

        <div class="chronicle-stream" role="feed" aria-label="最新文章卷轴流">
          <div v-if="state === 'loading'" class="stream-status-row">
            <span class="stream-spinner" aria-hidden="true"></span>
            <span>正在舒展卷轴 . . .</span>
          </div>

          <div v-else-if="state === 'error'" class="stream-status-row error">
            <span>文章载入暂缓，山风微阻。</span>
            <button type="button" class="stream-retry-btn" @click="load">重新拾取</button>
          </div>

          <div v-else-if="posts.length === 0" class="stream-status-row">
            <span>暂无新刊，静候风起。</span>
          </div>

          <div v-else class="stream-list">
            <RouterLink
              v-for="(post, index) in posts"
              :key="post.id"
              v-reveal="index + 1"
              :to="`/posts/${post.id}`"
              class="stream-row post-stream-row"
            >
              <div class="row-lead">
                <span class="row-perm" aria-hidden="true">-rw-r--r--</span>
                <span class="row-date">{{ post.published_at.slice(0, 10) }}</span>
                <span class="row-index">#{{ String(index + 1).padStart(2, '0') }}</span>
                <div class="row-title-group">
                  <h3 class="row-title">{{ post.title }}</h3>
                  <p v-if="post.summary" class="row-summary">{{ post.summary }}</p>
                </div>
              </div>

              <div class="row-tail">
                <span v-if="post.category" class="row-cat-pill">{{ post.category.name }}</span>
                <span v-if="post.reading_minutes" class="row-time">{{ post.reading_minutes }} MIN</span>
                <span class="row-dispatch">
                  <span>展卷</span>
                  <span class="dispatch-arrow" aria-hidden="true">→</span>
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 03: 工坊底盘与信条 (EDITORIAL MANIFESTO ~/manifesto.md) -->
    <section id="stream-manifesto" class="home-stream-section manifesto-section" aria-label="工坊底盘与信条">
      <div class="stream-content-wrap">
        <header class="stream-section-head" v-reveal="0">
          <div class="stream-head-meta">
            <span class="meta-prompt">03 //</span>
            <h2 class="meta-title">工坊底盘与信条</h2>
            <span class="meta-path">~/peaceful-mind/manifesto.md</span>
            <span class="meta-status">[TELEMETRY: STABLE]</span>
          </div>
        </header>

        <div class="manifesto-stream">
          <div class="manifesto-row" v-reveal="0">
            <div class="manifesto-lead">
              <span class="manifesto-no">01</span>
              <h3 class="manifesto-title">全栈工程化闭环</h3>
              <span class="manifesto-tag">[ARCHITECTURE]</span>
            </div>
            <p class="manifesto-text">
              Vue 3 + TypeScript 驱动的现代前端，配合 FastAPI + SQLAlchemy 2 + MySQL 8 的严谨服务端架构与自动化测试防御网。
            </p>
          </div>

          <div class="manifesto-row" v-reveal="1">
            <div class="manifesto-lead">
              <span class="manifesto-no">02</span>
              <h3 class="manifesto-title">先锋美学与触觉动效</h3>
              <span class="manifesto-tag">[VISUAL POETICS]</span>
            </div>
            <p class="manifesto-text">
              彻底抛弃千篇一律的卡片式模板。利用 WebGL 粒子、苏格兰仙境高地丘陵意境、纯粹终端流式排版与 View Transitions，营造有温度的数字现场。
            </p>
          </div>

          <div class="manifesto-row" v-reveal="2">
            <div class="manifesto-lead">
              <span class="manifesto-no">03</span>
              <h3 class="manifesto-title">极客终端交互哲学</h3>
              <span class="manifesto-tag">[CLI &amp; TERMINAL]</span>
            </div>
            <div class="manifesto-text-block">
              <p class="manifesto-text">
                图形界面的从容与命令行的敏捷交融。随时按下 Ctrl+K，用纯粹文本指令巡航博文与作品集。
              </p>
              <button
                type="button"
                class="manifesto-cli-btn"
                @click="terminal.open()"
              >
                <span>运行控制台 &gt;_</span>
                <kbd class="kbd-micro">Ctrl+K</kbd>
              </button>
            </div>
          </div>

          <div class="manifesto-row" v-reveal="3">
            <div class="manifesto-lead">
              <span class="manifesto-no">04</span>
              <h3 class="manifesto-title">自然与代码的平衡</h3>
              <span class="manifesto-tag">[ZEN CREED]</span>
            </div>
            <p class="manifesto-text motto-quote">
              “Talk is cheap. Show me the code. 但在代码的森林里奔跑时，别忘了抬头看看远方的山峦与星光。”
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  position: relative;
}

/* 全出血 Hero: 全景自然与悬浮终端视窗 */
.hero {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: max(1.25rem, 5vw);
  padding-block: var(--space-2xl);
  box-sizing: border-box;
  overflow: hidden;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* ========================================================
   Hero 主视觉排版与核心导航体系 (ZEN HERITAGE ARCHITECTURE)
   ======================================================== */
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 54rem;
  padding: 0 1.5rem;
  will-change: transform, opacity;
  user-select: none;
}

/* 工坊品牌标识胶囊 */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 9999px;
  background: rgba(10, 24, 18, 0.48);
  border: 1px solid rgba(116, 198, 157, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  color: #a3be8c;
  margin-bottom: 1.75rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.28);
}

:root[data-theme='light'] .hero-badge {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(45, 106, 79, 0.2);
  color: #2d6a4f;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #74c69d;
  box-shadow: 0 0 8px #74c69d;
  animation: pulse-dot 2.4s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.35);
    opacity: 1;
  }
}

.badge-brand {
  font-weight: 600;
  color: #eceff4;
}

:root[data-theme='light'] .badge-brand {
  color: #1e293b;
}

.badge-sep {
  opacity: 0.4;
}

.badge-role {
  color: #74c69d;
}

:root[data-theme='light'] .badge-role {
  color: #2d6a4f;
}

/* 典雅双语主标题 */
.hero-title {
  margin: 0;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.65);
}

:root[data-theme='light'] .hero-title {
  text-shadow: 0 2px 18px rgba(255, 255, 255, 0.85);
}

.title-cn {
  display: block;
  font-size: clamp(2.2rem, 5.2vw, 4.2rem);
  font-family: var(--font-serif, "Songti SC", "Noto Serif SC", serif);
  color: #f8fafc;
  letter-spacing: 0.04em;
  margin-bottom: 0.75rem;
}

:root[data-theme='light'] .title-cn {
  color: #0f172a;
}

.title-en {
  display: block;
  font-size: clamp(0.95rem, 1.8vw, 1.35rem);
  font-family: var(--font-mono);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: rgba(226, 232, 240, 0.78);
}

:root[data-theme='light'] .title-en {
  color: rgba(30, 41, 59, 0.68);
}

/* 副标题定位 */
.hero-subtitle {
  margin-top: 1.5rem;
  margin-bottom: 2.25rem;
  font-family: var(--font-mono);
  font-size: clamp(0.82rem, 1.3vw, 0.98rem);
  letter-spacing: 0.08em;
  color: rgba(203, 213, 225, 0.88);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55);
}

:root[data-theme='light'] .hero-subtitle {
  color: rgba(51, 65, 85, 0.88);
  text-shadow: none;
}

/* 核心行动召唤 */
.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--dur-base) cubic-bezier(0.16, 1, 0.3, 1);
}

.cta-primary {
  background: #2d6a4f;
  color: #f8fafc;
  border: 1px solid rgba(116, 198, 157, 0.45);
  box-shadow: 0 8px 24px -4px rgba(45, 106, 79, 0.5);
}

.cta-primary:hover {
  background: #40916c;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -4px rgba(64, 145, 108, 0.65);
}

.btn-arrow {
  transition: transform var(--dur-fast) ease;
}

.cta-primary:hover .btn-arrow {
  transform: translateX(3px);
}

.cta-terminal {
  background: rgba(12, 22, 17, 0.55);
  color: #d8dee9;
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.cta-terminal:hover {
  background: rgba(18, 34, 26, 0.78);
  border-color: rgba(116, 198, 157, 0.45);
  color: #74c69d;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

:root[data-theme='light'] .cta-terminal {
  background: rgba(255, 255, 255, 0.75);
  color: #1e293b;
  border-color: rgba(45, 106, 79, 0.2);
}

:root[data-theme='light'] .cta-terminal:hover {
  background: rgba(255, 255, 255, 0.95);
  color: #2d6a4f;
}

.cli-icon {
  color: #74c69d;
  font-weight: 700;
}

.kbd-hint {
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.75);
}

:root[data-theme='light'] .kbd-hint {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.6);
}

/* 终端唤出快捷提示条 */
.hero-hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: rgba(203, 213, 225, 0.7);
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.hero-hint:hover {
  color: #74c69d;
  border-color: rgba(116, 198, 157, 0.35);
  background: rgba(0, 0, 0, 0.42);
}

:root[data-theme='light'] .hero-hint {
  color: rgba(51, 65, 85, 0.75);
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
}

:root[data-theme='light'] .hero-hint:hover {
  color: #2d6a4f;
  background: rgba(255, 255, 255, 0.88);
}

.hint-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #74c69d;
}







/* ========================================================
   无卡片化极客流式排版系统 (STREAM ARCHITECTURE)
   ======================================================== */
.home-stream-section {
  position: relative;
  width: 100%;
  max-width: 68rem;
  margin-inline: auto;
  padding-inline: max(1.25rem, 3.5vw);
  padding-block: clamp(3.5rem, 6vw, 5.5rem);
  box-sizing: border-box;
}

/* 前景内容包裹与毛玻璃微透视 */
.stream-content-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
}

.stream-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-md);
  border-bottom: 1px dashed rgba(255, 255, 255, 0.14);
  flex-wrap: wrap;
  gap: var(--space-xs);
}

:root[data-theme='light'] .stream-section-head {
  border-bottom-color: rgba(18, 26, 40, 0.14);
}

.stream-head-meta {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.meta-prompt {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--color-accent);
  font-weight: 600;
}

.meta-title {
  margin: 0;
  font-size: clamp(1.3rem, 2.2vw, 1.65rem);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.meta-path {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-code-cyan);
  letter-spacing: 0.04em;
}

.meta-status {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.stream-all-link {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-accent);
  text-decoration: none;
  letter-spacing: 0.06em;
  transition: all var(--dur-fast) ease;
}

.stream-all-link:hover {
  color: var(--color-accent-high);
  text-decoration: underline;
}

/* 01: 作品集文件流 (DIRECTORY STREAM) - 优雅透视流式条目 */
.directory-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-stream-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 24px;
  background: rgba(12, 22, 17, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(116, 198, 157, 0.16);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition:
    transform var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    background-color var(--dur-fast) ease,
    box-shadow var(--dur-fast) ease;
}

:root[data-theme='light'] .project-stream-row {
  background: rgba(246, 250, 247, 0.88);
  border-color: rgba(45, 106, 79, 0.16);
}

.project-stream-row:hover {
  background: rgba(16, 30, 23, 0.88);
  border-color: rgba(116, 198, 157, 0.45);
  transform: translateY(-2px);
  box-shadow:
    0 12px 32px -4px rgba(0, 0, 0, 0.55),
    0 0 20px rgba(82, 183, 136, 0.12);
}

:root[data-theme='light'] .project-stream-row:hover {
  background: rgba(238, 246, 241, 0.96);
  border-color: rgba(45, 106, 79, 0.35);
  box-shadow: 0 12px 32px -4px rgba(45, 106, 79, 0.12);
}

.project-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.project-id-block {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.project-idx {
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-accent);
}

.project-cat {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  background: rgba(82, 183, 136, 0.12);
  border: 1px solid rgba(82, 183, 136, 0.28);
  color: var(--color-accent);
}

.project-cat.fullstack {
  color: #74c69d;
  border-color: rgba(116, 198, 157, 0.35);
}

.project-cat.creative {
  color: #81a1c1;
  border-color: rgba(129, 161, 193, 0.35);
  background: rgba(129, 161, 193, 0.1);
}

.project-cat.tool {
  color: #ebcb8b;
  border-color: rgba(235, 203, 139, 0.35);
  background: rgba(235, 203, 139, 0.1);
}

.project-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
  transition: color var(--dur-fast) ease;
}

.project-stream-row:hover .project-title {
  color: var(--color-accent-high);
}

.project-meta-block {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.project-status {
  color: var(--color-text-dim);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .project-status {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.08);
}

.project-year {
  color: var(--color-text-dim);
}

.project-row-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-subtitle {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--color-code-cyan);
  line-height: 1.5;
}

.project-desc {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  line-height: 1.65;
}

.project-row-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .project-row-foot {
  border-top-color: rgba(18, 26, 40, 0.08);
}

.project-tags-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.stream-tech-pill {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
}

:root[data-theme='light'] .stream-tech-pill {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.08);
  color: #475569;
}

.project-action-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-accent);
  font-weight: 500;
  transition: all var(--dur-fast) ease;
}

.project-action-link .action-arrow {
  transition: transform var(--dur-fast) ease;
}

.project-stream-row:hover .project-action-link .action-arrow {
  transform: translate(2px, -2px);
}

.stream-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(116, 198, 157, 0.12);
  text-decoration: none;
  color: inherit;
  transition: all var(--dur-fast) ease;
  cursor: pointer;
  gap: 16px;
  background: rgba(12, 22, 17, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
}

:root[data-theme='light'] .stream-row {
  background: rgba(246, 250, 247, 0.88);
  border-bottom-color: rgba(45, 106, 79, 0.12);
}

.stream-row:hover {
  background: rgba(16, 30, 23, 0.88);
  border-color: rgba(116, 198, 157, 0.4);
  transform: translateX(4px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
}

:root[data-theme='light'] .stream-row:hover {
  background: rgba(238, 246, 241, 0.96);
  border-color: rgba(45, 106, 79, 0.3);
  box-shadow: 0 8px 24px -4px rgba(45, 106, 79, 0.12);
}

.row-lead {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.row-perm {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--color-text-dim);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  transition: color var(--dur-fast) ease;
}

.stream-row:hover .row-perm {
  color: #a3be8c;
}

.row-index {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-accent);
  font-weight: 500;
  flex-shrink: 0;
}

.row-title-group {
  min-width: 0;
}

.row-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
  transition: color var(--dur-fast) ease;
}

.stream-row:hover .row-title {
  color: var(--color-accent-high);
}

.row-sub {
  margin: 3px 0 0;
  font-size: 0.84rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.row-mid {
  flex-shrink: 0;
}

.tech-tag-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.stream-tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
}

:root[data-theme='light'] .stream-tag {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.08);
  color: #475569;
}

.row-tail {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.row-category {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--color-code-cyan);
}

.row-year {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-dim);
}

.row-dispatch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-muted);
  transition: color var(--dur-fast) ease;
}

.stream-row:hover .row-dispatch {
  color: var(--color-accent);
}

.dispatch-arrow {
  transition: transform var(--dur-fast) ease;
}

.stream-row:hover .dispatch-arrow {
  transform: translateX(4px);
}

/* 02: 最新思考卷轴流 (CHRONICLE STREAM) */
.chronicle-stream {
  display: flex;
  flex-direction: column;
}

.stream-list {
  display: flex;
  flex-direction: column;
}

.post-stream-row {
  padding: 16px 14px;
}

.row-date {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.row-summary {
  margin: 3px 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.row-cat-pill {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 1px 7px;
  border-radius: 9999px;
  background: rgba(129, 161, 193, 0.12);
  color: #81a1c1;
  border: 1px solid rgba(129, 161, 193, 0.25);
}

.row-time {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-dim);
}

.stream-status-row {
  padding: var(--space-xl) 0;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stream-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stream-retry-btn {
  margin-left: 12px;
  padding: 2px 10px;
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

/* 03: 极客工坊底盘与信条 (EDITORIAL MANIFESTO) - 彻底摒弃 Bento Card */
.manifesto-stream {
  display: flex;
  flex-direction: column;
}

.manifesto-row {
  display: grid;
  grid-template-columns: 240px 1fr;
  align-items: baseline;
  gap: var(--space-xl);
  padding: 22px 20px;
  border-bottom: 1px solid rgba(116, 198, 157, 0.12);
  background: rgba(12, 22, 17, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  transition: all var(--dur-fast) ease;
}

:root[data-theme='light'] .manifesto-row {
  background: rgba(246, 250, 247, 0.88);
  border-bottom-color: rgba(45, 106, 79, 0.12);
}

.manifesto-row:hover {
  background: rgba(16, 30, 23, 0.88);
  border-color: rgba(116, 198, 157, 0.35);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
}

:root[data-theme='light'] .manifesto-row:hover {
  background: rgba(238, 246, 241, 0.96);
  border-color: rgba(45, 106, 79, 0.3);
  box-shadow: 0 8px 24px -4px rgba(45, 106, 79, 0.12);
}

.manifesto-lead {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.manifesto-no {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-accent);
  font-weight: 500;
}

.manifesto-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.manifesto-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  color: var(--color-code-cyan);
}

.manifesto-text {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.manifesto-text.motto-quote {
  font-family: var(--font-serif, inherit);
  font-style: italic;
  color: var(--color-text);
}

.manifesto-text-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manifesto-cli-btn {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.manifesto-cli-btn:hover {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

@media (max-width: 900px) {
  .manifesto-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .row-mid {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero {
    padding-inline: var(--space-md);
  }

  .hero-content {
    padding-inline: 0.5rem;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    max-width: 20rem;
    gap: 12px;
  }

  .hero-btn {
    width: 100%;
    justify-content: center;
  }

  .hero-hint {
    font-size: 0.7rem;
    padding: 6px 10px;
    line-height: 1.5;
  }

  .row-perm {
    display: none;
  }

  .row-tail {
    gap: 8px;
  }

  .row-dispatch {
    display: none;
  }
}
</style>
