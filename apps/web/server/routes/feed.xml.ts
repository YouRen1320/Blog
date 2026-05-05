/**
 * /feed.xml —— RSS 2.0 订阅源。
 *
 * 设计:
 * - 只输出最近 20 篇 PUBLISHED 文章
 * - 用 summary 作为 description(避免 RSS 阅读器拉走全文,保留站内访问)
 * - lastBuildDate 取最新文章的 publishedAt;无文章时取当前时间
 * - 不嵌内容(<content:encoded>),保持简单
 */

interface PublicArticle {
  title: string;
  slug: string;
  summary: string | null;
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

function toRfc822(iso: string | null): string {
  return new Date(iso ?? Date.now()).toUTCString();
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase as string;
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, "");

  const resp = await $fetch<PaginatedResp>(`${apiBase}/articles`, {
    query: { page: 1, pageSize: 20 },
  });
  const articles = resp.data;

  const lastBuildDate = toRfc822(articles[0]?.publishedAt ?? null);

  const channelTitle = "YouRen";
  const channelDesc = "Youren 的写作:博客、笔记、AI 内容生产实验。";

  const items = articles
    .map(
      (a) =>
        `    <item>\n` +
        `      <title>${escapeXml(a.title)}</title>\n` +
        `      <link>${escapeXml(`${siteUrl}/articles/${a.slug}`)}</link>\n` +
        `      <guid isPermaLink="true">${escapeXml(`${siteUrl}/articles/${a.slug}`)}</guid>\n` +
        `      <pubDate>${toRfc822(a.publishedAt)}</pubDate>\n` +
        (a.summary ? `      <description>${escapeXml(a.summary)}</description>\n` : "") +
        `    </item>`,
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${escapeXml(channelTitle)}</title>\n` +
    `    <link>${escapeXml(siteUrl)}</link>\n` +
    `    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />\n` +
    `    <description>${escapeXml(channelDesc)}</description>\n` +
    `    <language>zh-cn</language>\n` +
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n` +
    items +
    `\n  </channel>\n` +
    `</rss>\n`;

  setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=1800");
  return xml;
});
