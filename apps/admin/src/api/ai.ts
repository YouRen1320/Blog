import { apiClient } from './client'
import type { ArticleDetail } from './articles'

export interface GenerateDraftInput {
  prompt: string
  tone?: 'technical' | 'casual' | 'poetic' | 'narrative'
  length?: 'short' | 'medium' | 'long'
}

export async function generateAiDraft(input: GenerateDraftInput) {
  const { data } = await apiClient.post<ArticleDetail>('/admin/ai/drafts', input)
  return data
}

/**
 * SSE 事件类型 —— 跟 ai-service / NestJS 的事件名一一对应。
 * - chunk: LLM 增量文本
 * - draft: 流末解析出的结构化草稿(NestJS 已经落库,不直接消费)
 * - saved: NestJS 落库成功,带 articleId
 * - error / done: 状态信号
 */
export type AiStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'draft' }
  | { type: 'saved'; articleId: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

/**
 * 走 fetch + ReadableStream 接 SSE。EventSource 不支持 POST + Bearer header,
 * 必须用 fetch 自己解析 SSE 协议。
 *
 * 调用方:
 *   await streamAiDraft(input, (e) => { ... })
 * 内部:
 *   - 从根 baseUrl 拼 /admin/ai/drafts/stream
 *   - Authorization 用现有 apiClient 的默认 header
 *   - 按 \n\n 切事件,逐个 dispatch
 */
export async function streamAiDraft(
  input: GenerateDraftInput,
  onEvent: (e: AiStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  // 同 stores/auth.ts:固定 key,刷新后还能继续流式
  const token = localStorage.getItem('blog_admin_token')
  const baseUrl = apiClient.defaults.baseURL ?? ''
  const res = await fetch(`${baseUrl}/admin/ai/drafts/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
    signal,
  })
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) msg = body.message
    } catch {
      /* keep status */
    }
    onEvent({ type: 'error', message: msg })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      let eventName = ''
      let dataStr = ''
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
      }
      if (!eventName) continue
      try {
        if (eventName === 'chunk') {
          const data = JSON.parse(dataStr) as { text: string }
          onEvent({ type: 'chunk', text: data.text })
        } else if (eventName === 'draft') {
          onEvent({ type: 'draft' })
        } else if (eventName === 'saved') {
          const data = JSON.parse(dataStr) as { articleId: string }
          onEvent({ type: 'saved', articleId: data.articleId })
        } else if (eventName === 'error') {
          const data = JSON.parse(dataStr) as { message?: string }
          onEvent({ type: 'error', message: data.message ?? '未知错误' })
        } else if (eventName === 'done') {
          onEvent({ type: 'done' })
        }
      } catch (e) {
        onEvent({
          type: 'error',
          message: `解析事件失败: ${(e as Error).message}`,
        })
      }
    }
  }
  onEvent({ type: 'done' })
}

/**
 * 编辑器内联 AI 操作类型。跟 ai-service InlineRequest.action 一一对应。
 */
export type InlineAction = 'continue' | 'rewrite' | 'expand' | 'summarize' | 'title'

export interface InlineInput {
  action: InlineAction
  context: string
  selection?: string
  instruction?: string
}

export type InlineEvent =
  | { type: 'chunk'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

/**
 * 内联 AI 流。比 streamAiDraft 简单:**只有 chunk 和 done**,不需要 saved。
 * 前端自己决定怎么把 chunk 拼回 textarea(替换选区 / 写到字段 / 追加光标)。
 */
export async function streamInlineAi(
  input: InlineInput,
  onEvent: (e: InlineEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('blog_admin_token')
  const baseUrl = apiClient.defaults.baseURL ?? ''
  const res = await fetch(`${baseUrl}/admin/ai/inline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
    signal,
  })
  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) msg = body.message
    } catch {
      /* keep status */
    }
    onEvent({ type: 'error', message: msg })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      let eventName = ''
      let dataStr = ''
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
      }
      if (!eventName) continue
      try {
        if (eventName === 'chunk') {
          const data = JSON.parse(dataStr) as { text: string }
          onEvent({ type: 'chunk', text: data.text })
        } else if (eventName === 'error') {
          const data = JSON.parse(dataStr) as { message?: string }
          onEvent({ type: 'error', message: data.message ?? '未知错误' })
        } else if (eventName === 'done') {
          onEvent({ type: 'done' })
        }
      } catch (e) {
        onEvent({
          type: 'error',
          message: `解析事件失败: ${(e as Error).message}`,
        })
      }
    }
  }
  onEvent({ type: 'done' })
}
