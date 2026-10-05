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
      <RouterLink class="brand" to="/">SakiBlog</RouterLink>
      <nav class="site-nav" aria-label="主导航">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/posts">文章</RouterLink>
        <RouterLink to="/categories">分类</RouterLink>
        <RouterLink to="/tags">标签</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
      <div class="header-actions">
        <form class="search-form" role="search" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            name="q"
            placeholder="搜索文章"
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
      <p>&copy; 2026 SakiBlog</p>
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
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;
}

.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.site-nav a {
  color: var(--color-text-muted);
  text-decoration: none;
}

.site-nav a:hover {
  color: var(--color-text);
}

.site-nav a.router-link-active {
  color: var(--color-text);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.theme-toggle {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
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
  gap: var(--space-2);
}

.search-form input {
  width: 10rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.search-form button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.search-form button:hover {
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
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.site-footer p {
  margin: 0;
}
</style>
