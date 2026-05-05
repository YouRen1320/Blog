<template>
  <!--
    /articles —— 文章管理列表(V1-07 新增):
    · 顶部 hero 卡:统计 + 新建按钮
    · 状态 tab 筛选(全部 / 草稿 / 已发布)
    · 表格:标题 / 状态 / 分类 / 更新时间 / 操作
    · 分页(简单版,带"上一页/下一页")
  -->
  <AdminShell active="writing">
    <div class="stack">
      <header class="card hero">
        <div class="hero-row">
          <div>
            <div class="mono kicker">WRITING</div>
            <div class="kicker-rule" />
            <h1 class="cn title">文章管理</h1>
            <p class="cn lede">共 {{ totalAll }} 篇,其中已发布 {{ totalPublished }} · 草稿 {{ totalDrafts }}。</p>
          </div>
          <RouterLink to="/editor" class="primary">+ 新建文章</RouterLink>
        </div>

        <div class="tabs mono">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="tab"
            :class="{ active: status === t.value }"
            @click="setStatus(t.value)"
          >{{ t.label }}</button>
        </div>

        <input
          v-model.trim="searchQ"
          class="article-search"
          type="search"
          placeholder="🔍 在当前列表里筛选标题 / slug…"
        />
      </header>

      <section class="card table" v-if="!loading && filteredRows.length > 0">
        <div class="row head mono">
          <span>TITLE</span>
          <span>STATUS</span>
          <span>CATEGORY</span>
          <span>UPDATED</span>
          <span class="actions-head">ACTIONS</span>
        </div>
        <div v-for="a in filteredRows" :key="a.id" class="row body">
          <span class="cn cell-title">
            <RouterLink :to="`/editor/${a.id}`">{{ a.title }}</RouterLink>
            <span class="mono cell-slug">/{{ a.slug }}</span>
          </span>
          <span class="mono" :class="['status', `status-${a.status.toLowerCase()}`]">{{ a.status }}</span>
          <span class="cn">{{ a.category?.name ?? '—' }}</span>
          <span class="mono">{{ formatDate(a.updatedAt) }}</span>
          <span class="actions">
            <button v-if="a.status !== 'PUBLISHED'" class="link accent" type="button" @click="onPublish(a.id)">发布</button>
            <button v-else class="link" type="button" @click="onUnpublish(a.id)">下线</button>
            <RouterLink :to="`/editor/${a.id}`" class="link">编辑</RouterLink>
            <button class="link danger" type="button" @click="onDelete(a)">删除</button>
          </span>
        </div>
      </section>

      <section v-else-if="loading" class="card empty mono">LOADING…</section>
      <section v-else-if="searchQ" class="card empty mono">没有匹配 "{{ searchQ }}" 的文章。</section>
      <section v-else class="card empty mono">还没有文章。点右上角「+ 新建文章」开始。</section>

      <p v-if="error" class="error mono">{{ error }}</p>

      <div v-if="rows.length > 0" class="pager mono">
        <button class="link" :disabled="page <= 1" @click="goPrev">← 上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button class="link" :disabled="page >= totalPages" @click="goNext">下一页 →</button>
      </div>
    </div>
  </AdminShell>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import { listArticles, deleteArticle, publishArticle, unpublishArticle, type ArticleStatus, type ArticleSummary } from '../api/articles'
import { extractErrorMessage } from '../composables/useApiError'

const tabs: { value: ArticleStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
]
const status = ref<ArticleStatus | 'ALL'>('ALL')
const page = ref(1)
const pageSize = 10

const loading = ref(false)
const error = ref('')
const rows = ref<ArticleSummary[]>([])
const searchQ = ref('')

/**
 * 当前页内本地过滤(轻量)。后端 listArticles 没接 q 参数,我们只在前端
 * 把当前 page 已加载的 rows 按 title / slug substring 筛一遍。
 * 当文章数 > 100 时建议给 backend 加 q,这里搜不到下一页的内容。
 */
const filteredRows = computed(() => {
  const q = searchQ.value.toLowerCase().trim()
  if (!q) return rows.value
  return rows.value.filter(
    (a) => a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q),
  )
})
const totalPages = ref(1)
const totalAll = ref(0)
const totalDrafts = ref(0)
const totalPublished = ref(0)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: any = { page: page.value, pageSize }
    if (status.value !== 'ALL') params.status = status.value
    const res = await listArticles(params)
    rows.value = res.data
    totalPages.value = Math.max(res.meta.totalPages, 1)

    // 统计 hero 数据(每次 tab 切换都重新拉,简单)
    const [drafts, pub] = await Promise.all([
      listArticles({ status: 'DRAFT', pageSize: 1 }),
      listArticles({ status: 'PUBLISHED', pageSize: 1 }),
    ])
    totalDrafts.value = drafts.meta.total
    totalPublished.value = pub.meta.total
    totalAll.value = totalDrafts.value + totalPublished.value
  } catch (e) {
    error.value = extractErrorMessage(e, '加载文章失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([status, page], load)

function setStatus(v: ArticleStatus | 'ALL') {
  status.value = v
  page.value = 1
}

function goPrev() { if (page.value > 1) page.value-- }
function goNext() { if (page.value < totalPages.value) page.value++ }

async function onPublish(id: string) {
  try { await publishArticle(id); await load() } catch (e) { error.value = extractErrorMessage(e) }
}
async function onUnpublish(id: string) {
  try { await unpublishArticle(id); await load() } catch (e) { error.value = extractErrorMessage(e) }
}
async function onDelete(a: ArticleSummary) {
  if (!confirm(`确定要删除"${a.title}"?此操作不可恢复。`)) return
  try { await deleteArticle(a.id); await load() } catch (e) { error.value = extractErrorMessage(e) }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
</script>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--card); border-radius: 16px; box-shadow: var(--shadow); }

.hero { padding: 32px 36px 18px; }
.hero-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 18px; }
.kicker { font-size: 10px; letter-spacing: 0.18em; color: var(--ink-3); }
.kicker-rule { width: 18px; height: 1px; background: var(--ink-3); margin: 4px 0 14px; }
.title { font-size: 30px; font-weight: 600; margin: 0; color: var(--ink); }
.lede { font-size: 13px; color: var(--ink-2); margin: 8px 0 0; }

.primary {
  background: var(--ink); color: var(--bg);
  border: 0; border-radius: 10px;
  padding: 10px 16px; font-size: 12px; font-weight: 500;
  cursor: pointer; text-decoration: none;
}
.primary:hover { opacity: 0.92; }

.article-search {
  margin-top: 12px;
  width: 100%;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  font-family: inherit;
}
.article-search:focus { border-color: var(--accent); }

.tabs { display: flex; gap: 8px; }
.tab {
  background: transparent; border: 1px solid var(--rule);
  border-radius: 8px; padding: 6px 12px; font-size: 10px; letter-spacing: 0.14em;
  color: var(--ink-3); cursor: pointer;
}
.tab.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.table { padding: 8px 0; }
.row {
  display: grid;
  grid-template-columns: 2fr 0.8fr 1fr 0.8fr 1.4fr;
  gap: 16px; padding: 14px 32px; align-items: center;
}
.row.head { font-size: 9px; letter-spacing: 0.18em; color: var(--ink-3); border-bottom: 1px solid var(--rule); }
.row.body { border-top: 1px solid var(--rule); }
.row.body:first-of-type { border-top: 0; }
.row.body:hover { background: var(--bg); }
.cell-title { display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 500; }
.cell-title a { color: var(--ink); text-decoration: none; }
.cell-title a:hover { color: var(--accent); }
.cell-slug { font-size: 10px; color: var(--ink-3); }

.status { font-size: 10px; padding: 3px 8px; border-radius: 6px; display: inline-block; width: fit-content; }
.status-draft { background: var(--bg); color: var(--ink-3); }
.status-published { background: rgba(107,122,90,0.15); color: var(--accent); }
.status-archived { background: var(--bg); color: var(--ink-4); }

.actions-head { text-align: right; }
.actions { display: flex; gap: 12px; justify-content: flex-end; }
.link { background: transparent; border: 0; color: var(--ink-2); font-size: 12px; cursor: pointer; padding: 4px 0; text-decoration: none; }
.link:hover { color: var(--ink); }
.link.danger:hover { color: #B95C50; }
.link.accent { color: var(--accent); }

.empty { padding: 40px; text-align: center; color: var(--ink-3); font-size: 11px; letter-spacing: 0.16em; }
.error { color: #c0392b; font-size: 12px; padding: 12px 32px; }

.pager { display: flex; gap: 16px; align-items: center; justify-content: center; font-size: 11px; color: var(--ink-2); }
.pager .link[disabled] { opacity: 0.3; cursor: not-allowed; }
</style>
