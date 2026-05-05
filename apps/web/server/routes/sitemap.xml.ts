/**
 * /sitemap.xml —— 给搜索引擎的索引地图。
 *
 * 列出所有已发布文章 + 静态页(首页)。base URL 走 runtimeConfig.public.siteUrl
 * (生产由 NUXT_PUBLIC_SITE_URL 覆盖)。
 *
 * 当前流量小,文章量小(<<100),分页拉一遍即可。如果未来文章数 >100,
 * for-while 循环到 totalPages 就行。
 */

interface PublicArticle {
  slug: string;
  publishedAt: string | null;
}

interface PaginatedResp {
  data: PublicArticle[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase as string;
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, "");

  // 拉所有 PUBLISHED 文章。pageSize 上限 100;loop until 末页。
  const articles: PublicArticle[] = [];
  let page = 1;
  while (true) {
    const resp = await $fetch<PaginatedResp>(`${apiBase}/articles`, {
      query: { page, pageSize: 100 },
    });
    articles.push(...resp.data);
    if (page >= resp.meta.totalPages || resp.data.length === 0) break;
    page += 1;
  }

  // 静态 URL 列表(目前只有首页;以后加 about / archive 写在这)
  const staticUrls = [{ loc: `${siteUrl}/`, changefreq: "weekly", priority: "1.0" }];

  const articleUrls = articles.map((a) => ({
    loc: `${siteUrl}/articles/${a.slug}`,
    lastmod: a.publishedAt ?? undefined,
    changefreq: "monthly",
    priority: "0.8",
  }));

  const urls = [...staticUrls, ...articleUrls];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${escapeXml(u.loc)}</loc>\n` +
          ("lastmod" in u && u.lastmod ? `    <lastmod>${escapeXml(u.lastmod)}</lastmod>\n` : "") +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  // 给 CDN / 浏览器一个温和的缓存(1 小时),sitemap 不需要实时
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return xml;
});
