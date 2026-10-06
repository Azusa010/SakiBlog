<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchCategories, type CategoryWithCount } from '@/api/posts'

/** 分类集合页(SRS FR-CATEGORY-001):展示全部有公开文章的分类及其文章数量。 */
const categories = ref<CategoryWithCount[]>([])
const status = ref<'loading' | 'ready' | 'error'>('loading')

async function load() {
  status.value = 'loading'
  try {
    categories.value = await fetchCategories()
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h1>分类</h1>

    <p v-if="status === 'loading'">加载中…</p>

    <div v-else-if="status === 'error'" class="state-box">
      <p>分类加载失败,请稍后重试。</p>
      <button type="button" @click="load">重试</button>
    </div>

    <p v-else-if="categories.length === 0" class="state-box">还没有任何分类。</p>

    <ul v-else class="taxonomy-list">
      <li v-for="(category, index) in categories" :key="category.id" v-reveal="index">
        <RouterLink :to="`/categories/${category.id}`">{{ category.name }}</RouterLink>
        <span class="count">{{ category.article_count }} 篇</span>
      </li>
    </ul>
  </section>
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

.taxonomy-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.taxonomy-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.taxonomy-list a {
  font-size: 1.05rem;
}

.count {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
