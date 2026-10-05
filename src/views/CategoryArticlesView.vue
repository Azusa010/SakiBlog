<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, fetchCategory, fetchPostsOfCategory, type PostSummary } from '@/api/posts'
import { useCountUp } from '@/utils/countUp'
import PostCard from '@/components/PostCard.vue'

/**
 * 分类文章页(SRS FR-CATEGORY-002 ~ 004):
 * 展示当前分类名称、结果数量与该分类下的公开文章。
 */
const route = useRoute()

const category = ref<{ id: number; name: string; article_count: number } | null>(null)
const posts = ref<PostSummary[]>([])
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')

async function load() {
  status.value = 'loading'
  try {
    category.value = await fetchCategory(String(route.params.id))
    posts.value = (await fetchPostsOfCategory(String(route.params.id))).items
    status.value = 'ready'
  } catch (error) {
    status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
  }
}

watch(() => route.params.id, load, { immediate: true })

const displayCount = useCountUp(computed(() => category.value?.article_count ?? 0))
</script>

<template>
  <section>
    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'not-found'" class="state-box">
      <h1>分类不存在</h1>
      <p>这个分类可能已被删除。</p>
      <p><RouterLink to="/categories">返回分类集合</RouterLink> 或 <RouterLink to="/posts">浏览全部文章</RouterLink></p>
    </div>

    <div v-else-if="status === 'error'" class="state-box">
      <p>文章加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else-if="category">
      <h1 v-reveal="0">分类:{{ category.name }}</h1>
      <p v-reveal="1" class="result-count">共 {{ displayCount }} 篇文章</p>

      <div v-if="posts.length === 0" class="state-box">
        <p>该分类下暂无公开文章。</p>
        <p><RouterLink to="/posts">浏览全部文章</RouterLink> 或 <RouterLink to="/categories">返回分类集合</RouterLink></p>
      </div>
      <PostCard v-for="(post, index) in posts" v-else :key="post.id" :post="post" :index="index" />
    </template>
  </section>
</template>

<style scoped>
.result-count {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
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
