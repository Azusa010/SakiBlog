<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

/**
 * 404 = 飞机失联:雾中半沉的飞机 + SIGNAL LOST 遥测 + 航线跑马灯。
 * 文案保持 e2e 断言所依赖的「页面不存在」「返回首页」。
 */
const route = useRoute()
</script>

<template>
  <section class="nf">
    <div class="nf-fog nf-fog-a" aria-hidden="true"></div>
    <div class="nf-fog nf-fog-b" aria-hidden="true"></div>

    <svg class="nf-plane" viewBox="0 0 220 120" aria-hidden="true">
      <path
        d="M8 96 C 70 78 130 48 178 26"
        fill="none"
        stroke="currentColor"
        stroke-opacity="0.3"
        stroke-width="1"
        stroke-dasharray="3 9"
      />
      <path d="M182 24 L214 12 L196 40 L188 30 Z" fill="currentColor" />
    </svg>

    <h1>页面不存在</h1>
    <p class="nf-telemetry">SIGNAL LOST /// 航线 {{ route.fullPath }} 未在航图上</p>
    <p class="nf-desc">你访问的地址没有对应的页面,飞机在这里失联了。</p>
    <RouterLink class="nf-home" to="/">返回首页</RouterLink>

    <div class="nf-marquee" aria-hidden="true">
      <div class="nf-marquee-track">
        <span>SIGNAL LOST /// 返回航线 /// SIGNAL LOST /// 返回航线 ///&nbsp;</span>
        <span>SIGNAL LOST /// 返回航线 /// SIGNAL LOST /// 返回航线 ///&nbsp;</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nf {
  position: relative;
  min-height: 62vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) 0;
  overflow: clip;
}

.nf-plane {
  width: clamp(150px, 18vw, 230px);
  color: var(--color-text);
  opacity: 0.85;
  transform: rotate(14deg) translateY(6px);
  margin-bottom: calc(-1 * var(--space-6));
}

.nf-fog {
  position: absolute;
  left: -10%;
  right: -10%;
  height: 46%;
  bottom: 8%;
  pointer-events: none;
  filter: blur(6px);
}

.nf-fog-a {
  background: radial-gradient(60% 80% at 30% 60%, var(--color-surface), transparent 70%);
}

.nf-fog-b {
  background: radial-gradient(70% 90% at 74% 45%, var(--color-surface), transparent 72%);
}

@media (prefers-reduced-motion: no-preference) {
  .nf-fog-a {
    animation: fog-drift 13s ease-in-out infinite alternate;
  }

  .nf-fog-b {
    animation: fog-drift 17s ease-in-out 2s infinite alternate-reverse;
  }
}

@keyframes fog-drift {
  from {
    transform: translateX(-4%);
  }

  to {
    transform: translateX(5%);
  }
}

.nf-telemetry {
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
}

.nf-desc {
  color: var(--color-text-muted);
}

.nf-home {
  display: inline-block;
  margin-top: var(--space-4);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.22em;
}

.nf-home:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

/* 航线跑马灯:全站仅此一条 */
.nf-marquee {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-top: 1px solid var(--color-border);
  padding: var(--space-2) 0;
}

.nf-marquee-track {
  display: flex;
  width: max-content;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.3em;
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .nf-marquee-track {
    animation: nf-marquee 16s linear infinite;
  }

  .nf-marquee:hover .nf-marquee-track {
    animation-play-state: paused;
  }
}

@keyframes nf-marquee {
  to {
    transform: translateX(-50%);
  }
}
</style>
