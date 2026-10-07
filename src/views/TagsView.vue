<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTags, type TagWithCount } from '@/api/posts'

/** 标签集合页(SRS FR-TAG-001): 禅意终端标签热区图谱。 */
const tags = ref<TagWithCount[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

async function load() {
  status.value = 'loading'
  try {
    tags.value = await fetchTags()
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="tags-page">
    <div class="page-head">
      <div class="terminal-meta">
        <span class="badge">[TAXONOMY · TAGS]</span>
        <span class="path">~/tags/cloud</span>
      </div>
      <h1 class="page-title">思考标签</h1>
      <p class="page-subtitle">散落在行文间的微型索引与概念注脚。</p>
    </div>

    <div v-if="status === 'loading'" class="state-box">
      <div class="state-spinner" aria-hidden="true"></div>
      <p>正在生成概念图谱…</p>
    </div>

    <div v-else-if="status === 'error'" class="state-box error">
      <p>标签加载失败，请稍后重试。</p>
      <button type="button" class="retry-btn" @click="load">重试</button>
    </div>

    <div v-else-if="tags.length === 0" class="state-box">
      <p>还没有任何标签。</p>
    </div>

    <ul v-else class="taxonomy-list">
      <li v-for="(tag, index) in tags" :key="tag.id" v-reveal="index">
        <RouterLink :to="`/tags/${tag.id}`" class="tag-card">
          <div class="tag-meta">
            <span class="tag-hash">#</span>
            <span class="tag-name">{{ tag.name }}</span>
          </div>
          <span class="count">{{ tag.article_count }} 篇</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tags-page {
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
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: var(--space-sm);
}

.taxonomy-list li {
  margin: 0;
}

.tag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) ease,
    background-color var(--dur-base) ease;
}

.tag-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent);
  background: var(--color-surface-hover);
  box-shadow: 0 6px 20px var(--color-accent-glow);
}

.tag-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-hash {
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.tag-name {
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
  transition: color var(--dur-fast) ease;
}

.tag-card:hover .tag-name {
  color: var(--color-accent-high);
}

.count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-dim);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.05);
}
</style>
