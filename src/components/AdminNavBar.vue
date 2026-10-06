<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/** 管理端顶部导航:各管理页共用。 */
const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <nav class="admin-nav" aria-label="管理导航">
    <strong>管理</strong>
    <RouterLink to="/admin/posts">文章</RouterLink>
    <RouterLink to="/admin/categories">分类</RouterLink>
    <RouterLink to="/admin/tags">标签</RouterLink>
    <span class="spacer"></span>
    <RouterLink to="/">返回前台</RouterLink>
    <span v-if="auth.username" class="who">{{ auth.username }}</span>
    <button type="button" @click="signOut">退出</button>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  margin-bottom: var(--space-8);
  border-bottom: 1px solid var(--color-border);
}

.admin-nav a {
  text-decoration: none;
  color: var(--color-text-muted);
}

.admin-nav a:hover,
.admin-nav a.router-link-active {
  color: var(--color-accent);
}

.spacer {
  flex: 1;
}

.who {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.admin-nav button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.admin-nav button:hover {
  border-color: var(--color-accent);
}
</style>
