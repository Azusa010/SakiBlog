import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = 'http://localhost:5175'
const out = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()

async function shot(name, url, opts = {}) {
  const { w = 1440, h = 900, scrollTo = null, wait = 4000, postWait = 1400 } = opts
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  try {
    await page.goto(base + url, { waitUntil: 'networkidle', timeout: 20000 })
  } catch {}
  await page.waitForTimeout(wait)
  if (scrollTo) {
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, scrollTo)
    await page.waitForTimeout(postWait)
  }
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
  console.log('shot', name)
}

// Desktop
await shot('01-home-hero', '/')
await shot('02-home-projects', '/', { scrollTo: '#stream-projects' })
await shot('03-home-posts', '/', { scrollTo: '#stream-posts' })
await shot('04-home-manifesto', '/', { scrollTo: '#stream-manifesto' })
await shot('05-posts', '/posts', { wait: 3000 })
await shot('06-post-detail', '/posts/5', { wait: 3000 })
await shot('07-projects', '/projects', { wait: 3000 })
await shot('08-about', '/about', { wait: 3000 })
await shot('09-categories', '/categories', { wait: 3000 })

// Mobile
await shot('10-m-home-hero', '/', { w: 390, h: 844 })
await shot('11-m-posts', '/posts', { w: 390, h: 844, wait: 3000 })

await browser.close()
console.log('done')
