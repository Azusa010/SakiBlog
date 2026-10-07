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
    title: 'SakiBlog',
    subtitle: 'Aesthetic Fullstack Digital Garden',
    description:
      '融合先锋视觉与前后端分离工程闭环的个人主页与技术工坊。搭载 WebGL 三维渲染、拟态交互式终端与完整的文章管理中台。',
    category: 'fullstack',
    tags: ['Vue 3', 'TypeScript', 'Tailwind CSS', 'FastAPI'],
    featured: true,
    status: 'active',
    statusLabel: '迭代中 · ACTIVE',
    year: '2026',
    demoUrl: '/',
    githubUrl: 'https://github.com/Azusa010/SakiBlog',
    articleUrl: '/posts',
    highlights: [
      'Vue 3 + FastAPI 全栈架构',
      '纯享暗黑极简排版与流畅动画',
      '拟态磨砂视窗 Zen Terminal',
    ],
  },
  {
    id: 'personal-agent',
    title: 'Personal Agent',
    subtitle: 'Local-first Personal AI Assistant',
    description:
      'A local-first personal AI agent built with Electron, TypeScript, and Python, featuring tool calling, permission control, and safe file operations.',
    category: 'tool',
    tags: ['Electron', 'TypeScript', 'Python', 'AI Agent'],
    featured: true,
    status: 'active',
    statusLabel: '研发中 · WIP',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/personal-agent',
    highlights: [
      'Local-first 本地优先架构设计',
      '支持 Tool Calling 智能工具调度',
      '严格的本地文件与权限安全控制',
    ],
  },
  {
    id: 'saki-flow',
    title: 'SakiFlow',
    subtitle: 'AI Workflow Platform Frontend',
    description:
      'An AI workflow platform frontend built with Vue 3, TypeScript, Pinia, and Monaco Editor. 提供可视化的 AI 工作流编排体验。',
    category: 'fullstack',
    tags: ['Vue 3', 'TypeScript', 'Pinia', 'Monaco Editor'],
    featured: true,
    status: 'active',
    statusLabel: '运行中 · STABLE',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/SakiFlow',
    demoUrl: 'https://saki-flow.vercel.app',
    highlights: [
      'Monaco Editor 高级代码编辑集成',
      'Pinia 全局复杂状态管理',
      '现代化流程编排可视化操作',
    ],
  },
  {
    id: 'saki-vault',
    title: 'SakiVault',
    subtitle: 'Modern Desktop App for Anime',
    description:
      'A modern desktop application built for anime tracking and cataloging, leveraging web technologies packed in Electron.',
    category: 'creative',
    tags: ['Vue', 'Electron', 'TypeScript', 'Bangumi'],
    featured: true,
    status: 'active',
    statusLabel: '运行中 · STABLE',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/SakiVault',
    demoUrl: 'https://saki-vault.vercel.app',
    highlights: [
      'Electron 驱动的跨平台桌面体验',
      '现代化的追番管理与数据追踪',
      '极致丝滑的前端交互体验',
    ],
  },
  {
    id: 'rag-demo',
    title: 'RAG_DEMO',
    subtitle: 'Retrieval-Augmented Generation',
    description:
      'Python 기반의 RAG (Retrieval-Augmented Generation) 演示与学习项目，探索大模型知识库构建与本地向量检索。',
    category: 'tool',
    tags: ['Python', 'RAG', 'LLM', 'AI'],
    featured: false,
    status: 'completed',
    statusLabel: '已完成 · COMPLETED',
    year: '2026',
    githubUrl: 'https://github.com/Azusa010/RAG_DEMO',
    highlights: [
      '大模型检索增强生成 (RAG) 基础架构',
      '本地化文档向量化与相似度匹配',
      '极简的交互与测试用例验证',
    ],
  },
]
