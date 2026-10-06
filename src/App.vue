<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { currentTheme, saveTheme, type Theme } from '@/theme'
import BootLoader from '@/components/BootLoader.vue'

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

function toggleTheme() {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!prefersReducedMotion() && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => saveTheme(next))
  } else {
    saveTheme(next)
  }
  theme.value = next
}

// boot 载入动画:每个会话首次进站出现;reduced-motion 用户直接跳过
const BOOT_STORAGE_KEY = 'sakiblog:booted'
const booting = ref(!sessionStorage.getItem(BOOT_STORAGE_KEY) && !prefersReducedMotion())

function finishBoot() {
  sessionStorage.setItem(BOOT_STORAGE_KEY, '1')
  booting.value = false
}

// 首页头部悬浮在 hero 场景之上
const isHome = computed(() => route.path === '/')
</script>

<template>
  <div class="layout">
    <header class="site-header" :class="{ overlaid: isHome }">
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
            @click="toggleTheme"
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
      <BootLoader v-if="booting" @done="finishBoot" />
    </Transition>
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
  color: var(--color-text-muted);
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
