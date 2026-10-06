<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, fetchPost, type PostDetail as PostDetailData } from '@/api/posts'
import { renderMarkdown } from '@/markdown'
import BackToTop from '@/components/BackToTop.vue'

/**
 * 文章详情页(SRS FR-ARTICLE-001 ~ 008):
 * 标题、发布时间、Markdown 正文、文章目录、上下篇导航与未找到状态。
 */
const route = useRoute()

const post = ref<PostDetailData | null>(null)
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')
const contentEl = ref<HTMLElement | null>(null)
const activeHeading = ref('')

const renderedContent = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))

// 目录(FR-ARTICLE-005):正文含二级或更深层级标题时提供,点击定位到对应标题
interface TocItem {
  id: string
  text: string
  level: number
}

const toc = computed<TocItem[]>(() => {
  if (!post.value) return []
  const doc = new DOMParser().parseFromString(renderedContent.value, 'text/html')
  return Array.from(doc.querySelectorAll('h2, h3, h4')).map((el, index) => ({
    id: `heading-${index}`,
    text: el.textContent ?? '',
    level: Number(el.tagName[1]),
  }))
})

// 给实际渲染出的标题写上与目录一致的锚点 id,并观察当前阅读位置点亮目录项
let headingObserver: IntersectionObserver | null = null

watch(renderedContent, async () => {
  await nextTick()
  const headings = contentEl.value?.querySelectorAll('h2, h3, h4') ?? []
  headings.forEach((el, index) => el.setAttribute('id', `heading-${index}`))

  headingObserver?.disconnect()
  if (typeof IntersectionObserver === 'function' && headings.length > 0) {
    headingObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeHeading.value = entry.target.id
          }
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    headings.forEach((el) => headingObserver?.observe(el))
  }
})

onBeforeUnmount(() => headingObserver?.disconnect())

function scrollToHeading(id: string) {
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'start',
  })
}

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
    <div class="read-progress" aria-hidden="true"></div>

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
      <p v-reveal="0" class="post-meta">
        <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
        <span v-if="post.category"> · {{ post.category.name }}</span>
        <span v-if="post.tags.length > 0"> · {{ post.tags.map((tag) => tag.name).join('、') }}</span>
      </p>

      <nav v-if="toc.length > 0" v-reveal="1" class="toc" aria-label="文章目录">
        <strong>目录</strong>
        <ol>
          <li v-for="heading in toc" :key="heading.id" :class="`level-${heading.level}`">
            <a
              :href="`#${heading.id}`"
              :class="{ active: heading.id === activeHeading }"
              @click.prevent="scrollToHeading(heading.id)"
            >
              {{ heading.text }}
            </a>
          </li>
        </ol>
      </nav>

      <!-- renderMarkdown 输出已转义原始 HTML,这里安全 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div ref="contentEl" v-reveal="2" class="post-content" v-html="renderedContent"></div>

      <nav
        v-if="post.prev || post.next"
        v-reveal="3"
        class="post-neighbors"
        aria-label="上下篇"
      >
        <RouterLink v-if="post.prev" :to="`/posts/${post.prev.id}`" class="neighbor neighbor-prev">
          ← {{ post.prev.title }}
        </RouterLink>
        <span v-else aria-hidden="true"></span>
        <RouterLink v-if="post.next" :to="`/posts/${post.next.id}`" class="neighbor neighbor-next">
          {{ post.next.title }} →
        </RouterLink>
      </nav>

      <p class="back-link"><RouterLink to="/posts">← 返回文章列表</RouterLink></p>
      <BackToTop />
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
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

.back-link {
  margin-top: var(--space-8);
  font-size: 0.875rem;
}

.toc {
  margin: var(--space-4) 0 var(--space-6);
  padding: var(--space-2) 0 var(--space-2) var(--space-6);
  border-left: 1px solid var(--color-border);
}

.toc strong {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.toc ol {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-6);
}

.toc li {
  font-size: 0.9375rem;
}

.toc a {
  color: var(--color-text);
  transition: color 0.2s ease;
}

.toc a:hover,
.toc a.active {
  color: var(--color-accent);
}

.toc li.level-3 {
  margin-left: var(--space-4);
}

.toc li.level-4 {
  margin-left: var(--space-8);
}

.post-neighbors {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: 0.9375rem;
}

.neighbor {
  max-width: 48%;
  overflow-wrap: anywhere;
  transition:
    transform 0.25s var(--ease-out),
    color 0.2s ease;
}

.neighbor:hover {
  color: var(--color-accent);
}

.neighbor-prev:hover {
  transform: translateX(-4px);
}

.neighbor-next:hover {
  transform: translateX(4px);
}

/* 阅读进度线:滚动驱动(CSS scroll-timeline),不支持的浏览器保持隐形 */
.read-progress {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  z-index: 90;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: 0 50%;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    .read-progress {
      animation: read-grow linear both;
      animation-timeline: scroll(root);
    }
  }
}

@keyframes read-grow {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

/* 正文图片悬浮微缩放 */
.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  transition: transform 0.35s var(--ease-out);
}

.post-content :deep(img:hover) {
  transform: scale(1.02);
}

/* 正文内容可读性优先:Markdown 标题豁免页面级的大写/压缩装饰(NFR-USE-003) */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4) {
  text-transform: none;
  letter-spacing: normal;
  border-bottom: none;
  padding-bottom: 0;
  font-size: 1.375rem;
  margin-top: var(--space-8);
}
</style>
