# AGENT.md

## 项目简介

SakiBlog:个人博客系统,含公开前台 + 管理员内容管理端,用于实践前后端分离全栈开发。
功能范围、数据需求与验收标准以 `docs/SRS.md` 为唯一依据。

## 项目定位(2026-10-06 起)

SakiBlog 不仅是一个博客，更是**独立全栈工程师与创意开发者的个人主页、作品集与数字花园（Personal Portfolio & Engineering Hub）**：

- **四大支柱体系**:
  1. **个人主页 (Home - `/`)**: 复合叙事流，包含个人身份/Slogan、精选作品集橱窗 (Featured Projects)、最新文章卷轴与工坊技术底盘。
  2. **作品集展示 (Portfolio - `/projects`)**: 独立作品集大厅，支持全栈工程、先锋交互 & 3D、开源工具多维筛选与代码/演示联动。
  3. **个人深度档案 (About - `/about`)**: 禅意明信片质感，沉淀个人背景、技能谱系雷达、历程时间轴与公开联络通道。
  4. **思考卷轴 (Blog - `/posts`)**: 完备的 Markdown 博客引擎与检索体验。
  5. **禅意交互终端 (Zen Terminal CLI)**: 全局 `Ctrl+K` 极客命令行，深度协同 `projects` / `skills` / `contact` / `cat about.md`。
- **设计与创意目标**: 对齐 Awwwards 评审维度（设计、可用性、创意、内容），效果层永不牺牲可用性与可访问性（prefers-reduced-motion 降级、键盘可达、对比度是底线）。
- **技术与工具**: 程序化 SVG/Canvas/WebGL、真实摄影、视差、页面过渡编排，保持轻量与性能兼备。

## 技术栈

- 前端:Vue 3 + TypeScript + Vite(仓库根目录,npm);vue-router、Pinia 已安装
- 后端:`backend/`,Python ≥3.13,FastAPI + SQLAlchemy 2 + PyMySQL,uv 管理
- 数据库:MySQL 8.4,字符集 utf8mb4
- 测试:Vitest + Playwright(前端),pytest + httpx(后端);lint 用 ESLint/oxlint、ruff

## 协作方式

- 以工程师身份直接参与开发:可读取、创建、修改文件,可运行构建、测试、lint 等命令,按里程碑提交代码。
- 提交信息沿用现有英文惯例:`feat: / fix: / docs: / chore:`。
- 动手前先阅读相关代码,保持项目现有风格;影响面大的设计决策先说明再改。
- 不实现 SRS 范围之外的业务功能(设计表现与交互创意见"项目定位",不受此限);`backend/.env` 等凭据配置不入库。
- **视觉设计决策规则 (重要)**: 每次询问关于视觉选项的问题（如通过 `/grill-me` 流程确定排版、色彩、动画等）时，**必须**启动一个本地服务器，并编写一个最小化的 HTML Demo 去直观展示每个选项的不同，绝不能仅仅通过纯文字提问。

## 常用命令

前端(仓库根目录):

- `npm run dev` 开发服务器;`npm run build` 类型检查+构建
- `npm run test:unit` / `npm run test:e2e`;`npm run lint`

后端(`backend/` 目录):

- `uv run uvicorn app.main:app --reload` 启动
- `uv run pytest` 测试;`uv run ruff check .` 静态检查

## 设计体系决议 (Design System Decisions)

目前正在通过 `/grill-me` 流程确立首页及其他页面的重新设计方向（Peaceful scenery + 复古蓝调阴沉滤镜）：
1. **页面范围**: 全局 (Home, Portfolio, About, Blog)
2. **首屏布局 (Hero Section)**: Editorial (杂志/社论风) 不对称网格排版
3. **字体与排版 (Typography)**: Elegant Serif (优雅衬线体主导，如 Playfair Display/EB Garamond + Geist)
4. **动画与微交互 (Motion)**: Gentle Cinematic (缓出淡入，背景微弱循环平移，优雅的过渡)
5. **作品集布局 (Portfolio)**: Vertical Immersive (垂直沉浸大标题列表，背景图随悬浮/滚动出现)
6. **个人档案布局 (About)**: Postcard/Letter (明信片信笺式居中单栏，高密度排版，文学感)
7. **文章列表布局 (Blog)**: Editorial Split (社论分栏，左侧日期/右侧标题摘要)

### 前端重构融合策略 (Refactoring Strategy)
- **样式架构**: 引入 Tailwind CSS 进行渐进式重构。新页面直接使用 Tailwind 类名落地 Demo 设计；旧组件（如后台界面）暂时保留原有原生 CSS 变量体系，后续平滑过渡。
- **核心资产融合**: 保留原有的 Three.js WebGL 场景与全局终端（Zen Terminal）。将原有代码库中的“赛博绿色调” Shader 和终端毛玻璃替换为深沉复古蓝调，通过添加 CSS 滤镜或调整渲染颜色，让动态山峦与终端完美融入“古典忧郁”的氛围中。
