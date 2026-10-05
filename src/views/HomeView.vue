<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchPosts, type PostSummary } from '@/api/posts'
import PostCard from '@/components/PostCard.vue'

/**
 * 首页(SRS FR-HOME-001 ~ FR-HOME-004):
 * 博客简介 + 最新发布的文章(最新 5 篇,按发布时间从新到旧)。
 */
const posts = ref<PostSummary[]>([])
const state = ref<'loading' | 'ready' | 'error'>('loading')

async function load() {
  state.value = 'loading'
  try {
    posts.value = (await fetchPosts(1, 5)).items
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="hero-title" aria-label="SakiBlog">
      <span
        v-for="(char, index) in 'SakiBlog'"
        :key="index"
        aria-hidden="true"
        class="char"
        :style="{ '--char-index': index }"
        >{{ char }}</span
      >
    </h1>
    <p v-reveal="4" class="lead">一个用于学习前后端分离全栈工程的全栈练习项目。</p>
    <RouterLink v-reveal="5" class="cta" to="/posts">浏览全部文章</RouterLink>

    <section v-if="state !== 'loading'" v-reveal="6" class="latest" aria-label="最新文章">
      <h2>最新文章</h2>

      <p v-if="state === 'error'" class="state-note">
        最新文章加载失败,<button type="button" class="retry" @click="load">重试</button>
      </p>
      <p v-else-if="posts.length === 0" class="state-note">还没有已发布的文章,敬请期待。</p>
      <PostCard v-for="(post, index) in posts" :key="post.id" :post="post" :index="index" />
    </section>
  </section>
</template>

<style scoped>
.hero-title {
  overflow: hidden;
}

.hero-title .char {
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-title .char {
    animation: char-in 0.55s var(--ease-out) both;
    animation-delay: calc(var(--char-index) * 45ms);
  }
}

@keyframes char-in {
  from {
    opacity: 0;
    transform: translateY(0.5em);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.lead {
  color: var(--color-text-muted);
  font-size: 1.05rem;
}

.cta {
  display: inline-block;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  text-decoration: none;
}

.cta:hover {
  border-color: var(--color-accent);
}

.latest {
  margin-top: var(--space-12);
}

.latest h2 {
  font-size: 1.25rem;
}

.state-note {
  color: var(--color-text-muted);
}

.retry {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-accent);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-size: 1rem;
}
</style>
