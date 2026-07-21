# Blog Loading Demo Design

| 项目 | 内容 |
| --- | --- |
| 日期 | 2026-07-21 |
| 状态 | Approved (design conversation) |
| 范围 | `demo/loading/` 独立全屏首屏 Loading 演示 |

## 1. Goal

Deliver a standalone, zero-build sci-fi starfield full-screen first-load loading demo for SakiBlog. Opening the HTML file in a browser should show a cinematic loading sequence, then transition into a minimal fake blog home page to prove completion.

This demo is for visual exploration and future reference. It is not wired into the Vue app or backend APIs.

## 2. Constraints

- Single file: `demo/loading/index.html` (structure + CSS + JS inline)
- No build step, no npm install, no external CDN dependencies
- Native Canvas 2D + CSS animations + small amount of vanilla JS
- Works by double-click / `file://` or any static server
- Respect `prefers-reduced-motion: reduce`

## 3. Chosen Approach

**Approach A — Canvas starfield + dual energy rings (selected)**

Alternatives considered:

| Approach | Summary | Why not |
| --- | --- | --- |
| B — Pure CSS stars + spinner | Lightest | Weaker depth and sci-fi atmosphere |
| C — Three.js / WebGL nebula | Strongest visuals | Too heavy for a single-file demo |

## 4. Information Architecture

```
demo/loading/
  index.html
```

Two page states in one document:

1. **Loading** — full-viewport overlay (starfield, rings, progress, copy)
2. **Ready** — overlay faded out; simple fake blog home visible underneath

## 5. Visual Design

### 5.1 Background

- Near-black to deep navy gradient (`#020617` → `#0f172a`)
- Canvas with three star layers (far / mid / near):
  - Slow drift
  - Subtle twinkle
- Optional soft radial glow behind the center UI

### 5.2 Center UI

- Dual energy rings:
  - Outer ring clockwise
  - Inner ring counter-clockwise
  - Thin stroke with dashed/highlight segments
- Brand title: `SakiBlog` (tech / monospace feel)
- Subcopy: `INITIALIZING...` (or equivalent Chinese “系统初始化中”)
- Thin progress bar + numeric percent (0% → 100%)
- `Skip` control visible during loading

### 5.3 Fake home (Ready)

Minimal blog shell only enough to show transition success:

- Top nav bar (site name + a few links)
- A short hero or title area
- 2–3 fake article cards (title, date, excerpt placeholders)

## 6. Motion Timeline

Target total duration: **2.5–3.5 seconds** (excluding manual skip).

| Phase | Timing | Behavior |
| --- | --- | --- |
| Enter | 0–0.3s | Starfield and rings fade in |
| Progress | 0.3s → complete | Eased progress 0→100% with optional micro-pauses |
| Complete flash | at 100% | Brief ring contract / light flash |
| Exit | ~0.6s | Overlay fade-out reveals fake home |
| Idle Ready | after exit | Show `Replay` control |

Easing: ease-out or custom ease for progress (not linear only).

## 7. Interaction

| Input | Result |
| --- | --- |
| Auto | Play full sequence then enter Ready |
| Click `Skip` | Jump to 100% and run exit fade |
| Press `Esc` | Same as Skip |
| Click `Replay` (Ready) | Reset progress, show overlay, replay sequence |

## 8. Accessibility & Motion

When `prefers-reduced-motion: reduce`:

- Disable or greatly reduce star drift, twinkle, and ring spin
- Complete loading quickly (near-instant or very short fade)
- Keep final Ready state reachable without long animation

UI text and controls must remain readable against the dark background (sufficient contrast on title, percent, buttons).

## 9. Technical Notes

- Resize canvas to viewport; redraw stars on resize (regenerate or scale positions)
- Use `requestAnimationFrame` for canvas loop; stop or idle the loop after overlay is gone (optional optimization)
- Progress driven by timer/easing function, not real asset loading
- No network calls

## 10. Out of Scope (YAGNI)

- Real API, router, or Vue integration
- Authentic progress from resource loading
- Three.js / WebGL
- Sound
- Theme toggle, i18n, or production design-system tokens
- Multiple loading variants in one page

## 11. Acceptance Criteria

1. Opening `demo/loading/index.html` runs without a build step.
2. Sci-fi full-screen loading is clear: starfield + dual rings + progress.
3. After completion, overlay fades out and fake blog home is visible.
4. `Skip`, `Esc`, and `Replay` work as specified.
5. Layout stays centered and usable on narrow viewports.
6. `prefers-reduced-motion: reduce` shortens/simplifies motion.

## 12. Future Follow-ups (non-blocking)

- Extract rings/starfield into a Vue component for the real SakiBlog app shell.
- Optionally drive progress from real bootstrap tasks later.
