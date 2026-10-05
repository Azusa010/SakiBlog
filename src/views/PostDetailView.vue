<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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

// 给实际渲染出的标题写上与目录一致的锚点 id
watch(renderedContent, async () => {
  await nextTick()
  contentEl.value
    ?.querySelectorAll('h2, h3, h4')
    .forEach((el, index) => el.setAttribute('id', `heading-${index}`))
})

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
            <a :href="`#${heading.id}`" @click.prevent="scrollToHeading(heading.id)">
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
        <RouterLink v-if="post.prev" :to="`/posts/${post.prev.id}`" class="neighbor">
          ← {{ post.prev.title }}
        </RouterLink>
        <span v-else aria-hidden="true"></span>
        <RouterLink v-if="post.next" :to="`/posts/${post.next.id}`" class="neighbor">
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
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  background: var(--color-surface);
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
  text-decoration: none;
}

.toc a:hover {
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
