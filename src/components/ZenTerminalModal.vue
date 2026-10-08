<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchCategories,
  fetchPost,
  fetchPosts,
  fetchSearch,
  fetchTags,
  type PostSummary,
} from '@/api/posts'
import { useTerminalStore } from '@/stores/terminal'
import { useAudioStore } from '@/stores/audio'
import { currentTheme, saveTheme, type Theme } from '@/theme'
import { PROJECTS_DATA } from '@/data/projects'

interface TerminalItem {
  id: number
  title: string
  subtitle?: string
  path: string
}

interface OutputBlock {
  id: number
  promptDir?: string
  command?: string
  type: 'banner' | 'system' | 'output' | 'error' | 'success' | 'table'
  tag?: string
  tagType?: 'system' | 'info' | 'motto' | 'author' | 'error' | 'success'
  text?: string
  lines?: string[]
  items?: TerminalItem[]
}

const terminal = useTerminalStore()
const audioStore = useAudioStore()
const router = useRouter()

const inputQuery = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const logContainerEl = ref<HTMLElement | null>(null)

let nextBlockId = 1
const blocks = ref<OutputBlock[]>([])
const history = ref<string[]>([])
const historyIndex = ref<number>(-1)
const isBusy = ref(false)

const COMMANDS = [
  'help',
  'projects',
  'portfolio',
  'ls',
  'posts',
  'cat',
  'grep',
  'find',
  'tags',
  'categories',
  'goto',
  'cd',
  'skills',
  'contact',
  'theme',
  'whoami',
  'clear',
  'music',
  'exit',
]

function addBlock(block: Omit<OutputBlock, 'id'>) {
  blocks.value.push({ ...block, id: nextBlockId++ })
  scrollToBottom()
}

function scrollToBottom() {
  void nextTick(() => {
    if (logContainerEl.value) {
      logContainerEl.value.scrollTop = logContainerEl.value.scrollHeight
    }
  })
}

function resetBanner() {
  blocks.value = [
    {
      id: nextBlockId++,
      type: 'banner',
    },
  ]
}

resetBanner()

async function handleCommand(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return

  history.value.push(trimmed)
  historyIndex.value = -1

  const [cmd, ...args] = trimmed.split(/\s+/)
  const command = (cmd ?? '').toLowerCase()
  const argStr = args.join(' ')

  addBlock({
    type: 'system',
    promptDir: '~/peaceful-mind',
    command: trimmed,
  })

  switch (command) {
    case 'help':
    case '?':
      addBlock({
        type: 'output',
        tag: '[help]',
        tagType: 'system',
        lines: [
          'AVAILABLE COMMANDS: (常用指令集)',
          '  projects / p        列出精选作品集矩阵 (点击直达/体验)',
          '  ls / posts          列出最近发布的文章卷轴 (点击即阅)',
          '  cat <id|about.md>   在终端快速预览指定文章或个人名片 (例: cat 1, cat about.md)',
          '  grep / find <词>    穿透检索全站文章 (例: grep fastapi)',
          '  tags                展示全站思考标签云与篇数',
          '  categories          展示全域分类目录与篇数',
          '  goto / cd <页面>    快速穿梭路由 (home, projects, posts, categories, tags, about)',
          '  skills              展示个人全栈技术栈与能力图谱',
          '  contact             获取开发者公开联络通道',
          '  theme [light|dark]  切换或查看当前界面主题 (light, dark, toggle)',
          '  music [subcmd]      终端音乐播放器 (play, pause, next, prev, vol <0-100>)',
          '  whoami              打印当前终端访客权限与身份',
          '  clear               清空屏幕并重置回初始视窗',
          '  exit / quit         退出终端控制台 (快捷键: ESC)',
        ],
      })
      break

    case 'music': {
      const sub = args[0]?.toLowerCase()
      if (sub === 'play') {
        audioStore.play()
        addBlock({ type: 'output', tag: '[music]', tagType: 'success', text: `▶️ 正在播放: ${audioStore.currentTrack.title}` })
      } else if (sub === 'pause') {
        audioStore.pause()
        addBlock({ type: 'output', tag: '[music]', tagType: 'info', text: `⏸️ 已暂停: ${audioStore.currentTrack.title}` })
      } else if (sub === 'next') {
        audioStore.next()
        addBlock({ type: 'output', tag: '[music]', tagType: 'success', text: `⏭️ 切歌: ${audioStore.currentTrack.title}` })
      } else if (sub === 'prev') {
        audioStore.prev()
        addBlock({ type: 'output', tag: '[music]', tagType: 'success', text: `⏮️ 切歌: ${audioStore.currentTrack.title}` })
      } else if (sub === 'vol' || sub === 'v') {
        const val = parseInt(args[1] || '')
        if (!isNaN(val) && val >= 0 && val <= 100) {
          audioStore.setVolume(val / 100)
          addBlock({ type: 'output', tag: '[music]', tagType: 'info', text: `🔊 音量已设置为: ${val}%` })
        } else {
          addBlock({ type: 'output', tag: '[music]', tagType: 'info', text: `🔊 当前音量: ${Math.round(audioStore.volume * 100)}%` })
        }
      } else {
        addBlock({
          type: 'output',
          tag: '[music]',
          tagType: 'info',
          lines: [
            `🎵 当前状态: ${audioStore.isPlaying ? '播放中 ▶️' : '已暂停 ⏸️'}`,
            `🎵 当前曲目: ${audioStore.currentTrack.title}`,
            `🔊 当前音量: ${Math.round(audioStore.volume * 100)}%`,
            '',
            '支持的子命令: play, pause, next, prev, vol <0-100>'
          ]
        })
      }
      break
    }

    case 'projects':
    case 'portfolio':
    case 'p':
      addBlock({
        type: 'table',
        tag: '[portfolio]',
        tagType: 'info',
        text: `精选作品集 (共 ${PROJECTS_DATA.length} 件作品，点击跳转体验):`,
        items: PROJECTS_DATA.map((p, idx) => ({
          id: idx + 1,
          title: `${p.title} · ${p.subtitle}`,
          subtitle: `${p.category.toUpperCase()} · ${p.statusLabel} (${p.year})`,
          path: p.demoUrl && p.demoUrl.startsWith('/') ? p.demoUrl : '/projects',
        })),
      })
      break

    case 'skills':
      addBlock({
        type: 'output',
        tag: '[skills]',
        tagType: 'system',
        lines: [
          'CORE TECHNICAL MATRIX (核心技术矩阵):',
          '  [FRONTEND]   Vue 3, TypeScript, Three.js (WebGL), Vite, CSS Architecture',
          '  [BACKEND]    Python 3.13, FastAPI, SQLAlchemy 2.0, MySQL 8.4 (utf8mb4)',
          '  [QUALITY]    Vitest, Playwright E2E, oxlint, ESLint 9, CI Workflows',
          '  [DESIGN]     Awwwards Visual Craft, Morandi/Nord Colorways, Frosted Glass UI',
        ],
      })
      break

    case 'contact':
      addBlock({
        type: 'output',
        tag: '[contact]',
        tagType: 'info',
        lines: [
          'CONNECT CHANNELS (联络渠道):',
          '  GitHub:    https://github.com/Azusa010/SakiBlog',
          '  Portfolio: /projects',
          '  Blog:      /posts',
          '  Location:  中国 · 在文字与山峦间安放代码',
        ],
      })
      break

    case 'clear':
    case 'cls':
      resetBanner()
      break

    case 'exit':
    case 'quit':
    case 'q':
      terminal.close()
      break

    case 'whoami':
      addBlock({
        type: 'output',
        tag: '[whoami]',
        tagType: 'info',
        lines: [
          'guest@zen-terminal',
          'HOST: SakiBlog Cyber Pastoral Workspace',
          'PRIVILEGES: Interactive Read · Client Grep · Route Hop',
        ],
      })
      break

    case 'ls':
    case 'posts':
      isBusy.value = true
      try {
        const data = await fetchPosts(1, 10)
        if (data.items.length === 0) {
          addBlock({ type: 'output', tag: '[info]', tagType: 'info', text: '暂无公开文章。' })
        } else {
          addBlock({
            type: 'table',
            tag: '[articles]',
            tagType: 'info',
            text: `已加载 ${data.items.length} 篇最新卷轴 (点击标题或执行 cat <ID> 阅览):`,
            items: data.items.map((p: PostSummary) => ({
              id: p.id,
              title: p.title,
              subtitle: `${p.category?.name ?? '随笔'} · ${p.published_at.slice(0, 10)}`,
              path: `/posts/${p.id}`,
            })),
          })
        }
      } catch {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '无法拉取文章列表，请检查网络或后端状态。',
        })
      } finally {
        isBusy.value = false
      }
      break

    case 'cat':
      if (!argStr) {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '用法: cat <文章ID | about.md | welcome>',
        })
        break
      }
      if (argStr === 'about' || argStr === 'about.md' || argStr === 'bio') {
        addBlock({
          type: 'output',
          tag: '[identity]',
          tagType: 'system',
          lines: [
            '==================================================',
            'PROFILE: Saki (开发者 / 全栈工程师 / 界面工匠)',
            'STACK: Vue 3 · TypeScript · FastAPI · SQLAlchemy · MySQL 8.4',
            'CREATIVE: Three.js · CSS Scroll-driven · View Transitions',
            'PHILOSOPHY: 在代码中寻求秩序，在文字里安放诗意。',
            '==================================================',
          ],
        })
      } else if (argStr === 'welcome' || argStr === 'welcome.txt') {
        addBlock({
          type: 'output',
          tag: '[welcome]',
          tagType: 'motto',
          lines: [
            'In words, meet a bigger world.',
            ' - SakiBlog 禅意终端 v2.0',
          ],
        })
      } else {
        const id = Number(argStr)
        if (Number.isNaN(id) || id <= 0) {
          addBlock({
            type: 'error',
            tag: '[error]',
            tagType: 'error',
            text: `未知文件或文章 ID: ${argStr}`,
          })
          break
        }
        isBusy.value = true
        try {
          const detail = await fetchPost(id)
          addBlock({
            type: 'output',
            tag: `[article #${detail.id}]`,
            tagType: 'system',
            lines: [
              detail.title,
              `分类: ${detail.category?.name ?? '未分类'} · 发布于: ${detail.published_at.slice(0, 10)} · 预计阅读: ${detail.reading_minutes ?? 3} 分钟`,
              '--------------------------------------------------',
              detail.summary || '（此文章暂无摘要）',
              '--------------------------------------------------',
            ],
            items: [
              {
                id: detail.id,
                title: `打开完整正文: ${detail.title}`,
                path: `/posts/${detail.id}`,
              },
            ],
          })
        } catch {
          addBlock({
            type: 'error',
            tag: '[error]',
            tagType: 'error',
            text: `未找到 ID 为 ${id} 的文章。`,
          })
        } finally {
          isBusy.value = false
        }
      }
      break

    case 'grep':
    case 'find':
    case 'search':
      if (!argStr) {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '用法: grep <搜索关键词>',
        })
        break
      }
      isBusy.value = true
      try {
        const res = await fetchSearch(argStr)
        if (res.items.length === 0) {
          addBlock({
            type: 'output',
            tag: '[grep]',
            tagType: 'info',
            text: `未匹配到包含「${argStr}」的文章。`,
          })
        } else {
          addBlock({
            type: 'table',
            tag: '[grep]',
            tagType: 'info',
            text: `关键词「${argStr}」匹配到 ${res.total} 篇文章:`,
            items: res.items.map((p) => ({
              id: p.id,
              title: p.title,
              subtitle: `${p.category?.name ?? '全域'} · ${p.published_at.slice(0, 10)}`,
              path: `/posts/${p.id}`,
            })),
          })
        }
      } catch {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '检索请求失败，请稍后重试。',
        })
      } finally {
        isBusy.value = false
      }
      break

    case 'tags':
      isBusy.value = true
      try {
        const list = await fetchTags()
        if (list.length === 0) {
          addBlock({ type: 'output', tag: '[info]', tagType: 'info', text: '目前暂无标签。' })
        } else {
          addBlock({
            type: 'output',
            tag: '[tags]',
            tagType: 'info',
            lines: [
              '思考标签云 (TAGS):',
              ...list.map((t) => `  #${t.name.padEnd(16, ' ')} (${t.article_count} 篇)`),
            ],
            items: list.map((t) => ({
              id: t.id,
              title: `#${t.name} (${t.article_count} 篇)`,
              path: `/tags/${t.id}`,
            })),
          })
        }
      } catch {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '获取标签失败。',
        })
      } finally {
        isBusy.value = false
      }
      break

    case 'categories':
    case 'cats':
      isBusy.value = true
      try {
        const list = await fetchCategories()
        if (list.length === 0) {
          addBlock({ type: 'output', tag: '[info]', tagType: 'info', text: '目前暂无分类。' })
        } else {
          addBlock({
            type: 'output',
            tag: '[categories]',
            tagType: 'info',
            lines: [
              '全域分类目录 (CATEGORIES):',
              ...list.map((c) => `  [0${c.id}] ${c.name.padEnd(14, ' ')} (${c.article_count} 篇)`),
            ],
            items: list.map((c) => ({
              id: c.id,
              title: `${c.name} (${c.article_count} 篇)`,
              path: `/categories/${c.id}`,
            })),
          })
        }
      } catch {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '获取分类失败。',
        })
      } finally {
        isBusy.value = false
      }
      break

    case 'goto':
    case 'cd': {
      const target = argStr.toLowerCase()
      const routeMap: Record<string, string> = {
        '~': '/',
        'home': '/',
        '/': '/',
        'projects': '/projects',
        'portfolio': '/projects',
        'posts': '/posts',
        'articles': '/posts',
        'categories': '/categories',
        'tags': '/tags',
        'about': '/about',
        'search': '/search',
        'admin': '/admin/posts',
      }
      const dest = routeMap[target]
      if (dest) {
        addBlock({
          type: 'success',
          tag: '[goto]',
          tagType: 'success',
          text: `正在穿梭至: ${dest}`,
        })
        await router.push(dest)
        terminal.close()
      } else {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: `未知目标页面: ${argStr}。可用: home, posts, categories, tags, about, admin`,
        })
      }
      break
    }

    case 'theme': {
      const mode = argStr.toLowerCase()
      const current = currentTheme()
      let nextTheme: Theme = current
      if (mode === 'light') nextTheme = 'light'
      else if (mode === 'dark') nextTheme = 'dark'
      else if (mode === 'toggle' || !mode) nextTheme = current === 'dark' ? 'light' : 'dark'
      else {
        addBlock({
          type: 'error',
          tag: '[error]',
          tagType: 'error',
          text: '用法: theme [light | dark | toggle]',
        })
        break
      }
      saveTheme(nextTheme)
      addBlock({
        type: 'success',
        tag: '[theme]',
        tagType: 'success',
        text: `主题已切换至: ${nextTheme === 'dark' ? '暮霭苍穹 (Dark)' : '暖纸象牙白 (Light)'}`,
      })
      break
    }

    default:
      addBlock({
        type: 'error',
        tag: '[error]',
        tagType: 'error',
        text: `command not found: "${cmd}". 输入 "help" 或点击快捷胶囊。`,
      })
  }

  scrollToBottom()
}

function submitCurrentInput() {
  const q = inputQuery.value
  inputQuery.value = ''
  void handleCommand(q)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (history.value.length === 0) return
    if (historyIndex.value === -1) {
      historyIndex.value = history.value.length - 1
    } else if (historyIndex.value > 0) {
      historyIndex.value -= 1
    }
    inputQuery.value = history.value[historyIndex.value] ?? ''
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (historyIndex.value !== -1) {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value += 1
        inputQuery.value = history.value[historyIndex.value] ?? ''
      } else {
        historyIndex.value = -1
        inputQuery.value = ''
      }
    }
  } else if (e.key === 'Tab') {
    e.preventDefault()
    const prefix = inputQuery.value.trim().toLowerCase()
    if (!prefix) return
    const match = COMMANDS.find((c) => c.startsWith(prefix))
    if (match) {
      inputQuery.value = `${match} `
    }
  }
}

function navigateTo(path: string) {
  void router.push(path)
  terminal.close()
}

function checkAndRunPendingCommand() {
  const cmd = terminal.consumePendingCommand()
  if (cmd) {
    void handleCommand(cmd)
  }
}

// 聚焦与模态监听
watch(
  () => terminal.isOpen,
  (open) => {
    if (open) {
      void nextTick(() => {
        checkAndRunPendingCommand()
        inputEl.value?.focus()
        scrollToBottom()
      })
    }
  },
)

watch(
  () => terminal.pendingCommand,
  (cmd) => {
    if (cmd && terminal.isOpen) {
      checkAndRunPendingCommand()
    }
  },
)

function onGlobalKey(e: KeyboardEvent) {
  // Ctrl+K / Cmd+K
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    terminal.toggle()
    return
  }

  // 反引号唤出 (当焦点不在任何 input/textarea 时)
  if (e.key === '`' && !terminal.isOpen) {
    const target = e.target as HTMLElement | null
    if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
      e.preventDefault()
      terminal.open()
      return
    }
  }

  // ESC 退出
  if (e.key === 'Escape' && terminal.isOpen) {
    e.preventDefault()
    terminal.close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKey)
})
</script>

<template>
  <Transition name="term-fade">
    <div
      v-if="terminal.isOpen"
      class="terminal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="禅意交互终端"
      @click.self="terminal.close()"
    >
      <div class="terminal-chassis">
        <!-- 终端顶栏 -->
        <header class="terminal-bar">
          <div class="traffic-lights" aria-hidden="true">
            <button
              type="button"
              class="light red"
              title="关闭终端 (ESC)"
              aria-label="关闭终端"
              @click="terminal.close()"
            ></button>
            <button
              type="button"
              class="light yellow"
              title="清空控制台 (clear)"
              aria-label="清空控制台"
              @click="handleCommand('clear')"
            ></button>
            <button
              type="button"
              class="light green"
              title="帮助指引 (help)"
              aria-label="帮助指引"
              @click="handleCommand('help')"
            ></button>
            <span class="terminal-title">~/peaceful-mind — guest@zen-terminal</span>
          </div>

          <div class="terminal-meta-group">
            <span class="window-status">[MODE: TRANQUIL]</span>
            <span class="terminal-hint">ESC</span>
          </div>
        </header>

        <!-- 终端历史与回显区 -->
        <div ref="logContainerEl" class="terminal-body" @click="inputEl?.focus()">
          <div v-for="block in blocks" :key="block.id" class="output-block" :class="block.type">
            <!-- 经典开场横幅与快捷胶囊 (Hallmark Studied DNA) -->
            <div v-if="block.type === 'banner'" class="zen-welcome-card">
              <div class="welcome-line">
                <span class="tag tag-system">[system]</span>
                <span class="text">Welcome to the Zen Terminal v1.0.0</span>
              </div>
              <div class="welcome-line">
                <span class="tag tag-info">[info]</span>
                <span class="text">
                  自然与代码在此交汇。输入
                  <button type="button" class="inline-cmd" @click="handleCommand('help')">help</button>
                  查看可用指令。
                </span>
              </div>
              <div class="welcome-line">
                <span class="tag tag-motto">[motto]</span>
                <span class="text">"Talk is cheap. Show me the code. - 但别忘了抬头看看风景。"</span>
              </div>
              <div class="welcome-line author-line">
                <span class="tag tag-author">[author]</span>
                <span class="text">
                  <strong>Saki</strong> · Full-Stack &amp; Creative Engineering
                  <span class="bio-inline">· In words, meet a bigger world.</span>
                </span>
              </div>

              <!-- 快捷命令胶囊 -->
              <div class="quick-capsules" aria-label="快捷指令胶囊">
                <button type="button" class="capsule" @click="handleCommand('projects')">projects</button>
                <button type="button" class="capsule" @click="handleCommand('ls')">ls</button>
                <button type="button" class="capsule" @click="handleCommand('cat about.md')">cat about.md</button>
                <button type="button" class="capsule" @click="handleCommand('clear')">clear</button>
              </div>
            </div>

            <!-- 用户命令输入回显行 (带有 ➜ 提示符) -->
            <div v-else-if="block.type === 'system'" class="block-prompt-line">
              <span class="prompt-arrow" aria-hidden="true">➜</span>
              <span class="prompt-dir">{{ block.promptDir || '~/peaceful-mind' }}</span>
              <span class="prompt-cmd">{{ block.command }}</span>
            </div>

            <!-- 输出多行文本 -->
            <div v-else class="block-output-content">
              <div v-if="block.tag || block.text" class="output-header-line">
                <span v-if="block.tag" class="tag" :class="`tag-${block.tagType || 'info'}`">{{ block.tag }}</span>
                <span v-if="block.text" class="text" :class="{ 'text-error': block.type === 'error' }">{{ block.text }}</span>
              </div>

              <pre v-if="block.lines" class="block-pre">{{ block.lines.join('\n') }}</pre>

              <!-- 结构化列表卡片 (可点击直达) -->
              <div v-if="block.items && block.items.length > 0" class="block-items">
                <button
                  v-for="item in block.items"
                  :key="item.path"
                  type="button"
                  class="item-link"
                  @click="navigateTo(item.path)"
                >
                  <span class="item-no">[{{ String(item.id).padStart(2, '0') }}]</span>
                  <span class="item-title">{{ item.title }}</span>
                  <span v-if="item.subtitle" class="item-sub">{{ item.subtitle }}</span>
                  <span class="item-arrow" aria-hidden="true">↵</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 加载中指示器 -->
          <div v-if="isBusy" class="block-busy">
            <span class="spinner" aria-hidden="true"></span>
            <span>正在执行检索 . . .</span>
          </div>

          <!-- 交互命令输入行 (➜ ~/peaceful-mind 输入指令...) -->
          <form class="cli-input-row" @submit.prevent="submitCurrentInput">
            <label for="zen-cli-input" class="cli-lead">
              <span class="prompt-arrow" aria-hidden="true">➜</span>
              <span class="prompt-dir">~/peaceful-mind</span>
            </label>
            <input
              id="zen-cli-input"
              ref="inputEl"
              v-model="inputQuery"
              type="text"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              class="cli-field"
              placeholder="输入指令..."
              @keydown="onKeyDown"
            />
          </form>
        </div>

        <!-- 终端底栏状态与文本导航 (与 Hero 界面 100% 保持一致) -->
        <footer class="terminal-footer">
          <div class="footer-status-nav">
            <button type="button" class="cta-primary status-link" @click="navigateTo('/projects')">
              <span>探索作品集</span>
              <svg class="status-arrow" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>

            <span class="status-sep">/</span>

            <button type="button" class="cta-secondary status-link" @click="navigateTo('/posts')">
              阅读文章
            </button>

            <span class="status-sep">/</span>

            <button type="button" class="cta-secondary status-link" @click="navigateTo('/about')">
              关于我
            </button>
          </div>

          <div class="footer-telemetry">
            <!-- Mini Music Player -->
            <div class="mini-music-player flex items-center gap-3 text-xs opacity-70 hover:opacity-100 transition-opacity mr-4">
              <button @click.stop="audioStore.prev()" class="hover:text-accent transition-colors cursor-pointer" title="上一首">⏮</button>
              <button @click.stop="audioStore.toggle()" class="hover:text-accent transition-colors cursor-pointer w-4 text-center" :title="audioStore.isPlaying ? '暂停' : '播放'">
                {{ audioStore.isPlaying ? '⏸' : '▶' }}
              </button>
              <button @click.stop="audioStore.next()" class="hover:text-accent transition-colors cursor-pointer" title="下一首">⏭</button>
              <span class="music-title truncate max-w-[100px] text-zinc-400 mx-2" :title="audioStore.currentTrack?.title">
                {{ audioStore.currentTrack?.title || 'Unknown Track' }}
              </span>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                :value="audioStore.volume" 
                @input="e => audioStore.setVolume(parseFloat((e.target as HTMLInputElement).value))"
                class="vol-slider w-16 h-1 cursor-pointer"
                title="音量调节"
              />
            </div>
            <span class="telemetry-item">UTF-8</span>
            <span class="telemetry-item">NORMAL</span>
            <button
              type="button"
              class="telemetry-btn"
              title="退出终端 (ESC)"
              @click="terminal.close()"
            >
              <span>ESC 退出</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.terminal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 100);
  background: rgba(4, 10, 8, 0.20);
  backdrop-filter: blur(2.5px);
  -webkit-backdrop-filter: blur(2.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(1rem, 3vw);
}

/* 禅意终端底盘 */
.terminal-chassis {
  width: min(52rem, 94vw);
  height: min(34rem, 80vh);
  display: flex;
  flex-direction: column;
  background: rgba(10, 22, 17, 0.75); /* 降低透明度 (25% 透明度) */
  backdrop-filter: blur(12px) saturate(125%);
  -webkit-backdrop-filter: blur(12px) saturate(125%);
  border: 1px solid rgba(147, 197, 253, 0.26);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(147, 197, 253, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  overflow: hidden;
  font-family: var(--font-mono);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
}

:root[data-theme='light'] .terminal-chassis {
  background: rgba(246, 250, 247, 0.85); /* 降低透明度 (15% 透明度) */
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow:
    0 24px 64px rgba(18, 26, 40, 0.15),
    0 0 0 1px rgba(59, 130, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
}

/* 顶栏控制 */
.terminal-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  background: rgba(9, 17, 13, 0.12);
  border-bottom: 1px solid rgba(147, 197, 253, 0.15);
  user-select: none;
}

:root[data-theme='light'] .terminal-bar {
  background: rgba(235, 242, 237, 0.15);
  border-bottom-color: rgba(59, 130, 246, 0.12);
}

.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
}

.light {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.light:hover {
  opacity: 0.85;
  transform: scale(1.15);
}

.light.red {
  background: #ff5f56;
}

.light.yellow {
  background: #ffbd2e;
}

.light.green {
  background: #27c93f;
}

.terminal-title {
  margin-left: 8px;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.terminal-meta-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.window-status {
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  color: #93c5fd;
  background: rgba(147, 197, 253, 0.12);
  border: 1px solid rgba(147, 197, 253, 0.25);
  padding: 2px 8px;
  border-radius: 9999px;
}

.terminal-hint {
  font-size: 0.64rem;
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.04);
}

/* 终端主体输出区 */
.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.output-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 禅意开场卡片 (完全还原参考图) */
.zen-welcome-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0 12px;
}

.welcome-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.85rem;
  line-height: 1.8;
  color: var(--color-text);
}

.welcome-line.author-line {
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  font-size: 0.84rem;
}

:root[data-theme='light'] .welcome-line.author-line {
  border-top-color: rgba(18, 26, 40, 0.08);
}

.bio-inline {
  color: var(--color-text-muted);
  margin-left: 4px;
}

/* 语义标签 (DNA 定制色调) */
.tag {
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.tag-system {
  color: #81a1c1; /* 雾蓝 Slate Blue */
}

.tag-info {
  color: #94a3b8; /* Slate-400 */
}

.tag-motto {
  color: #93c5fd; /* Blue-300 */
}

.tag-author {
  color: #d08770; /* 暖橙陶土 */
}

.tag-error {
  color: var(--color-danger);
}

.tag-success {
  color: #8fbcbb;
}

.inline-cmd {
  background: transparent;
  border: none;
  padding: 0 2px;
  font-family: inherit;
  font-size: inherit;
  color: #ebcb8b;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.inline-cmd:hover {
  color: var(--color-accent-high);
}

/* 快速胶囊按钮行 (Quick Action Pills) */
.quick-capsules {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.capsule {
  border-radius: 9999px;
  padding: 4px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

:root[data-theme='light'] .capsule {
  background: rgba(18, 26, 40, 0.05);
  border-color: rgba(18, 26, 40, 0.12);
}

.capsule:hover {
  background: var(--color-accent-glow);
  border-color: var(--color-accent);
  color: var(--color-accent-high);
  transform: translateY(-1px);
}

/* 提示行 (➜ ~/peaceful-mind) */
.block-prompt-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.85rem;
  line-height: 1.8;
}

.prompt-arrow {
  color: #60a5fa; /* Blue-400 */
  font-weight: 600;
}

.prompt-dir {
  color: #94a3b8; /* Slate-400 */
}

.prompt-cmd {
  color: var(--color-text);
  font-weight: 500;
}

/* 输出行内容 */
.block-output-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.output-header-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.85rem;
  line-height: 1.8;
  color: var(--color-text-muted);
}

.text-error {
  color: var(--color-danger);
}

.block-pre {
  margin: 0;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--color-code-frost);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 结构化直达按钮项 */
.block-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.item-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-xs);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.item-link:hover {
  background: var(--color-accent-glow);
  border-color: var(--color-accent);
  color: var(--color-accent-high);
  transform: translateX(4px);
}

.item-no {
  color: var(--color-accent);
  font-weight: 500;
}

.item-title {
  flex: 1;
}

.item-sub {
  color: var(--color-text-dim);
  font-size: 0.72rem;
}

.item-arrow {
  color: var(--color-accent);
}

.block-busy {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: 0.78rem;
  color: var(--color-accent);
}

.spinner {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--color-accent);
  border-top-color: transparent;
  border-radius: 50%;
  animation: term-spin 0.6s linear infinite;
}

@keyframes term-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 交互命令输入行 (➜ ~/peaceful-mind 输入指令...) */
.cli-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.cli-input-row:focus-within {
  border-color: rgba(147, 197, 253, 0.45);
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.12);
}

:root[data-theme='light'] .cli-input-row {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(18, 26, 40, 0.12);
}

.cli-lead {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.cli-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.85rem;
  padding: 0;
  letter-spacing: 0.02em;
}

.cli-field::placeholder {
  color: var(--color-text-dim);
  opacity: 0.6;
}

/* 终端底栏状态与文本导航 (与 Hero 界面 100% 保持一致) */
.terminal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(10, 16, 22, 0.12);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
  gap: 12px;
}

:root[data-theme='light'] .terminal-footer {
  background: rgba(235, 238, 242, 0.15);
  border-top-color: rgba(18, 26, 40, 0.08);
}

.footer-status-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.status-link {
  background: transparent;
  border: none;
  padding: 0;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  transition: color var(--dur-fast) ease;
}

.status-link:hover {
  color: var(--color-accent);
}

.cta-primary.status-link {
  color: var(--color-accent);
  font-weight: 500;
}

.cta-primary.status-link:hover {
  color: var(--color-accent-high);
}

.status-arrow {
  width: 0.8rem;
  height: 0.8rem;
}

.status-sep {
  color: rgba(255, 255, 255, 0.2);
}

:root[data-theme='light'] .status-sep {
  color: rgba(18, 26, 40, 0.2);
}

.footer-telemetry {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-text-dim);
}

.telemetry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  cursor: pointer;
  transition: all var(--dur-fast) ease;
}

.telemetry-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

/* 过渡动效 */
.term-fade-enter-active,
.term-fade-leave-active {
  transition:
    opacity var(--dur-base) ease,
    transform var(--dur-base) var(--ease-out);
}

.term-fade-enter-from,
.term-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(10px);
}
</style>
