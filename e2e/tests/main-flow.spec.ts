import { test, expect } from '@playwright/test'

/**
 * V1 主链路 e2e:
 * 登录 admin → 在 admin 内新建文章 → 发布 → 跳到 web 验证可见 → 删除 → 验证不再可见
 *
 * 假设:
 * - api / admin / web 已起(由 playwright.config.ts 的 webServer 处理)
 * - 数据库已 seed(管理员 admin@iyouren.top / admin12345 存在)
 *
 * 这条测试触达每一层:
 *   admin UI → axios → API (NestJS) → Prisma → Postgres
 *   web UI   → useFetch (SSR/CSR) → API → Prisma → Postgres
 */

const ADMIN_URL = 'http://localhost:5174'
const WEB_URL = 'http://localhost:3100'
const ADMIN_EMAIL = 'admin@iyouren.top'
const ADMIN_PASSWORD = 'admin12345'

// 用时间戳让 slug 唯一,避免和其他 test run 残留冲突
const stamp = Date.now()
const ARTICLE_TITLE = `E2E 测试文章 ${stamp}`
const ARTICLE_SLUG = `e2e-test-${stamp}`
const ARTICLE_CONTENT = '# E2E\n这是 Playwright 自动生成的测试文章。'

test('完整发布主链路', async ({ page }) => {
  // ── 1. 登录 admin ───────────────────────────────────
  await page.goto(`${ADMIN_URL}/login`)
  await expect(page).toHaveTitle(/Admin/i)
  await page.fill('input[type=email]', ADMIN_EMAIL)
  await page.fill('input[type=password]', ADMIN_PASSWORD)
  await page.click('button[type=submit]')

  await page.waitForURL(`${ADMIN_URL}/dashboard`, { timeout: 10_000 })
  await expect(page.locator('text=已发布')).toBeVisible()

  // ── 2. 进入新建编辑器 ─────────────────────────────────
  await page.goto(`${ADMIN_URL}/editor`)
  await page.fill('input.title-input', ARTICLE_TITLE)
  await page.fill('input[placeholder*=slug]', ARTICLE_SLUG)
  await page.fill('textarea.content-area', ARTICLE_CONTENT)

  // 保存(还没 id,触发新建)
  await page.click('button:has-text("保存")')
  await page.waitForURL(/\/editor\/.+/, { timeout: 10_000 })

  // ── 3. 发布 ────────────────────────────────────────
  await page.click('button:has-text("发布")')
  // 发布成功后,"发布"按钮变成"下线"。等这个状态变化才算完成,
  // 不能等 text=PUBLISHED —— 那个文本作为 meta label 一直可见。
  await expect(page.locator('button:has-text("下线")')).toBeVisible({ timeout: 10_000 })

  // ── 4. 在 web 上验证可见 ─────────────────────────────
  await page.goto(`${WEB_URL}/writing/${ARTICLE_SLUG}`)
  // 用页面顶部的 .title 而不是泛 h1,因为 markdown 正文也会出 h1
  await expect(page.locator('h1.title')).toContainText(ARTICLE_TITLE)
  await expect(page.locator('.prose')).toContainText('Playwright 自动生成的测试文章')

  // ── 5. 列表页也能看到 ────────────────────────────────
  await page.goto(`${WEB_URL}/writing`)
  await expect(page.locator(`text=${ARTICLE_TITLE}`)).toBeVisible()

  // ── 6. 回 admin 删掉 ────────────────────────────────
  await page.goto(`${ADMIN_URL}/articles`)
  // 删除按钮触发原生 confirm,提前注册"确认"
  page.on('dialog', (dialog) => dialog.accept())
  await page.locator(`text=${ARTICLE_TITLE}`).first().scrollIntoViewIfNeeded()
  // 同行的"删除"按钮:用 has-text 在 article row 范围内点
  const row = page.locator('.row.body', { hasText: ARTICLE_TITLE })
  await row.locator('button:has-text("删除")').click()

  // 等列表里看不到这篇
  await expect(page.locator(`text=${ARTICLE_TITLE}`)).toHaveCount(0, { timeout: 10_000 })

  // ── 7. web 也看不到 ─────────────────────────────────
  const res = await page.request.get(`${WEB_URL}/writing/${ARTICLE_SLUG}`)
  expect(res.status()).toBe(404)
})

test('未登录访问 admin 受保护页跳 /login', async ({ page }) => {
  await page.goto(`${ADMIN_URL}/dashboard`)
  await page.waitForURL(/\/login/, { timeout: 5_000 })
  expect(page.url()).toContain('/login')
})

test('web 列表页能拉到 seed 文章', async ({ page }) => {
  await page.goto(`${WEB_URL}/writing`)
  // seed 里有"你好,博客"published
  await expect(page.locator('text=你好,博客')).toBeVisible({ timeout: 10_000 })
})
