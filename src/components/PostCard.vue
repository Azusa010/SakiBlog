<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PostSummary } from '@/api/posts'

defineProps<{
  post: PostSummary
  /** 列表中的序号(从 0 开始),用于展示编号 */
  index?: number
}>()
</script>

<template>
  <article v-reveal="index" v-spotlight class="post-card">
    <div class="post-head">
      <span v-if="index !== undefined" class="post-no" aria-hidden="true">
        {{ String(index + 1).padStart(2, '0') }}
      </span>
      <h2 class="post-title">
        <!-- ISO 日期直接截取,保证所有列表项格式一致(SRS NFR-DATA-002) -->
        <RouterLink
          :to="`/posts/${post.id}`"
          :style="{ viewTransitionName: `post-title-${post.id}` }"
        >{{ post.title }}</RouterLink>
      </h2>
    </div>
    <p class="post-meta">
      <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
      <span v-if="post.category"> / {{ post.category.name }}</span>
      <span v-if="post.tags.length > 0"> / {{ post.tags.map((tag) => tag.name).join(' · ') }}</span>
    </p>
    <p class="post-summary">{{ post.summary }}</p>
  </article>
</template>

<style scoped>
.post-card {
  position: relative;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
  transition: transform 0.3s var(--ease-out);
}

/* 光斑边框:跟随光标的暖光沿卡片边缘亮起(mask 只留 1px 边环) */
.post-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  padding: 1px;
  pointer-events: none;
  background: radial-gradient(
    220px circle at var(--px, 50%) var(--py, 50%),
    color-mix(in srgb, var(--color-accent) 45%, transparent),
    transparent 70%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

@media (hover: hover) {
  .post-card:hover {
    transform: translateY(-2px);
  }

  .post-card:hover::after {
    opacity: 1;
  }
}

.post-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.post-no {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  color: var(--color-accent);
}

.post-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: 0.06em;
}

.post-title a {
  color: var(--color-text);
  transition: color 0.2s ease;
}

.post-title a:hover {
  color: var(--color-accent);
}

/* 悬浮时箭头从左滑入 */
.post-title a::after {
  content: ' →';
  display: inline-block;
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity 0.25s ease,
    transform 0.25s var(--ease-out);
}

@media (hover: hover) {
  .post-card:hover .post-title a::after {
    opacity: 1;
    transform: none;
  }
}

.post-meta {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
}

.post-summary {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
</style>
