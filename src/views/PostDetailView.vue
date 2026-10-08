<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError, fetchPost, type PostDetail as PostDetailData } from '@/api/posts'
import { estimateReadingMinutes, renderMarkdown } from '@/markdown'
import { scrollToElement } from '@/lib/smoothScroll'
import { useCountUp } from '@/utils/countUp'

/**
 * 文章详情页(SRS FR-ARTICLE-001 ~ 008):
 * 双栏协同先锋阅读流: 侧翼动态阅读中枢 + 65ch 黄金可读正文。
 */
const route = useRoute()

const post = ref<PostDetailData | null>(null)
const status = ref<'loading' | 'ready' | 'error' | 'not-found'>('loading')
const contentEl = ref<HTMLElement | null>(null)
const activeHeading = ref('')

const renderedContent = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))
const readingMinutes = computed(() => (post.value ? estimateReadingMinutes(post.value.content) : 0))
const displayMinutes = useCountUp(readingMinutes)

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
  const el = document.getElementById(id)
  if (el) scrollToElement(el)
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
  <article class="article-page">
    <div class="read-progress" aria-hidden="true"></div>

    <div v-if="status === 'loading'" class="state-box loading">
      <div class="state-spinner" aria-hidden="true"></div>
      <p>正在展卷…</p>
    </div>

    <div v-else-if="status === 'not-found'" class="state-box not-found">
      <h1>文章不存在</h1>
      <p>这篇文章可能已被删除，或尚未公开。</p>
      <p class="state-links">
        <RouterLink to="/posts">返回文章列表</RouterLink> 或
        <RouterLink to="/">回首页</RouterLink>
      </p>
    </div>

    <div v-else-if="status === 'error'" class="state-box error">
      <p>文章加载失败，请稍后重试。</p>
      <button type="button" class="retry-btn" @click="load">重试</button>
    </div>

    <template v-else-if="post">
      <div class="reader-shell">
        <!-- 侧翼阅读中枢 (Left Rail) -->
        <aside class="reader-rail">
          <div class="rail-sticky">
            <RouterLink to="/posts" class="rail-back">
              <span>← 全部卷轴</span>
            </RouterLink>

            <div class="reading-meta">
              <span class="meta-kicker">READING SPEED</span>
              <span class="meta-time">
                预计 <span class="kinetic-number">{{ displayMinutes }}</span> 分钟
              </span>
            </div>

            <!-- 目录索引 (Toc) -->
            <nav v-if="toc.length > 0" v-reveal="1" class="toc" aria-label="文章目录">
              <strong class="toc-title">目录</strong>
              <ol>
                <li
                  v-for="heading in toc"
                  :key="heading.id"
                  :class="`level-${heading.level}`"
                >
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

          </div>
        </aside>

        <!-- 正文阅读主轴 (Right Main) -->
        <main class="reader-main">
          <header class="post-header">
            <div class="header-tags">
              <span v-if="post.category" class="cat-badge">{{ post.category.name }}</span>
              <span v-for="tag in post.tags" :key="tag.id" class="tag-badge">#{{ tag.name }}</span>
            </div>

            <h1 class="post-title" :style="{ viewTransitionName: `post-title-${post.id}` }">
              {{ post.title }}
            </h1>

            <p v-reveal="0" class="post-meta">
              <time :datetime="post.published_at">{{ post.published_at.slice(0, 10) }}</time>
              <span v-if="post.category"> · {{ post.category.name }}</span>
              <span v-if="post.tags.length > 0"> · {{ post.tags.map((tag) => tag.name).join('、') }}</span>
              <span> · 预计阅读 <span class="kinetic-number">{{ displayMinutes }}</span> 分钟</span>
            </p>
          </header>

          <!-- renderMarkdown 输出已安全转义 -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div ref="contentEl" v-reveal="2" class="post-content" v-html="renderedContent"></div>

          <!-- 上下篇导航 -->
          <nav
            v-if="post.prev || post.next"
            v-reveal="3"
            class="post-neighbors"
            aria-label="上下篇"
          >
            <RouterLink
              v-if="post.prev"
              :to="`/posts/${post.prev.id}`"
              class="neighbor neighbor-prev"
            >
              <span class="neighbor-dir">PREVIOUS</span>
              <span class="neighbor-title">← {{ post.prev.title }}</span>
            </RouterLink>
            <span v-else aria-hidden="true"></span>

            <RouterLink
              v-if="post.next"
              :to="`/posts/${post.next.id}`"
              class="neighbor neighbor-next"
            >
              <span class="neighbor-dir">NEXT</span>
              <span class="neighbor-title">{{ post.next.title }} →</span>
            </RouterLink>
          </nav>

          <p class="back-link">
            <RouterLink to="/posts">← 返回文章列表</RouterLink>
          </p>
        </main>
      </div>
    </template>
  </article>
</template>

<style scoped>
.article-page {
  position: relative;
  width: 100%;
  max-width: 78rem;
  margin-inline: 0;
}

/* 顶部滚动进度条 */
.read-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-high));
  transform-origin: left;
  z-index: var(--z-toast);
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    .read-progress {
      animation: read-progress linear both;
      animation-timeline: scroll(root);
    }
  }
}

@keyframes read-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.state-box {
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.state-spinner {
  width: 24px;
  height: 24px;
  margin: 0 auto var(--space-xs);
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-pill);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: var(--space-3xs) var(--space-md);
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
}

/* 双栏协同先锋布局 */
.reader-shell {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  gap: clamp(2rem, 3.5vw, 3.5rem);
  align-items: start;
}

.reader-rail {
  position: relative;
}

.rail-sticky {
  position: sticky;
  top: calc(var(--space-3xl) + var(--space-md));
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.rail-back {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  transition: color var(--dur-fast) ease;
}

.rail-back:hover {
  color: var(--color-accent);
}

.reading-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.meta-kicker {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: var(--color-text-dim);
}

.meta-time {
  color: var(--color-accent);
}

.toc {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding-top: var(--space-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.toc-title {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-dim);
}

.toc ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc li {
  font-size: 0.82rem;
  line-height: 1.4;
}

.toc li.level-3 {
  padding-left: var(--space-2xs);
}

.toc li.level-4 {
  padding-left: var(--space-sm);
}

.toc a {
  color: var(--color-text-muted);
  transition: color var(--dur-fast) ease;
}

.toc a:hover,
.toc a.active {
  color: var(--color-accent);
}

/* 正文主轴 */
.reader-main {
  width: 100%;
  max-width: 52rem;
  min-width: 0;
}

.post-header {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.header-tags {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-bottom: var(--space-2xs);
}

.cat-badge {
  padding: 2px var(--space-2xs);
  border-radius: var(--radius-xs);
  background: var(--color-accent-glow);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
}

.tag-badge {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}

.post-title {
  margin: 0 0 var(--space-2xs);
  font-size: clamp(2rem, 3.8vw, 2.85rem);
  line-height: 1.25;
}

.post-meta {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}

/* Markdown 排版深度样式 */
.post-content {
  font-size: 1.05rem;
  line-height: 1.85;
  color: var(--color-text);
  word-break: break-word;
}

:deep(.post-content h2) {
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-3xs);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  letter-spacing: 0.01em;
}

:deep(.post-content h3) {
  margin-top: var(--space-xl);
  margin-bottom: var(--space-2xs);
  font-size: clamp(1.2rem, 1.8vw, 1.45rem);
}

:deep(.post-content h4) {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-3xs);
  font-size: 1.15rem;
}

:deep(.post-content p) {
  margin-bottom: var(--space-md);
}

:deep(.post-content blockquote) {
  margin: var(--space-lg) 0;
  padding: var(--space-sm) var(--space-md);
  border-left: 3px solid var(--color-accent);
  background: var(--color-surface);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
  color: var(--color-text-muted);
}

:deep(.post-content pre) {
  margin: var(--space-lg) 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow-x: auto;
}

:deep(.post-content code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
}

:deep(.post-content pre code) {
  font-size: 0.9em;
  line-height: 1.65;
}

:deep(.post-content ul),
:deep(.post-content ol) {
  margin-bottom: var(--space-md);
  padding-left: var(--space-lg);
}

:deep(.post-content li) {
  margin-bottom: var(--space-2xs);
  line-height: 1.8;
}

:deep(.post-content table) {
  width: 100%;
  margin: var(--space-lg) 0;
  border-collapse: collapse;
}

:deep(.post-content th),
:deep(.post-content td) {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
}

:deep(.post-content th) {
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

:deep(.post-content img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

/* 上下篇导航 */
.post-neighbors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-2xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.neighbor {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  padding: var(--space-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: all var(--dur-fast) ease;
}

.neighbor:hover {
  border-color: var(--color-accent);
  box-shadow: 0 4px 16px var(--color-accent-glow);
}

.neighbor-dir {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: var(--color-text-dim);
}

.neighbor-title {
  color: var(--color-text);
  font-size: 0.9rem;
}

.back-link {
  margin-top: var(--space-xl);
  font-size: 0.88rem;
}

@media (max-width: 900px) {
  .article-page {
    max-width: 100%;
  }

  .reader-shell {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .reader-rail {
    display: none;
  }

  .reader-main {
    max-width: 100%;
  }

  .post-neighbors {
    grid-template-columns: 1fr;
  }
}
</style>
