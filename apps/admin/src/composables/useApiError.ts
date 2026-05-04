// 把 axios 抛的错误统一抽成一行 message,组件直接展示。
// 后端返回:{ statusCode, message: string | string[], path, timestamp }
export function extractErrorMessage(err: unknown, fallback = '请求失败'): string {
  const e = err as { response?: { data?: { message?: string | string[] } } }
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg.join('; ')
  if (typeof msg === 'string') return msg
  return fallback
}
