<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PostSummary } from '@/api/posts'

defineProps<{
  post: PostSummary
}>()
</script>

<template>
  <article class="post-card">
    <h2 class="post-title">
      <!-- ISO 日期直接截取,保证所有列表项格式一致(SRS NFR-DATA-002) -->
      <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
    </h2>
    <p class="post-meta">
      <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
      <span v-if="post.category"> · {{ post.category.name }}</span>
      <span v-if="post.tags.length > 0"> · {{ post.tags.map((tag) => tag.name).join('、') }}</span>
    </p>
    <p class="post-summary">{{ post.summary }}</p>
  </article>
</template>

<style scoped>
.post-card {
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.post-title {
  margin: 0;
  font-size: 1.25rem;
}

.post-title a {
  color: var(--color-text);
  text-decoration: none;
}

.post-title a:hover {
  color: var(--color-accent);
}

.post-meta {
  margin: var(--space-1) 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.post-summary {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}
</style>
