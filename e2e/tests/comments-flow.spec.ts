import { test, expect } from '@playwright/test'

/**
 * 评论审核全流程 e2e。
 *
 * 1. web 端打开第一灯文章,提交一条评论(必填昵称 + 邮箱 + 正文)
 * 2. admin /comments 页能看到 PENDING 评论(带 ip + email)
 * 3. admin 点"通过",评论变 APPROVED
 * 4. web 端刷新,匿名访客看到这条评论(authorName + content,但 email 不显示)
 *
 * 用唯一 stamp 确保不同 e2e run 之间评论不会污染验证。
 */

const ADMIN_URL = 'http://localhost:5174'
const WEB_URL = 'http://localhost:3100'
const ADMIN_EMAIL = 'admin@iyouren.top'
const ADMIN_PASSWORD = 'admin12345'

const stamp = Date.now()
const COMMENT_AUTHOR = `E2E Bot ${stamp}`
const COMMENT_CONTENT = `e2e 测试评论 ${stamp},自动生成,审核完应公开。`

test('评论 → 审核 → 公开可见', async ({ page }) => {
  // ── 1. web 端提交评论 ──────────────────────────────
  await page.goto(`${WEB_URL}/writing/hello-blog`)
  // 滚到评论区
  const form = page.locator('section.comments form')
  await form.scrollIntoViewIfNeeded()
  await form.locator('input[type=text]').fill(COMMENT_AUTHOR)
  await form.locator('input[type=email]').fill('e2e@example.com')
  await form.locator('textarea').fill(COMMENT_CONTENT)
  await form.locator('button:has-text("提交评论")').click()

  // 提示出现 + 评论默认 PENDING(列表里看不到)
  await expect(page.locator('text=审核通过后会公开显示')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator(`text=${COMMENT_CONTENT}`)).toHaveCount(0)

  // ── 2. 切到 admin 登录 ─────────────────────────────
  await page.goto(`${ADMIN_URL}/login`)
  await page.fill('input[type=email]', ADMIN_EMAIL)
  await page.fill('input[type=password]', ADMIN_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(`${ADMIN_URL}/dashboard`, { timeout: 10_000 })

  // ── 3. /comments 看到 PENDING ──────────────────────
  await page.goto(`${ADMIN_URL}/comments`)
  // 默认进来就是 PENDING 过滤
  const pendingCard = page.locator('article.item', { hasText: COMMENT_CONTENT })
  await expect(pendingCard).toBeVisible({ timeout: 10_000 })
  await expect(pendingCard.locator('text=PENDING')).toBeVisible()

  // ── 4. 通过审核 ─────────────────────────────────────
  await pendingCard.locator('button:has-text("通过")').click()
  // approve 后列表会刷新,但当前 PENDING filter 下这条应该不在了
  await expect(pendingCard).toHaveCount(0, { timeout: 10_000 })

  // ── 5. web 端刷新,匿名访客看到 ──────────────────────
  // 用 incognito context 模拟匿名访客
  await page.context().clearCookies()
  await page.goto(`${WEB_URL}/writing/hello-blog`, { waitUntil: 'networkidle' })
  const visible = page.locator(`text=${COMMENT_CONTENT}`)
  await expect(visible).toBeVisible({ timeout: 10_000 })
  // 邮箱不应该显示出来
  await expect(page.locator('text=e2e@example.com')).toHaveCount(0)
})
