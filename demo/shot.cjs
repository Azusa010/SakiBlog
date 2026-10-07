// 临时截图脚本:渲染 redesign demo 到 PNG 供目检,验证后可删
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const file = 'file:///' + path.resolve(__dirname, 'redesign-v1.html').replace(/\\/g, '/');
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800); // 等字体与浮现动画
  const out = path.resolve(__dirname, 'shot');
  // 中档滤镜下的各区块
  await page.screenshot({ path: out + '-hero.png' });
  await page.locator('#index').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: out + '-index.png' });
  await page.locator('#parts').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.screenshot({ path: out + '-parts.png' });
  // 整页长图:强制显现所有浮现元素
  await page.evaluate(() => document.querySelectorAll('.rv').forEach((el) => el.classList.add('in')));
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-full.png', fullPage: true });
  // 深档滤镜首屏
  await page.click('button[data-g="deep"]');
  await page.waitForTimeout(600);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: out + '-hero-deep.png' });
  // 移动端首屏
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(file, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: out + '-mobile.png' });
  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
