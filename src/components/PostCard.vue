<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PostSummary } from '@/api/posts'

defineProps<{
  post: PostSummary
  /** 列表中的序号(从 0 开始),用于展示编号与非对称排版 */
  index?: number
}>()
</script>

<template>
  <article
    v-reveal="index"
    v-spotlight
    class="post-card"
    :class="{ 'is-featured': index === 0 }"
  >
    <div class="card-glass" aria-hidden="true"></div>

    <div class="post-content">
      <div class="post-head">
        <span v-if="index !== undefined" class="post-no" aria-hidden="true">
          NO.{{ String(index + 1).padStart(2, '0') }}
        </span>
        <span v-if="post.category" class="post-category">
          {{ post.category.name }}
        </span>
      </div>

      <h2 class="post-title">
        <RouterLink
          :to="`/posts/${post.id}`"
          :style="{ viewTransitionName: `post-title-${post.id}` }"
        >
          {{ post.title }}
        </RouterLink>
      </h2>

      <p class="post-summary">{{ post.summary }}</p>

      <div class="post-footer">
        <time class="post-date" :datetime="post.published_at">
          {{ post.published_at.slice(0, 10) }}
        </time>

        <div v-if="post.tags.length > 0" class="post-tags">
          <span v-for="tag in post.tags" :key="tag.id" class="tag-chip">
            #{{ tag.name }}
          </span>
        </div>

        <RouterLink :to="`/posts/${post.id}`" class="post-arrow" aria-label="阅读文章">
          <span>阅读</span>
          <svg class="arrow-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  position: relative;
  margin-bottom: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) ease,
    box-shadow var(--dur-base) ease;
  overflow: hidden;
}

.card-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    280px circle at var(--px, 50%) var(--py, 50%),
    var(--color-accent-glow),
    transparent 70%
  );
  opacity: 0;
  transition: opacity var(--dur-base) ease;
}

.post-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-glow);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.post-card:hover .card-glass {
  opacity: 1;
}

/* 高光旗舰文章:具有更宽广的气场 */
.post-card.is-featured {
  padding: var(--space-lg) var(--space-xl);
  border-color: var(--color-border-glow);
  background: linear-gradient(
    135deg,
    rgba(212, 163, 115, 0.08) 0%,
    var(--color-surface) 60%
  );
}

.post-card.is-featured .post-title {
  font-size: clamp(1.3rem, 2.4vw, 1.75rem);
}

.post-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.post-head {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
}

.post-no {
  color: var(--color-accent);
  font-weight: 500;
}

.post-category {
  padding: 1px var(--space-2xs);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-code-frost);
}

.post-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 1.8vw, 1.35rem);
  font-weight: 500;
  line-height: 1.35;
}

.post-title a {
  color: var(--color-text);
  transition: color var(--dur-fast) ease;
}

.post-title a:hover {
  color: var(--color-accent-high);
}

.post-summary {
  margin: var(--space-3xs) 0 0;
  color: var(--color-text-muted);
  font-size: 0.925rem;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.post-date {
  letter-spacing: 0.1em;
}

.post-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  flex-wrap: wrap;
}

.tag-chip {
  color: var(--color-text-muted);
}

.post-arrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  color: var(--color-accent);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  transition:
    transform var(--dur-fast) var(--ease-out),
    color var(--dur-fast) ease;
}

.arrow-icon {
  width: 0.85rem;
  height: 0.85rem;
  transition: transform var(--dur-fast) var(--ease-out);
}

.post-card:hover .post-arrow {
  color: var(--color-accent-high);
}

.post-card:hover .arrow-icon {
  transform: translateX(3px);
}

@media (max-width: 640px) {
  .post-card {
    padding: var(--space-sm) var(--space-md);
  }

  .post-card.is-featured {
    padding: var(--space-md) var(--space-md);
  }

  .post-tags {
    display: none;
  }
}
</style>
