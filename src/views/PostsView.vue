<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
 * 航线图:一条金色虚线把每篇文章的编号串成航段,滚动时逐段描画。
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

// ---------- 航线图 ----------
const listEl = ref<HTMLElement | null>(null)
const routeMap = ref({ path: '', width: 0, height: 0 })
let resizeObserver: ResizeObserver | null = null

function rebuildRouteMap() {
  const list = listEl.value
  if (!list) return
  const numbers = list.querySelectorAll<HTMLElement>('.post-no')
  if (numbers.length === 0) {
    routeMap.value = { path: '', width: 0, height: 0 }
    return
  }
  const bounds = list.getBoundingClientRect()
  const points = Array.from(numbers).map((el) => {
    const rect = el.getBoundingClientRect()
    return [rect.left - bounds.left + 12, rect.top - bounds.top + rect.height / 2] as const
  })
  let d = `M ${points[0]![0]} ${points[0]![1]}`
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]!
    const [x1, y1] = points[i]!
    const bend = (x0 + x1) / 2 + (i % 2 === 1 ? 30 : -30)
    d += ` C ${bend} ${y0}, ${bend} ${y1}, ${x1} ${y1}`
  }
  routeMap.value = { path: d, width: bounds.width, height: bounds.height }
}

function stopRouteMapObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
}

onMounted(() => {
  if (typeof ResizeObserver !== 'function') return
  resizeObserver = new ResizeObserver(() => rebuildRouteMap())
  if (listEl.value) resizeObserver.observe(listEl.value)
})

onBeforeUnmount(stopRouteMapObserver)

// KeepAlive 缓存页重新进入时重测一遍
onActivated(() => {
  void nextTick(rebuildRouteMap)
})

watch(
  () => [status.value, posts.value],
  async () => {
    if (status.value !== 'ready') return
    await nextTick()
    rebuildRouteMap()
    if (listEl.value && typeof ResizeObserver === 'function' && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => rebuildRouteMap())
      resizeObserver.observe(listEl.value)
    }
  },
)

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
      <div ref="listEl" class="post-list-wrap">
        <svg
          v-if="routeMap.path"
          class="route-map"
          :viewBox="`0 0 ${routeMap.width} ${routeMap.height}`"
          aria-hidden="true"
        >
          <path class="route-base" :d="routeMap.path" />
          <path class="route-progress" :d="routeMap.path" pathLength="100" />
        </svg>
        <PostCard v-for="(post, index) in posts" :key="post.id" :post="post" :index="index" />
      </div>

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
.post-list-wrap {
  position: relative;
}

/* 航线图:虚线为全程航路,金线随滚动逐段描画 */
.route-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.route-base {
  fill: none;
  stroke: var(--color-accent);
  stroke-opacity: 0.28;
  stroke-width: 1;
  stroke-dasharray: 2 7;
}

.route-progress {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 1.5;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

@media (prefers-reduced-motion: no-preference) {
  .route-progress {
    animation: route-draw linear both;
    animation-timeline: view();
  }
}

@keyframes route-draw {
  to {
    stroke-dashoffset: 0;
  }
}

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
