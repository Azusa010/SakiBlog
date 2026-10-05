import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* 回归测试涉及共享的开发数据库,固定串行保证结果确定 */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    // 核心回归先覆盖 chromium;需要多浏览器时再放开 firefox / webkit 项目
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'uv run uvicorn app.main:app --port 8000',
      cwd: 'backend',
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      /**
       * Use the dev server by default for faster feedback loop.
       * Use the preview server on CI for more realistic testing.
       * Playwright will re-use the local server if there is already a dev-server running.
       */
      command: process.env.CI ? 'npm run preview' : 'npm run dev',
      port: process.env.CI ? 4173 : 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
  ],
})
