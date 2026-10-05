<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, fetchPost, type PostDetail as PostDetailData } from '@/api/posts'
import { renderMarkdown } from '@/markdown'

/**
 * 文章详情页(SRS FR-ARTICLE-001/002/008):
 * 展示标题、发布时间与 Markdown 正文;无效或不公开的文章显示未找到状态。
 */
const route = useRoute()

const post = ref<PostDetailData | null>(null)
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')

const renderedContent = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))

async function load() {
  status.value = 'loading'
  try {
    post.value = await fetchPost(String(route.params.id))
    status.value = 'ready'
  } catch (error) {
    status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <article>
    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'not-found'" class="state-box">
      <h1>文章不存在</h1>
      <p>这篇文章可能已被删除,或尚未公开。</p>
      <p><RouterLink to="/posts">返回文章列表</RouterLink> 或 <RouterLink to="/">回首页</RouterLink></p>
    </div>

    <div v-else-if="status === 'error'" class="state-box">
      <p>文章加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else-if="post">
      <h1>{{ post.title }}</h1>
      <p class="post-meta">
        <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
        <span v-if="post.category"> · {{ post.category.name }}</span>
        <span v-if="post.tags.length > 0"> · {{ post.tags.map((tag) => tag.name).join('、') }}</span>
      </p>
      <!-- markdown-it 输出已转义原始 HTML,这里安全 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="post-content" v-html="renderedContent"></div>

      <p class="back-link"><RouterLink to="/posts">← 返回文章列表</RouterLink></p>
    </template>
  </article>
</template>

<style scoped>
.state-box {
  color: var(--color-text-muted);
}

.state-box button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.post-meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.back-link {
  margin-top: var(--space-8);
  font-size: 0.875rem;
}
</style>
