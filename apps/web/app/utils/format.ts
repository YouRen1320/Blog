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

// 用 article id 派生 InkArt seed,保证同一篇文章的封面稳定不变
export function seedFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 1024
}
