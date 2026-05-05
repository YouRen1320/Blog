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

        <textarea v-model="post.summary" class="input summary" rows="2" placeholder="摘要(可选,前台列表展示)" />

        <div class="tags-edit">
          <span class="mono tags-label">TAGS:</span>
          <label v-for="t in tags" :key="t.id" class="tag-pill">
            <input type="checkbox" :value="t.id" v-model="post.tagIds" />
            <span>{{ t.name }}</span>
          </label>
        </div>

        <textarea
          v-model="post.content"
          class="content-area"
          placeholder="正文(支持 Markdown,前台用 markdown-it 渲染)"
        />
      </section>

      <aside class="card aside">
        <div class="mono section-kicker">PUBLISH</div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="primary" type="button" :disabled="saving" @click="onSave">{{ saving ? '保存中…' : '保存' }}</button>
          <button v-if="post.status !== 'PUBLISHED'" class="ghost" type="button" :disabled="saving" @click="onPublish">发布</button>
          <button v-else class="ghost" type="button" :disabled="saving" @click="onUnpublish">下线</button>
          <button v-if="props.id" class="ghost danger" type="button" @click="onDelete">删除</button>
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
import { extractErrorMessage } from '../composables/useApiError'

// :id 由 router 的 props: true 注入,/editor 时为 undefined
const props = defineProps<{ id?: string }>()
const router = useRouter()

const post = reactive({
  title: '',
  slug: '',
  summary: '',
  content: '',
  categoryId: null as string | null,
  tagIds: [] as string[],
  status: 'DRAFT' as ArticleStatus,
  createdAt: '' as string | null,
  updatedAt: '' as string | null,
  publishedAt: '' as string | null,
})

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

.tags-edit { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tags-label { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); }
.tag-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; background: var(--bg); border-radius: 6px;
  font-size: 12px; cursor: pointer; color: var(--ink-2);
}
.tag-pill input { margin: 0; }

.content-area {
  flex: 1; min-height: 300px; padding: 14px;
  background: var(--bg); border: 1px solid var(--rule); border-radius: 10px;
  font-size: 14px; line-height: 1.7; color: var(--ink); resize: vertical;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
}

.aside { padding: 24px 22px; display: flex; flex-direction: column; gap: 18px; align-self: start; position: sticky; top: 24px; }
.section-kicker { font-size: 10px; letter-spacing: 0.16em; color: var(--ink-3); margin-bottom: 4px; }

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
