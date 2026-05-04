import { defineConfig, devices } from '@playwright/test'

/**
 * 跨 admin + web 的端到端测试配置。
 *
 * 跑前提条件:
 * 1. Postgres 容器已 up:`pnpm db:up`
 * 2. 数据库 seed 过(只有这样才有 admin@iyouren.top 账号):`pnpm --filter api db:seed`
 * 3. 三个服务已起:
 *    - API:    `pnpm --filter api start:prod` (3000)
 *    - Admin:  `pnpm --filter admin dev`      (5174)
 *    - Web:    `pnpm --filter web preview`    (3100,需先 build)
 *
 * 一键脚本 `pnpm e2e:start` 会按顺序起服务。
 *
 * 启用 reuseExistingServer 让 Playwright 检测到已有服务时直接复用,
 * CI 环境下没有外部服务时由 webServer 自动启动。
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // e2e 之间共享 DB,严格串行
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter api start:prod',
      url: 'http://127.0.0.1:3000/articles',
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: __dirname,
    },
    {
      command: 'pnpm --filter admin dev',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: __dirname,
    },
    {
      command: 'pnpm --filter web preview',
      url: 'http://localhost:3100',
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: __dirname,
    },
  ],
})
