/**
 * 作品集数据中心 (Portfolio & Projects Showcase)
 * 用于个人主页精选展示与独立作品集大厅。
 */

export type ProjectCategory = 'all' | 'fullstack' | 'creative' | 'tool'

export interface ProjectItem {
  id: string
  title: string
  subtitle: string
  description: string
  category: 'fullstack' | 'creative' | 'tool'
  tags: string[]
  featured: boolean
  status: 'active' | 'completed' | 'wip'
  statusLabel: string
  year: string
  coverImage?: string
  demoUrl?: string
  githubUrl?: string
  articleUrl?: string
  highlights: string[]
  metrics?: string
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  all: '全部作品 · ALL',
  fullstack: '全栈工程 · FULLSTACK',
  creative: '先锋交互 & 3D · CREATIVE',
  tool: '开源工具 & 基础设施 · TOOLS',
}

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'sakiblog',
    title: 'SakiBlog & Zen Terminal',
    subtitle: '禅意终端 × 苍山暮色全栈数字花园',
    description:
      '融合 Awwwards 级先锋视觉与前后端分离工程闭环的个人主页与技术工坊。搭载 WebGL 三维流体星尘、拟态毛玻璃交互式禅意终端、共享元素形变路由与完整的文章管理中台。',
    category: 'fullstack',
    tags: ['Vue 3', 'TypeScript', 'FastAPI', 'Three.js', 'SQLAlchemy', 'MySQL 8'],
    featured: true,
    status: 'active',
    statusLabel: '迭代中 · V2.0',
    year: '2026',
    demoUrl: '/',
    githubUrl: 'https://github.com/Azusa010/SakiBlog',
    articleUrl: '/posts',
    highlights: [
      'Vue 3 + FastAPI 全栈架构与 MySQL 8 规范持久化',
      'Three.js 苍山暮色星尘微粒场与 CSS Scroll-driven 视差解构',
      '拟态磨砂视窗 Zen Terminal，支持键盘交互与快捷 CLI 探索',
    ],
    metrics: '9 Test Suites · 30+ Tests Passed · 0 Lint Error',
  },
  {
    id: 'zen-cli-runtime',
    title: 'Zen CLI Terminal Kit',
    subtitle: '轻量级 Web 拟态交互终端渲染套件',
    description:
      '为现代前端页面设计的极客风格内嵌终端交互引擎，开箱即用支持自动补全、历史栈检索、语义括号高光和全键盘操作无障碍。',
    category: 'creative',
    tags: ['TypeScript', 'Vue 3', 'Keyboard Navigation', 'CLI UX'],
    featured: true,
    status: 'completed',
    statusLabel: '稳定版 · RELEASED',
    year: '2026',
    demoUrl: '#',
    githubUrl: 'https://github.com/Azusa010/SakiBlog',
    highlights: [
      '毫秒级历史指令按键回溯与 Tab 键双向智能补全',
      'Nord / Morandi 莫兰迪高对比语义括号标头渲染体系',
      '无障碍焦点捕获与自适应移动端轻量触控卡片',
    ],
    metrics: '轻量 0 外部重型依赖',
  },
  {
    id: 'mountain-fluid-webgl',
    title: 'Mountain Dust WebGL Engine',
    subtitle: '三维山脉与流体星尘粒子渲染器',
    description:
      '基于 Three.js 定制开发的程序化柔性微粒渲染管线。模拟苍山暮霭间的星芒浮动，带有视差扰动反应与 GPU 低功耗降级调度。',
    category: 'creative',
    tags: ['Three.js', 'GLSL Shaders', 'WebGL', 'Performance'],
    featured: true,
    status: 'completed',
    statusLabel: '运行中 · STABLE',
    year: '2026',
    demoUrl: '/',
    highlights: [
      '500+ 自适应浮动粒子与平滑相机空间扰动',
      '结合 prefers-reduced-motion 的自动平稳降级与防掉帧调度',
      '首屏非阻塞式着色器异步预热',
    ],
    metrics: '60 FPS 稳定运行 · GPU 内存占用 < 18MB',
  },
  {
    id: 'fastapi-blog-engine',
    title: 'SakiBlog RESTful API Backend',
    subtitle: '高内聚低耦合的现代化 Python 内容服务',
    description:
      '基于 FastAPI 0.115 与 SQLAlchemy 2 现代异步/ORM 模式构建的后端服务，提供 JWT 安全鉴权、文章分页检索、分类标签多对多关联与高标准自动化测试覆盖。',
    category: 'fullstack',
    tags: ['Python 3.13', 'FastAPI', 'SQLAlchemy 2', 'PyMySQL', 'Pytest'],
    featured: false,
    status: 'completed',
    statusLabel: '稳定生产 · LIVE',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/SakiBlog',
    highlights: [
      'SQLAlchemy 2.0 现代查询范式与连接池健康检查',
      '安全 HttpOnly Cookie 与 Bearer Token 双重会话鉴权体系',
      'Pytest + HTTPX 完备的单元测试与端到端测试闭环',
    ],
    metrics: '覆盖率 90%+ · 亚毫秒级响应',
  },
  {
    id: 'dev-workflow-scripts',
    title: 'DevOps & Code Quality Pipeline',
    subtitle: '极速现代前端全流程质量守卫',
    description:
      '整合 oxlint、ESLint 9 Flat Config、vue-tsc 与 Playwright E2E 的本地/CI 全自动守护工作流，兼顾极致的检查性能与严格的代码规范。',
    category: 'tool',
    tags: ['oxlint', 'ESLint 9', 'Vitest', 'Playwright', 'CI/CD'],
    featured: false,
    status: 'completed',
    statusLabel: '已集成 · BUILT-IN',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/SakiBlog',
    highlights: [
      'oxlint 毫秒级静态拦截与 ESLint 互补规则链',
      'Vitest 极速单元测试驱动组件与 Pinia 状态验证',
      '严格保证无警告、无类型泄漏的流水线构建门禁',
    ],
    metrics: 'Lint 耗时 < 30ms',
  },
]
