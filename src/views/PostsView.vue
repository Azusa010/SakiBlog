<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

defineOptions({
  // 与 App.vue 的 KeepAlive include 对应(FR-LIST-006 状态恢复)
  name: 'PostsView',
})

/**
 * 文章列表页(SRS FR-LIST-001 ~ FR-LIST-004):
 * 已发布文章按发布时间从新到旧,分页状态放在 URL 查询参数里便于回退与分享。
 */
const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()

const posts = ref<PostSummary[]>([])
const total = ref(0)
const status = ref<'loading' | 'ready' | 'error'>('loading')

const page = computed(() => {
  const raw = Number(route.query.page)
  return Number.isInteger(raw) && raw >= 1 ? raw : 1
})
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

async function load() {
  status.value = 'loading'
  try {
    const data = await fetchPosts(page.value, PAGE_SIZE)
    posts.value = data.items
    total.value = data.total
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

// FR-STATE-005:加载中忽略重复翻页点击
function goPage(target: number) {
  if (status.value === 'loading') return
  router.push({ query: target > 1 ? { page: String(target) } : {} })
}

watch(page, load, { immediate: true })
</script>

<template>
  <section>
    <h1>文章</h1>

    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'error'" class="state-box">
      <p>文章加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <p v-else-if="posts.length === 0" class="state-box">还没有已发布的文章。</p>

    <template v-else>
      <PostCard v-for="(post, index) in posts" :key="post.id" :post="post" :index="index" />

      <nav v-if="totalPages > 1" class="pagination" aria-label="分页">
        <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页,共 {{ total }} 篇</span>
        <button type="button" :disabled="page >= totalPages" @click="goPage(page + 1)">
          下一页
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.state-box {
  color: var(--color-text-muted);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.pagination span {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.pagination button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: transparent;
  /* hover 底色从左向右扫入 */
  background-image: linear-gradient(var(--color-surface), var(--color-surface));
  background-repeat: no-repeat;
  background-size: 0% 100%;
  background-position: left;
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-size 0.3s var(--ease-out),
    border-color 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  border-color: var(--color-accent);
  background-size: 100% 100%;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
