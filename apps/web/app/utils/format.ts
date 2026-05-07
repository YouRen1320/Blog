// 站点用的小工具:
// - 法国共和历月份名(根据 publishedAt 落在哪个月,粗略给一个,不严格对齐)
// - 阅读时长估算(中文 + 英文混排,简单按字符数 / 400)
// - 把 ISO 日期切成 yyyy-mm-dd

const FR_MONTHS = [
  'NIVÔSE', 'PLUVIÔSE', 'VENTÔSE', 'GERMINAL', 'FLORÉAL', 'PRAIRIAL',
  'MESSIDOR', 'THERMIDOR', 'FRUCTIDOR', 'VENDÉMIAIRE', 'BRUMAIRE', 'FRIMAIRE',
] as const

export function frenchSeason(iso: string | null): string {
  if (!iso) return ''
  const m = new Date(iso).getMonth()
  return FR_MONTHS[m] ?? ''
}

export function readingTime(content: string): string {
  const len = content?.length ?? 0
  const minutes = Math.max(1, Math.round(len / 400))
  return `${minutes} min read`
}

export function shortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthDay(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 卡片摘要展示用:把 markdown 残渣(##/>、链接、加粗、代码块)剥成纯文本。
// 不是完整 md 解析,只覆盖列表预览常见情况;真正的渲染走详情页 markdown 管线。
// 设计取舍:正则链路简单可控,避免列表页为了 6 个摘要引一整个 markdown 包。
export function stripMarkdown(md: string | null | undefined): string {
  if (!md) return ''
  return md
    // 围栏代码块整段丢弃(```...``` 多行)
    .replace(/```[\s\S]*?```/g, ' ')
    // 行内代码 `code` 保留内容、去掉反引号
    .replace(/`([^`]*)`/g, '$1')
    // 图片 ![alt](url) 整段丢
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // 链接 [text](url) 只留 text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 行首 # / ## / ### 标题符号、> 引用、- * + 列表前缀
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    .replace(/^[ \t]*>+[ \t]*/gm, '')
    .replace(/^[ \t]*[-*+][ \t]+/gm, '')
    // 加粗 **x** / __x__,斜体 *x* / _x_
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/([*_])(.*?)\1/g, '$2')
    // 残留 HTML 标签
    .replace(/<\/?[^>]+>/g, '')
    // 折叠所有空白(换行也吃掉),让一段长文连贯成单行
    .replace(/\s+/g, ' ')
    .trim()
}

// 用 article id 派生 InkArt seed,保证同一篇文章的封面稳定不变
export function seedFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 1024
}
