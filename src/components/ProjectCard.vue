<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ProjectItem } from '@/data/projects'
import { useTerminalStore } from '@/stores/terminal'

const props = defineProps<{
  project: ProjectItem
  featuredMode?: boolean
}>()

const terminal = useTerminalStore()

const isExternalDemo = computed(() => {
  if (!props.project.demoUrl) return false
  return props.project.demoUrl.startsWith('http')
})

function handleDemoClick(event: MouseEvent) {
  if (props.project.id === 'zen-cli-runtime') {
    event.preventDefault()
    terminal.open()
  }
}
</script>

<template>
  <article
    class="project-card"
    :class="{ 'is-featured': featuredMode }"
    v-spotlight
  >
    <!-- 头部元信息栏 -->
    <header class="card-meta">
      <div class="meta-left">
        <span class="project-year">{{ project.year }}</span>
        <span class="meta-sep" aria-hidden="true">/</span>
        <span class="project-category">{{ project.category.toUpperCase() }}</span>
      </div>
      <div class="status-badge" :data-status="project.status">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="status-text">{{ project.statusLabel }}</span>
      </div>
    </header>

    <!-- 主体内容 -->
    <div class="card-body">
      <h3 class="project-title">{{ project.title }}</h3>
      <p class="project-subtitle">{{ project.subtitle }}</p>
      <p class="project-desc">{{ project.description }}</p>

      <!-- 核心亮点清单 -->
      <ul v-if="project.highlights && project.highlights.length > 0" class="highlights-list">
        <li v-for="(highlight, i) in project.highlights" :key="i" class="highlight-item">
          <svg class="item-icon" viewBox="0 0 16 16" aria-hidden="true">
            <polyline points="3 8 7 12 13 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ highlight }}</span>
        </li>
      </ul>

      <!-- 技术栈胶囊 -->
      <div class="tech-tags" aria-label="技术栈">
        <span v-for="tag in project.tags" :key="tag" class="tech-tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 底部操作与指标 -->
    <footer class="card-foot">
      <div v-if="project.metrics" class="metrics-info">
        <span class="metrics-label">[STAT]</span>
        <span class="metrics-val">{{ project.metrics }}</span>
      </div>

      <div class="card-actions">
        <!-- 演示/运行入口 -->
        <a
          v-if="project.demoUrl && isExternalDemo"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-action primary"
          aria-label="查看在线演示"
        >
          <span>在线体验</span>
          <svg class="action-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 3h8v8M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
        <a
          v-else-if="project.id === 'zen-cli-runtime'"
          href="#open-terminal"
          class="btn-action primary"
          @click="handleDemoClick"
        >
          <span>呼出终端 &gt;_</span>
        </a>
        <RouterLink
          v-else-if="project.demoUrl"
          :to="project.demoUrl"
          class="btn-action primary"
        >
          <span>浏览站点</span>
        </RouterLink>

        <!-- GitHub 仓库 -->
        <a
          v-if="project.githubUrl"
          :href="project.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-action secondary"
          aria-label="查看开源仓库"
        >
          <svg class="action-icon github-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>源码</span>
        </a>

        <!-- 关联文章 -->
        <RouterLink
          v-if="project.articleUrl"
          :to="project.articleUrl"
          class="btn-action text-btn"
        >
          <span>设计复盘 →</span>
        </RouterLink>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--color-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 16px 36px rgba(0, 0, 0, 0.32);
  transition:
    transform var(--dur-fast) var(--ease-snappy, cubic-bezier(0.23, 1, 0.32, 1)),
    border-color var(--dur-fast) ease,
    box-shadow var(--dur-fast) ease;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-border-glow);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 24px 48px rgba(0, 0, 0, 0.42),
    0 0 32px var(--color-accent-glow);
}

.project-card:active {
  transform: scale(0.99) translateY(-2px);
}

.project-card.is-featured {
  border-left: 3px solid var(--color-accent);
}

/* 顶部元信息 */
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-text-dim);
}

.project-year {
  color: var(--color-accent);
}

.project-category {
  color: var(--color-code-cyan);
  letter-spacing: 0.08em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-dim);
}

.status-badge[data-status='active'] .status-dot {
  background: #a3be8c;
  box-shadow: 0 0 8px #a3be8c;
}

.status-badge[data-status='completed'] .status-dot {
  background: #88c0d0;
}

.status-badge[data-status='wip'] .status-dot {
  background: #ebcb8b;
}

/* 内容主体 */
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-title {
  margin: 0;
  font-size: 1.45rem;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.project-subtitle {
  margin: var(--space-3xs) 0 var(--space-sm);
  font-size: 0.92rem;
  color: var(--color-accent);
  font-weight: 500;
}

.project-desc {
  margin: 0 0 var(--space-md);
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-text-muted);
}

/* 核心亮点 */
.highlights-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.item-icon {
  width: 14px;
  height: 14px;
  margin-top: 3px;
  color: var(--color-code-cyan);
  flex-shrink: 0;
}

/* 标签组 */
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  margin-bottom: var(--space-md);
}

.tech-tag {
  display: inline-block;
  padding: 3px 9px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-muted);
  transition: border-color var(--dur-fast) ease;
}

.tech-tag:hover {
  border-color: var(--color-accent);
  color: var(--color-text);
}

/* 底部操作 */
.card-foot {
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.metrics-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-dim);
}

.metrics-label {
  color: var(--color-code-blue);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-family: var(--font-mono);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.btn-action.primary {
  background: var(--color-accent);
  color: var(--color-accent-ink);
  font-weight: 600;
}

.btn-action.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-action.secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-action.secondary:hover {
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.1);
}

.btn-action.text-btn {
  background: transparent;
  color: var(--color-accent);
  padding-inline: 4px;
}

.btn-action.text-btn:hover {
  text-decoration: underline;
}

.action-icon {
  width: 13px;
  height: 13px;
}

.github-icon {
  width: 14px;
  height: 14px;
}
</style>
