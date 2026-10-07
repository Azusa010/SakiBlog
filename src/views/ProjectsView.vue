<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CATEGORY_LABELS,
  PROJECTS_DATA,
  type ProjectCategory,
  type ProjectItem,
} from '@/data/projects'
import { useTerminalStore } from '@/stores/terminal'

const terminal = useTerminalStore()
const activeCategory = ref<ProjectCategory>('all')

const categories: ProjectCategory[] = ['all', 'fullstack', 'creative', 'tool']

const filteredProjects = computed<ProjectItem[]>(() => {
  if (activeCategory.value === 'all') {
    return PROJECTS_DATA
  }
  return PROJECTS_DATA.filter((p) => p.category === activeCategory.value)
})

function countByCategory(cat: ProjectCategory): number {
  if (cat === 'all') return PROJECTS_DATA.length
  return PROJECTS_DATA.filter((p) => p.category === cat).length
}

function openUrl(url?: string) {
  if (!url) return
  if (url.startsWith('http')) {
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    window.location.href = url
  }
}
</script>

<template>
  <div class="projects-view">
    <!-- 页面标题与终端定位 -->
    <header class="page-head" v-reveal="0">
      <div class="terminal-meta">
        <span class="badge">[PORTFOLIO · DIRECTORY STREAM]</span>
        <span class="path">~/projects/index.ts</span>
      </div>
      <h1 class="page-title">作品集与工坊</h1>
      <p class="page-subtitle">
        在全栈工程闭环与先锋界面美学之间雕琢的数字产物。抛弃厚重卡片，以纯粹终端文件流直观呈现。
      </p>
    </header>

    <!-- 终端工坊总控台: 无卡片化流式文件树 -->
    <div class="projects-stream-container" v-reveal="1">
      <!-- 状态与筛选工具栏 -->
      <div class="stream-toolbar">
        <div class="filter-pills" role="tablist" aria-label="作品分类筛选">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            role="tab"
            class="filter-pill"
            :class="{ active: activeCategory === cat }"
            :aria-selected="activeCategory === cat"
            @click="activeCategory = cat"
          >
            <span>{{ CATEGORY_LABELS[cat] }}</span>
            <span class="cat-count">({{ countByCategory(cat) }})</span>
          </button>
        </div>

        <div class="toolbar-telemetry">
          <span class="telemetry-tag">BUFFER: {{ activeCategory.toUpperCase() }}</span>
          <span class="telemetry-count">({{ filteredProjects.length }} / {{ PROJECTS_DATA.length }} MODULES)</span>
        </div>
      </div>

      <!-- 作品流式表单 (DIRECTORY STREAM - 彻底无卡片) -->
      <section class="projects-stream" aria-label="全部作品">
        <div
          v-for="(project, index) in filteredProjects"
          :key="project.id"
          class="project-stream-item"
          v-reveal="index"
          tabindex="0"
          @keydown.enter="openUrl(project.demoUrl)"
        >
          <div class="item-header-row">
            <div class="item-id-cluster">
              <span class="item-perm" aria-hidden="true">drwxr-xr-x</span>
              <span class="item-no">[{{ String(index + 1).padStart(2, '0') }}]</span>
              <h2 class="item-title">{{ project.title }}</h2>
              <span class="item-badge" :class="project.category">{{ project.category.toUpperCase() }}</span>
            </div>

            <div class="item-meta-cluster">
              <span class="item-status">{{ project.statusLabel }}</span>
              <span class="item-year">{{ project.year }}</span>
            </div>
          </div>

          <div class="item-body-row">
            <p class="item-subtitle">{{ project.subtitle }}</p>
            <p class="item-desc">{{ project.description }}</p>
          </div>

          <div class="item-footer-row">
            <div class="tags-cluster">
              <span v-for="tag in project.tags" :key="tag" class="stream-tag">
                {{ tag }}
              </span>
            </div>

            <div class="action-links">
              <a
                v-if="project.demoUrl"
                :href="project.demoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="stream-action-link primary"
              >
                <span>体验演示</span>
                <span class="arrow" aria-hidden="true">↗</span>
              </a>

              <a
                v-if="project.githubUrl"
                :href="project.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="stream-action-link"
              >
                <span>源码仓</span>
                <span class="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 底部终端联动彩蛋与引导 -->
    <footer class="projects-footer" v-reveal="filteredProjects.length">
      <div class="cli-easter-egg">
        <div class="cli-lead">
          <span class="cli-icon" aria-hidden="true">&gt;_</span>
          <span>CLI SPEEDRUN</span>
        </div>
        <p class="cli-text">
          喜欢纯键盘极客交互？按下 <kbd class="kbd-key">Ctrl+K</kbd> 唤出禅意终端，输入 <code class="cli-code">projects</code> 快速穿梭。
        </p>
        <button
          type="button"
          class="btn-open-terminal"
          @click="terminal.open()"
        >
          即刻体验终端 &gt;_
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.projects-view {
  position: relative;
  max-width: var(--content-wide);
  margin-inline: 0;
  padding-bottom: var(--space-2xl);
}

.page-head {
  position: relative;
  z-index: 1;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .page-head {
  border-bottom-color: rgba(18, 26, 40, 0.08);
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
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin: var(--space-2xs) 0 0;
  color: var(--color-text-muted);
  font-size: 1.05rem;
  max-width: 54ch;
  line-height: 1.6;
}

/* 筛选工具栏: 极简纯净 */
.stream-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

:root[data-theme='light'] .filter-pill {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.1);
  color: #475569;
}

.filter-pill:hover {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.filter-pill.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-ink);
  font-weight: 600;
}

.cat-count {
  font-size: 0.72rem;
  opacity: 0.85;
}

.toolbar-telemetry {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--color-text-dim);
}

.telemetry-tag {
  color: var(--color-code-cyan);
}

/* 彻底摒弃卡片化的目录流式布局 */
.projects-stream {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .projects-stream {
  border-top-color: rgba(18, 26, 40, 0.08);
}

.project-stream-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color var(--dur-fast) ease;
}

:root[data-theme='light'] .project-stream-item {
  border-bottom-color: rgba(18, 26, 40, 0.06);
}

.project-stream-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

:root[data-theme='light'] .project-stream-item:hover {
  background: rgba(18, 26, 40, 0.025);
}

.item-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.item-id-cluster {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.item-perm {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--color-text-dim);
  letter-spacing: 0.06em;
}

.project-stream-item:hover .item-perm {
  color: #a3be8c;
}

.item-no {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-accent);
  font-weight: 600;
}

.item-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.item-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-muted);
}

.item-meta-cluster {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-dim);
}

.item-status {
  color: var(--color-code-cyan);
}

.item-body-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 2px;
}

.item-subtitle {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-accent);
}

.item-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 72ch;
}

.item-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  flex-wrap: wrap;
  gap: 12px;
}

.tags-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.stream-tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
}

:root[data-theme='light'] .stream-tag {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.08);
  color: #475569;
}

.action-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stream-action-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-decoration: none;
  color: var(--color-text-muted);
  transition: color var(--dur-fast) ease;
}

.stream-action-link:hover {
  color: var(--color-text);
}

.stream-action-link.primary {
  color: var(--color-accent);
  font-weight: 500;
}

.stream-action-link.primary:hover {
  color: var(--color-accent-high);
}

.arrow {
  transition: transform var(--dur-fast) ease;
}

.stream-action-link:hover .arrow {
  transform: translate(2px, -2px);
}

/* 底部 CLI 引导 */
.projects-footer {
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

:root[data-theme='light'] .projects-footer {
  border-top-color: rgba(18, 26, 40, 0.1);
}

.cli-easter-egg {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 16px 20px;
  border-left: 2px solid var(--color-accent);
  background: rgba(255, 255, 255, 0.02);
}

:root[data-theme='light'] .cli-easter-egg {
  background: rgba(18, 26, 40, 0.02);
}

.cli-lead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent);
  letter-spacing: 0.12em;
}

.cli-icon {
  font-weight: 800;
}

.cli-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  flex: 1;
}

.kbd-key {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text);
}

.cli-code {
  font-family: var(--font-mono);
  color: var(--color-code-cyan);
  background: rgba(143, 188, 187, 0.12);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.btn-open-terminal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: var(--radius-xs);
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.btn-open-terminal:hover {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

@media (max-width: 768px) {
  .item-perm {
    display: none;
  }

  .item-meta-cluster {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
