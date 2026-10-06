import { test, expect } from '@playwright/test'

/**
 * 公开前台核心流程回归(NFR-TEST-002):
 * 首页、文章列表、文章详情、分类筛选、标签筛选、搜索、主题切换、异常页面。
 * 依赖开发库种子数据(技术/教程/随笔分类,fastapi/vue/mysql/typescript/笔记 标签)。
 */

test('首页展示博客简介与最新文章', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('在文字中,遇见更大的世界。')
  await expect(page.getByRole('heading', { name: '最新文章' })).toBeVisible()
  await expect(page.locator('.post-card').first()).toBeVisible()
})

test('文章列表按发布时间从新到旧', async ({ page }) => {
  await page.goto('/posts')
  const titles = page.locator('.post-card .post-title')
  await expect(titles.first()).toContainText('周末爬山的随笔')
  expect(await titles.count()).toBeGreaterThanOrEqual(5)
})

test('文章详情展示正文、目录与上下篇', async ({ page }) => {
  await page.goto('/posts')
  await page.locator('.post-card .post-title a').first().click()
  await expect(page.locator('.post-content')).toBeVisible()
  // 邻居导航:除仅有一篇文章外都应至少渲染一侧
  await expect(page.locator('nav[aria-label="上下篇"]')).toBeVisible()
  await page.getByRole('link', { name: '返回文章列表' }).click()
  await expect(page).toHaveURL(/\/posts/)
})

test('分类筛选展示数量与文章', async ({ page }) => {
  await page.goto('/categories')
  await page.getByRole('link', { name: /^技术/ }).click()
  await expect(page.locator('h1')).toContainText('分类:技术')
  await expect(page.locator('.result-count')).toContainText('2 篇')
  await expect(page.locator('.post-card')).toHaveCount(2)
})

test('标签筛选展示数量与文章', async ({ page }) => {
  await page.goto('/tags')
  await page.getByRole('link', { name: /^笔记/ }).click()
  await expect(page.locator('h1')).toContainText('标签:笔记')
  await expect(page.locator('.result-count')).toContainText('3 篇')
  await expect(page.locator('.post-card')).toHaveCount(3)
})

test('搜索:空关键词不触发,有关键词展示结果', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('搜索文章').fill('   ')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByLabel('搜索文章').fill('MySQL')
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page).toHaveURL(/\/search\?q=MySQL/)
  await expect(page.locator('.result-count')).toContainText('1 篇')
  await expect(page.locator('.post-card').first()).toContainText('MySQL 索引优化笔记')
})

test('搜索无结果提供返回入口', async ({ page }) => {
  await page.goto('/search?q=绝对不存在的关键词xyz')
  await expect(page.getByText('没有找到匹配的文章')).toBeVisible()
  await expect(page.getByRole('link', { name: '浏览全部文章' })).toBeVisible()
})

test('主题切换立即生效并在刷新后保持', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const initial = await html.getAttribute('data-theme')
  expect(initial).toMatch(/light|dark/)

  await page.getByRole('button', { name: /切换到/ }).click()
  const switched = html
  await expect(switched).not.toHaveAttribute('data-theme', initial)

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', switched ?? 'dark')
})

test('不存在的文章与不存在的页面均有明确状态', async ({ page }) => {
  await page.goto('/posts/999999')
  await expect(page.getByRole('heading', { name: '文章不存在' })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回文章列表' })).toBeVisible()

  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible()
})
