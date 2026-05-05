import { test, expect } from '@playwright/test'

/**
 * SEO / 订阅源 e2e:
 * - sitemap.xml 包含首页 + 至少一篇已发布文章
 * - feed.xml 是合法 RSS 2.0,channel + item 结构
 *
 * 这条测试不走浏览器渲染,直接打 web 的 SSR endpoint 拿原始 XML。
 */

const WEB_URL = 'http://localhost:3100'

test('GET /sitemap.xml 含首页 + 文章 url', async ({ request }) => {
  const res = await request.get(`${WEB_URL}/sitemap.xml`)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('application/xml')

  const xml = await res.text()
  expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
  expect(xml).toContain('<urlset')
  // 首页
  expect(xml).toMatch(/<loc>https?:\/\/[^<]*\/<\/loc>/)
  // 至少一篇文章 url(seed 里的 hello-blog)
  expect(xml).toContain('/articles/')
})

test('GET /feed.xml 合法 RSS 2.0', async ({ request }) => {
  const res = await request.get(`${WEB_URL}/feed.xml`)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('application/rss+xml')

  const xml = await res.text()
  expect(xml).toContain('<rss version="2.0"')
  expect(xml).toContain('<channel>')
  expect(xml).toContain('<title>')
  expect(xml).toContain('<lastBuildDate>')
  // 至少一个 item(seed 里有第一灯)
  expect(xml).toContain('<item>')
})
