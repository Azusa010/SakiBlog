# AGENT.md

## 项目简介

SakiBlog:个人博客系统,含公开前台 + 管理员内容管理端,用于实践前后端分离全栈开发。
功能范围、数据需求与验收标准以 `docs/SRS.md` 为唯一依据。

## 项目定位(2026-10-06 起)

SakiBlog 不仅是一个博客,更是**前端设计与创意的展示窗**:

- 设计与创意目标对齐 Awwwards 评审维度:**设计、可用性、创意、内容**——效果层永远不牺牲可用性与可访问性(prefers-reduced-motion 降级、键盘可达、对比度是底线)
- 鼓励发动想象力并用上一切合理工具:程序化 SVG/Canvas/WebGL、真实摄影、滚动叙事、视差、自定义光标、页面过渡编排等
- 允许为此引入重量级依赖(如 three.js / gsap / lenis),但必须在代码注释中说明理由与体积代价,并懒加载非首屏部分
- 每个公开页面至少一个"签名瞬间";创意效果属于本站定位的一部分,不受"SRS 范围之外的功能"限制(SRS 约束的是业务功能,不是设计表现)

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

## 常用命令

前端(仓库根目录):

- `npm run dev` 开发服务器;`npm run build` 类型检查+构建
- `npm run test:unit` / `npm run test:e2e`;`npm run lint`

后端(`backend/` 目录):

- `uv run uvicorn app.main:app --reload` 启动
- `uv run pytest` 测试;`uv run ruff check .` 静态检查
