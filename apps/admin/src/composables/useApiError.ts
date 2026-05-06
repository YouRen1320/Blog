// 把 axios 抛的错误统一抽成一行中文提示,组件直接展示。
// 后端返回结构:{ statusCode, message: string | string[], path, timestamp }
// 优先级:
//   1. 网络层(根本没拿到 response)→ 给"无法连接"
//   2. 已知状态码 → 翻译成中文友好提示
//   3. 后端给的 message(可能是 class-validator 列出的字段错)
//   4. fallback

// 后端常见的"裸露异常名"映射 —— 把 "ThrottlerException: Too Many Requests"
// 这种调试串映射成对用户有意义的中文。
const EXCEPTION_MAP: Record<string, string> = {
  ThrottlerException: '请求太频繁,稍后再试',
  TooManyRequests: '请求太频繁,稍后再试',
  Unauthorized: '登录已过期,请重新登录',
  Forbidden: '没有权限执行这个操作',
  NotFound: '资源不存在',
  BadRequest: '请求参数有误',
  InternalServerError: '服务器开了点小差,请稍后重试',
  ServiceUnavailable: '后端服务暂时不可用,请稍后重试',
}

const STATUS_MAP: Record<number, string> = {
  400: '请求参数有误',
  401: '登录已过期,请重新登录',
  403: '没有权限执行这个操作',
  404: '资源不存在',
  409: '操作冲突,请刷新后重试',
  413: '上传内容过大',
  422: '请求格式不正确',
  429: '请求太频繁,稍后再试',
  500: '服务器开了点小差,请稍后重试',
  502: '网关错误,请稍后重试',
  503: '后端服务暂时不可用',
  504: '请求超时,请稍后重试',
}

interface ApiErrorShape {
  message?: string
  response?: {
    status?: number
    data?: {
      message?: string | string[]
      statusCode?: number
    }
  }
  code?: string
}

/** 把后端 message 里的"ExceptionName: ..."前缀换成中文,如果命中映射表 */
function translateRawMessage(raw: string): string {
  // 形如 "ThrottlerException: Too Many Requests" → 取前缀
  const match = raw.match(/^([A-Z][A-Za-z]+Exception|[A-Z][A-Za-z]+):/)
  if (match && EXCEPTION_MAP[match[1]]) return EXCEPTION_MAP[match[1]]
  return raw
}

export function extractErrorMessage(err: unknown, fallback = '请求失败'): string {
  const e = err as ApiErrorShape

  // 1. 完全没收到响应(断网 / CORS / DNS / api 没起)
  if (!e?.response) {
    if (e?.code === 'ECONNABORTED') return '请求超时,请稍后重试'
    if (e?.code === 'ERR_NETWORK') return '无法连接服务器,请检查网络'
    return e?.message ? `网络错误:${e.message}` : '无法连接服务器'
  }

  const status = e.response.status
  const data = e.response.data
  const msg = data?.message

  // 2. 后端 message 是数组(class-validator 字段错)→ 直接连起来
  if (Array.isArray(msg)) return msg.join('; ')

  // 3. 后端 message 是字符串 → 尝试翻译异常名前缀
  if (typeof msg === 'string' && msg.length > 0) {
    return translateRawMessage(msg)
  }

  // 4. 没有具体 message,按状态码兜底
  if (status && STATUS_MAP[status]) return STATUS_MAP[status]

  return fallback
}
