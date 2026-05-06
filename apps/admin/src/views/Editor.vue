<template>
  <!--
    /editor —— 文章编辑器(V1-07 接真 API):
    路径:
      · /editor       新建文章(props.id 为 undefined)
      · /editor/:id   编辑已有文章
    左:正文编辑(标题 / slug / 摘要 / 分类 / 标签 / Markdown 正文)
    右:发布状态 + 操作按钮(保存草稿 / 发布 / 下线 / 删除)
    AI 助手栏暂留位,V4 才接。
  -->
  <AdminShell active="writing">
    <div class="layout">
      <section class="card editor">
        <div class="mono topbar">
          <RouterLink to="/articles" class="back">← 文章</RouterLink>
          <span>·</span>
          <span :class="{ accent: post.status === 'PUBLISHED' }">{{ post.status }}</span>
          <span v-if="lastSavedAt" >·</span>
          <span v-if="lastSavedAt" class="accent">SAVED {{ savedAgo }}s</span>
        </div>

        <input v-model="post.title" class="cn title-input" placeholder="标题" />

        <div class="meta-row">
          <input v-model="post.slug" class="input mono" placeholder="slug(留空自动生成)" />
          <select v-model="post.categoryId" class="input">
            <option :value="null">— 未分类 —</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!--
          封面图:点击上传或拖入 → 走 /admin/uploads → 拿到 /uploads/<hash>.ext
          已设过的 cover 显示缩略图 + 移除按钮;未设时一个虚线占位框
        -->
        <div class="cover-row">
          <span class="mono cover-label">COVER:</span>
          <label class="cover-box" :class="{ filled: !!post.cover, uploading: uploadingCover }">
            <img v-if="post.cover" :src="resolveCoverUrl(post.cover)" alt="封面" class="cover-img" />
            <span v-else-if="uploadingCover" class="cover-hint">上传中…</span>
            <span v-else class="cover-hint">点击或拖入图片(≤8MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              class="cover-input"
              @change="onCoverPick"
            />
          </label>
          <button v-if="post.cover" class="link" type="button" @click="post.cover = null">移除</button>
          <span v-if="coverError" class="error">{{ coverError }}</span>
        </div>

        <textarea v-model="post.summary" class="input summary" rows="2" placeholder="摘要(可选,前台列表展示)" />

        <div class="tags-edit">
          <span class="mono tags-label">TAGS:</span>
          <label v-for="t in tags" :key="t.id" class="tag-pill">
            <input type="checkbox" :value="t.id" v-model="post.tagIds" />
            <span>{{ t.name }}</span>
          </label>
        </div>

        <div class="content-bar mono">
          <span>正文 · Markdown</span>
          <button class="preview-toggle" type="button" @click="previewMode = !previewMode">
            {{ previewMode ? '✎ 编辑' : '◑ 预览' }}
          </button>
        </div>

        <div class="content-pane">
          <textarea
            v-show="!previewMode"
            ref="contentRef"
            v-model="post.content"
            class="content-area"
            :readonly="ai.running"
            placeholder="正文(支持 Markdown · 拖入或粘贴图片自动上传)"
            @paste="onContentPaste"
            @drop.prevent="onContentDrop"
            @dragover.prevent
          />
          <div v-if="previewMode" class="content-preview cn" v-html="renderedPreview" />
        </div>
        <p v-if="contentImageUploading" class="content-upload-hint mono">
          正在上传图片…
        </p>
      </section>

      <aside class="card aside">
        <div class="mono section-kicker">PUBLISH</div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="primary" type="button" :disabled="saving || ai.running" @click="onSave">{{ saving ? '保存中…' : '保存' }}</button>
          <button v-if="post.status !== 'PUBLISHED'" class="ghost" type="button" :disabled="saving || ai.running" @click="onPublish">发布</button>
          <button v-else class="ghost" type="button" :disabled="saving || ai.running" @click="onUnpublish">下线</button>
          <button v-if="props.id" class="ghost danger" type="button" :disabled="ai.running" @click="onDelete">删除</button>
        </div>

        <!--
          AI ASSIST:5 个内联操作,统一走 SSE 流。
          - 起标题 / 摘要:整篇文章作 context,流式覆写对应字段
          - 续写:不需要选中,在光标位置插入(无光标信息时追加文末)
          - 改写 / 扩写:必须有选中,流式替换选区
          流式期间整个编辑器其他按钮禁用 + content textarea readonly,
          避免用户手输跟 AI 流冲突。
        -->
        <div class="mono section-kicker accent">✦ AI ASSIST</div>
        <p v-if="ai.message" class="ai-msg" :class="ai.kind">{{ ai.message }}</p>
        <div class="ai-row">
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('title')">起标题</button>
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('summarize')">摘要</button>
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('tags')">起标签</button>
        </div>
        <div class="ai-row">
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('continue')">续写</button>
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('rewrite')">改写选中</button>
          <button class="ghost ai-btn" type="button" :disabled="ai.running" @click="onAi('expand')">扩写选中</button>
        </div>

        <div class="mono section-kicker">META</div>
        <div class="meta-info">
          <div><span class="mono">CREATED:</span> {{ post.createdAt ?? '—' }}</div>
          <div><span class="mono">UPDATED:</span> {{ post.updatedAt ?? '—' }}</div>
          <div><span class="mono">PUBLISHED:</span> {{ post.publishedAt ?? '—' }}</div>
        </div>
      </aside>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { createArticle, deleteArticle, getArticle, publishArticle, unpublishArticle, updateArticle, type ArticleStatus } from '../api/articles'
import { listCategories, type Category } from '../api/categories'
import { listTags, type Tag } from '../api/tags'
import { streamInlineAi, type InlineAction } from '../api/ai'
import { uploadImage } from '../api/uploads'
import { extractErrorMessage } from '../composables/useApiError'
import MarkdownIt from 'markdown-it'

// markdown-it 配置同 web /writing/[slug]:不开 html(防 XSS)+ linkify
const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

// :id 由 router 的 props: true 注入,/editor 时为 undefined
const props = defineProps<{ id?: string }>()
const router = useRouter()

const post = reactive({
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover: null as string | null,
  categoryId: null as string | null,
  tagIds: [] as string[],
  status: 'DRAFT' as ArticleStatus,
  createdAt: '' as string | null,
  updatedAt: '' as string | null,
  publishedAt: '' as string | null,
})

// 封面图上传状态
const uploadingCover = ref(false)
const coverError = ref('')

/**
 * 正文拖拽 / 粘贴图片:
 * 1. 拦截 paste / drop 事件,从 clipboard / dataTransfer 拿 image 文件
 * 2. 上传 → /uploads/<hash>.ext
 * 3. 在光标位置插入 markdown `![alt](url)`,光标跟到 url 之后
 * 多张图片时按顺序处理(await 串行,防止同时多个上传请求挤爆后端)
 */
const contentImageUploading = ref(false)

async function uploadAndInsertImage(file: File) {
  contentImageUploading.value = true
  try {
    const res = await uploadImage(file)
    const ta = contentRef.value
    const insertAt = ta?.selectionStart ?? post.content.length
    const before = post.content.slice(0, insertAt)
    const after = post.content.slice(insertAt)
    const md = `\n![${file.name.replace(/\.[^.]+$/, '')}](${res.url})\n`
    post.content = before + md + after
    // 光标移到插入文本之后
    setTimeout(() => {
      if (ta) {
        const pos = insertAt + md.length
        ta.focus()
        ta.setSelectionRange(pos, pos)
      }
    }, 0)
  } catch (e) {
    error.value = `图片上传失败:${(e as Error).message}`
  } finally {
    contentImageUploading.value = false
  }
}

async function onContentPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  const images: File[] = []
  for (const it of items) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) images.push(f)
    }
  }
  if (images.length === 0) return
  e.preventDefault()
  for (const f of images) await uploadAndInsertImage(f)
}

async function onContentDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
  if (images.length === 0) return
  for (const f of images) await uploadAndInsertImage(f)
}

/**
 * 后端返回的 cover URL 是相对路径(/uploads/<hash>.ext)。
 * 在 admin 页面里展示时需要拼上 web 端域名(因为 admin 跟 web 不同子域)。
 * 同 Comments.vue 的 webUrlFor:dev 直跳 :3100,生产用 iyouren.top。
 */
function resolveCoverUrl(url: string): string {
  if (url.startsWith('http')) return url   // 旧数据是绝对 URL 时直接用
  if (typeof window === 'undefined') return url
  const host = window.location.hostname
  if (host.endsWith('iyouren.top')) return `https://www.iyouren.top${url}`
  return `http://localhost:3100${url}`
}

async function onCoverPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingCover.value = true
  coverError.value = ''
  try {
    const res = await uploadImage(file)
    post.cover = res.url
  } catch (err) {
    coverError.value = extractErrorMessage(err, '上传失败')
  } finally {
    uploadingCover.value = false
    input.value = ''  // 允许重新选同一个文件
  }
}

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const error = ref('')
const saving = ref(false)
const lastSavedAt = ref<number | null>(null)
const now = ref(Date.now())
setInterval(() => (now.value = Date.now()), 1000)
const savedAgo = computed(() => (lastSavedAt.value ? Math.floor((now.value - lastSavedAt.value) / 1000) : 0))

async function loadOptions() {
  const [cs, ts] = await Promise.all([listCategories(), listTags()])
  categories.value = cs
  tags.value = ts
}

async function loadArticle(id: string) {
  const a = await getArticle(id)
  post.title = a.title
  post.slug = a.slug
  post.cover = a.cover ?? null
  post.summary = a.summary ?? ''
  post.content = a.content
  post.categoryId = a.category?.id ?? null
  post.tagIds = a.tags.map((t) => t.tag.id)
  post.status = a.status
  post.createdAt = a.createdAt
  post.updatedAt = a.updatedAt
  post.publishedAt = a.publishedAt
}

onMounted(async () => {
  try {
    await loadOptions()
    if (props.id) await loadArticle(props.id)
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
})

watch(() => props.id, async (id) => {
  if (id) await loadArticle(id)
})

/**
 * 保存。返回保存后的 article id(新建后是新 id,更新是 props.id)。
 * 失败返回 undefined,error.value 已更新。
 *
 * 关键:onPublish 在新建态会先调 onSave,**它必须返回 id 让 publish 能继续**,
 * 否则就是"先保存了,但忘记发布"这种半截状态(v1.3 之前的 bug)。
 */
async function onSave(): Promise<string | undefined> {
  // 前端先做基础校验,避免给后端发出注定 400 的请求
  const title = post.title.trim()
  if (!title) {
    error.value = '标题不能为空'
    return undefined
  }
  if (!post.content.trim()) {
    error.value = '正文不能为空'
    return undefined
  }

  saving.value = true; error.value = ''
  try {
    const payload = {
      title,
      slug: post.slug.trim() || undefined,
      summary: post.summary.trim() || undefined,
      content: post.content,
      cover: post.cover ?? undefined,
      categoryId: post.categoryId ?? undefined,
      tagIds: post.tagIds,
    }
    if (props.id) {
      const a = await updateArticle(props.id, payload)
      post.updatedAt = a.updatedAt
      lastSavedAt.value = Date.now()
      return props.id
    } else {
      const a = await createArticle(payload)
      // 跳转到编辑模式;router.replace 是异步的,但 a.id 是确定的,直接返回它
      router.replace(`/editor/${a.id}`)
      lastSavedAt.value = Date.now()
      return a.id
    }
  } catch (e) {
    error.value = extractErrorMessage(e)
    return undefined
  } finally {
    saving.value = false
  }
}

async function onPublish() {
  // 新建态:先 save 拿 id,再 publish。任何一步失败都不继续
  let id = props.id
  if (!id) {
    id = await onSave()
    if (!id) return
  }
  saving.value = true; error.value = ''
  try {
    const a = await publishArticle(id)
    post.status = a.status
    post.publishedAt = a.publishedAt
    lastSavedAt.value = Date.now()
  } catch (e) { error.value = extractErrorMessage(e) } finally { saving.value = false }
}

async function onUnpublish() {
  if (!props.id) return
  saving.value = true
  try {
    const a = await unpublishArticle(props.id)
    post.status = a.status
    post.publishedAt = a.publishedAt
  } catch (e) { error.value = extractErrorMessage(e) } finally { saving.value = false }
}

async function onDelete() {
  if (!props.id) return
  if (!confirm(`确定要删除"${post.title}"?`)) return
  try {
    await deleteArticle(props.id)
    router.replace('/articles')
  } catch (e) { error.value = extractErrorMessage(e) }
}

// ── 内联 AI(5 个 action,SSE 流式)──────────────────────────
const contentRef = ref<HTMLTextAreaElement | null>(null)
// V1.15:实时预览开关。点"预览"切换 textarea 和渲染视图
const previewMode = ref(false)
const renderedPreview = computed(() => md.render(post.content || '_(空白)_'))
const ai = reactive({
  running: false,
  message: '' as string,
  kind: 'info' as 'info' | 'error' | 'success',
})

function setAiMsg(kind: 'info' | 'error' | 'success', message: string) {
  ai.kind = kind
  ai.message = message
}

async function onAi(action: InlineAction) {
  if (ai.running) return

  // 拿当前选中范围。textarea 可能没 focus,fallback 到末尾
  const ta = contentRef.value
  const selStart = ta?.selectionStart ?? post.content.length
  const selEnd = ta?.selectionEnd ?? post.content.length
  const selection = post.content.slice(selStart, selEnd)
  const hasSelection = selection.length > 0

  // 不同 action 的输入校验
  if ((action === 'rewrite' || action === 'expand') && !hasSelection) {
    setAiMsg('error', `${action === 'rewrite' ? '改写' : '扩写'}需要先在正文里选中一段文字`)
    return
  }
  if ((action === 'summarize' || action === 'title') && !post.content.trim()) {
    setAiMsg('error', '正文为空,无法基于全文生成')
    return
  }

  ai.running = true
  setAiMsg('info', `AI 正在${actionLabel(action)}…`)

  // 把原始 content 的 before / after 两段在流前固定下来 ——
  // 每个 chunk 来时只更新中间累积部分,简单且正确,不需要算 offset
  const beforeContent = post.content.slice(0, selStart)
  // continue 时 selEnd == selStart,after 就是光标后整段;
  // rewrite/expand 时 selEnd > selStart,after 是选区之后的内容
  const afterContent = post.content.slice(selEnd)

  // 把 LLM 上下文准备好(发请求时 content 已经被改过,这里用原文)
  const fullContextForAi = post.content
  // title / summarize 字段先清空,流式覆写
  if (action === 'title') post.title = ''
  else if (action === 'summarize') post.summary = ''
  // content 类操作:先删掉选区(改写 / 扩写)或保留(续写),让 acc 从空开始拼
  if (action === 'rewrite' || action === 'expand' || action === 'continue') {
    post.content = beforeContent + afterContent
  }

  let acc = ''
  try {
    await streamInlineAi(
      {
        action,
        context: fullContextForAi,
        selection: hasSelection ? selection : undefined,
      },
      (e) => {
        if (e.type === 'chunk') {
          acc += e.text
          if (action === 'title') post.title += e.text
          else if (action === 'summarize') post.summary += e.text
          else if (action === 'tags') {
            // tags 不流式更新 UI,等流末统一处理(避免 partial split 闪烁)
          } else post.content = beforeContent + acc + afterContent
        } else if (e.type === 'error') {
          setAiMsg('error', e.message)
        }
      },
    )
    // tags 流末解析:split 逗号 → trim → 跟现有 tags 列表 match,有的勾上,
    // 没的写到 ai-msg 提示 admin 去 /tags 创建
    if (action === 'tags' && ai.kind !== 'error') {
      const suggested = acc.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
      const existing = new Set(tags.value.map((t) => t.name))
      const matched: string[] = []
      const newOnes: string[] = []
      for (const name of suggested) {
        if (existing.has(name)) {
          matched.push(name)
          const tag = tags.value.find((t) => t.name === name)
          if (tag && !post.tagIds.includes(tag.id)) post.tagIds.push(tag.id)
        } else {
          newOnes.push(name)
        }
      }
      const matchedHint = matched.length > 0 ? `已勾选 ${matched.length} 个(${matched.join(' / ')})` : '没有匹配上的'
      const newHint = newOnes.length > 0 ? ` · 新词建议:${newOnes.join(' / ')}(去 /tags 加)` : ''
      setAiMsg('success', `AI 标签:${matchedHint}${newHint}`)
    } else if (ai.kind !== 'error') {
      setAiMsg('success', `AI ${actionLabel(action)}完成`)
    }
  } catch (e) {
    setAiMsg('error', extractErrorMessage(e, 'AI 调用失败'))
  } finally {
    ai.running = false
  }
}

function actionLabel(a: InlineAction): string {
  return { title: '起标题', summarize: '生成摘要', continue: '续写', rewrite: '改写', expand: '扩写', tags: '起标签' }[a]
}
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; min-height: calc(100vh - 48px); }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.editor { padding: 32px 44px; display: flex; flex-direction: column; gap: 16px; }

.topbar { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); display: flex; gap: 14px; }
.topbar .accent { color: var(--accent); }
.back { color: inherit; text-decoration: none; }
.back:hover { color: var(--ink); }

.title-input {
  width: 100%; border: 0; font-size: 32px; font-weight: 600;
  background: transparent; color: var(--ink); outline: none; padding: 4px 0;
  letter-spacing: -0.01em;
}

.meta-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; }
.input {
  padding: 8px 12px; background: var(--bg); border: 1px solid var(--rule);
  border-radius: 8px; font-size: 13px; color: var(--ink); outline: none;
}
.input:focus { border-color: var(--accent); }
.summary { resize: vertical; }

/* 封面图上传:左 label,中点击/拖入框,右移除 */
.cover-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cover-label { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); }
.cover-box {
  position: relative;
  width: 200px; height: 100px;
  border: 1.5px dashed var(--rule);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg);
  transition: border-color 0.2s;
}
.cover-box:hover { border-color: var(--accent); }
.cover-box.filled { border-style: solid; padding: 0; }
.cover-box.uploading { border-color: var(--accent); }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-hint { font-size: 11px; color: var(--ink-3); padding: 6px 12px; text-align: center; }
.cover-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

/* TAGS 行:标签头单独一行,pills 选中后用 accent 颜色明显区分 */
.tags-edit { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tags-label {
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--ink-3);
  margin-right: 4px;
}
.tag-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 999px;
  font-size: 12px; cursor: pointer; color: var(--ink-2);
  user-select: none;
  transition: all 0.15s ease;
}
.tag-pill:hover { border-color: var(--accent); color: var(--accent); }
/* 隐藏原生 checkbox,用 :has() 改 pill 自身的样式 */
.tag-pill input { position: absolute; opacity: 0; pointer-events: none; }
.tag-pill:has(input:checked) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.content-upload-hint {
  font-size: 11px;
  color: var(--accent);
  margin: 4px 0 0;
  letter-spacing: 0.1em;
}

.content-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0 4px;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-3);
}
.preview-toggle {
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-size: 10px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  letter-spacing: 0.12em;
  font-family: var(--mono, ui-monospace, monospace);
}
.preview-toggle:hover { border-color: var(--accent); color: var(--accent); }

/* content-pane 撑高:editor 是 flex column,这里 flex:1 把剩下高度全吃下,
   再让内部 textarea / preview 各自 100% 撑满 —— 正文区永远占满到底部 */
.content-pane {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 360px;
}

.content-preview {
  flex: 1;
  width: 100%;
  padding: 18px 22px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--ink);
  overflow-y: auto;
  box-sizing: border-box;
}
.content-preview :deep(h2) { font-size: 20px; font-weight: 600; margin: 20px 0 10px; color: var(--ink); }
.content-preview :deep(h3) { font-size: 17px; font-weight: 600; margin: 16px 0 8px; }
.content-preview :deep(p) { margin: 0 0 14px; }
.content-preview :deep(blockquote) {
  border-left: 2px solid var(--accent);
  padding-left: 14px;
  margin: 16px 0;
  color: var(--ink-2);
  font-style: italic;
}
.content-preview :deep(code) {
  background: var(--card);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12.5px;
  font-family: var(--mono, ui-monospace, monospace);
}
.content-preview :deep(pre) {
  background: var(--ink); color: var(--bg);
  padding: 12px 14px; border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px; line-height: 1.6;
  margin: 14px 0;
}
.content-preview :deep(pre code) { background: transparent; color: inherit; padding: 0; }
.content-preview :deep(ul), .content-preview :deep(ol) { padding-left: 22px; margin: 0 0 14px; }
.content-preview :deep(a) { color: var(--accent); text-decoration: none; }
.content-preview :deep(a:hover) { text-decoration: underline; }
.content-preview :deep(img) { max-width: 100%; height: auto; border-radius: 6px; margin: 10px 0; }
.content-preview :deep(em) { color: var(--ink-3); }

.content-area {
  flex: 1;
  width: 100%;
  padding: 14px;
  background: var(--bg); border: 1px solid var(--rule); border-radius: 10px;
  font-size: 14px; line-height: 1.7; color: var(--ink);
  resize: none;  /* 不要让用户拖手柄改高度,固定撑满父容器 */
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  box-sizing: border-box;
}

.aside { padding: 24px 22px; display: flex; flex-direction: column; gap: 18px; align-self: start; position: sticky; top: 24px; }
.section-kicker { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); margin-bottom: 4px; }
.section-kicker.accent { color: var(--accent); }

.ai-row { display: flex; gap: 6px; flex-wrap: wrap; }
.ai-btn { flex: 1 1 auto; padding: 8px 10px; font-size: 11px; }

.ai-msg {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 6px;
  margin: 0 0 4px;
  line-height: 1.5;
}
.ai-msg.info    { background: var(--bg); color: var(--ink-2); }
.ai-msg.error   { background: #fdecec; color: #b3261e; }
.ai-msg.success { background: #e8f5ee; color: #1f7a3e; }

.actions { display: flex; flex-direction: column; gap: 8px; }
.primary { background: var(--ink); color: var(--bg); border: 0; border-radius: 10px; padding: 10px 14px; font-size: 12px; font-weight: 500; cursor: pointer; }
.primary:hover { opacity: 0.92; }
.primary:disabled { opacity: 0.5; cursor: progress; }
.ghost { background: var(--bg); color: var(--ink); border: 1px solid var(--rule); border-radius: 10px; padding: 10px 14px; font-size: 12px; cursor: pointer; }
.ghost:hover { border-color: var(--accent); color: var(--accent); }
.ghost.danger:hover { border-color: #B95C50; color: #B95C50; }

.meta-info { font-size: 11px; color: var(--ink-2); display: flex; flex-direction: column; gap: 4px; }
.meta-info .mono { color: var(--ink-3); margin-right: 4px; }

.error { color: #c0392b; font-size: 12px; }

@media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .aside { position: static; } }
</style>
