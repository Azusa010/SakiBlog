# Design — SakiBlog (Zen Terminal × Cyber Pastoral)

A locked design system for SakiBlog.
Every page redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## 0. Meta
- **Genre:** `atmospheric`
- **Aesthetic Family:** Zen Terminal × Cyber Pastoral (禅意终端 × 赛博田园)
- **Vibe:** 半透明毛玻璃终端外壳 + 苍山暮雾呼吸底色 + 莫兰迪/Nord 柔和代码流 + 暖金琥珀单强调色 + 极度克制的人文排版
- **Dials:**
  - `DESIGN_VARIANCE: 8.5` (非对称画卷，右侧通透留白，动感错落列表)
  - `MOTION_INTENSITY: 7.5` (流体星尘微粒，毛玻璃折射，晨雾呼吸渐显)
  - `VISUAL_DENSITY: 3.5` (通透画廊感，负空间充足，正文严格 65ch 黄金行宽)

---

## 1. Macrostructure Families

- **Marketing / Portal (`HomeView.vue`):**
  - **Macrostructure:** “景中之界”非对称画卷 (Asymmetric Scenic Frame) + 动感非对称文章流 (Asymmetric Kinetic Feed)
  - **Hero Signature:** 真实黄昏晨雾摄影底图 + 居中偏左悬浮半透明禅意毛玻璃视窗（透光率 0.65，微霜冰雾边缘，包含诗意标题与微型交互指令），右侧大幅留白给远山星空。
  - **Feed Rhythm:** 区分高光文章（宽幅视差与微光重点）与次要文章，告别单调均等卡片，卡片具备微磁吸与高精度光斑轮廓。

- **Content / Reader (`PostDetailView.vue`):**
  - **Macrostructure:** 双栏协同先锋阅读流 (Dual-Column Kinetic Reader)
  - **Left Rail (阅读中枢):** 悬浮吸顶中枢，集成阅读进度环、实时阅读耗时（Kinetic Count-up）、交互式目录索引（Active Heading 高亮追随）、一键返回顶部。
  - **Right Main (正文区):** 严格 65ch 舒适阅读行宽，首段艺术化首字下沉（Drop-cap），关键段落穿插突破列宽的艺术化引言（Pull-quote），优雅的代码块与微霜边框。

- **Taxonomy & Story (`CategoriesView.vue`, `TagsView.vue`, `AboutView.vue`):**
  - **Macrostructure:** 禅意终端 × 动态风景明信片 (Zen Terminal Workspace)
  - **Visual Treatment:** 半透明毛玻璃终端外壳，内嵌 Nord / 莫兰迪极客代码流与交互命令，动态唤醒明信片式图文展板与分类热区晶体徽章。

---

## 2. Global Tokens & Theme System

### Theme: 暮霭苍穹 × 暖金琥珀 (Morandi Nightfall & Twilight Gold)

```css
:root {
  /* 基础光暗模式:默认跟随系统或暗色 */
  color-scheme: dark;

  /* 深色主题(核心视觉基石) */
  --color-bg: #0a101d;                      /* 深空夜苍基底 */
  --color-bg-secondary: #0f1726;            /* 次级深苍 */
  --color-surface: rgba(18, 26, 40, 0.65);  /* 半透明毛玻璃终端底板 */
  --color-surface-hover: rgba(26, 38, 58, 0.75);
  --color-surface-solid: #121a28;           /* 实体降级底板 */
  --color-border: rgba(255, 255, 255, 0.12);/* 微霜冰雾边缘 */
  --color-border-glow: rgba(212, 163, 115, 0.35); /* 琥珀微光边缘 */

  /* 文字墨色体系 */
  --color-text: #e2e8f0;                    /* 晨雾霜白 */
  --color-text-muted: #8a99ad;              /* 苍烟灰 */
  --color-text-dim: #546274;                /* 暗影文字 */

  /* 单一核心强调色(锁定,不可在页面中途即兴更换) */
  --color-accent: #d4a373;                  /* 莫兰迪暖赭流金 */
  --color-accent-high: #fff3dd;             /* 琥珀高光流金 */
  --color-accent-ink: #0a101d;              /* 强调色填充上的文字墨色 */
  --color-accent-glow: rgba(212, 163, 115, 0.18); /* 漫射暖晕 */

  /* 代码流与极客高亮(Nord克制色系) */
  --color-code-cyan: #8fbcbb;               /* 竹青 */
  --color-code-blue: #81a1c1;               /* 水墨青 */
  --color-code-frost: #88c0d0;              /* 霜蓝 */

  /* 毛玻璃滤镜标准 */
  --backdrop-blur: blur(16px);
  --backdrop-blur-heavy: blur(24px);

  /* 排版尺度 */
  --font-display: "Cabinet Grotesk", system-ui, -apple-system, sans-serif;
  --font-body: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  /* 4-point 命名间距阶梯 */
  --space-3xs: 0.25rem;  /* 4px */
  --space-2xs: 0.5rem;   /* 8px */
  --space-xs:  0.75rem;  /* 12px */
  --space-sm:  1rem;      /* 16px */
  --space-md:  1.5rem;    /* 24px */
  --space-lg:  2rem;      /* 32px */
  --space-xl:  3rem;      /* 48px */
  --space-2xl: 4.5rem;    /* 72px */
  --space-3xl: 6.5rem;    /* 104px */

  /* 圆角规范:毛玻璃终端使用精细规整圆角 */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 9999px;

  /* 动效阶梯与物理曲线 */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.25, 1, 0.5, 1);
  --dur-fast: 180ms;
  --dur-base: 320ms;
  --dur-slow: 600ms;

  /* 分级 z-index 体系 */
  --z-base: 1;
  --z-nav: 50;
  --z-cursor: 90;
  --z-modal: 100;
  --z-toast: 110;
}

:root[data-theme='light'] {
  --color-bg: #f5f3ef;                      /* 暖纸象牙白 */
  --color-bg-secondary: #eae6df;
  --color-surface: rgba(255, 255, 255, 0.72);
  --color-surface-hover: rgba(255, 255, 255, 0.9);
  --color-surface-solid: #ffffff;
  --color-border: rgba(18, 26, 40, 0.08);
  --color-border-glow: rgba(181, 118, 46, 0.3);

  --color-text: #1a2230;                    /* 枯墨深灰 */
  --color-text-muted: #5e6b7d;
  --color-text-dim: #94a3b8;

  --color-accent: #b5762e;                  /* 熟褐暖金 */
  --color-accent-high: #784812;
  --color-accent-ink: #ffffff;
  --color-accent-glow: rgba(181, 118, 46, 0.15);
}
```

---

## 3. Global Navigation Archetype: N5 Floating Pill

- **形态:** 顶部居中或贴边浮动的紧凑型毛玻璃胶囊（`backdrop-filter: var(--backdrop-blur)`，带 `1px` 微霜冰雾边缘）。
- **滚动自适应:** 页面向下滚动超过 80px 时，胶囊平滑缩小内边距并加深毛玻璃浓度，彻底避免任何切断背景山川视距的横贯式通栏。
- **动效反馈:** 鼠标悬停项目时，底色微光指示滑块（Sliding Indicator）随指针平滑滑动，点击带 1px 物理按压反馈。

---

## 4. Microinteractions & Motion Stance

1. **光标系统 (Cursor System):**
   - 彻底废除旧版具有延迟滞后感的追随圆环（`ringX += (mouseX - ringX) * 0.14`）。
   - 升级为**柔性流体微光浮标**：即时响应、零滞后；掠过可交互链接、按钮、卡片时，平滑展开为半透明高亮磁吸外罩。
2. **纸飞机航标 (Plane Indicator):**
   - 不在全局页面乱飞掠夺视线；收敛为精巧的折纸航标微型印记，在文章序号与路由跳转时作为静谧的航迹伴随。
3. **首屏粒子场 (Particle Field):**
   - Three.js 粒子山升级为柔性星尘微粒，鼠标推开水面微澜，滚动时平滑随视差淡入黑夜。
   - 严格尊重 `prefers-reduced-motion: reduce`，在动效减弱模式下静默退化为高画质摄影。

---

## 5. Implementation Rules
- **Non-destructive:** 保持所有 API、Pinia Store、路由结构与测试用例完全兼容。
- **No Inline improvisation:** 所有颜色均引用全局令牌，严禁再行发明野生的 hex/rgba。
- **Zero AI-slop:** 严禁斜体大标题、严禁通栏紫蓝渐变、严禁假窗口模拟点。
