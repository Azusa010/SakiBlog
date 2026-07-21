# Blog Loading Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone sci-fi starfield full-screen first-load loading demo at `demo/loading/index.html` that auto-plays, supports Skip/Esc/Replay, and reveals a minimal fake blog home.

**Architecture:** Single self-contained HTML file with inline CSS and JS. A full-viewport loading overlay (Canvas starfield + CSS dual rings + progress UI) sits above a static fake blog home. A small state machine drives Loading → Complete → Ready, with timer-based eased progress (not real network loading).

**Tech Stack:** Vanilla HTML5, CSS3, Canvas 2D, vanilla JS. No build tools, no CDN, no Vue.

**Spec:** `docs/superpowers/specs/2026-07-21-blog-loading-demo-design.md`

**Note:** `.gitignore` ignores `demo/` and `docs/`. Use `git add -f` when committing demo files.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `demo/loading/index.html` | Entire demo: fake home markup, loading overlay markup, styles, starfield canvas logic, progress/state machine, Skip/Esc/Replay |

No other files.

---

### Task 1: Scaffold HTML structure and base styles

**Files:**
- Create: `demo/loading/index.html`

- [ ] **Step 1: Create directory and HTML skeleton**

Create `demo/loading/index.html` with this structure (styles/scripts empty shells for now):

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SakiBlog — Loading Demo</title>
  <style>
    /* Task 1–2 styles go here */
  </style>
</head>
<body>
  <!-- Fake blog home (always in DOM, under overlay) -->
  <div id="app" class="app" aria-hidden="true">
    <header class="nav">
      <div class="nav__brand">SakiBlog</div>
      <nav class="nav__links">
        <a href="#">Home</a>
        <a href="#">Archive</a>
        <a href="#">About</a>
      </nav>
    </header>
    <main class="main">
      <section class="hero">
        <p class="hero__eyebrow">Welcome</p>
        <h1 class="hero__title">Notes from the edge of the network</h1>
        <p class="hero__lead">A quiet place for long-form writing and experiments.</p>
      </section>
      <section class="cards" aria-label="Recent posts">
        <article class="card">
          <time datetime="2026-07-18">2026-07-18</time>
          <h2>Building a personal blog from scratch</h2>
          <p>Vue on the front, FastAPI on the back, and a lot of intentional choices in between.</p>
        </article>
        <article class="card">
          <time datetime="2026-07-10">2026-07-10</time>
          <h2>Why loading states matter</h2>
          <p>First impressions are often waiting. Make the wait feel deliberate.</p>
        </article>
        <article class="card">
          <time datetime="2026-07-01">2026-07-01</time>
          <h2>Starfields and other distractions</h2>
          <p>Sometimes the journey into the page is part of the design.</p>
        </article>
      </section>
    </main>
    <button type="button" id="btn-replay" class="btn btn--replay" hidden>Replay</button>
  </div>

  <!-- Loading overlay -->
  <div id="loader" class="loader" role="status" aria-live="polite" aria-busy="true">
    <canvas id="stars" class="loader__canvas" aria-hidden="true"></canvas>
    <div class="loader__center">
      <div class="rings" aria-hidden="true">
        <div class="ring ring--outer"></div>
        <div class="ring ring--inner"></div>
        <div class="ring__glow"></div>
      </div>
      <div class="loader__brand">SakiBlog</div>
      <div class="loader__sub" id="loader-sub">INITIALIZING...</div>
      <div class="loader__progress-wrap">
        <div class="loader__progress-bar" id="progress-bar" style="width: 0%"></div>
      </div>
      <div class="loader__percent" id="progress-text">0%</div>
      <button type="button" id="btn-skip" class="btn btn--skip">Skip</button>
    </div>
  </div>

  <script>
    // Task 3–5 scripts go here
  </script>
</body>
</html>
```

- [ ] **Step 2: Add base CSS reset, fake home layout, and dark page background**

Inside `<style>`, add:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-0: #020617;
  --bg-1: #0f172a;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --card: rgba(15, 23, 42, 0.85);
  --border: rgba(148, 163, 184, 0.2);
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace;
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

html,
body {
  min-height: 100%;
  background: linear-gradient(160deg, var(--bg-0), var(--bg-1));
  color: var(--text);
  font-family: var(--font-sans);
}

body {
  overflow-x: hidden;
}

a {
  color: var(--muted);
  text-decoration: none;
}

a:hover {
  color: var(--accent);
}

.app {
  min-height: 100vh;
  padding: 1.25rem clamp(1rem, 4vw, 3rem) 4rem;
  max-width: 960px;
  margin: 0 auto;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0 1.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}

.nav__brand {
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.nav__links {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.hero__eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.hero__title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.hero__lead {
  color: var(--muted);
  max-width: 36rem;
  margin-bottom: 2.5rem;
}

.cards {
  display: grid;
  gap: 1rem;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem 1.35rem;
}

.card time {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.card h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.card p {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.55;
}

.btn {
  appearance: none;
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.55);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
}

.btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn--replay {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 5;
}
```

- [ ] **Step 3: Open in browser and verify fake home layout**

Run (Windows):

```bash
start demo/loading/index.html
```

Or open the file path manually in Chrome/Edge.

Expected: Dark gradient page with nav, hero, three cards. Overlay may be unstyled/blank for now — that is OK. No console errors from missing elements.

- [ ] **Step 4: Commit scaffold**

```bash
git add -f demo/loading/index.html
git commit -m "feat(demo): scaffold blog loading demo HTML shell"
```

---

### Task 2: Loading overlay visuals (CSS rings + layout)

**Files:**
- Modify: `demo/loading/index.html` (`<style>` section)

- [ ] **Step 1: Add loader overlay, canvas, rings, progress, and reduced-motion CSS**

Append to `<style>`:

```css
.loader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at center, rgba(56, 189, 248, 0.08), transparent 55%),
    linear-gradient(160deg, var(--bg-0), var(--bg-1));
  opacity: 1;
  transition: opacity 0.6s ease;
  pointer-events: auto;
}

.loader.is-exiting {
  opacity: 0;
  pointer-events: none;
}

.loader.is-hidden {
  display: none;
}

.loader__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.loader__center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  width: min(100%, 22rem);
}

.rings {
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  margin-bottom: 1.5rem;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid transparent;
}

.ring--outer {
  border-top-color: var(--accent);
  border-right-color: rgba(56, 189, 248, 0.35);
  animation: spin-cw 2.4s linear infinite;
}

.ring--inner {
  inset: 0.85rem;
  border-bottom-color: #a78bfa;
  border-left-color: rgba(167, 139, 250, 0.4);
  animation: spin-ccw 1.6s linear infinite;
}

.ring__glow {
  position: absolute;
  inset: 1.6rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%);
  filter: blur(2px);
}

.loader.is-complete .rings {
  animation: ring-flash 0.35s ease-out forwards;
}

.loader__brand {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}

.loader__sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
  color: var(--muted);
  margin-bottom: 1.25rem;
}

.loader__progress-wrap {
  width: 100%;
  height: 2px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.loader__progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #38bdf8, #a78bfa);
  border-radius: inherit;
  transition: width 0.05s linear;
}

.loader__percent {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 1.25rem;
  min-height: 1em;
}

.btn--skip {
  opacity: 0.85;
}

@keyframes spin-cw {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-ccw {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes ring-flash {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  60% {
    transform: scale(0.88);
    opacity: 1;
  }
  100% {
    transform: scale(0.75);
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ring--outer,
  .ring--inner {
    animation: none;
  }

  .loader {
    transition-duration: 0.15s;
  }

  .loader__progress-bar {
    transition: none;
  }
}
```

- [ ] **Step 2: Browser check overlay layout**

Open `demo/loading/index.html` again.

Expected:
- Full-screen dark overlay centered with dual spinning rings
- `SakiBlog`, `INITIALIZING...`, progress bar at 0%, `Skip` button
- Fake home not interactable underneath

- [ ] **Step 3: Commit overlay styles**

```bash
git add -f demo/loading/index.html
git commit -m "feat(demo): style sci-fi loading overlay and rings"
```

---

### Task 3: Canvas starfield

**Files:**
- Modify: `demo/loading/index.html` (`<script>` section)

- [ ] **Step 1: Implement starfield module**

Replace/fill `<script>` with starfield first (progress wired in Task 4):

```js
(function () {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {{x:number,y:number,z:number,r:number,a:number,tw:number}[]} */
  let stars = [];
  let rafId = 0;
  let running = false;
  let w = 0;
  let h = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
  }

  function seedStars() {
    const count = Math.floor((w * h) / 3500);
    stars = [];
    for (let i = 0; i < count; i++) {
      const layer = i % 3; // 0 far, 1 mid, 2 near
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: layer,
        r: layer === 0 ? 0.6 : layer === 1 ? 1.1 : 1.6,
        a: layer === 0 ? 0.35 : layer === 1 ? 0.55 : 0.85,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const speeds = [0.02, 0.05, 0.12];
    for (const s of stars) {
      if (!reduceMotion) {
        s.x += speeds[s.z];
        if (s.x > w + 2) s.x = -2;
        s.tw += 0.02 + s.z * 0.01;
      }
      const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(s.tw);
      ctx.beginPath();
      ctx.fillStyle = `rgba(226, 232, 240, ${s.a * twinkle})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (running) rafId = requestAnimationFrame(draw);
  }

  function startStars() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  }

  function stopStars() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  window.addEventListener("resize", resize);
  resize();
  startStars();

  // Expose for loader state machine (Task 4)
  window.__loadingDemo = { startStars, stopStars, reduceMotion };
})();
```

- [ ] **Step 2: Browser check starfield**

Open the file.

Expected:
- Moving/twinkling multi-layer stars behind rings
- Resize window: canvas fills viewport, stars reseed without crash
- With OS “reduce motion” on: stars static or nearly static

- [ ] **Step 3: Commit starfield**

```bash
git add -f demo/loading/index.html
git commit -m "feat(demo): add canvas multi-layer starfield"
```

---

### Task 4: Progress state machine + Skip / Esc / Replay

**Files:**
- Modify: `demo/loading/index.html` (`<script>` section)

- [ ] **Step 1: Append loader controller after starfield IIFE**

Add a second IIFE (or extend the same scope) that owns progress:

```js
(function () {
  const loader = document.getElementById("loader");
  const app = document.getElementById("app");
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  const sub = document.getElementById("loader-sub");
  const btnSkip = document.getElementById("btn-skip");
  const btnReplay = document.getElementById("btn-replay");
  const api = window.__loadingDemo || { reduceMotion: false, startStars() {}, stopStars() {} };

  const DURATION_MS = api.reduceMotion ? 200 : 3000;
  const EXIT_MS = api.reduceMotion ? 150 : 600;
  const FLASH_MS = api.reduceMotion ? 0 : 350;

  let progress = 0;
  let raf = 0;
  let startTs = 0;
  let phase = "idle"; // idle | loading | complete | exiting | ready
  let skipRequested = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Optional micro-pause feel: hold slightly around 40% and 78%
  function shaped(t) {
    if (t < 0.4) return easeOutCubic(t / 0.4) * 0.42;
    if (t < 0.55) return 0.42 + ((t - 0.4) / 0.15) * 0.08;
    if (t < 0.78) return 0.5 + easeOutCubic((t - 0.55) / 0.23) * 0.35;
    return 0.85 + easeOutCubic((t - 0.78) / 0.22) * 0.15;
  }

  function setProgress(p) {
    progress = Math.max(0, Math.min(1, p));
    const pct = Math.round(progress * 100);
    bar.style.width = pct + "%";
    text.textContent = pct + "%";
  }

  function setAppAccessible(ready) {
    app.setAttribute("aria-hidden", ready ? "false" : "true");
    loader.setAttribute("aria-busy", ready ? "false" : "true");
  }

  function tick(now) {
    if (phase !== "loading") return;
    if (skipRequested) {
      finishLoading(true);
      return;
    }
    const t = Math.min(1, (now - startTs) / DURATION_MS);
    setProgress(api.reduceMotion ? t : shaped(t));
    if (t >= 1) {
      finishLoading(false);
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function finishLoading(fromSkip) {
    phase = "complete";
    setProgress(1);
    sub.textContent = fromSkip ? "SKIPPED" : "READY";
    btnSkip.hidden = true;

    const afterFlash = () => {
      phase = "exiting";
      loader.classList.add("is-exiting");
      loader.classList.remove("is-complete");
      window.setTimeout(enterReady, EXIT_MS);
    };

    if (fromSkip || FLASH_MS === 0) {
      afterFlash();
    } else {
      loader.classList.add("is-complete");
      window.setTimeout(afterFlash, FLASH_MS);
    }
  }

  function enterReady() {
    phase = "ready";
    loader.classList.add("is-hidden");
    loader.classList.remove("is-exiting");
    btnReplay.hidden = false;
    setAppAccessible(true);
    api.stopStars();
  }

  function startLoading() {
    if (raf) cancelAnimationFrame(raf);
    skipRequested = false;
    phase = "loading";
    progress = 0;
    setProgress(0);
    sub.textContent = "INITIALIZING...";
    btnSkip.hidden = false;
    btnReplay.hidden = true;
    loader.classList.remove("is-hidden", "is-exiting", "is-complete");
    setAppAccessible(false);
    api.startStars();
    startTs = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function requestSkip() {
    if (phase !== "loading") return;
    skipRequested = true;
  }

  btnSkip.addEventListener("click", requestSkip);
  btnReplay.addEventListener("click", startLoading);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") requestSkip();
  });

  startLoading();
})();
```

Behavior checklist (must match spec):
- Auto duration ~3s (or ~200ms if reduced motion)
- Skip/Esc: jump to 100%, **no** complete-flash, exit fade only
- Natural complete: brief ring flash, then exit fade
- Replay: reset and play again; stars restart

- [ ] **Step 2: Manual interaction verification**

Open `demo/loading/index.html` and verify:

| Check | Expected |
| --- | --- |
| Auto play | Progress 0→100 in ~2.5–3.5s, flash, fade, home visible |
| Skip click | Immediate 100%, fade without flash delay, home visible |
| Esc during load | Same as Skip |
| Replay | Overlay returns, stars move, progress restarts |
| Reduced motion | Short sequence, little/no spin/drift |

- [ ] **Step 3: Commit controller**

```bash
git add -f demo/loading/index.html
git commit -m "feat(demo): add loading progress, skip, esc, and replay"
```

---

### Task 5: Polish and acceptance pass

**Files:**
- Modify: `demo/loading/index.html` (only if gaps found)

- [ ] **Step 1: Run full acceptance checklist from spec §11**

1. Open `demo/loading/index.html` with no build — works on `file://`
2. Starfield + dual rings + progress clearly visible
3. Overlay fades; fake home readable
4. Skip, Esc, Replay all work
5. Narrow viewport (~375px width): center UI not clipped; nav wraps or stays usable
6. Reduced motion path is short/simple

- [ ] **Step 2: Fix any visual/interaction gaps found in Step 1**

Common fixes if needed:
- Increase z-index / ensure canvas behind center UI
- Prevent body scroll while loader visible (`body { overflow: hidden }` toggled in JS)
- Ensure Replay stays clickable above content

- [ ] **Step 3: Final commit (if changes) or skip**

```bash
git add -f demo/loading/index.html
git commit -m "fix(demo): polish loading demo acceptance details"
```

If no changes needed, skip commit.

---

## Done when

- `demo/loading/index.html` exists and meets all acceptance criteria in the spec
- Commits created with `git add -f` as needed
- No Vue/backend integration introduced
