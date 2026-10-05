<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchSearch, type SearchResult } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

/**
 * 搜索结果页(SRS FR-SEARCH-004 ~ 006):
 * 关键词放在 URL 查询参数里,刷新或分享链接可恢复相同结果语义。
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

// 空关键词保持待输入状态,不发请求(FR-SEARCH-003)
watch(query, (q) => (q ? load() : (status.value = 'idle')), { immediate: true })
</script>

<template>
  <section>
    <h1>搜索</h1>

    <p v-if="status === 'idle'" class="state-box">在页面上方的搜索框输入关键词,开始查找文章。</p>

    <p v-else-if="status === 'loading'">搜索中…</p>

    <div v-else-if="status === 'error'" class="state-box">
      <p>搜索失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <template v-else-if="result">
      <p class="result-count">关键词「{{ result.query }}」共匹配 {{ result.total }} 篇文章</p>

      <div v-if="result.items.length === 0" class="state-box">
        <p>没有找到匹配的文章。</p>
        <p>换个关键词试试,或 <RouterLink to="/posts">浏览全部文章</RouterLink>。</p>
      </div>
      <PostCard v-for="post in result.items" v-else :key="post.id" :post="post" />
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
