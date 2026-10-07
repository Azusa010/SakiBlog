<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTerminalStore } from '@/stores/terminal'

const terminal = useTerminalStore()

const milestones = [
  {
    period: '2026 · NOW',
    title: 'SakiBlog 全栈工坊与先锋数字花园',
    desc: '重构打造集个人主页、作品集展示、技术博客与禅意终端于一体的数字资产；融合 Three.js WebGL 与 FastAPI 全流程自动化守护。',
  },
  {
    period: '2025 · EXPLORATION',
    title: '全栈工程化闭环与深度微服务实践',
    desc: '深耕 Python/FastAPI 与 Vue 3/TypeScript 现代工程流，注重严格的测试金字塔与类型安全体系。',
  },
  {
    period: '2024 · GENESIS',
    title: '界面美学与极客工具探索',
    desc: '从命令行工具、Linux 极客环境到现代 Web 先锋动效与无障碍设计的全方位探索。',
  },
]

const skillGroups = [
  {
    category: 'FRONTEND · 客户端与创意交互',
    items: ['Vue 3 (Composition API)', 'TypeScript', 'Three.js / WebGL', 'Vite', 'Pinia', 'Modern CSS / View Transitions'],
  },
  {
    category: 'BACKEND · 服务端与数据底座',
    items: ['Python 3.13', 'FastAPI', 'SQLAlchemy 2.0', 'MySQL 8 (utf8mb4)', 'RESTful APIs', 'JWT & Session Security'],
  },
  {
    category: 'ENGINEERING · 质量守卫与工具链',
    items: ['Vitest / Pytest', 'Playwright E2E', 'oxlint / ESLint 9', 'Git / CI Pipelines', 'Bash / Linux CLI'],
  },
]
</script>

<template>
  <div class="about-page">
    <div class="page-head" v-reveal="0">
      <div class="terminal-meta">
        <span class="badge">[SYSTEM · PROFILE]</span>
        <span class="path">~/about/identity.md</span>
      </div>
      <h1 class="page-title">关于与工坊</h1>
      <p class="page-subtitle">写在山峦与代码边缘的个人档案与探索志。摒弃卡片堆砌，以纯净文档流展开。</p>
    </div>

    <!-- 禅意终端文档视窗 (无嵌套卡片，纯粹流式 Buffer) -->
    <div class="zen-document-buffer" v-reveal="1">
      <div class="buffer-head">
        <div class="traffic-lights" aria-hidden="true">
          <span class="dot red" @click="terminal.open()"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="head-prompt">
          <span class="cli-user">saki@sakiblog</span>:<span class="cli-dir">~</span>$
          <span class="cli-cmd">cat about.md --view=stream</span>
        </div>
        <span class="status-pill">STATUS: CRAFTING · GEO: 25.69°N</span>
      </div>

      <div class="buffer-body">
        <!-- 01: 个人写照与定位 (STREAM SECTION) -->
        <section class="manifesto-section" v-reveal="0">
          <div class="section-meta-row">
            <span class="sec-prompt">01 //</span>
            <span class="sec-kicker">IDENTITY &amp; CREED</span>
            <span class="sec-file">~/.identity</span>
          </div>

          <h2 class="sec-heading">关于我 · Saki</h2>

          <p class="sec-prose">
            你好，我是 <strong>Saki</strong>，一名穿行在<strong>前后端分离全栈工程化</strong>与<strong>先锋交互设计</strong>之间的独立开发者与技术创作者。
          </p>

          <p class="sec-prose secondary">
            热衷于用代码构筑稳健、清晰的系统骨架，用排版、光影与触觉微动效雕琢有呼吸感的数字场景。坚信“在代码中寻求秩序，在文字里安放诗意”，在山峦与夜色间保持对创造的热忱。
          </p>

          <div class="identity-badges">
            <span class="identity-badge">Full-Stack Software Engineer</span>
            <span class="identity-badge">Creative Technologist</span>
            <span class="identity-badge">Open Source Explorer</span>
          </div>
        </section>

        <!-- 02: 技术掌握与能力图谱 (STREAM SECTION) -->
        <section class="manifesto-section" v-reveal="1">
          <div class="section-meta-row">
            <span class="sec-prompt">02 //</span>
            <span class="sec-kicker">CRAFTSMANSHIP &amp; SKILLS</span>
            <span class="sec-file">~/.skills.json</span>
          </div>

          <h2 class="sec-heading">技术栈与设计底盘</h2>

          <p class="sec-prose secondary">
            坚持“不牺牲可用性的创意表现”，注重类型安全、高覆盖测试防护与亚毫秒级渲染：
          </p>

          <div class="skill-stream">
            <div v-for="group in skillGroups" :key="group.category" class="skill-row">
              <span class="group-category">{{ group.category }}</span>
              <div class="tags-cluster">
                <span v-for="item in group.items" :key="item" class="skill-tag">
                  {{ item }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 03: 历程里程碑 (STREAM SECTION) -->
        <section class="manifesto-section" v-reveal="2">
          <div class="section-meta-row">
            <span class="sec-prompt">03 //</span>
            <span class="sec-kicker">CHRONICLES &amp; MILESTONES</span>
            <span class="sec-file">~/.timeline.log</span>
          </div>

          <h2 class="sec-heading">历程与航迹</h2>

          <div class="timeline-stream">
            <div v-for="(m, i) in milestones" :key="i" class="timeline-row">
              <div class="timeline-period">{{ m.period }}</div>
              <div class="timeline-detail">
                <h3 class="timeline-title">{{ m.title }}</h3>
                <p class="timeline-desc">{{ m.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 04: 连结与回响 (STREAM SECTION) -->
        <section class="manifesto-section connect-section" v-reveal="3">
          <div class="section-meta-row">
            <span class="sec-prompt">04 //</span>
            <span class="sec-kicker">ECHO &amp; DIALOGUE</span>
            <span class="sec-file">~/.contact</span>
          </div>

          <h2 class="sec-heading">交流与交谈</h2>

          <p class="sec-prose">
            无论你对全栈架构、WebGL 创意交互感兴趣，还是有优质项目合作想法，都随时欢迎交流：
          </p>

          <div class="channels-stream">
            <a
              href="https://github.com/Azusa010/SakiBlog"
              target="_blank"
              rel="noopener noreferrer"
              class="channel-stream-row"
            >
              <span class="ch-label">GITHUB</span>
              <span class="ch-val">@Azusa010</span>
              <span class="ch-arrow" aria-hidden="true">↗</span>
            </a>

            <RouterLink to="/projects" class="channel-stream-row">
              <span class="ch-label">PORTFOLIO</span>
              <span class="ch-val">浏览作品矩阵</span>
              <span class="ch-arrow" aria-hidden="true">→</span>
            </RouterLink>

            <RouterLink to="/posts" class="channel-stream-row">
              <span class="ch-label">WRITINGS</span>
              <span class="ch-val">阅读博客文章</span>
              <span class="ch-arrow" aria-hidden="true">→</span>
            </RouterLink>

            <div
              class="channel-stream-row interactive"
              role="button"
              tabindex="0"
              @click="terminal.open()"
              @keydown.enter="terminal.open()"
            >
              <span class="ch-label">ZEN CLI</span>
              <span class="ch-val">输入 contact / help</span>
              <span class="ch-arrow" aria-hidden="true">&gt;_</span>
            </div>
          </div>

          <div class="buffer-foot">
            <span class="sign-text">散落于苍山夜色间的记录 · Saki</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
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
  font-size: clamp(2rem, 3.8vw, 2.75rem);
  font-family: var(--font-display);
}

.page-subtitle {
  margin: var(--space-2xs) 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  max-width: 54ch;
  line-height: 1.6;
}

/* 禅意终端文档 Buffer (彻底摒弃卡片，统一流式排版) */
.zen-document-buffer {
  position: relative;
  z-index: 1;
  background: var(--color-surface);
  backdrop-filter: var(--backdrop-blur-heavy);
  -webkit-backdrop-filter: var(--backdrop-blur-heavy);
  border: 1px solid rgba(116, 198, 157, 0.16);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 24px 54px rgba(0, 0, 0, 0.42);
  overflow: hidden;
}

:root[data-theme='light'] .zen-document-buffer {
  border-color: rgba(45, 106, 79, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 20px 48px rgba(45, 106, 79, 0.08);
}

.buffer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(9, 17, 13, 0.65);
  border-bottom: 1px solid rgba(116, 198, 157, 0.1);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--color-text-dim);
  user-select: none;
  flex-wrap: wrap;
  gap: 10px;
}

:root[data-theme='light'] .buffer-head {
  background: rgba(235, 242, 237, 0.75);
  border-bottom-color: rgba(45, 106, 79, 0.1);
}

.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
}

.traffic-lights .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: pointer;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.head-prompt {
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.04em;
}

.cli-user { color: #a3be8c; }
.cli-dir { color: #81a1c1; }
.cli-cmd { color: var(--color-text); }

.status-pill {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.buffer-body {
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
}

/* 流式段落区: 纯粹排版，无卡片框 */
.manifesto-section {
  padding-block: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:root[data-theme='light'] .manifesto-section {
  border-bottom-color: rgba(18, 26, 40, 0.06);
}

.manifesto-section:last-of-type {
  border-bottom: none;
}

.section-meta-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
}

.sec-prompt {
  color: var(--color-accent);
  font-weight: 600;
}

.sec-kicker {
  letter-spacing: 0.14em;
  color: var(--color-accent);
  font-weight: 500;
}

.sec-file {
  color: var(--color-code-cyan);
  margin-left: 6px;
}

.sec-heading {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.sec-prose {
  margin: 0;
  font-size: 0.96rem;
  line-height: 1.75;
  color: var(--color-text);
  max-width: 68ch;
}

.sec-prose.secondary {
  color: var(--color-text-muted);
}

.identity-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.identity-badge {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  padding: 4px 12px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-muted);
}

:root[data-theme='light'] .identity-badge {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.1);
  color: #334155;
}

/* 技能流 */
.skill-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}

.skill-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-category {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--color-accent);
  letter-spacing: 0.08em;
  font-weight: 500;
}

.tags-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text);
}

:root[data-theme='light'] .skill-tag {
  background: rgba(18, 26, 40, 0.04);
  border-color: rgba(18, 26, 40, 0.08);
  color: #1e293b;
}

/* 时间轴流 */
.timeline-stream {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
  border-left: 1px dashed rgba(255, 255, 255, 0.14);
  padding-left: 20px;
}

:root[data-theme='light'] .timeline-stream {
  border-left-color: rgba(18, 26, 40, 0.14);
}

.timeline-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-period {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  font-weight: 600;
}

.timeline-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}

.timeline-desc {
  margin: 2px 0 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 64ch;
}

/* 联系通道流 */
.channels-stream {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.channel-stream-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  color: inherit;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  transition: all var(--dur-fast) ease;
}

:root[data-theme='light'] .channel-stream-row {
  background: rgba(18, 26, 40, 0.03);
  border-color: rgba(18, 26, 40, 0.08);
}

.channel-stream-row:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--color-accent);
  transform: translateX(2px);
}

.ch-label {
  color: var(--color-accent);
  font-weight: 500;
}

.ch-val {
  color: var(--color-text-muted);
}

.ch-arrow {
  color: var(--color-text-dim);
}

.channel-stream-row.interactive {
  cursor: pointer;
}

.buffer-foot {
  margin-top: var(--space-xl);
  padding-top: var(--space-md);
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-text-dim);
  text-align: right;
}

@media (max-width: 768px) {
  .buffer-body {
    padding: 20px 16px;
  }

  .channels-stream {
    grid-template-columns: 1fr;
  }
}
</style>
