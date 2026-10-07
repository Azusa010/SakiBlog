<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchSearch, type SearchResult } from '@/api/posts'
import { useCountUp } from '@/utils/countUp'
import PostCard from '@/components/PostCard.vue'

/**
 * 搜索结果页(SRS FR-SEARCH-004 ~ 006):
 * 禅意终端检索中枢。
 */
const route = useRoute()

const query = computed(() => String(route.query.q ?? '').trim())
const result = ref<SearchResult | null>(null)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

async function load() {
  status.value = 'loading'
  try {
    result.value = await fetchSearch(query.value)
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

watch(query, (q) => (q ? load() : (status.value = 'idle')), { immediate: true })

const displayTotal = useCountUp(computed(() => result.value?.total ?? 0))
</script>

<template>
  <div class="search-page">
    <div class="page-head">
      <div class="terminal-meta">
        <span class="badge">[QUERY · GREP]</span>
        <span class="path">~/search?q={{ query || '*' }}</span>
      </div>
      <h1 class="page-title">全域检索</h1>
      <p class="page-subtitle">穿透标题、正文、分类与标签的检索中枢。</p>
    </div>

    <div v-if="status === 'idle'" class="state-box">
      <p>在页面上方的搜索框输入关键词，开始查找文章。</p>
    </div>

    <div v-else-if="status === 'loading'" class="state-box">
      <div class="state-spinner" aria-hidden="true"></div>
      <p>搜索中…</p>
    </div>

    <div v-else-if="status === 'error'" class="state-box error">
      <p>搜索失败，请稍后重试。</p>
      <button type="button" class="retry-btn" @click="load">重试</button>
    </div>

    <template v-else-if="result">
      <p v-reveal="0" class="result-count">
        关键词「{{ result.query }}」共匹配 <span class="kinetic-number">{{ displayTotal }}</span> 篇文章
      </p>

      <div v-if="result.items.length === 0" class="state-box">
        <p>没有找到匹配的文章。</p>
        <p>换个关键词试试，或 <RouterLink to="/posts">浏览全部文章</RouterLink>。</p>
      </div>

      <div v-else class="post-feed">
        <PostCard v-for="(post, index) in result.items" :key="post.id" :post="post" :index="index" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-page {
  position: relative;
  max-width: 68rem;
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

.result-count {
  margin-bottom: var(--space-lg);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.kinetic-number {
  color: var(--color-accent);
  font-weight: 500;
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

.post-feed {
  display: flex;
  flex-direction: column;
}
</style>
