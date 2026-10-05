<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PostSummary } from '@/api/posts'

defineProps<{
  post: PostSummary
  /** 列表中的序号(从 0 开始),用于展示工业编号 */
  index?: number
}>()
</script>

<template>
  <article v-reveal="index" class="post-card">
    <div class="post-head">
      <span v-if="index !== undefined" class="post-no" aria-hidden="true">
        {{ String(index + 1).padStart(2, '0') }}
      </span>
      <h2 class="post-title">
        <!-- ISO 日期直接截取,保证所有列表项格式一致(SRS NFR-DATA-002) -->
        <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
      </h2>
    </div>
    <p class="post-meta">
      <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
      <span v-if="post.category"> /// {{ post.category.name }}</span>
      <span v-if="post.tags.length > 0"> /// {{ post.tags.map((tag) => tag.name).join(' · ') }}</span>
    </p>
    <p class="post-summary">{{ post.summary }}</p>
  </article>
</template>

<style scoped>
.post-card {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.post-card:last-child {
  border-bottom: 2px solid var(--color-border);
}

.post-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.post-no {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--color-accent);
}

.post-title {
  margin: 0;
  font-size: 1.25rem;
  text-transform: none;
  letter-spacing: -0.01em;
}

.post-title a {
  color: var(--color-text);
  text-decoration: none;
}

.post-title a:hover {
  color: var(--color-accent);
}

.post-meta {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.post-summary {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}
</style>
