import process from 'node:process'
import { test, expect } from '@playwright/test'

/**
 * 管理端核心流程回归(NFR-TEST-002):
 * 登录、文章创建与发布、撤回、删除、退出。
 * 凭据可用环境变量覆盖;默认对应本地开发库的管理员。
 */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'saki'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'sakiblog123'

async function login(page: import('@playwright/test').Page, password = ADMIN_PASSWORD) {
  await page.goto('/admin/login')
  await page.getByLabel('用户名').fill(ADMIN_USERNAME)
  await page.getByLabel('密码').fill(password)
  await page.getByRole('button', { name: '登录' }).click()
}

test('未登录访问管理页跳转登录,错误密码被拒绝,登录成功进入列表,可退出', async ({ page }) => {
  await page.goto('/admin/posts')
  await expect(page).toHaveURL(/\/admin\/login/)

  await login(page, 'definitely-wrong')
  await expect(page.getByRole('alert')).toContainText('用户名或密码错误')

  await page.getByLabel('密码').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/admin\/posts/)
  await expect(page.getByRole('heading', { name: '文章管理' })).toBeVisible()

  await page.getByRole('button', { name: '退出' }).click()
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('创建→发布→公开可见(含目录)→撤回→删除', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/admin\/posts/)

  // 新建草稿
  await page.getByRole('link', { name: '+ 新建文章' }).click()
  await page.getByLabel('标题').fill('端到端回归文章')
  await page.getByLabel('摘要').fill('用于核心回归测试')
  await page.getByLabel('分类').selectOption({ label: '技术' })
  await page.getByLabel(/正文/).fill('## 回归小节\n\n这是回归测试的正文。')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByRole('status')).toContainText('已保存为草稿')

  // 回列表发布
  await page.getByRole('link', { name: '返回列表' }).click()
  const row = page.locator('li', { hasText: '端到端回归文章' })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: '发布' }).click()
  await expect(row.locator('.badge')).toHaveText('已发布')

  // 公开列表可见,详情含目录
  await page.goto('/posts')
  const publicLink = page.locator('.post-card .post-title a', { hasText: '端到端回归文章' })
  await expect(publicLink).toBeVisible()
  await publicLink.click()
  await expect(page.locator('nav[aria-label="文章目录"]')).toContainText('回归小节')

  // 撤回后公开端不可见
  await page.goto('/admin/posts')
  await row.getByRole('button', { name: '撤回' }).click()
  await expect(row.locator('.badge')).toHaveText('已撤回')
  await page.goto('/posts')
  await expect(page.locator('.post-card .post-title a', { hasText: '端到端回归文章' })).toHaveCount(0)

  // 删除(原生 confirm 对话框)
  await page.goto('/admin/posts')
  page.once('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: '删除' }).click()
  await expect(page.locator('li', { hasText: '端到端回归文章' })).toHaveCount(0)
})
