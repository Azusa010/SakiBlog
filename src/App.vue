<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { currentTheme, saveTheme, type Theme } from '@/theme'

// FR-SEARCH-001/003:主要页面提供搜索入口,空关键词不触发导航
const router = useRouter()
const searchQuery = ref('')

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchQuery.value = ''
}

// FR-THEME-003/004:手动切换主题并记忆偏好
const theme = ref<Theme>(currentTheme())

function toggleTheme() {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
  saveTheme(next)
  theme.value = next
}
</script>

<template>
  <div class="layout">
    <header class="site-header">
      <div class="header-top">
        <RouterLink class="brand" to="/">SAKIBLOG<sup>®</sup></RouterLink>
        <div class="header-actions">
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
            {{ theme === 'dark' ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
      <nav class="site-nav" aria-label="主导航">
        <RouterLink to="/"><span class="nav-index">01</span>首页</RouterLink>
        <RouterLink to="/posts"><span class="nav-index">02</span>文章</RouterLink>
        <RouterLink to="/categories"><span class="nav-index">03</span>分类</RouterLink>
        <RouterLink to="/tags"><span class="nav-index">04</span>标签</RouterLink>
        <RouterLink to="/about"><span class="nav-index">05</span>关于</RouterLink>
      </nav>
    </header>

    <main class="site-main">
      <!-- 缓存文章列表页,返回时保留筛选/分页/滚动状态(FR-LIST-006) -->
      <RouterView v-slot="{ Component }">
        <KeepAlive include="PostsView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <footer class="site-footer">
      <p>
        © 2026 SAKIBLOG&nbsp;&nbsp;///&nbsp;&nbsp;REV 1.0&nbsp;&nbsp;///&nbsp;&nbsp;VUE 3 × FASTAPI × MYSQL
      </p>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  border-bottom: 2px solid var(--color-border);
  border-top: 4px solid var(--color-accent);
}

.header-top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-weight: 900;
  font-size: 1.375rem;
  letter-spacing: -0.03em;
  color: var(--color-text);
  text-decoration: none;
  text-transform: uppercase;
}

.brand sup {
  color: var(--color-accent);
  font-size: 0.6em;
}

.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5, var(--space-6));
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
}

.site-nav a {
  color: var(--color-text-muted);
  text-decoration: none;
}

.site-nav a:hover {
  color: var(--color-text);
}

.site-nav a.router-link-active {
  color: var(--color-accent);
}

.site-nav a.router-link-active::after {
  content: ' ▮';
}

.nav-index {
  margin-right: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.6875rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.theme-toggle {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.theme-toggle:hover {
  border-color: var(--color-accent);
}

.search-form {
  display: flex;
  gap: 0;
}

.search-form input {
  width: 10rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.05em;
}

.search-form input::placeholder {
  color: var(--color-text-muted);
}

.search-form button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-left: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.search-form button:hover {
  background: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.site-main {
  flex: 1;
  width: 100%;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.site-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 2px solid var(--color-border);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
}

.site-footer p {
  margin: 0;
}
</style>
