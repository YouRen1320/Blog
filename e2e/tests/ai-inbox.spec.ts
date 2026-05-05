import { test, expect } from '@playwright/test'

/**
 * AI 草稿主链路 e2e。
 *
 * 前提:ai-service 起着 + USE_MOCK_LLM=true(本地不烧 quota,CI 也快)。
 * mock 模式下 article_generator 返 [MOCK] 前缀的固定草稿。
 *
 * 如果 ai-service 没起,/admin/ai/drafts 会返 503,这条 test 应当看到错误提示。
 * 我们用 try/catch:能跑通就检查内容,跑不通就 skip(避免阻塞主 e2e)。
 */

const ADMIN_URL = 'http://localhost:5174'
const ADMIN_EMAIL = 'admin@iyouren.top'
const ADMIN_PASSWORD = 'admin12345'

test.describe('AI 草稿生成', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`)
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(`${ADMIN_URL}/dashboard`, { timeout: 10_000 })
  })

  test('普通生成 → mock 草稿落库 → 列表可见', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/inbox`)
    const promptInput = page.locator('input.prompt')
    await promptInput.fill('e2e 测试 — 写一篇 AI 草稿')

    await page.click('button:has-text("生成草稿")')
    // mock 模式下立即返回,真模式 30s+;给宽限 20s 双向兼容
    await expect(page.locator('text=[MOCK]').first()).toBeVisible({ timeout: 20_000 })
  })

  test('流式生成 → 实时预览面板出现 → 落库后跳转入口可见', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/inbox`)
    await page.locator('input.prompt').fill('e2e 测试 — 流式生成')
    await page.click('button:has-text("流式生成")')
    // 流式预览面板带"STREAMING"kicker
    await expect(page.locator('text=STREAMING')).toBeVisible({ timeout: 10_000 })
    // 流末出现"进入编辑器"链接
    await expect(page.locator('text=进入编辑器')).toBeVisible({ timeout: 30_000 })
  })
})
