import { test, expect } from '@playwright/test'
import { E2E_ADMIN } from './support/admin'

/**
 * 改密码 e2e —— 故意只测**错误路径**,不真改 admin 密码:
 *
 * 1. 当前密码错 → 401 + UI 显示"当前密码不正确"
 * 2. 新旧密码相同 → 400 + UI 显示"新密码不能与当前密码相同"
 * 3. 新密码不到 8 位 → 客户端校验拦下,根本不发请求
 *
 * 200 路径靠 jest 单测覆盖(apps/api/src/modules/auth/auth.service.spec.ts),
 * 这里测的是**前端校验 + 错误展示链路**。
 */

const ADMIN_URL = 'http://localhost:5174'

test.beforeEach(async ({ page }) => {
  await page.goto(`${ADMIN_URL}/login`)
  await page.fill('input[type=email]', E2E_ADMIN.email)
  await page.fill('input[type=password]', E2E_ADMIN.password)
  await page.click('button[type=submit]')
  await page.waitForURL(`${ADMIN_URL}/dashboard`, { timeout: 10_000 })
  await page.goto(`${ADMIN_URL}/settings`)
})

test('当前密码错 → 401 友好提示', async ({ page }) => {
  // settings 页里改密码三个 input 在 AUTH · 改密码 区块
  const section = page.locator('section.card.group', { hasText: 'AUTH · 改密码' })
  await section.scrollIntoViewIfNeeded()
  await section.locator('input[autocomplete=current-password]').fill('WRONG_PASSWORD_XX')
  const newPwds = section.locator('input[autocomplete=new-password]')
  await newPwds.first().fill('new-pwd-test-12345')
  await newPwds.last().fill('new-pwd-test-12345')
  await section.locator('button:has-text("修改密码")').click()

  await expect(section.locator('text=当前密码不正确')).toBeVisible({ timeout: 10_000 })
})

test('新旧密码相同 → 客户端校验拦下', async ({ page }) => {
  const section = page.locator('section.card.group', { hasText: 'AUTH · 改密码' })
  await section.locator('input[autocomplete=current-password]').fill(E2E_ADMIN.password)
  const newPwds = section.locator('input[autocomplete=new-password]')
  await newPwds.first().fill(E2E_ADMIN.password)
  await newPwds.last().fill(E2E_ADMIN.password)
  await section.locator('button:has-text("修改密码")').click()

  await expect(section.locator('text=新密码不能与当前密码相同')).toBeVisible({ timeout: 5_000 })
})

test('新密码不到 8 位 → 客户端拦下', async ({ page }) => {
  const section = page.locator('section.card.group', { hasText: 'AUTH · 改密码' })
  await section.locator('input[autocomplete=current-password]').fill(E2E_ADMIN.password)
  const newPwds = section.locator('input[autocomplete=new-password]')
  await newPwds.first().fill('short')
  await newPwds.last().fill('short')
  await section.locator('button:has-text("修改密码")').click()

  await expect(section.locator('text=新密码至少 8 位')).toBeVisible({ timeout: 5_000 })
})
