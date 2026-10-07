<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchCategories, type CategoryWithCount } from '@/api/posts'

/** 分类集合页(SRS FR-CATEGORY-001): 禅意终端分类矩阵。 */
const categories = ref<CategoryWithCount[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

async function load() {
  status.value = 'loading'
  try {
    categories.value = await fetchCategories()
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="taxonomy-page">
    <div class="page-head">
      <div class="terminal-meta">
        <span class="badge">[TAXONOMY · DIRECTORY]</span>
        <span class="path">~/categories/</span>
      </div>
      <h1 class="page-title">全域分类</h1>
      <p class="page-subtitle">按主题归整的知识脉络与思维版图。</p>
    </div>

    <div v-if="status === 'loading'" class="state-box">
      <div class="state-spinner" aria-hidden="true"></div>
      <p>正在展开分类脉络…</p>
    </div>

    <div v-else-if="status === 'error'" class="state-box error">
      <p>分类加载失败，请稍后重试。</p>
      <button type="button" class="retry-btn" @click="load">重试</button>
    </div>

    <div v-else-if="categories.length === 0" class="state-box">
      <p>还没有任何分类。</p>
    </div>

    <ul v-else class="taxonomy-list">
      <li v-for="(category, index) in categories" :key="category.id" v-reveal="index">
        <RouterLink :to="`/categories/${category.id}`" class="taxonomy-card">
          <div class="card-head">
            <span class="cat-idx">0{{ index + 1 }}</span>
            <span class="count">{{ category.article_count }} 篇</span>
          </div>
          <span class="cat-name">{{ category.name }}</span>
          <span class="cat-arrow" aria-hidden="true">进入目录 →</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.taxonomy-page {
  position: relative;
  max-width: 78rem;
  margin-inline: 0;
}

.page-head {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.terminal-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  color: var(--color-accent);
  margin-bottom: var(--space-2xs);
}

.terminal-meta .path {
  color: var(--color-code-cyan);
}

.page-title {
  margin: 0;
  font-size: clamp(2rem, 3.8vw, 2.75rem);
}

.page-subtitle {
  margin: var(--space-2xs) 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.state-box {
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.state-spinner {
  width: 24px;
  height: 24px;
  margin: 0 auto var(--space-xs);
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-pill);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: var(--space-xs);
  padding: var(--space-3xs) var(--space-md);
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.taxonomy-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--space-md);
}

.taxonomy-list li {
  margin: 0;
}

.taxonomy-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) ease,
    box-shadow var(--dur-base) ease;
}

.taxonomy-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-glow);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.cat-idx {
  color: var(--color-accent);
  font-weight: 500;
}

.count {
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.cat-name {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 500;
  color: var(--color-text);
  transition: color var(--dur-fast) ease;
}

.taxonomy-card:hover .cat-name {
  color: var(--color-accent-high);
}

.cat-arrow {
  margin-top: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-dim);
  letter-spacing: 0.12em;
  transition:
    color var(--dur-fast) ease,
    transform var(--dur-fast) var(--ease-out);
}

.taxonomy-card:hover .cat-arrow {
  color: var(--color-accent);
  transform: translateX(4px);
}
</style>
