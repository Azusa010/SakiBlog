<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { currentTheme, saveTheme, type Theme } from '@/theme'
import { useBootStore } from '@/stores/boot'
import BootLoader from '@/components/BootLoader.vue'
import CursorFx from '@/components/CursorFx.vue'
import PlaneSprite from '@/components/PlaneSprite.vue'

// FR-SEARCH-001/003:主要页面提供搜索入口,空关键词不触发导航
const route = useRoute()
const router = useRouter()
const searchQuery = ref('')

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchQuery.value = ''
}

// FR-THEME-003/004:手动切换主题并记忆偏好;支持的浏览器走 View Transition 交叉淡化
const theme = ref<Theme>(currentTheme())

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function toggleTheme(event?: MouseEvent) {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> }
  }
  if (!prefersReducedMotion() && typeof doc.startViewTransition === 'function') {
    const transition = doc.startViewTransition(() => saveTheme(next))
    // 圆形扩散:从切换按钮为圆心揭示新主题(不支持的浏览器走默认交叉淡化)
    const button = event?.currentTarget as HTMLElement | undefined
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            },
            { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {})
    }
  } else {
    saveTheme(next)
  }
  theme.value = next
}

// 首屏载入编舞:状态在 boot store(session-once)。
// 落地在首页时由 Home 播放"未完成态 hero → 完成"编舞;
// 落地在其他页时用极简 overlay 兜底;reduced-motion 用户直接跳过。
const boot = useBootStore()
const isHome = computed(() => route.path === '/')

onMounted(() => {
  if (prefersReducedMotion()) {
    boot.finish()
  }
})
</script>

<template>
  <div class="layout">
    <header
      class="site-header"
      :class="[{ overlaid: isHome }, { 'boot-hidden': !boot.done }]"
    >
      <div class="header-inner">
        <RouterLink class="brand" to="/">
          <svg class="brand-mark" viewBox="0 0 24 16" aria-hidden="true">
            <path d="M1 15 L9 3 L13 9 L16 5 L23 15 Z" fill="currentColor" />
          </svg>
          <span>SAKIBLOG</span>
        </RouterLink>
        <div class="header-actions">
          <nav class="site-nav" aria-label="主导航">
            <RouterLink to="/">首页</RouterLink>
            <RouterLink to="/posts">文章</RouterLink>
            <RouterLink to="/categories">分类</RouterLink>
            <RouterLink to="/tags">标签</RouterLink>
            <RouterLink to="/about">关于</RouterLink>
          </nav>
          <form class="search-form" role="search" @submit.prevent="submitSearch">
            <input
              v-model="searchQuery"
              type="search"
              name="q"
              placeholder="SEARCH"
              aria-label="搜索文章"
            />
            <button type="submit">搜索</button>
          </form>
          <button
            type="button"
            class="theme-toggle"
            :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
            @click="toggleTheme($event)"
          >
            {{ theme === 'dark' ? '☀' : '☾' }}
          </button>
        </div>
      </div>
    </header>

    <main class="site-main">
      <!-- 缓存文章列表页,返回时保留筛选/分页/滚动状态(FR-LIST-006);路由轻量过渡 -->
      <RouterView v-slot="{ Component }">
        <Transition name="route" mode="out-in">
          <KeepAlive include="PostsView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>

    <footer class="site-footer">
      <p class="footer-tagline">一个记录思考与生活的地方</p>
      <p class="footer-copy">© 2026 SAKIBLOG</p>
    </footer>

    <Transition name="boot">
      <!-- 非首页落地时的兜底载入层;首页的载入编舞由 Home 的 hero 承担 -->
      <BootLoader v-if="!boot.done && !isHome" @done="boot.finish()" />
    </Transition>

    <PlaneSprite />

    <CursorFx />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  transition: opacity 0.8s ease;
}

/* 载入编舞期间隐藏头部,完成后淡入 */
.site-header.boot-hidden {
  opacity: 0;
  pointer-events: none;
}

/* 首页:头部悬浮在 hero 场景上,文字用场景同款浅色 */
.site-header.overlaid {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 100;
  border-bottom-color: transparent;
  background: transparent;
  color: #e8e6e1;
}

.site-header.overlaid .brand,
.site-header.overlaid .site-nav a {
  color: rgb(232 230 225 / 78%);
}

.site-header.overlaid .site-nav a:hover,
.site-header.overlaid .site-nav a.router-link-active {
  color: #f0e9dd;
}

.site-header.overlaid .search-form input {
  border-bottom-color: rgb(255 255 255 / 30%);
  color: #f0e9dd;
}

.site-header.overlaid .search-form input::placeholder {
  color: rgb(232 230 225 / 45%);
}

.site-header.overlaid .search-form button,
.site-header.overlaid .theme-toggle {
  color: rgb(232 230 225 / 78%);
}

.site-header.overlaid .search-form button:hover,
.site-header.overlaid .theme-toggle:hover {
  color: #f0e9dd;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  max-width: 84rem;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.32em;
  text-decoration: none;
}

.brand:hover {
  opacity: 0.8;
}

.brand-mark {
  width: 1.375rem;
  height: 1rem;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.site-nav {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  letter-spacing: 0.14em;
}

.site-nav a {
  position: relative;
  color: var(--color-text-muted);
}

/* 下划线从左向右生长 */
.site-nav a::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -3px;
  left: 0;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s var(--ease-out);
}

.site-nav a:hover::after {
  transform: scaleX(1);
}

.site-nav a:hover,
.site-nav a.router-link-active {
  color: var(--color-text);
}

.site-nav a + a::before {
  content: '·';
  margin: 0 var(--space-3);
  color: var(--color-text-muted);
  opacity: 0.6;
}

.search-form {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search-form input {
  width: 7.5rem;
  padding: var(--space-1) 0;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  transition: border-color 0.2s ease;
}

.search-form input:focus {
  outline: none;
  border-bottom-color: var(--color-accent);
}

.search-form input::placeholder {
  color: var(--color-text-muted);
}

.search-form button,
.theme-toggle {
  padding: var(--space-1) var(--space-2);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
}

.search-form button:hover,
.theme-toggle:hover {
  color: var(--color-accent);
}

.theme-toggle {
  font-size: 0.9375rem;
}

.site-main {
  flex: 1;
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-12) var(--space-6) var(--space-8);
}

.site-footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
}

.site-footer p {
  margin: 0;
}

@media (max-width: 768px) {
  .header-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .header-actions {
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-4);
  }

  .site-footer {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
