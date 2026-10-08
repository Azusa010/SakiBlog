import { chromium } from '@playwright/test'
const base = 'http://localhost:5175'
const out = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const browser = await chromium.launch()
async function shot(name, url, opts = {}) {
  const { w = 1440, h = 900, scrollTo = null } = opts
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark' })
  await page.goto(base + url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(4000)
  if (scrollTo) {
    await page.evaluate((sel) => { document.querySelector(sel)?.scrollIntoView({ behavior: 'instant', block: 'start' }) }, scrollTo)
    await page.waitForTimeout(1400)
  }
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
  console.log('shot', name)
}
await shot('d1-home-hero', '/')
await shot('d2-posts', '/posts')
await shot('d3-post-detail', '/posts/5')
await shot('d4-projects', '/projects')
await browser.close()
console.log('done')
