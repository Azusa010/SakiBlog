<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

defineOptions({
  name: 'PostsView',
})

/**
 * 文章列表页(SRS FR-LIST-001 ~ FR-LIST-004):
 * 禅意终端航线图: 虚线串起每篇文章编号, 滚动时随视差生长。
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
    return [rect.left - bounds.left + 14, rect.top - bounds.top + rect.height / 2] as const
  })
  let d = `M ${points[0]![0]} ${points[0]![1]}`
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]!
    const [x1, y1] = points[i]!
    const bend = (x0 + x1) / 2 + (i % 2 === 1 ? 24 : -24)
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

function goPage(target: number) {
  if (status.value === 'loading') return
  router.push({ query: target > 1 ? { page: String(target) } : {} })
}

watch(page, load, { immediate: true })
</script>

<template>
  <div class="posts-page">
    <div class="page-head">
      <div class="terminal-meta">
        <span class="badge">[INDEX · ARCHIVE]</span>
        <span class="path">~/posts/all</span>
      </div>
      <h1 class="page-title">全部卷轴</h1>
      <p class="page-subtitle">按岁月经纬拾取的思考与实践碎片，共计 {{ total }} 篇。</p>
    </div>

    <div v-if="status === 'loading'" class="state-panel">
      <div class="pulse-line" aria-hidden="true"></div>
      <p>正在舒展航路与文章索引…</p>
    </div>

    <div v-else-if="status === 'error'" class="state-panel error">
      <p>文章加载失败，请稍后重试。</p>
      <button type="button" class="retry-btn" @click="load">重试</button>
    </div>

    <div v-else-if="posts.length === 0" class="state-panel">
      <p>还没有已发布的文章，静候新篇。</p>
    </div>

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

      <nav v-if="totalPages > 1" class="pagination" aria-label="分页导航">
        <button
          type="button"
          class="page-btn"
          :disabled="page <= 1"
          @click="goPage(page - 1)"
        >
          ← 上一卷
        </button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 卷 · 共 {{ total }} 篇</span>
        <button
          type="button"
          class="page-btn"
          :disabled="page >= totalPages"
          @click="goPage(page + 1)"
        >
          下一卷 →
        </button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.posts-page {
  position: relative;
  max-width: 68rem;
  margin-inline: 0;
  padding-bottom: var(--space-2xl);
}

.page-head {
  position: relative;
  z-index: 1;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.terminal-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  color: var(--color-accent);
  margin-bottom: var(--space-2xs);
}

.terminal-meta .path {
  color: var(--color-code-cyan);
}

.page-title {
  margin: 0;
  font-size: clamp(2rem, 3.8vw, 2.75rem);
}

.page-subtitle {
  margin: var(--space-2xs) 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.post-list-wrap {
  position: relative;
  z-index: 1;
}

.route-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.route-base {
  fill: none;
  stroke: var(--color-accent);
  stroke-opacity: 0.22;
  stroke-width: 1;
  stroke-dasharray: 2 6;
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

.state-panel {
  position: relative;
  z-index: 1;
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.retry-btn {
  margin-top: var(--space-xs);
  padding: var(--space-3xs) var(--space-md);
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.retry-btn:hover {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.pagination {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  font-family: var(--font-mono);
}

.page-info {
  color: var(--color-text-dim);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

.page-btn {
  padding: var(--space-3xs) var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent-high);
  box-shadow: 0 0 12px var(--color-accent-glow);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
