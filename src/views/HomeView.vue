<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section>
    <h1>SakiBlog</h1>
    <p class="lead">一个用于学习前后端分离全栈工程的全栈练习项目。</p>
    <p>
      前端骨架已经就绪，但文章数据尚未接入，因此首页暂时不会展示最新文章列表
      （待实现：SRS FR-HOME-002）。
    </p>
    <RouterLink class="cta" to="/posts">浏览全部文章</RouterLink>
  </section>
</template>

<style scoped>
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
</style>