<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, fetchPostsOfTag, fetchTag, type PostSummary } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

/**
 * 标签文章页(SRS FR-TAG-002 ~ 004):
 * 展示当前标签名称、结果数量与包含该标签的公开文章。
 */
const route = useRoute()

const tag = ref<{ id: number; name: string; article_count: number } | null>(null)
const posts = ref<PostSummary[]>([])
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')

async function load() {
  status.value = 'loading'
  try {
    tag.value = await fetchTag(String(route.params.id))
    posts.value = (await fetchPostsOfTag(String(route.params.id))).items
    status.value = 'ready'
  } catch (error) {
    status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <section>
    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'not-found'" class="state-box">
      <h1>标签不存在</h1>
      <p>这个标签可能已被删除。</p>
      <p><RouterLink to="/tags">返回标签集合</RouterLink> 或 <RouterLink to="/posts">浏览全部文章</RouterLink></p>
    </div>

    <div v-else-if="status === 'error'" class="state-box">
      <p>文章加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else-if="tag">
      <h1>标签:{{ tag.name }}</h1>
      <p class="result-count">共 {{ tag.article_count }} 篇文章</p>

      <div v-if="posts.length === 0" class="state-box">
        <p>该标签下暂无公开文章。</p>
        <p><RouterLink to="/posts">浏览全部文章</RouterLink> 或 <RouterLink to="/tags">返回标签集合</RouterLink></p>
      </div>
      <PostCard v-for="post in posts" v-else :key="post.id" :post="post" />
    </template>
  </section>
</template>

<style scoped>
.result-count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

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
</style>
