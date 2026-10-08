# SakiBlog Design & Architecture Plan

## 1. Design System & Aesthetic (The "Read")
- **Vibe:** Dark Tech, Editorial, Premium Consumer, "Volume IV — Serenity"
- **Colors:** Deep slate/black base (`#03070d`), subtle blue/slate accents, white/slate text.
- **Typography:** 
  - Display: `Cormorant Garamond` (Elegant, Editorial)
  - Accent: `EB Garamond` italic
  - Functional/Eyebrow: Monospace (tracking-widest, uppercase)
- **Dials (taste-skill):** 
  - `DESIGN_VARIANCE: 7` (Asymmetric hero, strong typography)
  - `MOTION_INTENSITY: 6` (GSAP ScrollTriggers, Container Animations)
  - `VISUAL_DENSITY: 4` (High negative space, large typography)

## 2. Home Page Structure
1. **Hero Section:**
   - Left-aligned text, right-aligned image.
   - Max 2-line headline, short subtext.
   - Entrance animation: `gsap.fromTo` stagger.
2. **Mood Board (Horizontal Pan):**
   - **Layout:** GSAP ScrollTrigger `pin: true` with horizontal track movement.
   - **Content:** Decoupled from projects. Uses a dedicated `moodVideos` array to focus entirely on atmosphere and serenity.
   - **Media:** Full-bleed video/GIF backgrounds.
   - **Text:** Minimalist. A single evocative word (e.g., "Breathe.", "Observe.") perfectly centered.

## 3. Asset Management Plan (Videos)
### Directory Structure
All video assets should be placed in the `public` directory to bypass Vite's asset bundling and allow direct streaming.
- `public/videos/sakiblog-loop.mp4`
- `public/videos/personal-agent-loop.mp4`
- `public/videos/sakiflow-loop.mp4`

### Implementation Steps (Pending User Asset Creation)
1. User sources or generates abstract tech loop videos (e.g., via Runway, Pexels).
2. User places `.mp4` files into `public/videos/`.
3. Update `src/data/projects.ts` to include a `videoUrl` property:
   ```typescript
   export interface ProjectItem {
     // ... existing fields
     videoUrl?: string
   }
   ```
4. Update `HomeView.vue` to bind the video `src` dynamically:
   ```html
   <video :src="project.videoUrl || '/videos/default-loop.mp4'" loop muted playsinline></video>
   ```

## 4. GSAP Motion Rules
- Never use `window.addEventListener("scroll")`. Always use `ScrollTrigger`.
- Use `containerAnimation` for elements inside the pinned horizontal track.
- Always clean up GSAP contexts in `onBeforeUnmount` using `ctx.revert()`.
