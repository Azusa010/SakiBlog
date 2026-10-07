<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fetchPosts, type PostSummary } from '@/api/posts'

defineOptions({
  name: 'PostsView',
})

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger)
}

const PAGE_SIZE = 10
const route = useRoute()
const router = useRouter()

const posts = ref<PostSummary[]>([])
const total = ref(0)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const blogEl = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

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

function goPage(target: number) {
  if (status.value === 'loading') return
  router.push({ query: target > 1 ? { page: String(target) } : {} })
}

function initAnimations() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('.gs-reveal').forEach((elem) => {
      ScrollTrigger.create({
        trigger: elem,
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo(
            elem,
            { y: 35, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out', overwrite: 'auto' },
          )
        },
        once: true,
      })
    })
  }, blogEl.value ?? undefined)
}

onMounted(() => {
  initAnimations()
})

watch(page, load, { immediate: true })

watch(
  () => [status.value, posts.value],
  async () => {
    if (status.value !== 'ready') return
    await nextTick()
    initAnimations()
  },
)

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<template>
  <div id="blog" ref="blogEl" class="blog-view w-full">
    <div class="pt-20 md:pt-32 px-6 md:px-16 max-w-[1200px] mx-auto pb-32">
      <!-- Header -->
      <header class="mb-16 md:mb-24 gs-reveal">
        <p class="font-accent text-blue-400/50 mb-4 text-sm uppercase tracking-widest">
          Archive · 全部卷轴
        </p>
        <h1 class="font-display text-5xl md:text-7xl lg:text-8xl text-slate-200">
          The Scroll.
        </h1>
        <p class="text-slate-400 text-base md:text-lg max-w-xl mt-4 leading-relaxed font-sans">
          按岁月经纬拾取的思考与实践碎片，共计 {{ total }} 篇。
        </p>
      </header>

      <!-- Loading State -->
      <div v-if="status === 'loading'" class="py-24 text-center text-slate-400 font-mono text-sm">
        <p>正在舒展航路与文章索引…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="status === 'error'" class="py-24 text-center">
        <p class="text-slate-400 text-base mb-6 font-sans">文章加载失败，请稍后重试。</p>
        <button
          type="button"
          class="cursor-pointer font-mono text-xs uppercase px-5 py-2 rounded border border-blue-400/40 text-blue-300 hover:bg-blue-400/10 transition-colors"
          @click="load"
        >
          重试
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="posts.length === 0" class="py-24 text-center text-slate-400 font-sans text-base">
        <p>还没有已发布的文章，静候新篇。</p>
      </div>

      <!-- Editorial Split Stream -->
      <template v-else>
        <div class="posts-editorial-stream flex flex-col" aria-label="文章列表">
          <article
            v-for="post in posts"
            :key="post.id"
            class="blog-row group gs-reveal"
            tabindex="0"
            role="button"
            :aria-label="post.title"
            @click="router.push(`/posts/${post.id}`)"
            @keydown.enter="router.push(`/posts/${post.id}`)"
          >
            <!-- Left: Date, Category, Reading Time -->
            <div class="blog-meta pt-2 pr-4">
              <time
                class="font-accent text-slate-400/80 tracking-widest text-sm md:text-base block mb-2"
                :datetime="post.published_at"
              >
                {{ post.published_at.slice(0, 10) }}
              </time>

              <div v-if="post.category" class="mb-2">
                <span class="font-mono text-xs px-2.5 py-0.5 rounded-full border border-blue-400/20 bg-blue-400/5 text-blue-300">
                  {{ post.category.name }}
                </span>
              </div>

              <div v-if="post.reading_minutes" class="text-slate-500 font-mono text-xs">
                {{ post.reading_minutes }} min read
              </div>
            </div>

            <!-- Right: Title, Summary, Tags -->
            <div class="blog-body min-w-0">
              <h2 class="font-display text-3xl md:text-5xl text-slate-200 mb-4 blog-title leading-snug">
                <RouterLink
                  :to="`/posts/${post.id}`"
                  class="block focus:outline-none"
                  @click.stop
                >
                  {{ post.title }}
                </RouterLink>
              </h2>

              <p class="text-slate-400 max-w-2xl text-base md:text-lg leading-relaxed font-sans mb-6">
                {{ post.summary }}
              </p>

              <div class="flex flex-wrap items-center gap-2.5">
                <span
                  v-for="tag in post.tags"
                  :key="tag.id"
                  class="font-mono text-xs px-2.5 py-1 rounded bg-white/5 text-slate-400 border border-white/5"
                >
                  #{{ tag.name }}
                </span>

                <RouterLink
                  :to="`/posts/${post.id}`"
                  class="font-accent text-xs uppercase tracking-widest text-slate-500 group-hover:text-blue-300 transition-colors ml-auto flex items-center gap-2"
                  @click.stop
                >
                  <span>Read Note</span>
                  <span class="transition-transform group-hover:translate-x-1">→</span>
                </RouterLink>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <nav
          v-if="totalPages > 1"
          class="pagination flex items-center justify-between border-t border-white/10 pt-12 mt-12"
          aria-label="分页导航"
        >
          <button
            type="button"
            class="page-btn cursor-pointer font-mono text-xs uppercase px-4 py-2 rounded border border-white/10 text-slate-300 hover:border-blue-400/40 hover:text-blue-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
          >
            ← 上一卷
          </button>
          <span class="page-info font-mono text-xs text-slate-500 tracking-wider">
            第 {{ page }} / {{ totalPages }} 卷 · 共 {{ total }} 篇
          </span>
          <button
            type="button"
            class="page-btn cursor-pointer font-mono text-xs uppercase px-4 py-2 rounded border border-white/10 text-slate-300 hover:border-blue-400/40 hover:text-blue-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            :disabled="page >= totalPages"
            @click="goPage(page + 1)"
          >
            下一卷 →
          </button>
        </nav>
      </template>
    </div>
  </div>
</template>

<style scoped>
.blog-view {
  min-height: 100vh;
  color: var(--color-text, #e2e8f0);
}

.font-display {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
}

.font-accent {
  font-family: var(--font-accent, 'EB Garamond', serif);
  font-style: italic;
}

/* Editorial Split Row */
.blog-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3.5rem 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: start;
  cursor: pointer;
  transition: background-color 0.4s ease;
}

@media (min-width: 768px) {
  .blog-row {
    grid-template-columns: 2.5fr 7.5fr;
    gap: 3rem;
  }
}

.blog-row:hover .blog-title {
  color: var(--color-accent, #93c5fd);
}

.blog-title {
  transition: color 0.4s ease;
}
</style>
